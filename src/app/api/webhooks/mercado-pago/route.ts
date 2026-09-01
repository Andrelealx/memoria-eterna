import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/adapters/payment";
import { parseMercadoPagoDataId } from "@/lib/adapters/payment/mercado-pago";
import { processPaymentApproved, processPaymentFailed } from "@/lib/server/orders";

export const maxDuration = 30;

// Webhook do Mercado Pago (seções 14, 21). Valida assinatura e processa de forma
// idempotente. Nunca confia no retorno visual do navegador.

export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text();
  const provider = getPaymentProvider();

  let event;
  try {
    event = provider.parseWebhookEvent(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const raw = event.raw as Record<string, unknown>;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const queryDataId = parseMercadoPagoDataId(new URL(req.url).searchParams.get("data.id"));
  const payloadDataId = parseMercadoPagoDataId(data.id);

  // A assinatura oficial usa o ID da URL. Quando ele não vier na query,
  // aceitamos o ID equivalente do payload. Se ambos existirem, precisam apontar
  // para o mesmo recurso, inclusive nas integrações legadas que normalizavam case.
  if (queryDataId && payloadDataId && queryDataId.toLowerCase() !== payloadDataId.toLowerCase()) {
    return new Response("Unauthorized", { status: 401 });
  }

  const signatureDataId = queryDataId ?? payloadDataId;
  const verified = await provider.verifyWebhookSignature({
    headers: req.headers,
    rawBody,
    dataId: signatureDataId,
  });
  if (!verified) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Usa o mesmo recurso coberto pela assinatura, nunca outro ID arbitrário do body.
  const providerPaymentId = payloadDataId ?? queryDataId ?? "";

  let payment = await prisma.payment.findUnique({ where: { providerPaymentId } });
  let status;

  if (payment) {
    // Consulta o status no provedor (fonte da verdade) antes de mudar o pedido.
    status = await provider.getPaymentStatus(providerPaymentId);
  } else {
    // Checkout Pro: o evento traz o ID do pagamento real, mas salvamos o ID
    // da preferência ao criar a cobrança. Busca os detalhes no provedor para
    // achar o pedido pela external_reference e reconciliar o ID salvo.
    const details = await provider.getPaymentDetails(providerPaymentId);
    if (!details?.externalReference) {
      return new Response("Not found", { status: 404 });
    }
    payment = await prisma.payment.findFirst({ where: { orderId: details.externalReference } });
    if (!payment) {
      return new Response("Not found", { status: 404 });
    }
    await prisma.payment.update({ where: { id: payment.id }, data: { providerPaymentId } });
    status = details.status;
  }

  if (status === "APPROVED") {
    await processPaymentApproved(payment.id, event.providerEventId);
  } else if (status === "REJECTED" || status === "CANCELLED") {
    await processPaymentFailed(payment.id, status);
  }

  return new Response("OK", { status: 200 });
}
