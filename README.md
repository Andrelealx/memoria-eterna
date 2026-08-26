# Presente Vivo (nome de trabalho) — Plataforma de Presentes Digitais com NFC

MVP funcional de uma plataforma brasileira de presentes digitais personalizados. O cliente escolhe
um tema, envia fotos, escreve textos, adiciona uma música permitida (Spotify/YouTube), visualiza a
prévia, paga por Pix ou cartão e recebe um site personalizado pronto para compartilhar — opcionalmente
vinculado a um chaveiro físico com tag NFC escondida.

> **Especificação principal:** `PROMPT_MESTRE_PLATAFORMA_PRESENTE_NFC.md` (raiz do projeto).
> Consulte também `docs/` para decisões técnicas e operacionais.

## Status

**MVP completo localmente** — todas as fases (fundação, jornada, receita, operação e qualidade) concluídas
e verificadas. As integrações reais (Mercado Pago, Supabase, Resend) e o deploy em produção aguardam
credenciais externas. Veja `ACOMPANHAMENTO.md` e `docs/ROADMAP.md`.

## Stack

- **Next.js 16** (App Router, TypeScript estrito) + **React 19**
- **Tailwind CSS v4** + componentes base no padrão shadcn/ui
- **PostgreSQL** (Supabase em produção; container local em dev) + **Prisma** (ORM)
- **Zod** (validação compartilhada), **Vitest** (testes), **ESLint + Prettier**
- Adapters isolados: **Mercado Pago**, **Supabase Storage**, **Resend**, frete e moderação.

## Requisitos

- Node.js 20+ (desenvolvido com Node 26)
- Docker + Docker Compose (para o PostgreSQL local)

## Instalação e execução local

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente (valores de desenvolvimento)
cp .env.example .env

# 3. Banco de dados local (PostgreSQL)
docker-compose up -d

# 4. Migrations + seed (dados fictícios de demonstração)
npm run db:migrate
npm run db:seed

# 5. Servidor de desenvolvimento
npm run dev
```

Abra http://localhost:3000. O seed cria o admin `admin@presentevivo.local` (papel `ADMIN`).

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (unitários) |
| `npm run format` | Prettier |
| `npm run db:migrate` | Aplica migrations de dev |
| `npm run db:seed` | Popula dados de demonstração |
| `npm run db:studio` | Prisma Studio |
| `npm run verify` | lint + typecheck + test + build |

## Estrutura

```
src/
  app/            rotas (App Router; (marketing) para páginas públicas)
  components/     ui/ (base) e layout/ (header/footer)
  lib/
    domain/       regras de negócio puras (preços, slug, tokens, estados, música, sanitização)
    adapters/     pagamento, storage, frete, e-mail, moderação (interfaces + impls)
    auth/         autorização (papéis) e magic link de desenvolvimento
    brand.ts      configuração central da marca
    env.ts        validação de variáveis de ambiente
    db.ts         Prisma Client (singleton)
prisma/           schema.prisma, migrations, seed.ts
docs/             documentação (arquitetura, dados, pagamentos, NFC, segurança, deploy, roadmap)
```

## Documentação

- `docs/ARCHITECTURE.md` — decisões técnicas e diagramas
- `docs/DATA_MODEL.md` — tabelas e relacionamentos
- `docs/PRODUCT_SPEC.md` — regras funcionais
- `docs/PAYMENTS.md` — Mercado Pago, webhook e idempotência
- `docs/NFC_OPERATIONS.md` — geração/gravação/teste de tags e cartão
- `docs/SECURITY_PRIVACY.md` — threat model, LGPD e retenção
- `docs/DEPLOYMENT.md` — ambientes, migrations, storage e cron
- `docs/ROADMAP.md` — MVP, Fase 2 e Fase 3

## Aviso importante

- `DEV_FAKE_PAYMENT_ENABLED=true` habilita um provedor de pagamento **fake**, disponível **somente
  em desenvolvimento**. Em produção o provedor fake é bloqueado (ver `src/lib/adapters/payment/`).
- O nome **"Presente Vivo"** é um nome de trabalho. Não foi aprovado para uso em produção (domínio,
  redes sociais e marca registrada pendentes de pesquisa).
- Dados do seed são **fictícios** e claramente identificados como demonstração.
