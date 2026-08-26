import type { EmailMessage, EmailProvider } from "./index";

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
        // Prévia textual/HTML do template (componentes reais na Fase 3).
        html: `<p>${message.subject}</p>`,
      }),
    });
    if (!res.ok) {
      throw new Error(`[email] falha ao enviar (${res.status}): ${await res.text()}`);
    }
  }
}
