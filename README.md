# Site da Kafé Apps

Site institucional da [Kafé Apps](https://kafeapps.com.br): software house de Niterói (RJ) que desenvolve aplicativos, plataformas e soluções de IA em código, com engenharia aumentada por IA.

Feito com [Astro](https://astro.build), gera um site 100% estático (HTML, CSS e um pouco de JavaScript): rápido, bom para SEO e fácil de hospedar em qualquer lugar.

## Identidade visual: "Ônix & Pérola"

- Preto e branco premium, como a marca (o K branco sobre preto): **fundo ônix** (`#08080a`), **texto branco-pérola** (`#f4f4f2`) e cinzas neutros.
- A assinatura é o próprio branco: o mascote e as ilustrações são brancos com olhos pretos, e os botões principais são brancos com texto preto. A segunda linha dos títulos fica em **prata escovado** (degradê `--gradient-silver`).
- Ilustrações em 2D sólido: cor chapada e bordas nítidas (sem "metal líquido"). Entre uma seção e outra, o desenho se recolhe numa bolinha, que salta em arco até o próximo espaço, achata ao pousar e "estoura" no novo desenho: as peças saem do centro uma a uma, passam um pouco do ponto e assentam (os recortes, como os do K, são entalhados por último). Se o desenho anterior já saiu da tela, o novo nasce direto no lugar.
- O estilo antigo, com gotas que se fundem e a faixa de café na abertura, continua disponível: troque `data-liquid-style="solid"` por `"liquid"` na tag `<html>` em `src/layouts/Base.astro`.
- Todas as cores ficam no topo de `src/styles/global.css`. Para trocar a cor-assinatura, mude `--signature`, `--brand-rgb` e `--liquid` (hex de 6 dígitos).

## Destaques

- **Líquido que explica o conteúdo (WebGL)**: um único corpo de líquido, em estilo 2D bem acabado (cor chapada, bordas nítidas, brilho suave), acompanha a navegação e vira o desenho do que está escrito: um relógio no problema do tempo, barras de crescimento na virada, um ciclo na metodologia, o K da Kafé no "Sobre" e uma xícara no convite final. Cada forma tem um espaço reservado no layout, rola junto com o conteúdo e nunca fica por cima do texto. Nos cartões de serviço, basta passar o mouse para o líquido virar celular, navegador, IA, foguete, rede ou layout. Veja "Formas do líquido" abaixo.
- **Mascote com personalidade**: no início da home (e tristinho na página 404), com os olhos inspirados nos recortes do K. Ele acompanha o cursor, pisca, olha para onde a pessoa clica e muda de expressão:
  - clique: uma reação diferente a cada vez (feliz, piscadinha, surpreso, apaixonado); cliques demais o deixam tonto e depois bravo;
  - clique duplo: cambalhota; toque longo (celular): enche de ar;
  - arrastar (mouse): puxa-puxa. O corpo fica no lugar e se inclina, e o pedaço que você segura sai dele preso por um "pescoço" que afina e resiste conforme estica (perto do limite, ele treme de esforço). Ao soltar, a ponta volta num estalo e o corpo achata, balança e assenta;
  - mouse rápido por cima: cócegas; mouse devagar: carinho;
  - mouse no botão principal: apaixonado; em temas de IA: olhos de estrela;
  - cursor sai da página: fica triste e comemora quando ele volta; voltar para a aba: comemora;
  - ninguém mexe: boceja e depois cochila;
  - digitar "café" em qualquer lugar: festa; copiar um texto: piscadinha; voltar ao topo depois de ler tudo: carinho;
  - cumprimenta conforme a hora do dia. No celular, a fala aparece dentro do botão "Diga oi".
  Falas em `src/scripts/mascot.ts`; expressões e movimentos em `src/scripts/liquid.ts`.
- **Fundo calmo**: só uma fumaça quente que flui devagar e o brilho da cor-assinatura em volta das formas.
- **Trilho de seções**: à direita (telas largas), mostra em que parte da página a pessoa está e permite pular entre as seções.
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
| Serviços (cards e páginas `/servicos/...`) | `src/data/services.ts` |
| Método, formatos de trabalho, comparativo e perguntas frequentes | `src/data/method.ts` |
| Artigos do blog | `src/content/blog/*.md` |
| Cases | `src/content/cases/*.md` (use `_modelo-de-case.md` como base) |
| Cores (ônix, pérola e prata), fontes e espaçamentos | `src/styles/global.css` (variáveis no topo) |
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
- `data-mascot-look="love"` ou `"star"`: o mascote olha para o elemento e reage quando o mouse passa por ele.

Para testar no console do navegador: `__liquid.show('rocket')` mostra uma forma, `__liquid.react('love')` faz o mascote reagir (`happy`, `wink`, `surprise`, `love`, `dizzy`, `angry`, `giggle`, `spin`, `star`, `sad`, `pet`, `yawn`, `inflate`, `party`) `__liquid.advance(3)` adianta a animação em 3 segundos, `__liquid.state()` mostra a forma atual e a fase da transformação e `__liquid.tint('#3b6ef0', '#ffffff')` testa outra cor para o líquido e os olhos.

### Fontes

- **Inter** no texto (já incluída).
- **Gilroy** nos títulos. É uma fonte paga, então o site não a distribui: coloque os arquivos licenciados em `public/fonts/gilroy/` com o peso no nome (ex.: `Gilroy-Bold.woff2`, `Gilroy-SemiBold.woff2`). No próximo build, os títulos passam a usar a Gilroy automaticamente. Enquanto a pasta estiver vazia, os títulos usam a Figtree, gratuita e de desenho parecido.

### Formulário de contato

Em `src/data/site.ts`, dentro de `contact`:

- `briefUrl`: o pré-orçamento com a Kafeína, a assistente de IA da Kafé (hoje `https://form.kafeapps.com.br`, o mesmo do site atual). Os botões principais ("Tirar minha ideia do papel", "Começar meu projeto", "Pedir uma proposta") levam para lá, e a página de contato o destaca acima do formulário.
- `formEndpoint`: endereço de um serviço que recebe formulários (Formspree, Web3Forms, Getform ou um endpoint próprio). Quando preenchido, as mensagens são enviadas direto do site.
- `whatsapp`: número só com dígitos, com DDI e DDD (ex.: `5521999999999`). Ativa o botão flutuante e, se não houver `formEndpoint`, o formulário abre o WhatsApp com a mensagem pronta.
- `email`: usado nos links de e-mail e como último recurso do formulário.

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
- [ ] Confirmar razão social e CNPJ exibidos no rodapé.
- [ ] Revisar os números "10x mais agilidade" e "até 40% mais econômico" (vieram do site atual).
- [ ] Confirmar que todos os clientes em `src/assets/clients/` autorizam o uso do logo (vieram do site atual).
- [ ] Revisar as respostas das perguntas frequentes (NDA, prazos, propriedade).
- [ ] Adicionar os arquivos da Gilroy em `public/fonts/gilroy/`.
- [ ] Adicionar cases e depoimentos reais.
- [ ] Revisar a política de privacidade com o jurídico.
