import { z } from "zod";

export const shippingAddressSchema = z.object({
  recipient: z
    .string()
    .trim()
    .min(2, "Digite o nome de quem receberá a entrega.")
    .max(120, "O nome pode ter até 120 caracteres."),
  cep: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().length(8, "Digite um CEP válido com 8 números.")),
  street: z
    .string()
    .trim()
    .min(2, "Digite a rua ou avenida.")
    .max(160, "A rua pode ter até 160 caracteres."),
  number: z
    .string()
    .trim()
    .min(1, "Digite o número.")
    .max(20, "O número pode ter até 20 caracteres."),
  complement: z.string().trim().max(80, "O complemento pode ter até 80 caracteres.").optional(),
  neighborhood: z
    .string()
    .trim()
    .min(2, "Digite o bairro.")
    .max(100, "O bairro pode ter até 100 caracteres."),
  city: z
    .string()
    .trim()
    .min(2, "Digite a cidade.")
    .max(100, "A cidade pode ter até 100 caracteres."),
  state: z
    .string()
    .trim()
    .length(2, "Digite a sigla do estado com 2 letras.")
    .transform((value) => value.toUpperCase()),
});

export const checkoutSchema = z.object({
  draftToken: z.string().min(20),
  planSlug: z.string().min(1),
  email: z
    .string()
    .trim()
    .email("Digite um e-mail válido.")
    .max(320, "O e-mail pode ter até 320 caracteres."),
  name: z
    .string()
    .trim()
    .min(2, "Digite o seu nome com pelo menos 2 caracteres.")
    .max(120, "O nome pode ter até 120 caracteres."),
  method: z.literal("PIX", {
    message: "No momento, o pagamento está disponível por Pix.",
  }),
  couponCode: z.string().trim().max(40).optional(),
  acceptedTerms: z.literal(true, {
    message: "Aceite os Termos e a Política de Privacidade.",
  }),
  shippingAddress: shippingAddressSchema.optional(),
});

export type ShippingAddressInput = z.input<typeof shippingAddressSchema>;
