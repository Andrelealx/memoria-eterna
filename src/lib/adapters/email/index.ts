// E-mails transacionais (seção 17). Em desenvolvimento, quando o provedor não
// estiver configurado, a prévia é registrada em log — nunca se finge envio real.

export type EmailTemplateId =
  | "magic-link"
  | "payment-approved"
  | "pix-pending"
  | "physical-received"
  | "order-shipped"
  | "about-to-expire"
  | "upgrade-confirmed"
  | "deletion-requested";

export interface EmailMessage {
  to: string;
  template: EmailTemplateId;
  subject: string;
  data: Record<string, string>;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

/** Provedor de log — desenvolvimento/teste. Registra a prévia sem enviar. */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:dev] para=${message.to} template=${message.template}`, message.data);
  }
}
