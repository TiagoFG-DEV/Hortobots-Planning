# Hortobots Planning

Diário de bordo digital para as equipes Hortobots FLL e Hortobots OBR. A aplicação React e a API são entregues por um único servidor Node/Fastify.

## Desenvolvimento

Requisitos: Node 20 ou superior. O desenvolvimento local usa a pasta `Logs`; o Supabase será ativado no ambiente publicado.

```bash
npm install
npm run assets
npm run dev
```

O frontend abre em `http://localhost:5173` e a API em `http://localhost:3000`.

## Produção local

```bash
npm run build
npm run start -w @hortobots/api
```

Abra `http://localhost:3000`. O mesmo servidor entrega o site, a API e o fallback das rotas React.

## Verificação

```bash
npm run check:emoji
npm run typecheck
npm run build
npm audit --omit=dev
```

Consulte `docs/CLOUD_MIGRATION.md` para Supabase e Render, `docs/FORMATO_REGISTRO.md` para o contrato do documento e `docs/DECISOES.md` para decisões de arquitetura.
