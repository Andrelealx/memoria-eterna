// Abstração de frete (seção 14). Sem integração real (Melhor Envio) no MVP,
// usa tabela configurável por faixa de CEP ou frete fixo — nunca inventa frete
// silenciosamente.

export interface ShippingQuoteInput {
  cep: string; // apenas dígitos
  physical: boolean;
}

export interface ShippingQuote {
  shippingCents: number;
  estimatedDays: number | null;
  carrier: string | null;
}

export interface ShippingProvider {
  readonly name: string;
  quote(input: ShippingQuoteInput): Promise<ShippingQuote>;
}

/** Tabela de frete fixa configurável (dev/MVP). */
export interface FixedShippingRule {
  cepPrefixes: string[]; // ex.: ["01310", "04538"]; vazio = qualquer CEP
  shippingCents: number;
  estimatedDays: number | null;
  carrier: string | null;
}

export class FixedTableShippingProvider implements ShippingProvider {
  readonly name = "fixed_table";

  constructor(private readonly rules: FixedShippingRule[]) {}

  async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    if (!input.physical) {
      return { shippingCents: 0, estimatedDays: null, carrier: null };
    }
    const normalized = input.cep.replace(/\D/g, "");
    const rule =
      this.rules.find(
        (r) => r.cepPrefixes.length === 0 || r.cepPrefixes.some((p) => normalized.startsWith(p)),
      ) ?? this.rules[0];

    return {
      shippingCents: rule?.shippingCents ?? 0,
      estimatedDays: rule?.estimatedDays ?? null,
      carrier: rule?.carrier ?? null,
    };
  }
}
