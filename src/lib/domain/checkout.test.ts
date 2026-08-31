import { describe, expect, it } from "vitest";
import { checkoutSchema, shippingAddressSchema } from "./checkout";

const validAddress = {
  recipient: "Marina Souza",
  cep: "01310-100",
  street: "Avenida Paulista",
  number: "1000",
  complement: "Apto 42",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "sp",
};

describe("checkout domain", () => {
  it("normaliza CEP e UF do endereço", () => {
    expect(shippingAddressSchema.parse(validAddress)).toEqual({
      ...validAddress,
      cep: "01310100",
      state: "SP",
    });
  });

  it("explica qual campo do endereço precisa ser corrigido", () => {
    const parsed = shippingAddressSchema.safeParse({ ...validAddress, city: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toEqual(
        expect.objectContaining({ path: ["city"], message: "Digite a cidade." }),
      );
    }
  });

  it("rejeita nome curto antes de iniciar o Pix", () => {
    const parsed = checkoutSchema.safeParse({
      draftToken: "draft-token-with-more-than-twenty-chars",
      planSlug: "momento",
      email: "cliente@example.com",
      name: "C",
      method: "PIX",
      acceptedTerms: true,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe("Digite o seu nome com pelo menos 2 caracteres.");
    }
  });
});
