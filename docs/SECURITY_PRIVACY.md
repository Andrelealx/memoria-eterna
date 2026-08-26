# Segurança, Privacidade e LGPD

## Threat model (resumo)

Ameaças principais: IDOR (acessar projeto/pedido alheio), HTML/script arbitrário, upload malicioso,
varredura de tokens NFC, webhook forjado/duplicado, vazamento de segredos e conteúdo íntimo não
consentido.

## Medidas implementadas (Fase 1)

- Validação Zod no servidor; sanitização de texto (bloqueio de HTML arbitrário) em `domain/sanitize.ts`.
- Tokens aleatórios e não sequenciais (`domain/tokens.ts`), com hash para magic links.
- Autorização por papéis (`auth/authorize.ts`) e prevenção de IDOR (`canAccessOwnedResource`).
- Segredos somente no servidor; `.env` no `.gitignore`; `.env.example` sem valores reais.
- Whitelist estrita de Spotify/YouTube (`domain/music.ts`).
- Headers de segurança base em `next.config.ts`.
- Adapters com guardas: sem credencial → erro claro, nunca "sucesso" falso.
- Provedor fake de pagamento bloqueado em produção.

## Medidas previstas (Fases 3–5)

- Verificação real de MIME/tamanho, remoção de EXIF e nomes aleatórios no upload.
- Bucket privado + URLs assinadas de curta duração; páginas públicas só com variantes de publicação.
- CSRF, cookies `HttpOnly`/`SameSite`/`Secure`, rate limiting (login, upload, pedido, cupom, denúncia, NFC).
- CSP compatível com embeds permitidos.
- RLS no Supabase (políticas em `prisma/rls-policies.sql`).

## LGPD

- Consentimentos registrados com data no perfil (`consents`, `consentTermsAt`, `consentPrivacyAt`).
- Fluxo de exclusão/remoção de conteúdo previsto no painel do cliente.
- Política de retenção configurável para rascunhos abandonados e arquivos órfãos.
- Analytics sem fotos, mensagens ou dados pessoais.

## Moderação

No MVP sem serviço externo, **não há análise por IA**. O adapter `NoopModerationAdapter` aprova tudo;
a moderação efetiva é feita por denúncia + revisão administrativa + estados de bloqueio. Nunca
alegar que uma foto foi analisada por IA se isso não aconteceu.

## Regra contra abuso

Conteúdo íntimo não consentido, exploração infantil, violência ilegal e uso abusivo são proibidos;
denúncia (`/denunciar/[projectId]`) e bloqueio administrativo previstos.
