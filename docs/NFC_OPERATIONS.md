# Operação NFC e produto físico

## Princípio (seções 7, 13)

- A tag guarda uma **URL curta e estável** `https://dominio.com/t/<token>` — nunca a URL final do casal.
- `/t/[token]` redireciona (302/307) para o destino atual (`nfc_tags.destination_url`).
- Trocar o destino **não** exige regravar a tag: basta atualizar `destination_url`.
- O chaveiro fica visualmente limpo; o QR Code de contingência fica apenas no cartão.

## Token

- `generateNfcToken()` produz token público aleatório, não sequencial, sem dados pessoais (alfabeto
  sem caracteres ambíguos). `nfc_tags.public_token` é único e indexado.
- Rate limiting no redirect (Fase 4) impede varredura de tokens. Métricas com IP anonimizado/sem IP bruto.

## Estados da tag

`GENERATED → WRITTEN → TESTED → PACKED → SHIPPED → ACTIVE → DISABLED`

- `DISABLED` a partir de qualquer estado (tag perdida). Uma substituta pode ser vinculada.
- Cada mudança registra operador e horário (auditoria).

## Fluxo operacional (admin, Fase 4)

1. Gerar token e URL curta.
2. Copiar a URL e gravá-la com um aplicativo confiável de NFC.
3. Confirmar teste da tag (obrigatório antes de "PACKED").
4. Gerar o QR Code do cartão (nomes + "Aproxime o celular do coração").
5. Registrar estados e marcar embalado/enviado com rastreio.

Web NFC é melhoria futura (suporte inconsistente entre navegadores); o fluxo operacional não depende dela.

## Regras

- Pedido físico **não** pode ser marcado como `PACKED` sem tag testada quando há NFC
  (`canPackPhysicalOrder` em `src/lib/domain/state-machine.ts`).
- O modelo 3D da peça não faz parte desta aplicação; o sistema guarda SKU, cor, quantidade e observação.
- Embalagem e cartão usam o mesmo pedido e a mesma tag.
