# PROMPT MESTRE — PLATAFORMA DE PRESENTES DIGITAIS COM NFC

> Copie todo o conteúdo deste arquivo e envie à ferramenta de IA responsável por construir o sistema. Este documento é uma especificação de produto e implementação. Não entregue apenas uma demonstração visual: construa uma aplicação funcional, segura, responsiva e preparada para produção.

---

## 1. PAPEL DA IA E OBJETIVO DA MISSÃO

Atue simultaneamente como:

- Product Manager sênior;
- UX/UI Designer especializado em produtos emocionais e e-commerce;
- Arquiteto de software SaaS;
- Desenvolvedor full-stack sênior;
- Especialista em segurança, pagamentos e LGPD;
- QA Engineer.

Sua missão é projetar e implementar o MVP funcional de uma plataforma brasileira de presentes digitais personalizados. Nela, uma pessoa sem conhecimento técnico poderá escolher um tema, enviar fotos, escrever textos, informar datas, adicionar uma música permitida, visualizar uma prévia, pagar por Pix ou cartão e receber um site personalizado pronto para compartilhar.

O principal diferencial comercial é a integração opcional com um objeto físico impresso em 3D contendo uma tag NFC escondida. No primeiro nicho, romance, esse objeto será um chaveiro em formato de coração. Ao aproximá-lo de um celular compatível, a página personalizada do casal será aberta. O QR Code de contingência não deve aparecer no chaveiro; ele ficará apenas no cartão impresso que acompanha o produto.

O sistema deve nascer focado no nicho romântico, mas sua arquitetura deverá permitir adicionar posteriormente casamento, pets, nascimento, 15 anos, memorial, viagens e produtos corporativos sem duplicar o núcleo da aplicação.

Não use “Atlas Tecnologias” como marca comercial deste produto. A Atlas poderá aparecer futuramente apenas como empresa desenvolvedora/operadora nos termos ou no rodapé institucional. A produção física poderá ser operada pela Special Art, mas essa informação deve ser configurável e não precisa aparecer para o comprador no MVP.

---

## 2. PRINCÍPIOS OBRIGATÓRIOS DO PRODUTO

1. O produto precisa parecer um presente premium, afetivo e confiável — não uma página genérica criada por IA.
2. O fluxo precisa ser simples para pessoas leigas e funcionar perfeitamente no celular.
3. A compra deve poder ocorrer sem exigir que o cliente crie senha antes do pagamento.
4. O preço e as regras dos planos nunca devem ficar hardcoded na interface; devem vir do banco ou de uma configuração central segura.
5. O valor final nunca poderá ser aceito diretamente do frontend. O backend deve recalcular tudo com base no plano, adicionais, cupom e frete.
6. Uma página só poderá ser publicada depois de a confirmação real do pagamento chegar pelo webhook e ser validada no servidor.
7. O NFC nunca deve guardar a URL final do casal. Deve guardar uma URL curta e estável com token, como `https://dominio.com/t/AB7K9X`, que redirecionará para o destino atual configurado no sistema.
8. O chaveiro deve permanecer visualmente limpo. Nenhum QR Code, endereço de site ou símbolo técnico na peça.
9. O QR Code de contingência deverá ser gerado no cartão que acompanha o produto físico.
10. A implementação deve ser modular, tipada, testável e pronta para receber novos templates e nichos.
11. Não implemente um editor drag-and-drop no MVP. Use um assistente guiado com etapas e campos controlados.
12. Não invente depoimentos, avaliações, número de clientes ou selos falsos.
13. Não hospede arquivos MP3 enviados por usuários. Música deverá funcionar apenas por link/embed permitido, inicialmente Spotify e YouTube.
14. Não exponha segredos, chaves privadas, tokens de pagamento ou credenciais no cliente ou no repositório.

---

## 3. POSICIONAMENTO DO PRODUTO

### Proposta de valor

“Transforme suas melhores memórias em um presente que pode ser tocado.”

A plataforma transforma fotos, datas e mensagens em uma experiência digital pronta para presentear. O produto pode ser somente digital ou acompanhado de um coração físico com NFC escondido.

### Público inicial

- Pessoas de 16 a 40 anos em um relacionamento;
- Compradores de presentes de aniversário de namoro, aniversário do parceiro, Dia dos Namorados, pedido de namoro, noivado e surpresa espontânea;
- Usuários que descobrem o produto por TikTok, Reels, influenciadores, floriculturas e lojas de presentes.

### Emoções que a interface deve transmitir

- carinho;
- surpresa;
- exclusividade;
- confiança;
- facilidade;
- acabamento premium.

### Tom de voz

- brasileiro, próximo, elegante e direto;
- romântico sem ser infantil ou exageradamente meloso;
- frases curtas;
- evitar linguagem técnica;
- nunca dizer “gere HTML”, “instância”, “storage” ou termos técnicos para o cliente;
- preferir “criar presente”, “nossa história”, “ver prévia” e “publicar surpresa”.

### Nome da marca

Use temporariamente a variável de configuração `BRAND_NAME`, com valor inicial “Presente Vivo” apenas como nome de trabalho. Centralize nome, domínio, logotipo textual, cores, contato e dados jurídicos em um arquivo/configuração de marca para que possam ser substituídos posteriormente sem refatoração.

Antes de usar um nome definitivo em produção, deverá ser feita pesquisa de domínio, redes sociais e marca registrada. Não trate “Presente Vivo” como nome aprovado.

---

## 4. MODELO COMERCIAL INICIAL

Os preços deverão ser editáveis pelo painel administrativo. Cadastre inicialmente:

### Plano Momento — R$ 19,90

- site publicado por 7 dias após a ativação;
- até 5 fotos;
- 1 template romântico selecionado;
- nomes do casal;
- mensagem principal;
- data do relacionamento e contador;
- compartilhamento por link e WhatsApp;
- sem chaveiro físico;
- possibilidade de upgrade antes e depois da expiração.

### Plano Para Sempre — R$ 59,90

- site sem data programada de expiração, sujeito aos termos de disponibilidade do serviço;
- até 30 fotos otimizadas;
- todos os templates românticos disponíveis;
- linha do tempo com até 12 momentos;
- mensagem, contador, galeria e música por embed;
- slug personalizado, se estiver disponível;
- edição posterior pelo proprietário;
- QR Code digital para download;
- sem chaveiro físico.

### Kit Coração NFC — R$ 149,90 + frete

- todos os recursos do Plano Para Sempre;
- um chaveiro de coração com tag NFC escondida;
- cartão impresso personalizado com instruções simples e QR Code de contingência;
- embalagem plana e protegida;
- acompanhamento do pedido;
- cor do chaveiro selecionável entre opções em estoque;
- frete calculado ou configurado separadamente.

### Preparação para uma opção futura

Deixe a estrutura pronta para o kit “Duas Metades”, composto por duas metades de um coração que se unem, cada uma com sua própria tag NFC apontando para a mesma página. Não precisa habilitar a venda no MVP, mas não crie uma modelagem que impeça vários itens NFC vinculados ao mesmo projeto.

### Regras comerciais

- Não parcelar o plano de R$ 19,90.
- Permitir Pix e cartão via Mercado Pago.
- Destacar Pix como forma preferencial sem enganar o cliente.
- Cupons devem ter validade, limite de uso, planos permitidos e valor fixo ou percentual.
- Upgrade deve cobrar a diferença ou um preço de upgrade configurado no painel.
- No quinto dia do Plano Momento, deixar preparado um evento para enviar lembrete de expiração e oferecer upgrade. O envio automático poderá entrar na fase seguinte, mas o evento e o estado precisam existir.
- Prever reembolso e chargeback sem apagar o histórico financeiro.

---

## 5. ESCOPO EXATO DO MVP

### Incluído

- site institucional/landing page;
- catálogo de templates românticos;
- assistente de criação em etapas;
- upload e otimização de imagens;
- prévia fiel da página;
- checkout Pix/cartão pelo Mercado Pago;
- criação automática do acesso do cliente após a compra;
- publicação e expiração das páginas;
- painel do cliente;
- páginas públicas personalizadas;
- links curtos redirecionáveis para NFC;
- registro operacional das tags NFC;
- pedido físico e estados básicos de produção/expedição;
- cartão com QR Code de contingência;
- painel administrativo;
- cupons;
- página de denúncia;
- termos, privacidade e consentimento;
- logs de auditoria administrativa;
- e-mails transacionais essenciais;
- analytics de eventos sem armazenar conteúdo sensível desnecessário.

### Fora do MVP

- editor drag-and-drop;
- aplicativo nativo;
- marketplace público de páginas;
- feed social;
- upload de áudio;
- IA cara para gerar vídeos;
- integração automática com transportadoras, se atrasar o lançamento;
- programa completo de revendedores/white-label;
- split de pagamentos;
- lista de presentes de casamento;
- outros nichos totalmente publicados.

Mesmo fora do MVP, preserve limites arquiteturais que facilitem essas expansões.

---

## 6. STACK RECOMENDADA

Se o repositório estiver vazio, utilize:

- Next.js com App Router e TypeScript em modo estrito;
- React;
- Tailwind CSS;
- componentes acessíveis baseados em shadcn/ui ou Radix UI;
- Lucide Icons;
- PostgreSQL;
- Supabase para PostgreSQL, autenticação e storage no MVP;
- ORM Prisma ou Drizzle, escolhendo apenas um e justificando em `docs/ARCHITECTURE.md`;
- Zod para validação compartilhada;
- Mercado Pago como primeiro provedor de pagamento;
- Resend ou provedor equivalente para e-mails transacionais;
- biblioteca madura para geração de QR Code;
- Vitest para testes unitários;
- Playwright para os fluxos críticos end-to-end;
- ESLint, Prettier e scripts de verificação;
- deploy compatível com Vercel ou infraestrutura Node equivalente.

Se já houver um projeto existente, inspecione-o primeiro e preserve a stack quando ela for adequada. Não refaça o projeto sem necessidade.

Use versões estáveis e compatíveis no momento da implementação, fixe as dependências no lockfile e não dependa de APIs experimentais sem necessidade.

### Armazenamento de mídia

Para o MVP, Supabase Storage é aceitável. Isole o acesso em uma camada `MediaStorageAdapter` para permitir migração futura para Cloudflare R2 sem alterar a lógica de negócio.

### Pagamentos

Crie uma interface `PaymentProvider` com implementação `MercadoPagoProvider`. Deixe o contrato preparado para `StripeProvider`, mas não implemente Stripe no MVP sem necessidade. O sistema deve operar em BRL.

---

## 7. IDENTIDADE VISUAL DESCRITA EM TEXTO

A ferramenta não terá imagens de referência. Portanto, siga exatamente estas orientações e construa os elementos decorativos com CSS e SVG simples.

### Direção de arte

Visual contemporâneo, afetivo e premium. Misturar a delicadeza de um presente artesanal com a limpeza de um produto digital moderno. Evitar aparência de loja genérica, excesso de gradientes, corações espalhados por toda parte, glassmorphism excessivo e elementos que pareçam gerados aleatoriamente por IA.

### Paleta principal

- Fundo creme: `#FFF9F5`;
- Superfície branca: `#FFFFFF`;
- Vinho principal: `#7A2438`;
- Vinho escuro: `#4B1625`;
- Rosa queimado: `#D99AAA`;
- Rosa muito claro: `#F8E8EC`;
- Dourado discreto: `#C6A15B`;
- Grafite: `#231F20`;
- Cinza de texto: `#6E6568`;
- Borda suave: `#EADDE0`;
- Sucesso: `#247A52`;
- Erro: `#B42318`.

Garanta contraste WCAG AA. O dourado deve ser decorativo e não a única cor de textos pequenos.

### Tipografia

- Títulos emocionais e editoriais: `Playfair Display` ou serifada equivalente;
- Interface, botões, formulários e textos: `Inter` ou sans-serif equivalente;
- Carregar fontes com otimização nativa do framework;
- Não usar fontes manuscritas em textos funcionais;
- Escala clara: título hero entre 48 e 64 px no desktop e 36 a 42 px no celular; corpo entre 16 e 18 px; labels nunca menores que 14 px.

### Formas e componentes

- cantos arredondados entre 14 e 24 px;
- botões principais em vinho, texto branco e sombra muito discreta;
- botões secundários com fundo transparente e borda vinho;
- cartões brancos com borda suave, sem sombras pesadas;
- bastante espaço em branco;
- pequenos detalhes lineares em SVG, como traço de coração, fita ou estrela de quatro pontas;
- animações suaves entre 180 e 350 ms;
- respeitar `prefers-reduced-motion`;
- estados de foco sempre visíveis.

### Logotipo provisório

Criar somente um wordmark textual configurável com o nome de trabalho. À esquerda, usar um símbolo SVG minimalista composto por duas curvas que formam um elo/coração abstrato. Não criar um logotipo complexo nem tratá-lo como definitivo.

### Imagens e placeholders

- Não buscar imagens aleatórias da internet.
- Não incluir links remotos frágeis.
- Para o ambiente de demonstração, criar placeholders locais em SVG com composição elegante e rótulo “Sua foto aqui”.
- Quando o cliente enviar fotos reais, elas substituem os placeholders.
- Usar `object-fit: cover`, foco configurável e recorte responsivo.
- Nunca esticar ou deformar a foto.

---

## 8. MAPA DE ROTAS E TELAS

### Área pública comercial

- `/` — landing page;
- `/modelos` — catálogo de templates;
- `/modelos/[slug]` — demonstração do template;
- `/como-funciona` — explicação do fluxo;
- `/precos` — comparação dos planos;
- `/criar` — início do assistente;
- `/checkout/[orderId]` — checkout;
- `/pagamento/sucesso` — retorno após pagamento;
- `/pagamento/pendente` — Pix ou análise pendente;
- `/pagamento/falha` — pagamento recusado;
- `/presente/[slug]` — página pública publicada;
- `/t/[token]` — redirect estável da tag NFC/QR;
- `/denunciar/[projectId]` — denúncia de conteúdo;
- `/termos`;
- `/privacidade`;
- `/ajuda`.

### Área do cliente

- `/entrar` — magic link por e-mail;
- `/painel` — visão geral;
- `/painel/presentes`;
- `/painel/presentes/[id]` — editar, visualizar, compartilhar e acompanhar validade;
- `/painel/pedidos/[id]` — pagamento, produção, expedição e rastreio;
- `/painel/conta` — dados, consentimentos e exclusão.

### Área administrativa

- `/admin` — indicadores;
- `/admin/projetos`;
- `/admin/pedidos`;
- `/admin/pedidos/[id]`;
- `/admin/nfc`;
- `/admin/templates`;
- `/admin/planos`;
- `/admin/cupons`;
- `/admin/denuncias`;
- `/admin/clientes`;
- `/admin/auditoria`;
- `/admin/configuracoes`.

Proteja rotas privadas no servidor. Nunca confie apenas em esconder menus no frontend.

---

## 9. LANDING PAGE — LAYOUT EXATO

### Cabeçalho

- altura compacta;
- logo à esquerda;
- links “Como funciona”, “Modelos” e “Preços” no centro em desktop;
- “Entrar” e botão “Criar meu presente” à direita;
- no celular, logo, botão principal reduzido e menu acessível;
- cabeçalho inicialmente transparente/creme e com fundo sólido suave ao rolar.

### Hero

Desktop em duas colunas; celular em uma coluna.

Coluna esquerda:

- selo pequeno: “Uma surpresa feita por você”;
- título: “Suas memórias em um presente que pode ser tocado.”;
- texto: “Crie uma página com fotos, mensagens e a história de vocês. Se quiser, conecte tudo a um coração com NFC.”;
- CTA principal: “Criar meu presente”;
- CTA secundário: “Ver como funciona”;
- microtexto: “A partir de R$ 19,90 • Pronto em poucos minutos”.

Coluna direita:

- construir com HTML/CSS um mockup de celular mostrando uma página romântica;
- ao lado ou sobreposto, criar uma representação vetorial simples de um chaveiro de coração vinho, com argola e brilho discreto;
- inserir três etiquetas flutuantes pequenas: “Fotos”, “Nossa história” e “NFC”;
- não depender de fotografia externa.

### Como funciona

Três cartões numerados:

1. “Escolha o estilo”;
2. “Conte a história de vocês”;
3. “Envie o link ou presenteie com NFC”.

### Modelos

Mostrar três prévias de templates dentro de molduras de celular, com nomes e CTA:

- Romance Clássico;
- Nossa Linha do Tempo;
- Amor Minimalista.

### Seção do produto físico

Fundo vinho escuro, texto creme. Exibir ilustração vetorial do coração e explicar:

“A tecnologia fica escondida. A emoção aparece quando a pessoa encosta o celular.”

Incluir três benefícios: NFC oculto, link atualizável e QR de segurança no cartão.

### Comparação de planos

Três cartões. Destacar “Para Sempre” como mais escolhido sem alegar estatística real; use apenas o selo “Melhor experiência”. Mostrar preço, recursos e CTA.

### Segurança e privacidade

Bloco curto explicando que a página pode ser pública por link, não aparece em busca interna, fotos são protegidas e o proprietário pode solicitar exclusão.

### FAQ

Responder pelo menos:

- Precisa saber criar site?
- Funciona em qualquer celular?
- E se o celular não tiver NFC?
- Posso editar depois?
- Quanto tempo a página fica no ar?
- Posso usar qualquer música?
- Quanto demora o envio do chaveiro?

### Rodapé

Logo, navegação, contato, termos, privacidade, ajuda e copyright dinâmico. Não exibir telefone ou CNPJ fictícios.

---

## 10. ASSISTENTE DE CRIAÇÃO

O fluxo deve salvar rascunho automaticamente e ser retomável no mesmo dispositivo. Se o usuário informar o e-mail, associe o rascunho à conta após autenticação/compra.

Use barra de progresso, botões “Voltar” e “Continuar”, validação por etapa e resumo do que falta. No celular, mantenha o CTA principal visível sem cobrir campos.

### Etapa 1 — Ocasião e template

- nicho “Romance” selecionado;
- mostrar os três templates;
- permitir prévia em tela cheia;
- templates de outros nichos podem aparecer apenas como “Em breve”, sem checkout.

### Etapa 2 — Informações principais

- nome de quem está criando;
- nome de quem receberá;
- título da página;
- data do início do relacionamento;
- mensagem principal;
- tratamento/pronomes opcionais sem impor gênero;
- contador ativado/desativado.

### Etapa 3 — Fotos

- upload múltiplo;
- limite conforme o plano ainda pretendido;
- aceitar JPEG, PNG, WebP e HEIC se houver conversão segura;
- recusar executáveis, SVG de usuário e MIME inconsistente;
- tamanho máximo configurável;
- exibir progresso individual;
- permitir reordenar;
- definir capa;
- permitir recorte/foco simples;
- remover metadados EXIF;
- gerar versões responsivas e thumbnail;
- não bloquear todo o formulário se uma foto falhar; informar qual falhou.

### Etapa 4 — Nossa história

- criar momentos opcionais com data, título, texto e uma foto;
- ordenação cronológica ou manual;
- limite conforme o plano;
- botão “Me ajude a escrever” apenas se houver integração de IA configurada;
- sem integração, oferecer sugestões estáticas claramente editáveis;
- nunca publicar texto gerado sem o usuário revisar e confirmar.

### Etapa 5 — Música e detalhes

- aceitar URL do Spotify ou YouTube;
- validar domínio e extrair o identificador com segurança;
- mostrar preview do embed;
- não reproduzir automaticamente com som;
- permitir escolher frase final;
- permitir selecionar cores apenas entre presets aprovados do template;
- escolher slug personalizado no plano compatível;
- verificar disponibilidade em tempo real com debounce e validação definitiva no servidor.

### Etapa 6 — Prévia e plano

- exibir prévia mobile como principal e opção desktop;
- marca d’água discreta apenas antes do pagamento;
- checklist do conteúdo;
- seleção do plano;
- se escolher produto físico: cor em estoque, endereço, frete e prazo estimado;
- resumo completo do preço;
- aceite dos Termos e da Política de Privacidade;
- confirmação de que o usuário possui autorização para utilizar as imagens e o conteúdo enviado;
- CTA “Ir para pagamento”.

---

## 11. TEMPLATES PÚBLICOS DO MVP

Todos devem compartilhar o mesmo schema de conteúdo e componentes seguros. O template muda a apresentação, não cria código arbitrário.

### Template 1 — Romance Clássico

- fundo creme;
- capa em tela cheia com foto, leve overlay vinho e nomes em serifada;
- frase de abertura;
- contador “Juntos há…”;
- carta central em cartão branco;
- galeria elegante em mosaico;
- linha do tempo vertical;
- música em bloco discreto;
- mensagem final;
- pequenos detalhes dourados e rosa queimado.

### Template 2 — Nossa Linha do Tempo

- visual editorial;
- início com data e nomes;
- cada momento alterna foto e texto;
- linha vertical fina ligando datas;
- contador fixado em bloco de destaque;
- galeria final em carrossel acessível;
- paleta vinho, branco e rosa claro.

### Template 3 — Amor Minimalista

- fundo branco quente;
- tipografia grande em grafite;
- fotos com bastante respiro;
- detalhes em vinho apenas nos CTAs e divisores;
- seções curtas e cinematográficas;
- nenhuma decoração excessiva;
- adequado a casais que preferem estética neutra.

### Requisitos comuns

- mobile-first;
- carregamento rápido;
- SEO `noindex` por padrão para proteger a privacidade;
- Open Graph configurável, com opção de usar uma capa segura;
- link difícil de adivinhar mesmo com slug amigável, ou mecanismo adicional de token quando necessário;
- opção futura de senha/PIN, prevista no modelo;
- botão de compartilhar usando Web Share API e fallback para copiar link;
- botão de denúncia discreto no rodapé;
- não expor e-mail, endereço, ID interno ou dados de pagamento.

---

## 12. AUTENTICAÇÃO E EXPERIÊNCIA PÓS-COMPRA

### Compra sem senha

1. O cliente cria o presente como visitante.
2. Antes do checkout, informa nome e e-mail.
3. O pedido é criado no servidor.
4. O cliente paga.
5. O webhook confirma o pagamento.
6. O sistema publica/processa o presente e cria ou associa uma conta ao e-mail.
7. O cliente recebe um link mágico para acessar o painel, sem senha inicial.

Evite enumeração de contas. Mensagens de login devem ser neutras.

### Painel do cliente

Exibir:

- cartão de cada presente com capa, destinatário, estado e validade;
- ações “Ver página”, “Editar”, “Compartilhar” e “Fazer upgrade”;
- pedido físico com estados claros;
- link NFC e status da tag sem mostrar o token completo desnecessariamente;
- possibilidade de trocar o destino da tag apenas entre páginas pertencentes ao próprio cliente;
- exclusão da conta e solicitação de remoção de conteúdo;
- histórico de pedidos e recibos disponíveis.

Edições em páginas publicadas devem preservar uma versão publicada estável. Salvar rascunho e aplicar alterações com ação explícita “Publicar mudanças”.

---

## 13. NFC E OPERAÇÃO DO PRODUTO FÍSICO

### Funcionamento técnico

- Cada tag possui um token público aleatório, longo o suficiente e não sequencial.
- O NFC aponta para `/t/[token]`.
- O endpoint procura uma tag ativa e redireciona com HTTP 302/307 para a página vinculada.
- Permitir desativar uma tag perdida e vincular uma substituta.
- Registrar somente métricas necessárias dos acessos, com IP anonimizado ou sem IP bruto.
- Implementar rate limiting para impedir varredura de tokens.
- Não colocar e-mail, nome do casal ou ID incremental na URL da tag.

### Programação da tag

No MVP, o painel administrativo deve:

- gerar o token e a URL curta;
- mostrar a URL para ser gravada com um aplicativo confiável de NFC;
- oferecer botão de copiar;
- gerar o QR Code do cartão;
- marcar estados `GENERATED`, `WRITTEN`, `TESTED`, `PACKED`, `SHIPPED`, `ACTIVE`, `DISABLED`;
- exigir uma confirmação operacional de que a tag foi testada antes de permitir marcar o pedido como embalado;
- registrar operador e horário em cada mudança.

Web NFC poderá ser uma melhoria futura porque não funciona igualmente em todos os navegadores. Não faça o fluxo operacional depender dela.

### Produto físico inicial

- formato: coração limpo;
- tag escondida dentro da peça;
- nenhuma indicação técnica visível na frente;
- cores definidas por estoque no painel;
- modelo do arquivo 3D não faz parte desta aplicação;
- o sistema deve guardar SKU, cor, quantidade e observação de produção;
- o cartão de contingência deve conter nomes, instrução “Aproxime o celular do coração” e QR Code;
- embalagem e cartão devem usar o mesmo pedido e a mesma tag.

---

## 14. CHECKOUT E MERCADO PAGO

Implementar Mercado Pago com Pix e cartão usando a opção oficial adequada ao ambiente, preferencialmente Payment Brick para manter a experiência integrada.

### Regras obrigatórias

- Chaves privadas somente no servidor.
- Criar idempotency key para toda tentativa de pagamento.
- Não confiar no retorno visual do navegador.
- Validar assinatura do webhook conforme a documentação oficial vigente.
- Consultar o pagamento no servidor quando necessário antes de mudar o pedido para pago.
- Processar webhooks de forma idempotente; o mesmo evento repetido não pode publicar duas vezes nem gerar dois pedidos físicos.
- Registrar payload mínimo necessário e remover/mascarar dados sensíveis.
- Nunca armazenar número completo de cartão ou CVV.
- Implementar estados `CREATED`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REFUNDED`, `CHARGEDBACK`.
- Separar estado do pagamento, estado do projeto e estado do pedido físico.
- Oferecer uma tela clara para Pix pendente, com atualização periódica moderada e opção de voltar depois.
- Utilizar moeda BRL, centavos inteiros no backend e formatação `pt-BR` no frontend.
- Em ambiente local sem credenciais, disponibilizar um provedor fake somente para desenvolvimento, claramente bloqueado em produção.

### Frete do MVP

Crie `ShippingProvider` como abstração. Se não houver integração de frete disponível, permita tabela de frete configurável por faixa de CEP/região ou frete fixo no painel. Não calcule um frete fictício silenciosamente. Deixe a integração com Melhor Envio preparada para uma fase posterior.

---

## 15. MODELO DE DADOS MÍNIMO

Crie migrations, índices, constraints e tipos enumerados adequados. Ajuste nomes conforme o ORM, preservando os conceitos:

### Entidades principais

#### `users` / `profiles`

- id UUID;
- nome;
- e-mail normalizado e único;
- telefone opcional;
- role (`CUSTOMER`, `OPERATOR`, `ADMIN`);
- consentimentos e datas;
- timestamps.

#### `categories`

- id;
- nome;
- slug;
- estado;
- ordem.

#### `templates`

- id;
- category_id;
- nome;
- slug;
- descrição;
- versão;
- status;
- thumbnail local/configuração;
- schema_version;
- limites e presets em JSON validado;
- timestamps.

#### `plans`

- id;
- nome;
- slug;
- preço em centavos;
- duração em dias ou nulo;
- limites em campos explícitos/JSON validado;
- inclui produto físico;
- ativo;
- ordem;
- timestamps.

#### `projects`

- id UUID;
- owner_id opcional durante rascunho visitante;
- draft_token seguro;
- template_id e template_version;
- plan_id;
- slug;
- public_token opcional;
- status (`DRAFT`, `AWAITING_PAYMENT`, `PROCESSING`, `PUBLISHED`, `EXPIRED`, `ARCHIVED`, `BLOCKED`);
- conteúdo JSON validado por schema versionado;
- data de publicação e expiração;
- configuração de privacidade;
- created_at/updated_at.

#### `project_versions`

- id;
- project_id;
- version_number;
- conteúdo validado;
- autor;
- estado draft/published;
- timestamps.

#### `media_assets`

- id UUID;
- project_id;
- storage_key não público;
- tipo MIME verificado;
- tamanho;
- largura/altura;
- variantes geradas;
- hash;
- posição;
- alt text;
- status de processamento/moderação;
- timestamps.

#### `orders`

- id UUID;
- order_number humano, não usado como segredo;
- customer_id/e-mail de checkout;
- project_id;
- currency;
- subtotal, desconto, frete e total em centavos;
- status;
- endereço snapshot quando físico;
- timestamps.

#### `order_items`

- order_id;
- tipo;
- referência do produto/plano;
- descrição snapshot;
- quantidade;
- valor unitário e total em centavos;
- configuração de cor/SKU.

#### `payments`

- order_id;
- provider;
- provider_payment_id único;
- idempotency_key única;
- método;
- status;
- valor;
- payload sanitizado;
- timestamps.

#### `payment_events`

- provider_event_id único;
- tipo;
- payload sanitizado;
- processed_at;
- resultado/erro.

#### `nfc_tags`

- id UUID;
- public_token único e indexado;
- project_id;
- physical_order_id;
- status;
- destino atual;
- número/lote opcional;
- written_at, tested_at, activated_at, disabled_at;
- timestamps.

#### `physical_orders`

- order_id;
- status (`WAITING_PAYMENT`, `QUEUED`, `PRINTING`, `ASSEMBLY`, `NFC_WRITING`, `QUALITY_CHECK`, `PACKED`, `SHIPPED`, `DELIVERED`, `RETURNED`, `CANCELLED`);
- SKU/cor;
- código de rastreio;
- transportadora;
- prazo estimado;
- notas internas;
- timestamps.

#### `coupons` e `coupon_redemptions`

- código normalizado único;
- tipo e valor;
- validade;
- limite total e por cliente;
- planos elegíveis;
- ativo;
- usos vinculados a pedidos.

#### `abuse_reports`

- project_id;
- motivo;
- descrição;
- contato opcional;
- status;
- decisão e administrador;
- timestamps.

#### `audit_logs`

- ator;
- ação;
- entidade e id;
- antes/depois sanitizado;
- timestamp;
- metadados técnicos mínimos.

#### `analytics_events`

- evento;
- project_id/order_id quando aplicável;
- sessão anônima;
- campanha/UTM;
- timestamp;
- sem conteúdo das mensagens ou fotos.

### Segurança no banco

- Usar RLS se Supabase for utilizado.
- Cliente só acessa seus próprios projetos, pedidos e mídias.
- Operadores físicos não precisam visualizar dados financeiros além do necessário.
- Administradores têm acesso conforme role e toda ação sensível gera auditoria.
- Bucket de originais privado; acesso por URLs assinadas de curta duração.
- Páginas públicas recebem somente variantes de mídia destinadas à publicação.

---

## 16. PAINEL ADMINISTRATIVO

### Dashboard

Exibir indicadores reais, sem dados inventados:

- vendas hoje, 7 dias e 30 dias;
- receita aprovada;
- ticket médio;
- conversão de rascunho para pagamento;
- divisão por plano;
- Pix versus cartão;
- projetos aguardando processamento;
- pedidos físicos por etapa;
- tags aguardando gravação/teste;
- denúncias pendentes;
- falhas recentes de webhook/processamento.

Quando não houver dados, mostrar estado vazio útil.

### Pedidos

- filtros por estado, período, plano, método e busca;
- timeline do pedido;
- dados do cliente com acesso controlado;
- itens, frete e pagamento;
- ações de produção com confirmação;
- inserir rastreio;
- imprimir/gerar cartão com QR;
- nunca permitir marcar como embalado sem tag testada quando houver NFC.

### Templates e planos

- ativar/desativar;
- ordenar;
- editar textos comerciais, preço e limites;
- não permitir apagar um plano/template já usado; apenas arquivar ou versionar;
- pré-visualizar antes de publicar alterações.

### Auditoria

Registrar alterações de preço, estado manual de pedido, troca de destino NFC, bloqueio de página, cupom e permissões administrativas.

---

## 17. E-MAILS TRANSACIONAIS

Criar templates responsivos e simples para:

1. link mágico de acesso;
2. pagamento aprovado e presente publicado;
3. Pix criado/pendente;
4. pedido físico recebido;
5. pedido enviado com rastreio;
6. página prestes a expirar;
7. confirmação de upgrade;
8. solicitação de exclusão recebida.

No desenvolvimento, registrar a prévia em ambiente seguro quando o provedor não estiver configurado. Não fingir que um e-mail foi enviado em produção.

---

## 18. SEGURANÇA, PRIVACIDADE E MODERAÇÃO

Implementar desde o início:

- validação Zod no servidor em todas as entradas;
- sanitização de textos e bloqueio de HTML arbitrário;
- proteção CSRF quando aplicável;
- cookies seguros, `HttpOnly`, `SameSite` e `Secure` em produção;
- rate limiting em login, upload, criação de pedido, cupons, denúncia e redirect NFC;
- headers de segurança e CSP compatível com os embeds permitidos;
- whitelist estrita de Spotify e YouTube;
- verificação real de MIME e tamanho dos uploads;
- nomes de arquivos aleatórios;
- remoção de EXIF;
- prevenção de IDOR;
- tokens aleatórios e não sequenciais;
- logs sem segredos, mensagens privadas ou URLs assinadas;
- política de retenção para rascunhos abandonados e arquivos órfãos;
- fluxo de exclusão LGPD;
- consentimento para uso de fotos de terceiros;
- denúncia e bloqueio administrativo;
- regra explícita contra conteúdo íntimo não consentido, exploração infantil, violência ilegal e uso abusivo;
- limite de tentativas e trilha de auditoria.

Se houver serviço de moderação disponível, isole-o em `ContentModerationAdapter`. No MVP sem serviço externo, ao menos implemente denúncia, termos, limites de upload, revisão administrativa e estados de bloqueio. Nunca alegue que uma foto foi analisada por IA se isso não aconteceu.

---

## 19. ACESSIBILIDADE, RESPONSIVIDADE E PERFORMANCE

### Acessibilidade

- HTML semântico;
- navegação completa por teclado;
- labels reais em todos os campos;
- mensagens de erro ligadas aos campos;
- foco correto ao trocar de etapa e abrir modal;
- `aria-live` para upload e pagamento;
- alt text editável para imagens;
- contraste AA;
- não depender apenas de cor;
- respeitar redução de movimento.

### Breakpoints de validação

Testar pelo menos:

- 360 × 800;
- 390 × 844;
- 768 × 1024;
- 1366 × 768;
- 1440 × 900.

Não deve existir rolagem horizontal acidental.

### Performance

- usar componentes de servidor quando fizer sentido;
- lazy-load de galerias/embeds;
- imagens responsivas em WebP/AVIF quando possível;
- thumbnails no painel;
- evitar enviar originais gigantes às páginas públicas;
- reservar dimensões para impedir layout shift;
- carregar o mínimo de JavaScript no site público;
- cache control adequado sem tornar conteúdo privado público;
- meta inicial: landing e páginas publicadas com boa pontuação de Core Web Vitals em aparelho intermediário.

---

## 20. ANALYTICS E FUNIL

Preparar eventos:

- `landing_viewed`;
- `template_viewed`;
- `creation_started`;
- `step_completed` com número da etapa;
- `preview_viewed`;
- `plan_selected`;
- `checkout_started`;
- `payment_method_selected`;
- `payment_approved`;
- `project_published`;
- `share_clicked`;
- `nfc_redirect_opened`;
- `upgrade_viewed`;
- `upgrade_purchased`.

Respeitar consentimento quando necessário e não enviar fotos, mensagens do casal ou dados pessoais para analytics.

Preservar UTM desde a landing até o pedido para medir parceiros e campanhas. Preparar campo `partner_code` para B2B2C futuro, sem construir o portal de parceiros agora.

---

## 21. ESTADOS E REGRAS DE NEGÓCIO

### Projeto

`DRAFT → AWAITING_PAYMENT → PROCESSING → PUBLISHED → EXPIRED/ARCHIVED`

Estados excepcionais: `BLOCKED`, `CANCELLED`.

### Pagamento

`CREATED → PENDING → APPROVED` ou `REJECTED/CANCELLED`; depois pode chegar a `REFUNDED/CHARGEDBACK`.

### Pedido físico

`WAITING_PAYMENT → QUEUED → PRINTING → ASSEMBLY → NFC_WRITING → QUALITY_CHECK → PACKED → SHIPPED → DELIVERED`.

Defina transições permitidas no domínio/backend. Não aceite qualquer mudança de qualquer estado para outro por um simples select no frontend.

### Expiração

- Calcular a validade a partir da ativação/publicação, não da criação do rascunho.
- Página expirada não deve vazar o conteúdo.
- Mostrar ao visitante somente uma mensagem neutra de indisponibilidade.
- Mostrar ao proprietário a opção de upgrade/restauração.
- Não excluir imediatamente as mídias ao expirar; aplicar política de retenção configurável.

### Upgrade

- Preservar o mesmo link público sempre que possível.
- Recalcular limites e validade.
- Não perder conteúdo já enviado.
- Se o projeto possuía uma tag NFC, o link curto continua igual.

---

## 22. DADOS DE DEMONSTRAÇÃO

Criar seed apenas para desenvolvimento com:

- três templates românticos;
- três planos;
- um projeto fictício claramente identificado como demonstração, usando nomes genéricos “Alex e Dani”;
- SVGs locais “Sua foto aqui”;
- um pedido digital pago fictício;
- um pedido físico em produção;
- uma tag de teste desativada;
- usuário administrador configurado por variável de ambiente ou script seguro.

Não misturar seed com produção. Não publicar depoimentos falsos.

---

## 23. TESTES OBRIGATÓRIOS

### Unitários

- cálculo de preço, desconto e frete;
- regras de limites dos planos;
- validade/expiração;
- criação e validação de slug;
- transições de estado;
- parser de Spotify/YouTube;
- geração/validação de tokens NFC;
- sanitização;
- idempotência de webhook.

### Integração

- criação de pedido a partir de rascunho;
- webhook aprovado publica exatamente uma vez;
- webhook repetido não duplica recursos;
- cliente não acessa projeto alheio;
- tag ativa redireciona e tag desativada não redireciona;
- upload inválido é recusado;
- cupom expirado/sem limite é recusado;
- upgrade preserva o link.

### E2E

1. Visitante abre a landing, escolhe template, completa o assistente, vê preview e cria checkout.
2. Pagamento fake aprovado em desenvolvimento publica a página e libera painel.
3. Usuário edita rascunho de uma página publicada e publica a nova versão.
4. Admin processa um pedido físico, gera tag, confirma teste, embala e adiciona rastreio.
5. Página do Plano Momento expira e oferece upgrade ao proprietário sem expor conteúdo ao visitante.

Executar lint, typecheck, testes e build de produção. Corrigir erros antes de considerar a entrega concluída.

---

## 24. VARIÁVEIS DE AMBIENTE

Fornecer `.env.example` sem valores reais, incluindo apenas o necessário, por exemplo:

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_BRAND_NAME=Presente Vivo
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
CRON_SECRET=
APP_ENCRYPTION_KEY=
DEV_FAKE_PAYMENT_ENABLED=false
```

Validar variáveis ao inicializar. A aplicação deve falhar com mensagem técnica clara no servidor quando uma configuração obrigatória de produção estiver ausente, sem expor o valor ou segredo ao cliente.

---

## 25. DOCUMENTAÇÃO A SER CRIADA

Crie e mantenha:

- `README.md` — instalação, scripts, arquitetura resumida e deploy;
- `docs/PRODUCT_SPEC.md` — regras funcionais;
- `docs/ARCHITECTURE.md` — decisões técnicas e diagramas simples em Mermaid;
- `docs/DATA_MODEL.md` — tabelas e relacionamentos;
- `docs/PAYMENTS.md` — Mercado Pago, webhook, idempotência e testes;
- `docs/NFC_OPERATIONS.md` — geração, gravação, teste, cartão e substituição de tag;
- `docs/SECURITY_PRIVACY.md` — threat model resumido, LGPD e retenção;
- `docs/DEPLOYMENT.md` — ambiente, migrations, storage, cron e rollback;
- `docs/ROADMAP.md` — MVP, fase 2 e fase 3;
- `.env.example`;
- migrations e seed reproduzíveis.

---

## 26. ORDEM DE IMPLEMENTAÇÃO

Não tente construir tudo ao mesmo tempo. Trabalhe nesta ordem e mantenha uma lista de tarefas atualizada:

### Fase 0 — Diagnóstico

1. Inspecionar todos os arquivos existentes.
2. Identificar stack, padrões, comandos e limitações do ambiente.
3. Escrever um plano curto com riscos e decisões.
4. Não apagar trabalho existente sem justificativa.

### Fase 1 — Fundação

1. Configurar projeto, qualidade e variáveis.
2. Implementar tema, componentes e layout base.
3. Criar banco, migrations, seed, autenticação e autorização.
4. Criar domínio de planos, templates, projetos, pedidos e tags.

### Fase 2 — Jornada principal

1. Landing e catálogo.
2. Assistente de criação e autosave.
3. Upload/processamento de fotos.
4. Três templates públicos.
5. Prévia responsiva.

### Fase 3 — Receita

1. Motor de preços e cupons.
2. Checkout.
3. Mercado Pago.
4. Webhook seguro e idempotente.
5. Publicação e e-mails.

### Fase 4 — Operação

1. Painel do cliente.
2. Admin.
3. Pedidos físicos.
4. Tags NFC e QR do cartão.
5. Expiração e upgrade.

### Fase 5 — Qualidade

1. Testes.
2. Acessibilidade.
3. Responsividade.
4. Performance.
5. Segurança.
6. Documentação e deploy.

Ao terminar cada fase, execute as verificações pertinentes e corrija regressões antes de avançar.

---

## 27. CRITÉRIOS DE ACEITE DO MVP

O MVP só está concluído quando:

- um visitante consegue iniciar e salvar um presente pelo celular;
- consegue enviar, ordenar e remover fotos válidas;
- consegue visualizar uma prévia fiel em um dos três templates;
- consegue selecionar um plano e obter o total calculado no backend;
- consegue pagar em sandbox Mercado Pago ou usar o provedor fake somente em desenvolvimento;
- o webhook aprovado publica o presente uma única vez;
- o comprador recebe acesso ao painel sem precisar criar senha antes da compra;
- a página pública funciona em celular e desktop;
- o Plano Momento expira corretamente;
- o upgrade preserva o conteúdo e o link;
- o admin consegue visualizar e avançar pedidos físicos por estados permitidos;
- o admin consegue gerar URL NFC, QR do cartão e confirmar o teste da tag;
- `/t/[token]` redireciona com segurança e permite trocar o destino sem regravar a tag;
- usuários não conseguem acessar projetos ou pedidos de outras pessoas;
- dados de cartão não são armazenados;
- uploads maliciosos e HTML arbitrário são recusados;
- lint, typecheck, testes e build passam;
- a documentação permite que outro desenvolvedor instale e opere o sistema.

---

## 28. EXPANSÃO FUTURA — NÃO IMPLEMENTAR AGORA

Documentar no roadmap:

### Linha Pet

- página do animal;
- tag em formato de pata ou osso;
- nome, contato do responsável, informações médicas e botão “Encontrei este pet”;
- controles de privacidade para não expor endereço residencial;
- produto com foco funcional e recorrência.

### Casamento

- convite digital;
- RSVP;
- mapa, agenda e padrinhos;
- lista de presentes;
- domínio personalizado;
- painel do casal.

### B2B2C e white-label

- floriculturas, fotógrafos, cerimonialistas, pet shops e lojas de presentes;
- código do parceiro e comissão;
- catálogo e painel do parceiro;
- pedidos em lote;
- subdomínio e identidade visual configurável;
- split de pagamento somente após validação jurídica e financeira.

### IA assistiva

- seleção das melhores fotos;
- correção de enquadramento/luz;
- sugestão de narrativa;
- moderação de conteúdo;
- sempre com revisão e consentimento do usuário;
- custos medidos e limites por plano.

---

## 29. REGRAS DE EXECUÇÃO PARA A FERRAMENTA DE IA

1. Não responda somente com explicações ou um protótipo estático: faça as alterações no projeto.
2. Antes de codificar, leia o repositório e as instruções existentes.
3. Se uma decisão não bloquear a implementação, adote a solução mais simples e documente a suposição.
4. Só faça perguntas quando faltar uma informação realmente impossível de inferir, como credenciais ou uma escolha comercial irreversível.
5. Nunca invente que uma integração real está funcionando. Diferencie claramente sandbox, mock de desenvolvimento e produção.
6. Não coloque funções críticas apenas no frontend.
7. Não use dados ou preços falsos sem identificá-los como seed de desenvolvimento.
8. Não adicione bibliotecas duplicadas para a mesma função.
9. Prefira componentes reutilizáveis, mas evite abstrações prematuras.
10. Preserve a identidade visual descrita neste documento em todas as telas comerciais.
11. O admin pode ter aparência mais funcional, mas deve usar a mesma base de marca.
12. Depois de implementar, navegue pelos fluxos principais e verifique visualmente os breakpoints definidos.
13. Informe, ao final, o que foi construído, quais testes passaram, quais integrações exigem credenciais e quais itens permaneceram para a próxima fase.

---

## 30. PRIMEIRA RESPOSTA ESPERADA DA IA

Comece respondendo com:

1. um diagnóstico curto do repositório;
2. a stack encontrada ou proposta;
3. um plano em fases com entregáveis verificáveis;
4. as primeiras decisões e riscos;
5. em seguida, inicie a implementação da Fase 1 sem esperar nova autorização, exceto se houver um bloqueio real.

O objetivo final não é apenas “ter telas bonitas”. É entregar a primeira versão de um negócio operável: o cliente cria, paga, recebe, compartilha; a equipe publica, produz, programa a tag, testa e envia; e o sistema preserva segurança, rastreabilidade e capacidade de expansão.
