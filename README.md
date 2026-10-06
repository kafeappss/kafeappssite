# Site da Kafé Apps

Site institucional da [Kafé Apps](https://kafeapps.com.br): estúdio de produto digital de Niterói (RJ).

Feito com [Astro](https://astro.build), gera um site 100% estático (HTML, CSS e um pouco de JavaScript): rápido, bom para SEO e fácil de hospedar em qualquer lugar.

## Destaques

- **Metal líquido em WebGL**: um único corpo de líquido acompanha toda a navegação. Cada seção declara uma "formação" (`data-liquid="hero"`, `"pool"` etc.), e as gotas escorrem entre elas. O cursor também vira gota. Código em `src/scripts/liquid.ts`.
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
| Serviços (cards e páginas `/servicos/...`) | `src/data/services.ts` |
| Método, formatos de trabalho, comparativo e perguntas frequentes | `src/data/method.ts` |
| Artigos do blog | `src/content/blog/*.md` |
| Cases | `src/content/cases/*.md` (use `_modelo-de-case.md` como base) |
| Cores (preto, branco e cinzas), fontes e espaçamentos | `src/styles/global.css` (variáveis no topo) |
| Logos (KAFÉ APPS e o símbolo K) | `src/assets/brand/` e `public/favicon.svg` |

Seções que dependem de listas vazias (depoimentos, clientes, tecnologias, cases) **não aparecem** até receberem conteúdo. Assim nada de "exemplo" vai para o ar por engano.

### Formulário de contato

Em `src/data/site.ts`, dentro de `contact`:

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
- [ ] Confirmar os quatro "D" da Metodologia 4D (`src/data/method.ts`).
- [ ] Revisar o número "até 40% mais econômico" (veio da landing page atual).
- [ ] Revisar as respostas das perguntas frequentes (NDA, prazos, propriedade).
- [ ] Adicionar cases, depoimentos, clientes e tecnologias reais.
- [ ] Revisar a política de privacidade com o jurídico.
