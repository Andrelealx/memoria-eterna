# Pagamentos (Mercado Pago)

Implementação em `src/lib/adapters/payment/`. Contrato `PaymentProvider` permite trocar por Stripe
futuramente.

## Provedores

| Provedor | Classe | Ambiente |
|---|---|---|
| Mercado Pago | `MercadoPagoProvider` | produção/sandbox (requer credenciais) |
| Fake | `FakePaymentProvider` | **somente desenvolvimento** (`DEV_FAKE_PAYMENT_ENABLED=true`) |

A factory `getPaymentProvider()` (em `src/lib/adapters/payment/index.ts`) **bloqueia o fake em
produção** e exige `MERCADO_PAGO_ACCESS_TOKEN`.

## Credenciais necessárias

- `MERCADO_PAGO_ACCESS_TOKEN` (servidor, nunca no cliente)
- `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` (Payment Brick, se usado)
- `MERCADO_PAGO_WEBHOOK_SECRET` (validação de assinatura)

## Fluxo

1. O servidor cria o pedido e calcula o total (nunca aceita total do frontend).
2. `createPayment` gera uma **idempotency key** e chama `POST /v1/payments`.
3. Pix: `payment_method_id=pix` e o `point_of_interaction.transaction_data` fornece o QR copia-e-cola.
4. Cartão: Payment Brick no frontend com a `public_key`; o token do cartão é enviado ao backend.
5. O webhook (`/api/webhooks/mercado-pago`, Fase 3) valida a assinatura e processa de forma idempotente.

## Idempotência (obrigatória)

- `payments.idempotency_key` é único por tentativa.
- `payment_events.provider_event_id` é único por evento recebido. Evento repetido → `result = "duplicate"`
  e nenhum efeito colateral (não publica duas vezes, não gera dois pedidos físicos).
- Antes de mudar o pedido para pago, o status é consultado no servidor quando necessário.

## Validação de webhook

Mercado Pago envia `x-signature` (HMAC SHA-256) e `x-request-id`. A verificação usa
`HMAC(secret, requestId + "." + rawBody)` com comparação `timingSafeEqual` (ver
`MercadoPagoProvider.verifyWebhookSignature`).

## Estados e moeda

- Estados: `CREATED`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REFUNDED`, `CHARGEDBACK`.
- Moeda BRL; valores em **centavos inteiros** no backend; formatação `pt-BR` no frontend.
- Nunca armazenar número de cartão ou CVV. Payload do webhook é sanitizado antes de persistir.

## Teste local

Com `DEV_FAKE_PAYMENT_ENABLED=true`, o fake devolve PIX como `PENDING` e cartão como `APPROVED`,
permitindo exercitar o fluxo sem credenciais. **Não é integração real.**
