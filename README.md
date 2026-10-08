# Hortobots Planning

Plataforma de Diario de Bordo Digital e Gestao Tecnica para as equipes Hortobots FLL e Hortobots OBR do SESI 437 - Hortolandia.

O projeto opera como um monorepo modular em TypeScript. O backend em Node.js com Express e arquitetura hibrida gerencia as requisicoes da API e serve a Single Page Application (SPA) compilada em React + Vite.

---

## 1. Visao Geral e Arquitetura

O sistema adota o padrao de persistencia hibrida com desacoplamento de infraestrutura:

- **Modo Nuvem (Render + Supabase):**
  - Hospedagem no Render via Blueprint (`render.yaml`).
  - Persistencia relacional no PostgreSQL do Supabase (`records`, `events`, `tests`).
  - Armazenamento de arquivos e midias em Supabase Storage.
  - Ativado automaticamente com `STORAGE_DRIVER=supabase`.

- **Modo Local (Simulacao de Desenvolvimento):**
  - Persistencia orientada a arquivos JSON e midias locais na pasta `Logs/` (`registros`, `testes`, `eventos`).
  - Execucao agil sem necessidade de conexao externa ativa.
  - Ativado com `STORAGE_DRIVER=local`.

---

## 2. Estrutura do Monorepo

```text
hortobots-planning/
├── apps/
│   ├── api/              # Servidor Node.js + Express (API REST e entrega estatica)
│   └── web/              # Interface SPA React + Vite + CSS Design System
├── packages/
│   └── shared/           # Tipos TypeScript, constantes e schemas Zod compartilhados
├── supabase/
│   └── migrations/       # Scripts SQL DDL de inicializacao do banco de dados
├── scripts/              # Utilitarios de auditoria, no-emoji e processamento de imagens
├── Logs/                 # Armazenamento local de desenvolvimento
├── render.yaml           # Configuracao de deploy declarativo no Render
└── package.json          # Workspaces e orquestracao de scripts npm
```

---

## 3. Funcionalidades Principais

- **Diario de Bordo Tecnico:**
  - Registro cronologico de atividades, hipoteses, problemas e solucoes.
  - Segmentacao estrita entre modalidades FLL (verde) e OBR (vermelho).
  - Associacao de metadados, tags tecnicas e galeria de midias (fotos e videos).

- **Calendario Oficial de Atividades:**
  - Calculo matematico real de dias e semanas (sem distorcoes de datas).
  - Destaque em tempo real do dia atual no fuso horario de Sao Paulo (`America/Sao_Paulo`).
  - Navegacao dedicada no trimestre critico (Outubro, Novembro e Dezembro).
  - Integracao unificada exibindo registros de diario, testes de robo e eventos na data selecionada.
  - Controle de prioridade de eventos (Comum / Urgente).

- **Fluxo de Autorizacao de Eventos:**
  - Mentores podem planejar e cadastrar novos eventos na agenda.
  - Eventos urgentes entram no estado `PENDENTE` e exigem aprovacao expressa da conta `Gestao` (`PATCH /api/eventos/:id/confirmar`).

- **Simulacoes e Testes de Robos:**
  - Registro de ciclos de testes com quantidade variavel de tentativas (3 a 15).
  - Metricas de tempo, pontuacao observada e taxa de falhas.
  - Visualizacao grafica de desempenho em linha, barras ou circular.

- **Design System e Fluidez:**
  - Transicoes suaves entre rotas e paineis (`.page-transition`).
  - Estetica baseada em cadernos tecnicos de engenharia.
  - Conformidade estrita com a regra universal de proibicao de emojis no codigo e interface.

---

## 4. Guia de Instalacao e Execucao Local

### Pre-requisitos
- Node.js versao 20 ou superior.
- npm versao 10 ou superior.

### Instalacao de Dependencias
```bash
npm install
```

### Processamento de Assets Graficos (opcional / inicial)
```bash
npm run assets
```

### Execucao em Modo de Desenvolvimento Local (Logs)
Para executar a API em modo local (`Logs/`) em conjunto com o servidor Vite:
```bash
npm run dev:local
```
- Frontend acessivel em: `http://localhost:5173`
- Servidor de API acessivel em: `http://localhost:3000`

---

## 5. Comandos de Build e Validacao

### Compilacao Completa do Projeto
Gera os artefatos compilados em todos os workspaces (`shared`, `api` e `web`):
```bash
npm run build
```

### Compilacao por Workspace
```bash
# Pacote compartilhado
npm run build -w @hortobots/shared

# Backend Express
npm run build -w @hortobots/api

# Frontend React SPA
npm run build -w @hortobots/web
```

### Testes de Conformidade e Tipagem
```bash
# Validacao de regra sem emojis
npm run check:emoji

# Verificacao estrita de tipos TypeScript
npm run typecheck

# Analise estatica de codigo
npm run lint
```

---

## 6. Deploy e Producao

### Execucao da Versao de Producao Localmente
```bash
npm run build
npm run start:local
```
O servidor Express servira a aplicacao completa na porta 3000 (`http://localhost:3000`).

### Deploy no Render com Supabase
O arquivo `render.yaml` esta configurado para execucao no Render:
- **Build Command:** `npm ci && npm run check:emoji && npm run build`
- **Start Command:** `npm run start:render`
- **Health Check Path:** `/api/health`

### Variaveis de Ambiente Necessarias no Servidor
Configure as seguintes chaves no painel do Render ou arquivo `.env`:
```ini
NODE_VERSION=20
STORAGE_DRIVER=supabase
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<sua-service-role-key>
SUPABASE_BUCKET=hortobots-planning
PORT=3000
```

---

## 7. Padroes de Codigo e Boas Praticas

1. **TypeScript Estrito:**
   Configuracao com `strict: true` e `noUncheckedIndexedAccess`. Evita-se uso indiscriminado de `any`.
2. **Seguranca de Chaves:**
   Chaves privilegiadas (`service_role`) permanecem restritas ao backend. O cliente consome apenas a chave publica `anon`/`publishable`.
3. **Imutabilidade e Tratamento de Datas:**
   Datas de acontecimento sao manipuladas no formato textual `YYYY-MM-DD` preservando a data nominal sem interferencia indevida de fuso horario na persistencia.
4. **Resiliencia da API:**
   Uso de rate-limit contra abusos, sanitizacao de nomes de arquivos para evitar path traversal e protecao de rotas via tokens criptografados.
