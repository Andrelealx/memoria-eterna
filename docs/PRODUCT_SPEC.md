# Regras Funcionais (resumo)

Resumo executivo das regras do `PROMPT_MESTRE_PLATAFORMA_PRESENTE_NFC.md`. A spec original é a
referência normativa.

## Posicionamento

- Nicho inicial: **romance**. Proposta: "Transforme suas melhores memórias em um presente que pode
  ser tocado."
- Compra **sem senha** antes do pagamento; conta criada após webhook aprovado, com magic link.

## Planos (preços em centavos, editáveis no admin)

| Plano | Preço | Destaques |
|---|---|---|
| Momento | R$ 19,90 | 7 dias, 5 fotos, 1 template, sem físico |
| Para Sempre | R$ 59,90 | sem expiração, 30 fotos, 12 momentos, música, slug |
| Kit Coração NFC | R$ 149,90 + frete | tudo do Para Sempre + chaveiro NFC + cartão QR |

## Regras inegociáveis

1. Preço e regras nunca hardcoded na UI (vêm do banco/config).
2. Total **nunca** aceito do frontend — backend recalcula plano + adicional + cupom + frete.
3. Publicação só após webhook validado no servidor.
4. NFC guarda URL curta estável `/t/[token]` (nunca a URL final).
5. Chaveiro visualmente limpo (sem QR/URL/símbolo técnico); QR só no cartão.
6. Não hospedar MP3 de usuário; música apenas por embed Spotify/YouTube (whitelist estrita).
7. Não inventar depoimentos/selos/números; não expor segredos no cliente.

## Escopo MVP vs fora

**Incluído:** landing, catálogo, assistente guiado (sem drag-and-drop), upload/otimização de fotos,
prévia fiel, checkout Pix/cartão, publicação/expiração, painel do cliente, páginas públicas, links
curtos NFC, pedido físico + estados, cartão QR, admin, cupons, denúncia, termos/privacidade,
auditoria, e-mails transacionais e analytics.

**Fora:** editor drag-and-drop, app nativo, marketplace, feed, upload de áudio, IA cara, integração
automática de transportadoras (se atrasar), white-label completo, split, lista de casamento.

## Expiração e upgrade

- Validade calculada a partir da **publicação** (não da criação do rascunho).
- Página expirada não vaza conteúdo ao visitante (mensagem neutra); dono vê opção de upgrade.
- Upgrade preserva conteúdo, link e (se houver) o link curto NFC.
