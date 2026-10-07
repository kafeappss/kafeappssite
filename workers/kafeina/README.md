# Kafeína: serviço do pré-orçamento

Pequeno serviço (Cloudflare Worker) usado pela página `/orcamento` do site. Ele:

1. recebe as respostas do formulário;
2. pede à IA da Anthropic (modelo Claude Opus 5.5) um retorno curto e personalizado: resumo, escopo sugerido para a primeira versão, pontos de atenção e próximos passos;
3. repassa o pedido completo (com o contato) ao CRM, se `LEAD_WEBHOOK_URL` estiver configurado, e avisa o site se a entrega deu certo.

Sem este serviço, o site continua funcionando: a estimativa (investimento e prazo) é calculada no navegador pela tabela de `src/data/kafeina.ts`, o resumo é montado por regras e a pessoa envia o pedido por WhatsApp ou e-mail.

## Privacidade

- Para a IA vão só as respostas sobre o projeto. Nome, e-mail, WhatsApp e cidade nunca são enviados a ela.
- Valores e prazos chegam prontos do site, e a IA é instruída a não inventar outros números.
- Só os endereços em `ALLOWED_ORIGINS` (o site e o ambiente local) podem chamar o serviço.

## Como publicar

Requer uma conta na Cloudflare e uma chave da API da Anthropic (console.anthropic.com).

```bash
cd workers/kafeina
npm install
npx wrangler login                          # entra na sua conta da Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY   # cola a chave da Anthropic
npx wrangler secret put LEAD_WEBHOOK_URL    # opcional: webhook do CRM que recebe cada pedido
npx wrangler deploy
```

O `deploy` mostra o endereço do serviço (algo como `https://kafeina.SEU-USUARIO.workers.dev`). Coloque esse endereço em `kafeinaEndpoint`, no arquivo `src/data/site.ts`, e publique o site de novo.

Para testar localmente: `npx wrangler dev` (com o site rodando em `http://localhost:4321`).

## O que o CRM recebe

Um `POST` com JSON contendo: `projeto`, `problema`, `contexto`, `escopo`, `prazo`, `investimento`, `contato` (`nome`, `empresa`, `email`, `whatsapp`, `uf`, `cidade`), `estimativa` (faixa de investimento em mil reais, semanas e escopo sugerido), `pagina`, `criadoEm` e `resumoKafeina` (o retorno da IA).

## Cuidados

- Ative uma regra de limite de requisições (Rate Limiting) para o endereço do serviço no painel da Cloudflare, para evitar abuso.
- Ajuste `ALLOWED_ORIGINS` em `wrangler.toml` se o site mudar de domínio.
