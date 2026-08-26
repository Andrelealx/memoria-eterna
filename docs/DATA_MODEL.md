# Modelo de Dados

Fonte de verdade: `prisma/schema.prisma` (migrations em `prisma/migrations/`). Conceitos da seção 15.

## Entidades

| Tabela | Propósito | Pontos-chave |
|---|---|---|
| `users` | Identidade + papel (`CUSTOMER/OPERATOR/ADMIN`) | e-mail normalizado único; consentimentos LGPD em JSON |
| `magic_link_tokens` | Magic link **de desenvolvimento** | hash SHA-256, expiração e uso único |
| `categories` | Nicho (inicialmente "Romance") | slug único |
| `templates` | Templates de apresentação | `schema_version` + `presets` JSON |
| `plans` | Planos comerciais | preço em centavos, `duration_days` (null = sem expiração), `limits` JSON |
| `projects` | O presente | `draft_token` (visitante), `public_token`, `slug`, `status`, `content` JSON versionado |
| `project_versions` | Versões publicadas estáveis | edição preserva a versão publicada |
| `media_assets` | Mídias do projeto | `storage_key` privado, MIME verificado, variantes JSON |
| `orders` | Pedido comercial | `order_number` humano (não secreto), snapshot de endereço, UTM/partner |
| `order_items` | Itens do pedido | snapshot de descrição e preço |
| `payments` | Pagamento | `idempotency_key` único, payload sanitizado |
| `payment_events` | Eventos de webhook | `provider_event_id` único → idempotência |
| `nfc_tags` | Tag NFC | `public_token` único, `destination_url` (troca sem regravar) |
| `physical_orders` | Produção física | status + SKU/cor + rastreio |
| `coupons` / `coupon_redemptions` / `coupon_plans` | Cupons | validade, limites, planos elegíveis |
| `abuse_reports` | Denúncias | decisão + administrador |
| `audit_logs` | Auditoria administrativa | antes/depois sanitizado |
| `analytics_events` | Eventos de funil | sem conteúdo sensível |

## Estados de negócio (seção 21)

- **Projeto:** `DRAFT → AWAITING_PAYMENT → PROCESSING → PUBLISHED → EXPIRED/ARCHIVED` (+ `BLOCKED`, `CANCELLED`)
- **Pagamento:** `CREATED → PENDING → APPROVED | REJECTED/CANCELLED` (+ `REFUNDED/CHARGEDBACK`)
- **Pedido físico:** `WAITING_PAYMENT → QUEUED → PRINTING → ASSEMBLY → NFC_WRITING → QUALITY_CHECK → PACKED → SHIPPED → DELIVERED`
- **Tag NFC:** `GENERATED → WRITTEN → TESTED → PACKED → SHIPPED → ACTIVE → DISABLED`

As transições permitidas ficam em `src/lib/domain/state-machine.ts` (nunca um select livre no frontend).

## Separação de estados

`payments.status`, `projects.status` e `physical_orders.status` são independentes. Um webhook que
repete o evento de pagamento aprovado não pode publicar duas vezes (idempotência via `payment_events`).
