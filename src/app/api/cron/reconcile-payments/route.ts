import { prisma } from "@/lib/db";
import { reconcilePendingPayment } from "@/lib/server/orders";

export const maxDuration = 60;

// Rede de segurança para pagamentos confirmados cujo webhook não chegou.
//
// O webhook do Mercado Pago é o caminho principal, mas ele pode falhar em
// silêncio (queda do provedor, redirect na URL de notificação, timeout). Sem
// esta varredura o pedido fica preso em AWAITING_PAYMENT mesmo com o dinheiro
// já pago, e o comprador que fechou a aba nunca recebe o presente.
//
// A tela de Pix já reconsulta enquanto o comprador está nela; este cron cobre
// justamente quem saiu antes da confirmação.

const LOOKBACK_HOURS = 72;
const MAX_PER_RUN = 60;

export async function GET(req: Request): Promise<Response> {
  const configuredSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization");
  const authorized = Boolean(configuredSecret) && authorization === `Bearer ${configuredSecret}`;
  if (!authorized) return new Response("Unauthorized", { status: 401 });

  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const pending = await prisma.payment.findMany({
    where: {
      status: { in: ["PENDING", "CREATED"] },
      providerPaymentId: { not: null },
      createdAt: { gte: since },
      order: { status: { in: ["CREATED", "AWAITING_PAYMENT"] } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
    select: { id: true },
  });

  let aprovados = 0;
  let falhados = 0;
  let inalterados = 0;

  for (const payment of pending) {
    try {
      // force: o throttle da tela não se aplica aqui — o cron roda espaçado.
      const status = await reconcilePendingPayment(payment.id, { force: true });
      if (status === "APPROVED") aprovados++;
      else if (status === "PENDING" || status === "CREATED") inalterados++;
      else falhados++;
    } catch (cause) {
      console.error("[cron/reconcile] Falha ao reconciliar pagamento.", {
        paymentId: payment.id,
        cause: cause instanceof Error ? cause.message : String(cause),
      });
    }
  }

  const resumo = { verificados: pending.length, aprovados, falhados, inalterados };
  if (aprovados > 0) {
    console.warn("[cron/reconcile] Pagamentos confirmados sem webhook.", resumo);
  }
  return Response.json(resumo);
}
