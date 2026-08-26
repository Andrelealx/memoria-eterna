# Acompanhamento da implementação

Arquivo de acompanhamento de tarefas. Status atualizado a cada fase concluída.

> Especificação normativa: `PROMPT_MESTRE_PLATAFORMA_PRESENTE_NFC.md`

## Legenda

- `[x]` concluído · `[>]` em andamento · `[ ]` pendente · `[!]` bloqueado

---

## Fase 0 — Diagnóstico ✅

- [x] Inspecionar repositório (vazio: sem git, sem package.json, sem código).
- [x] Identificar ambiente: Node 26, npm 11, Docker ativo, `docker-compose` disponível.
- [x] Escrever diagnóstico, stack, riscos e decisões.

## Fase 1 — Fundação ✅

- [x] Scaffold Next.js 16 + TS estrito + Tailwind v4 + ESLint + Prettier.
- [x] Config de marca (`brand.ts`) + tema (cores/fontes da seção 7).
- [x] Componentes base (Button, Card, Input, Label, Textarea, Badge, Logo, Header, Footer).
- [x] Landing page (seção 9) com hero, como funciona, modelos, produto físico, planos, privacidade e FAQ.
- [x] Banco: schema Prisma completo (seção 15), migration `init`, seed (seção 22).
- [x] Domínio puro: planos, templates, projetos, enums, preços, slug, tokens, state machine, música, sanitização.
- [x] Adapters: PaymentProvider, MediaStorageAdapter, ShippingProvider, Email, Moderation (+ fake/dev).
- [x] Auth/autorização (papéis + guards + magic link dev).
- [x] Env validation + `.env.example`.
- [x] Documentação (README + docs/).
- [x] Testes unitários (28) + lint + typecheck + build **passando**.

## Fase 2 — Jornada principal ✅

- [x] Catálogo de templates (`/modelos`, `/modelos/[slug]`).
- [x] Assistente de criação com autosave (`/criar`, 6 etapas + `draft_token` retomável).
- [x] Upload/otimização de fotos (sharp, detecção de MIME, remoção de EXIF, variantes WebP).
- [x] Três templates públicos + página `/presente/[slug]` (noindex, compartilhar, denúncia).
- [x] Resolução de mídia (placeholders/privado) + rota `/media/[...path]` (dev).

> Pendência menor (não bloqueante): reordenar fotos com botões (mover para cima/baixo) no assistente.

## Fase 3 — Receita ✅ (parcial: Mercado Pago aguarda credencial)

- [x] Cupons (elegibilidade) + criação de pedido no servidor (preço recalculado).
- [x] Checkout Pix/cartão com provedor **fake** em dev (verificado ponta a ponta).
- [x] Webhook seguro e idempotente (`/api/webhooks/mercado-pago`) + publicação do presente.
- [x] Páginas `/pagamento/{sucesso,pendente,falha}` + e-mail transacional (log em dev).
- [ ] Mercado Pago real (sandbox) + Payment Brick — **aguarda `MERCADO_PAGO_ACCESS_TOKEN`**.

## Fase 4 — Operação ✅

- [x] Sessão por magic link (dev) + proteção de rotas (cliente/admin) no servidor.
- [x] Painel do cliente (`/painel`, presentes, pedido, conta).
- [x] Admin (`/admin`): dashboard, pedidos, NFC, planos, templates, cupons, denúncias, clientes, auditoria, configurações.
- [x] Pedidos físicos + transições de estado validadas (state machine).
- [x] Tags NFC: geração, transições, QR do cartão e redirect `/t/[token]`.
- [x] Denúncia (`/denunciar/[projectId]`).
- [ ] Upgrade (preservar link) e cron de expiração — domínio preparado; fluxo completo na Fase 5.

## Fase 5 — Qualidade ✅

- [x] Upgrade de plano (preserva link/conteúdo/NFC; dev com provedor fake).
- [x] Cron de expiração (`/api/cron/expire`, `CRON_SECRET`) + lembrete do Plano Momento.
- [x] Segurança: CSP compatível com embeds + rate limiting no redirect NFC.
- [x] Testes E2E (Playwright, 4 fluxos críticos).
- [ ] Deploy real (Vercel/Supabase) — **aguarda credenciais de produção**.

> Hardening adicional (documentado, não bloqueante): CSP com nonces; rate limit distribuído (Upstash);
> testes E2E dos fluxos de pagamento/upgrade/físico com servidor + banco isolados.

---

## Bloqueios / dependências de credenciais (registrados)

| Integração | O que falta | Onde está preparado |
|---|---|---|
| Supabase (DB/Auth/Storage) | credenciais de projeto Supabase | adapters + schema + RLS policies |
| Mercado Pago | `MERCADO_PAGO_ACCESS_TOKEN` e webhook secret | `PaymentProvider` + `MercadoPagoProvider` |
| Resend | `RESEND_API_KEY` e `EMAIL_FROM` | `EmailProvider` + `ResendEmailProvider` |

Nenhuma integração real foi declarada como concluída. Em desenvolvimento usam-se provedores
fake/local/log claramente identificados.

## Próximos passos

1. Integração real (Mercado Pago sandbox, Supabase, Resend) quando houver credenciais.
2. Deploy real (Vercel/Supabase) — aguarda credenciais de produção.
3. Hardening opcional (não bloqueante): CSP com nonces; rate limit distribuído (Upstash);
   reordenar fotos com botões no assistente.
