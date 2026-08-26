# Roadmap

## Fase 0 — Diagnóstico ✅

Inspeção do repositório (vazio), stack e ambiente. Plano de riscos.

## Fase 1 — Fundação ✅

Scaffold, tema/marca, componentes base, landing page, banco (schema/migrations/seed), domínio puro,
adapters (com fake/dev), autorização e magic link dev, env validation, documentação e testes
unitários. `lint`, `typecheck`, `test` e `build` passando.

## Fase 2 — Jornada principal ✅

- Catálogo de templates (`/modelos`, `/modelos/[slug]`)
- Assistente de criação com autosave (etapas 1–6)
- Upload/otimização de fotos (sharp, EXIF, variantes)
- Três templates públicos + prévia responsiva (`/presente/[slug]`)

## Fase 3 — Receita ✅ (parcial — Mercado Pago real aguarda credencial)

- Motor de preços/cupons + checkout
- Mercado Pago (sandbox) + Payment Brick
- Webhook seguro e idempotente
- Publicação + e-mails transacionais

## Fase 4 — Operação ✅

- Painel do cliente + admin
- Pedidos físicos + tags NFC + QR do cartão
- Expiração e upgrade

## Fase 5 — Qualidade ✅

- Testes E2E (Playwright), acessibilidade, responsividade, performance, segurança (CSP, rate limit)
- Revisão final de deploy

## Expansão futura (documentar, não implementar agora)

- **Linha Pet**, **Casamento**, **B2B2C/white-label**, **IA assistiva** (com revisão e consentimento).

## Bloqueios / credenciais necessárias

- **Supabase** (DB/Auth/Storage), **Mercado Pago** e **Resend** exigem credenciais externas para
  integração real. Adapters e provedores fake/dev já estão no lugar para o fluxo local.
