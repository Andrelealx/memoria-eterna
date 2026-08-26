# Deploy e ambientes

## Ambientes

| Ambiente | Banco | Auth | Storage | Pagamento | E-mail |
|---|---|---|---|---|---|
| Desenvolvimento | PostgreSQL local (docker) | magic link dev | local (`.media/`) | fake (opcional) | log/console |
| Produção | Supabase (PostgreSQL) | Supabase Auth | Supabase Storage | Mercado Pago | Resend |

## Variáveis de ambiente

Copie `.env.example` para `.env` (local) ou configure no provedor de deploy (produção). A aplicação
valida as variáveis em `src/lib/env.ts` e falha com erro técnico claro (no servidor) se uma
configuração obrigatória de produção estiver ausente.

## Passos de deploy (produção)

1. Provisionar Supabase (PostgreSQL + Auth + Storage) e criar o bucket privado `media-originals`.
2. Configurar `DATABASE_URL` (e `DIRECT_URL` para o pooler) e `NEXT_PUBLIC_SUPABASE_URL`/keys.
3. Rodar migrations: `npx prisma migrate deploy`.
4. Aplicar políticas RLS (`prisma/rls-policies.sql`) no Supabase.
5. Configurar Mercado Pago (token de produção/sandbox, webhook secret e URL de notificação).
6. Configurar Resend (`RESEND_API_KEY`, `EMAIL_FROM`) e `APP_ENCRYPTION_KEY`.
7. Deploy em Vercel (ou Node equivalente) com `NODE_ENV=production`.
8. Garantir que `DEV_FAKE_PAYMENT_ENABLED` esteja **false** (o código já bloqueia o fake em produção).

## Migrations

- Dev: `npm run db:migrate` (cria migration a partir do schema).
- Produção: `npm run db:deploy` (`prisma migrate deploy`) — nunca `migrate dev` em produção.

## Cron / jobs (Fase 4)

- Expiração de páginas e lembrete de upgrade (5º dia do plano Momento) via job agendado protegido
  por `CRON_SECRET`.
- Processamento de mídia (variantes) e retenção de rascunhos abandonados.

## Rollback

- Migrations são versionadas e aplicadas com `prisma migrate deploy`; rollback é feito criando uma
  nova migration (não apagando arquivos).
- Dados financeiros nunca são apagados em reembolso/chargeback (marca-se o estado).
