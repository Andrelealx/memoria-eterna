import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/lib/adapters/email/factory";

export const maxDuration = 60;

// Cron de expiração (seções 4, 17, 21). Protegido por CRON_SECRET.
// Marca projetos publicados como EXPIRED e prepara lembrete de expiração
// (Plano Momento, ~5º dia = 2 dias antes do vencimento).

export async function GET(req: Request): Promise<Response> {
  const configuredSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization");
  const authorized =
    Boolean(configuredSecret) && authorization === `Bearer ${configuredSecret}`;

  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();

  // 1. Expira projetos cuja validade passou.
  const expired = await prisma.project.updateMany({
    where: { status: "PUBLISHED", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });

  // 2. Lembrete de expiração (2 dias antes) para o Plano Momento.
  const threshold = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const soon = await prisma.project.findMany({
    where: {
      status: "PUBLISHED",
      expiresAt: { gt: now, lt: threshold },
      plan: { slug: "momento" },
    },
    include: { owner: true },
  });

  if (soon.length > 0) {
    try {
      const email = getEmailProvider();
      for (const p of soon) {
        if (!p.owner?.email) continue;
        try {
          await email.send({
            to: p.owner.email,
            template: "about-to-expire",
            subject: "Seu presente está perto de expirar",
            data: { title: "presente" },
          });
        } catch {
          // A expiração não depende do provedor de e-mail.
        }
      }
    } catch {
      // Sem provedor configurado, a expiração continua funcionando.
    }
  }

  return new Response(JSON.stringify({ expired: expired.count, reminders: soon.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
