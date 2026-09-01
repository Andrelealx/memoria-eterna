import type { EmailMessage, EmailProvider } from "./index";
import { brand } from "@/lib/brand";

// Provedor Resend (seção 6). Requer RESEND_API_KEY. Sem credencial, falha com
// erro claro (não simula envio).

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    if (!this.apiKey || !this.from) {
      throw new Error("[email] Resend não configurado (RESEND_API_KEY/EMAIL_FROM).");
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: renderEmail(message),
      }),
    });
    if (!res.ok) {
      throw new Error(`[email] falha ao enviar (${res.status}): ${await res.text()}`);
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function action(href: string, label: string) {
  const safeHref = escapeHtml(href);
  return `<a href="${safeHref}" style="display:inline-block;background:#722B45;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;margin:8px 8px 8px 0">${escapeHtml(label)}</a>`;
}

function renderEmail(message: EmailMessage) {
  let content = "";

  if (message.template === "magic-link" && message.data.url) {
    content = `
      <p>Recebemos um pedido para acessar sua conta.</p>
      <p>${action(message.data.url, "Entrar na minha conta")}</p>
      <p style="font-size:13px;color:#6E6568">Este link é pessoal e expira em breve. Se você não solicitou o acesso, ignore este e-mail.</p>`;
  } else if (message.template === "payment-approved" && message.data.accessUrl) {
    const giftAction = message.data.giftUrl
      ? action(message.data.giftUrl, "Ver o presente")
      : "";
    content = `
      <p>Seu pagamento do pedido <strong>${escapeHtml(message.data.orderNumber ?? "")}</strong> foi aprovado e seu presente já está disponível.</p>
      <p>${giftAction}${action(message.data.accessUrl, message.data.accessLabel || "Acessar meu presente")}</p>
      <p style="font-size:13px;color:#6E6568">Guarde este e-mail. O botão de acesso é pessoal e não deve ser compartilhado.</p>`;
  } else if (message.template === "about-to-expire") {
    content = `<p>Seu presente ${escapeHtml(message.data.title ?? "")} está perto de expirar. Entre na sua conta para conferir as opções disponíveis.</p>`;
  } else {
    content = `<p>${escapeHtml(message.subject)}</p>`;
  }

  return `<!doctype html>
  <html lang="pt-BR">
    <body style="margin:0;background:#FFF9F6;font-family:Arial,sans-serif;color:#292326">
      <div style="max-width:600px;margin:0 auto;padding:32px 20px">
        <div style="background:#fff;border-radius:20px;padding:32px;border:1px solid #EADDE0">
          <p style="margin:0 0 20px;color:#722B45;font-weight:800;font-size:18px">${escapeHtml(brand.name)}</p>
          <h1 style="font-size:26px;line-height:1.2;margin:0 0 18px">${escapeHtml(message.subject)}</h1>
          <div style="font-size:16px;line-height:1.65">${content}</div>
        </div>
        <p style="font-size:12px;color:#6E6568;text-align:center;margin-top:18px">Uma lembrança feita com carinho, guardada em um só lugar.</p>
      </div>
    </body>
  </html>`;
}
