import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/adapters/payment";
import { processPaymentApproved } from "@/lib/server/orders";

// Webhook do Mercado Pago (seções 14, 21). Valida assinatura e processa de forma
// idempotente. Nunca confia no retorno visual do navegador.

export async function POST(req: Request): Promise<Response> {
  const rawBody = await req.text();
  const provider = getPaymentProvider();

  const verified = await provider.verifyWebhookSignature(req.headers, rawBody);
  if (!verified) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = provider.parseWebhookEvent(rawBody);
  const raw = event.raw as Record<string, unknown>;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const providerPaymentId = String(data.id ?? "");

  const payment = await prisma.payment.findUnique({ where: { providerPaymentId } });
  if (!payment) {
    // Pagamento desconhecido: ignora (não vaza existência).
    return new Response("Not found", { status: 404 });
  }

  // Consulta o status no provedor (fonte da verdade) antes de mudar o pedido.
  const status = await provider.getPaymentStatus(providerPaymentId);

  if (status === "APPROVED") {
    await processPaymentApproved(payment.id, event.providerEventId);
  } else if (status === "REJECTED" || status === "CANCELLED") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status } });
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "CANCELLED" },
    });
  }

  return new Response("OK", { status: 200 });
}
