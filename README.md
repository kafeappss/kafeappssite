# Site da Kafé Apps

Site institucional da [Kafé Apps](https://kafeapps.com.br): software house de Jaraguá do Sul (SC) que desenvolve aplicativos, plataformas e soluções de IA em código, com engenharia aumentada por IA.

Feito com [Astro](https://astro.build), gera um site 100% estático (HTML, CSS e um pouco de JavaScript): rápido, bom para SEO e fácil de hospedar em qualquer lugar.

## Identidade visual: cores do Linear e mascote de vidro no estilo do Zirtuno

- **Cores do [Linear](https://linear.app)**, com os mesmos valores que o site deles usa: fundo `#08090a`, texto `#f7f8f8`, cinzas `#d0d6e0`, `#8a8f98` e `#62666d`, bordas brancas a 8% e 12%, botão principal em pílula clara (`#e5e5e6`, texto `#08090a`) e o roxo da marca (`#5e6ad2`) com o destaque `#7170ff`. Os títulos têm dois tons: branco e, no trecho entre `<em>`, cinza.
- O cinza `#62666d`, que o Linear usa em rótulos minúsculos, não passa no contraste mínimo para texto; aqui ele fica só em detalhes, e os textos secundários usam `#8a8f98`.
- **Mascote e ilustrações em vidro escuro**, no mesmo design do mascote do Zirtuno: corpo quase preto e translúcido que clareia perto da borda, uma linha fina de luz no contorno, reflexo suave em cima, olhos "//" que brilham com halo e, na abertura da home, uma onda de luz roxa em que o mascote fica mergulhado (com o "Diga oi" por cima dela). As formas que ele vira em cada seção usam o mesmo vidro.
- No "(08) Quem somos" da home, no lugar da forma do líquido, fica a tela "Entregas em produção desde 2021" (`src/components/Figure.astro`).
- **Divisões de cor entre as seções** (classes em `src/styles/global.css`): faixas um pouco mais claras (`tone-band`, em "A virada" e no blog), um painel no tom da marca (`tone-brand panel`, em "O que dá para construir"), um painel de vidro (`tone-glass panel`, na IA) e um painel azul-marinho (`tone-navy panel`, em "Quem confia"). Os painéis são blocos arredondados, soltos das bordas da tela. Onde há formas do mascote, os fundos são translúcidos, para as letras e o líquido continuarem aparecendo.
- **Convite final**: um painel índigo arredondado, com raios de luz subindo da borda de baixo, que se esticam na direção do cursor (`src/components/CtaSection.astro` e `src/scripts/rays.ts`). O mascote descansa nos cantos enquanto ele está na tela.
- **Rodapé**: azul-marinho, arredondado e solto das bordas da tela (`src/components/Footer.astro`).
- Cores do vidro no topo de `src/styles/global.css`: `--liquid` (luz do vidro e da onda, `#7c7cff`), `--liquid-ink` (olhos, contorno e crista da onda, `#c9cbff`) e `--liquid-bg` (base do vidro, igual a `--bg`).

### Ligar e desligar o mascote

O mascote fica ligado em `mascot: true`, em `src/data/site.ts`. Com `false`, o topo da home mostra um planeta (`src/components/Planet.astro`) e as seções mostram telas de produto (`src/components/Figure.astro`, escolhidas em `src/data/figures.ts`); no pré-orçamento, a Kafeína fala dentro do cartão e um painel resume as respostas.

## Destaques

- **Líquido que explica o conteúdo (WebGL)**: um único corpo de líquido, em vidro escuro com borda de luz, acompanha a navegação e vira o desenho do que está escrito: um relógio no problema do tempo, barras de crescimento na virada, um ciclo na metodologia, o K da Kafé no "Sobre" e uma xícara no convite final. Cada forma tem um espaço reservado no layout, rola junto com o conteúdo e nunca fica por cima do texto. Nos cartões de serviço, basta passar o mouse para o líquido virar celular, navegador, IA, foguete, rede ou layout. Veja "Formas do líquido" abaixo.
- **Mascote com personalidade**: no início da home (e tristinho na página 404), com os olhos em "//" inspirados nos recortes do K. Ele acompanha o cursor, pisca, olha para onde a pessoa clica e muda de expressão:
  - clique: uma reação diferente a cada vez (feliz, piscadinha, surpreso, apaixonado); cliques demais o deixam tonto e depois bravo;
  - clique duplo: cambalhota; toque longo (celular): enche de ar;
  - arrastar (mouse): puxa-puxa. O corpo fica no lugar e se inclina, e o pedaço que você segura sai dele preso por um "pescoço" que afina e resiste conforme estica (perto do limite, ele treme de esforço). Ao soltar, a ponta volta num estalo e o corpo achata, balança e assenta;
  - mouse rápido por cima: cócegas; mouse devagar: carinho;
  - mouse em "Tirar minha ideia do papel": acena que sim com a cabeça; num botão de contato ("Fale com a gente", "Começar meu projeto", WhatsApp): aparecem dois pezinhos e ele bate o pé de alegria; em temas de IA: olhos de estrela;
  - cursor sai da página: balança a cabeça que não, tristinho, e comemora quando ele volta; voltar para a aba: comemora;
  - ninguém mexe: boceja e depois cochila;
  - digitar "café" em qualquer lugar: festa; copiar um texto: piscadinha; voltar ao topo depois de ler tudo: carinho;
  - cumprimenta conforme a hora do dia. No celular, a fala aparece dentro do botão "Diga oi".
  Falas em `src/scripts/mascot.ts`; expressões e movimentos em `src/scripts/liquid.ts`.
- **Fundo de letras**: uma grade de letras e números em fonte mono, quase apagada, que acende em manchas que vagam devagar pela tela (e sobem um pouco ao rolar a página). De tempos em tempos uma letra troca por outra, e uma parte das manchas acende na cor da marca. O mascote e as formas ficam por cima, com o brilho da cor-assinatura em volta. Código em `src/scripts/ascii.ts`; tamanho da letra e da grade no topo do arquivo.
- **Trilho de seções**: à direita (telas largas), uma régua compacta de tracinhos com uma bolinha no começo de cada seção. Parada, ela fica lisa e só o tracinho da posição atual se destaca; durante a rolagem, os tracinhos perto da posição atual crescem como uma lupa, que some pouco depois de parar. Com o mouse por cima, a lupa segue o cursor e mostra o nome da seção; clicar leva até lá (pelo teclado, cada seção é um botão).
- **Acessível e leve**: respeita "reduzir movimento" do sistema, tem fundo estático quando não há WebGL, reduz a qualidade em aparelhos mais modestos e economiza bateria quando a página está parada.
- **Conteúdo para SEO**: página para cada serviço, blog com artigos originais, dados estruturados (schema.org), sitemap, `robots.txt` e imagem de compartilhamento.

## Como rodar

Requer Node.js 22.12 ou mais recente.

```bash
npm install
npm run dev      # ambiente local em http://localhost:4321
npm run build    # gera o site final na pasta dist/
npm run preview  # visualiza o build localmente
npm run check    # verificação de tipos
```

## Onde editar cada coisa

| O que | Onde |
| --- | --- |
| Contatos, redes sociais, CNPJ, números, diferenciais, depoimentos, clientes e tecnologias | `src/data/site.ts` |
| Logos dos clientes (SVG em branco, sem fundo) | `src/assets/clients/` + lista `clients` em `src/data/site.ts` |
| Desenhos do líquido (relógio, celular, foguete…) | `src/scripts/shapes.ts` |
| Falas e reações do mascote | `src/scripts/mascot.ts` |
| Expressões do mascote, fundo e física do líquido | `src/scripts/liquid.ts` |
| Cor do líquido e dos olhos do mascote | `--liquid` e `--liquid-ink` em `src/styles/global.css` |
| Fundo de letras (cor das letras e da parte que acende) | `--ascii-ink` e `--ascii-glow` em `src/styles/global.css`; o desenho em `src/scripts/ascii.ts` |
| Serviços (cards e páginas `/servicos/...`) | `src/data/services.ts` |
| Método, formatos de trabalho, comparativo e perguntas frequentes | `src/data/method.ts` |
| Artigos do blog | `src/content/blog/*.md` |
| Cases | `src/content/cases/*.md` (use `_modelo-de-case.md` como base) |
| Cores (as do Linear), fontes e espaçamentos | `src/styles/global.css` (variáveis no topo) |
| Divisões de cor entre as seções | classes `tone-band`, `tone-brand`, `tone-glass`, `tone-navy` e `panel` em `src/styles/global.css`, aplicadas nas seções de `src/pages/index.astro` |
| Convite final (painel índigo e raios de luz) | `src/components/CtaSection.astro` e `src/scripts/rays.ts` |
| Logos (KAFÉ APPS e o símbolo K) | `src/assets/brand/` e `public/favicon.svg` |
| Arquivos da marca para download (K e logo, branco e preto, sem fundo) | `public/brand/` |

Seções que dependem de listas vazias (hoje: depoimentos e cases) **não aparecem** até receberem conteúdo. Assim nada de "exemplo" vai para o ar por engano.

### Formas do líquido e trilho de seções

Cada seção diz qual desenho o líquido deve formar enquanto ela está no meio da tela:

```astro
<section data-liquid="rocket" data-rail="MVP">…</section>
```

- `data-liquid="nome [lugar]"`: `nome` é uma das formas de `src/scripts/shapes.ts` (`mascot`, `clock`, `bars`, `code`, `code-ai`, `ai`, `phone`, `browser`, `rocket`, `nodes`, `layout`, `cycle-0` a `cycle-4`, `k`, `cup`, `rest`, `pool`, `page`). O `lugar` só vale quando a seção não tem espaço reservado: `stage` (ao lado do texto, padrão), `bottom`, `center` ou `view` (tela toda).
- `data-rail="Nome"`: inclui a seção no trilho da direita (aparece quando a página tem pelo menos três).
- Espaço da forma: coloque `<LiquidSlot class="slot" />` dentro da seção (ou qualquer elemento com `data-liquid-anchor`). A forma mora ali e rola junto com o conteúdo; sem espaço, ela fica ao lado do texto (ou num canto, no celular). A classe `slot` com `head-split` em volta do título monta o layout "título + forma" usado nas seções.
- `data-liquid-hover="phone"`: num cartão, o líquido vira essa forma ao passar o mouse (no celular, vale o cartão que estiver no meio da tela). O cartão pode ter o próprio `data-liquid-anchor`; se não tiver, usa o espaço da seção.
- `data-horizon`: no estilo `liquid`, desenha a faixa de café no fim da seção (`data-horizon="0.1"` ajusta a altura).
- `data-mascot-look="nod"`, `"tap"`, `"love"` ou `"star"`: o mascote olha para o elemento e reage quando o mouse passa por ele (acena que sim, bate o pezinho, fica apaixonado ou com olhos de estrela).

Para testar no console do navegador: `__liquid.show('rocket')` mostra uma forma, `__liquid.react('love')` faz o mascote reagir (`happy`, `wink`, `surprise`, `love`, `dizzy`, `angry`, `giggle`, `spin`, `star`, `sad`, `pet`, `yawn`, `inflate`, `party`) `__liquid.advance(3)` adianta a animação em 3 segundos, `__liquid.state()` mostra a forma atual e a fase da transformação e `__liquid.tint('#3b6ef0', '#ffffff')` testa outra cor para o líquido e os olhos.

### Fontes

- **Inter** no texto (já incluída).
- **Gilroy** nos títulos. É uma fonte paga, então o site não a distribui: coloque os arquivos licenciados em `public/fonts/gilroy/` com o peso no nome (ex.: `Gilroy-Bold.woff2`, `Gilroy-SemiBold.woff2`). No próximo build, os títulos passam a usar a Gilroy automaticamente. Enquanto a pasta estiver vazia, os títulos usam a Figtree, gratuita e de desenho parecido.

### Formulário de contato

Em `src/data/site.ts`, dentro de `contact`:

- `briefUrl`: o pré-orçamento com a Kafeína (`/orcamento`, veja abaixo). Os botões principais ("Tirar minha ideia do papel", "Começar meu projeto", "Pedir uma proposta") levam para lá, e a página de contato o destaca acima do formulário.
- `kafeinaEndpoint`: endereço do serviço da Kafeína (pasta `workers/kafeina`), que escreve o resumo do projeto com IA e repassa o pedido ao CRM.
- `formEndpoint`: endereço de um serviço que recebe formulários (Formspree, Web3Forms, Getform ou um endpoint próprio). Quando preenchido, as mensagens são enviadas direto do site.
- `whatsapp`: número só com dígitos, com DDI e DDD (ex.: `5547999999999`). Ativa o botão flutuante e, se não houver `formEndpoint`, o formulário abre o WhatsApp com a mensagem pronta.
- `email`: usado nos links de e-mail e como último recurso do formulário.

### Pré-orçamento com a Kafeína (`/orcamento`)

Formulário em cinco etapas (projeto, problema, escopo, contato e estimativa), com o mascote como anfitrião: ele cumprimenta, acena que sim ao escolher o projeto, olha enquanto a pessoa escreve, se assusta com prazo urgente, balança a cabeça que não quando falta preencher algo, gira enquanto calcula e faz festa no resultado. No celular, as falas aparecem num balão logo abaixo do cabeçalho.

O resultado mostra a faixa de investimento, o prazo, uma avaliação do investimento que a pessoa indicou, o escopo sugerido para a primeira versão (com itens tirados da descrição, como agenda, pagamentos ou chat) e a divisão nas 4Ds.

- **Perguntas, falas e preços** ficam em `src/data/kafeina.ts`. A tabela `pricing` define investimento (em mil reais) e semanas por tipo de projeto e escopo; `showPrices: false` esconde os valores e mostra só prazo e escopo.
- **Para onde vai o pedido:** com `kafeinaEndpoint`, o serviço da Kafeína escreve o resumo com IA e entrega o contato ao CRM (o site só diz "recebemos" quando a entrega é confirmada). Sem ele, tenta o `formEndpoint`. Sem nenhum dos dois, a pessoa envia o pré-orçamento por WhatsApp ou e-mail, com a mensagem pronta.
- **Serviço de IA:** instruções em `workers/kafeina/README.md`. Para a IA vão só as respostas sobre o projeto (nunca nome, e-mail ou telefone).

### Publicar um case

1. Copie `src/content/cases/_modelo-de-case.md` para um novo arquivo **sem** o `_` no início (ex.: `app-de-agendamento.md`).
2. Preencha com informações que o cliente autorizou divulgar. Imagens vão em `public/cases/`.
3. O item "Cases" aparece automaticamente no menu e no rodapé.

### Novo artigo no blog

Crie um arquivo `.md` em `src/content/blog/` com o cabeçalho:

```md
---
title: 'Título do artigo'
description: 'Resumo de uma ou duas frases (aparece no Google e nos cards).'
date: 2026-10-06
tags: ['mvp', 'startups']
---
```

## Hospedagem

O comando `npm run build` gera a pasta `dist/`, que funciona em qualquer hospedagem de site estático:

- **Vercel, Netlify ou Cloudflare Pages**: conecte este repositório e use `npm run build` como comando de build e `dist` como pasta de saída.
- **Hospedagem atual (cPanel/FTP)**: rode `npm run build` e envie o conteúdo da pasta `dist/` para a pasta pública do domínio.

## Antes de publicar

- [ ] Confirmar e-mail comercial, WhatsApp e, se possível, configurar `formEndpoint`.
- [ ] Preencher o CNPJ da Kafé Apps LTDA em `src/data/site.ts`.
- [ ] Ajustar a tabela de preços e prazos do pré-orçamento (`pricing` em `src/data/kafeina.ts`; os valores atuais são provisórios).
- [ ] Publicar o serviço da Kafeína (`workers/kafeina`) e preencher `kafeinaEndpoint`, ou definir outro destino para os pedidos.
- [ ] Revisar os números "10x mais agilidade" e "até 40% mais econômico" (vieram do site atual).
- [ ] Confirmar que todos os clientes em `src/assets/clients/` autorizam o uso do logo (vieram do site atual).
- [ ] Revisar as respostas das perguntas frequentes (NDA, prazos, propriedade).
- [ ] Adicionar os arquivos da Gilroy em `public/fonts/gilroy/`.
- [ ] Adicionar cases e depoimentos reais.
- [ ] Revisar a política de privacidade com o jurídico.
