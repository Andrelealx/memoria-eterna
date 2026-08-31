import { FixedTableShippingProvider, type ShippingProvider } from "./index";

export function getShippingProvider(): ShippingProvider {
  const shippingCents = Number(process.env.SHIPPING_FIXED_CENTS ?? "1990");
  const estimatedDays = Number(process.env.SHIPPING_ESTIMATED_DAYS ?? "7");
  if (!Number.isInteger(shippingCents) || shippingCents < 0) {
    throw new Error("[shipping] Configuração de frete inválida.");
  }
  return new FixedTableShippingProvider([
    {
      cepPrefixes: [],
      shippingCents,
      estimatedDays: Number.isInteger(estimatedDays) && estimatedDays > 0 ? estimatedDays : null,
      carrier: "Envio padrão",
    },
  ]);
}
