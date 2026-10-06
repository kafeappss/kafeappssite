# Site da Kafé Apps

Site institucional da [Kafé Apps](https://kafeapps.com.br): software house de Niterói (RJ) que desenvolve aplicativos, plataformas e soluções de IA em código, com engenharia aumentada por IA.

Feito com [Astro](https://astro.build), gera um site 100% estático (HTML, CSS e um pouco de JavaScript): rápido, bom para SEO e fácil de hospedar em qualquer lugar.

## Destaques

- **Líquido que explica o conteúdo (WebGL)**: um único corpo de metal líquido acompanha a navegação e vira o desenho do que está escrito: um relógio no problema do tempo, um celular no serviço de aplicativos, um foguete no MVP, um ciclo na metodologia, o K da Kafé no "Sobre" e uma xícara no convite final. Veja "Formas do líquido" abaixo.
- **Mascote interativo**: no início da home, uma gota com os olhos inspirados no logo. Ele acompanha o cursor, pisca e, ao ser clicado, pula e fala (frases em `src/scripts/mascot.ts`). No celular ele ganha um espaço só dele, abaixo do texto.
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
| Falas do mascote | `src/scripts/mascot.ts` |
| Serviços (cards e páginas `/servicos/...`) | `src/data/services.ts` |
| Método, formatos de trabalho, comparativo e perguntas frequentes | `src/data/method.ts` |
| Artigos do blog | `src/content/blog/*.md` |
| Cases | `src/content/cases/*.md` (use `_modelo-de-case.md` como base) |
| Cores (preto, branco e cinzas), fontes e espaçamentos | `src/styles/global.css` (variáveis no topo) |
| Logos (KAFÉ APPS e o símbolo K) | `src/assets/brand/` e `public/favicon.svg` |
| Arquivos da marca para download (K e logo, branco e preto, sem fundo) | `public/brand/` |

Seções que dependem de listas vazias (hoje: depoimentos e cases) **não aparecem** até receberem conteúdo. Assim nada de "exemplo" vai para o ar por engano.

### Formas do líquido e trilho de seções

Cada seção diz qual desenho o líquido deve formar enquanto ela está no meio da tela:

```astro
<section data-liquid="rocket" data-rail="MVP">…</section>
```

- `data-liquid="nome [lugar]"`: `nome` é uma das formas de `src/scripts/shapes.ts` (`mascot`, `clock`, `bars`, `code`, `code-ai`, `ai`, `phone`, `browser`, `rocket`, `nodes`, `layout`, `cycle-0` a `cycle-4`, `k`, `cup`, `rest`, `pool`, `page`). O `lugar` é opcional: `stage` (ao lado do texto, padrão), `bottom`, `center` ou `view` (tela toda). No celular as formas ficam menores, num canto e mais apagadas, para não competir com o texto.
- `data-rail="Nome"`: inclui a seção no trilho da direita (aparece quando a página tem pelo menos três).
- `data-liquid-anchor`: um elemento dentro da seção que reserva espaço para a forma, que passa a rolar junto com o conteúdo. É assim que o mascote fica abaixo do texto no celular e a xícara fica abaixo dos botões no convite final.

Para testar uma forma, abra o console do navegador e rode `__liquid.show('rocket')`.

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
