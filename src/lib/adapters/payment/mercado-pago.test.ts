import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MercadoPagoProvider } from "./mercado-pago";

const SECRET = "whsec_test_foryoupage";
const REQUEST_ID = "request-5b283f20";
const TIMESTAMP = "1788134400000";

function signatureFor(
  dataId: string,
  options?: { requestId?: string; timestamp?: string },
): string {
  const requestId = options?.requestId ?? REQUEST_ID;
  const timestamp = options?.timestamp ?? TIMESTAMP;
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const digest = createHmac("sha256", SECRET).update(manifest).digest("hex");
  return `ts=${timestamp},v1=${digest}`;
}

function verificationInput(options?: {
  signature?: string | null;
  requestId?: string | null;
  dataId?: string | null;
  rawBody?: string;
}) {
  const headers = new Headers();
  if (options?.signature !== null) {
    headers.set("x-signature", options?.signature ?? signatureFor("123456789"));
  }
  if (options?.requestId !== null) {
    headers.set("x-request-id", options?.requestId ?? REQUEST_ID);
  }
  return {
    headers,
    rawBody:
      options?.rawBody ?? JSON.stringify({ id: 99, type: "payment", data: { id: "123456789" } }),
    dataId: options?.dataId,
  };
}

describe("MercadoPagoProvider.verifyWebhookSignature", () => {
  it("valida o manifesto oficial id/request-id/ts", async () => {
    const provider = new MercadoPagoProvider("access-token", SECRET);

    await expect(
      provider.verifyWebhookSignature(
        verificationInput({ dataId: "123456789", signature: signatureFor("123456789") }),
      ),
    ).resolves.toBe(true);
  });

  it("aceita ordem e espaçamento dos campos sem comparar o hash de forma textual", async () => {
    const provider = new MercadoPagoProvider("access-token", SECRET);
    const [, digestPart] = signatureFor("123456789").split(",");
    const digest = digestPart.slice("v1=".length).toUpperCase();

    await expect(
      provider.verifyWebhookSignature(
        verificationInput({
          dataId: "123456789",
          signature: ` v1 = ${digest} , ts = ${TIMESTAMP} `,
        }),
      ),
    ).resolves.toBe(true);
  });

  it("usa data.id do payload quando a query não o fornece e preserva o case atual", async () => {
    const provider = new MercadoPagoProvider("access-token", SECRET);
    const rawBody = JSON.stringify({ id: 100, type: "payment", data: { id: "OrderABC" } });

    await expect(
      provider.verifyWebhookSignature(
        verificationInput({
          dataId: null,
          rawBody,
          signature: signatureFor("OrderABC"),
        }),
      ),
    ).resolves.toBe(true);
  });

  it("mantém compatibilidade com data.id alfanumérico normalizado para lowercase", async () => {
    const provider = new MercadoPagoProvider("access-token", SECRET);

    await expect(
      provider.verifyWebhookSignature(
        verificationInput({
          dataId: "OrderABC",
          signature: signatureFor("orderabc"),
        }),
      ),
    ).resolves.toBe(true);
  });

  it.each([
    ["sem ts", `v1=${"a".repeat(64)}`],
    ["sem v1", `ts=${TIMESTAMP}`],
    ["timestamp não numérico", `ts=agora,v1=${"a".repeat(64)}`],
    ["hash não hexadecimal", `ts=${TIMESTAMP},v1=${"z".repeat(64)}`],
    ["hash truncado", `ts=${TIMESTAMP},v1=${"a".repeat(63)}`],
    ["campo duplicado", `ts=${TIMESTAMP},ts=${TIMESTAMP},v1=${"a".repeat(64)}`],
    ["parte sem separador", `ts=${TIMESTAMP},v1=${"a".repeat(64)},inválida`],
  ])("rejeita header malformado: %s", async (_caseName, signature) => {
    const provider = new MercadoPagoProvider("access-token", SECRET);

    await expect(
      provider.verifyWebhookSignature(verificationInput({ dataId: "123456789", signature })),
    ).resolves.toBe(false);
  });

  it("rejeita assinatura hexadecimal bem formada, mas incorreta", async () => {
    const provider = new MercadoPagoProvider("access-token", SECRET);

    await expect(
      provider.verifyWebhookSignature(
        verificationInput({
          dataId: "123456789",
          signature: `ts=${TIMESTAMP},v1=${"0".repeat(64)}`,
        }),
      ),
    ).resolves.toBe(false);
  });

  it("rejeita o algoritmo antigo baseado em requestId.rawBody", async () => {
    const provider = new MercadoPagoProvider("access-token", SECRET);
    const rawBody = JSON.stringify({ id: 99, type: "payment", data: { id: "123456789" } });
    const oldDigest = createHmac("sha256", SECRET).update(`${REQUEST_ID}.${rawBody}`).digest("hex");

    await expect(
      provider.verifyWebhookSignature(
        verificationInput({
          dataId: "123456789",
          rawBody,
          signature: `ts=${TIMESTAMP},v1=${oldDigest}`,
        }),
      ),
    ).resolves.toBe(false);
  });

  it.each([
    ["assinatura", { signature: null }],
    ["request id", { requestId: null }],
    ["data id", { dataId: null, rawBody: "{}" }],
  ])("rejeita ausência de %s", async (_caseName, options) => {
    const provider = new MercadoPagoProvider("access-token", SECRET);

    await expect(provider.verifyWebhookSignature(verificationInput(options))).resolves.toBe(false);
  });

  it("rejeita quando o secret do webhook não está configurado", async () => {
    const provider = new MercadoPagoProvider("access-token");

    await expect(
      provider.verifyWebhookSignature(
        verificationInput({ dataId: "123456789", signature: signatureFor("123456789") }),
      ),
    ).resolves.toBe(false);
  });
});
