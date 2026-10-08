# HORTOBOTS PLANNING — PROMPT MESTRE DE CONSTRUÇÃO

Plataforma web de Diário de Bordo Digital para as equipes Hortobots FLL e Hortobots OBR.

Versão do documento: 1.0 — Data de referência: 06/10/2026 — Idioma do produto: português do Brasil (pt-BR)

---

# 0. COMO LER E USAR ESTE DOCUMENTO

## 0.1 Quem é você

Você é um agente de engenharia de software que vai construir, do zero e sem nenhum contexto prévio, uma aplicação web completa e 100% funcional chamada **Hortobots Planning**. Este documento é a única fonte de verdade. Leia-o inteiro antes de escrever qualquer linha de código. Ele descreve produto, identidade visual, arquitetura, banco de dados, armazenamento, API, interface, segurança, deploy e critérios de aceitação.

## 0.2 Precedência quando houver conflito

1. Seção 2 (Regras inegociáveis).
2. O restante deste documento.
3. As imagens de referência listadas na seção 3 (são direção visual, não pixel-perfect).
4. Sua preferência pessoal (só vale quando nada acima disser algo).

## 0.3 Níveis de prioridade

* **P0** — obrigatório e funcionando na primeira versão.
* **P1** — esperado na primeira versão; entregar se não comprometer os P0.
* **P2** — apenas deixar a arquitetura, tipos, rotas-stub e feature flag prontos. A funcionalidade fica DESLIGADA.

Palavras: DEVE / NÃO DEVE são obrigações; DEVERIA é recomendação forte.

## 0.4 Como agir diante de lacunas

Se algo não estiver especificado: escolha a opção mais simples e segura, registre a decisão em `docs/DECISOES.md` (data, contexto, decisão, motivo) e siga em frente. Só interrompa o trabalho para pedir ao humano o que é impossível obter sozinho (credenciais Supabase, acesso ao Render, domínio). Tudo o que exige ação manual do humano está consolidado na seção 14.

## 0.5 O que você deve entregar

1. Repositório monorepo completo (código, migrações SQL, scripts, testes, documentação).
2. Frontend funcional (React + TypeScript + Vite).
3. Backend/API funcional (Node + TypeScript + Fastify).
4. Pacote compartilhado de tipos e schemas Zod (editor, renderizador, API e importação usam o MESMO modelo).
5. Migrações do banco (Supabase/PostgreSQL) e script de criação do bucket de Storage.
6. Arquivo `render.yaml` (Blueprint do Render) e `.env.example` de cada app.
7. Scripts de processamento de assets (fundos, favicon, imagem Open Graph, transparência de logos/mascote).
8. Testes unitários, de integração e end-to-end cobrindo os 4 fluxos de aceitação (seção 15).
9. `README.md` (como rodar, como fazer deploy) e `docs/DECISOES.md`.
10. A área de testes ("Simulações e Testes") presente apenas como estrutura desligada (seção 13).

---

# 1. VISÃO DO PRODUTO

## 1.1 O que é

Um diário de bordo digital para equipes de robótica. Cada **registro** documenta um dia/atividade da equipe: título, resumo, texto rico em blocos (títulos, parágrafos, listas, tabelas, caixas de problema/solução/decisão, imagens, vídeos), galeria de mídia, tags, autor e data oficial do acontecimento.

A plataforma NÃO é um CRUD de posts, NÃO é um dashboard corporativo e NÃO é um editor de texto genérico. É a **versão digital de um caderno técnico de engenharia**: papel com linhas, margens, espiral, clipe, fitas, carimbos, grid de engenharia, páginas que se abrem como um livro.

## 1.2 Pergunta-guia de toda decisão de UX

> "Se alguém entrar aqui daqui a cinco anos, conseguirá entender o que a equipe fez?"

Consequências diretas: cada registro é compreensível isoladamente; datas são sempre exibidas por extenso; a data do acontecimento nunca é confundida com a data de criação; o histórico nunca se perde.

## 1.3 Duas modalidades, uma única plataforma

* **Hortobots FLL** — identidade predominante VERDE.
* **Hortobots OBR** — identidade predominante VERMELHA.

Mesma estrutura de interface; muda cor de destaque, logo, alguns ornamentos e rótulos. O sistema NÃO são duas aplicações. Namespaces de dados são rigidamente separados (nunca misturar `fll` e `obr` no Storage).

## 1.4 Usuários

Integrantes (estudantes e mentores) da equipe do SESI 437 – Hortolândia, em notebooks, tablets e celulares, durante reuniões, treinos e competições. Não são técnicos: a interface deve ser óbvia, tolerante a erro e nunca perder trabalho.

---

# 2. REGRAS INEGOCIÁVEIS

Estas regras valem sobre qualquer outra instrução.

## 2.1 PROIBIDO USAR EMOJIS — EM QUALQUER LUGAR, SEMPRE

Esta é a regra número um do projeto.

NÃO pode haver emoji Unicode em: botões, menus, títulos, mensagens, placeholders, tooltips, toasts, estados vazios, cards, logs (console e servidor), mensagens de erro, textos alternativos (`alt`), `aria-label`, nomes de arquivo, dados de seed, README, comentários de código, mensagens de commit e documentação.

Também NÃO usar caracteres "símbolo" que algumas plataformas renderizam como emoji colorido (por exemplo marcas de check/cruz decorativas, estrelas, setas "dingbat", coração, relógio, engrenagem em Unicode). Use **somente ícones vetoriais**: Lucide (`lucide-react`) ou SVGs próprios em `assets/`.

Garantias técnicas obrigatórias:

1. Script `scripts/check-no-emoji.mjs` que varre `apps/`, `packages/`, `supabase/`, `scripts/`, `docs/` e `README.md` com a regex Unicode `/\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|\uFE0F|\u200D/u`, ignorando `node_modules`, `dist` e binários. Lista de exceções permitidas: `©`, `®` e o ponto médio `·`. Qualquer outra ocorrência faz o script sair com código 1.
2. Esse script roda em `npm run lint`, no hook de pre-commit (husky/lint-staged) e no passo de build do Render (falha o deploy se houver emoji).
3. Teste e2e que percorre as telas principais e falha se o texto visível contiver emoji.
4. Decisão sobre conteúdo digitado por usuários: a regra vale para tudo que a PLATAFORMA produz. O texto que um integrante digita livremente NÃO é alterado ou censurado automaticamente (apagar caracteres do texto de alguém corrompe o diário). Deixe a flag `STRIP_EMOJI_FROM_USER_INPUT=false` pronta em config; se ligada, remove emojis no salvamento. Registre isso em `docs/DECISOES.md`.

## 2.2 A data oficial é a que o usuário informa

* `date` (formato `YYYY-MM-DD`) é a data do acontecimento. É escolhida manualmente. NUNCA é substituída pela data de criação, upload ou importação.
* `createdAt` / `updatedAt` são instantes técnicos (ISO 8601 UTC).
* Calendário, ordenação, filtros, pesquisa temporal, timeline e estatísticas usam SEMPRE `date`. NUNCA `createdAt`.
* Armadilha clássica a evitar: `new Date("2026-10-01")` é interpretado como UTC e, no Brasil (UTC-3), exibe 30/09. Trate `date` como STRING `YYYY-MM-DD` em toda a aplicação; para exibir, use `parseISO` do `date-fns` (que interpreta data pura como local) ou funções próprias que não passam por fuso. No banco, a coluna é do tipo `date`. O padrão do campo "data" em um novo registro é o dia atual no fuso `America/Sao_Paulo`.
* Registros futuros (data maior que hoje) são permitidos com aviso suave ("Esta data está no futuro").

## 2.3 Arquitetura de dados: três camadas separadas

* **Banco (PostgreSQL)** = catálogo/índice rápido.
* **JSON (`registro.json`)** = documento completo e canônico do registro.
* **Storage (objetos)** = JSON + imagens + vídeos + miniaturas.

Nunca salvar HTML arbitrário. Nunca salvar uma "foto" da página. O editor produz um **documento estruturado em blocos** (JSON validado por Zod). O renderizador (`DiaryRenderer`) transforma esse JSON em interface. Fluxo obrigatório:

```text
Editor (TipTap, só como UI de edição)
  -> Conversor para o modelo próprio (blocos)
  -> Validação Zod (shared)
  -> registro.json no Storage (+ índice no banco)
  -> Leitura + validação + migração de versão
  -> DiaryRenderer (React, sem dangerouslySetInnerHTML)
  -> Página do diário
```

## 2.4 Persistência real em nuvem

O conteúdo DEVE sobreviver a fechar o navegador, trocar de computador, limpar cache e novo deploy do site. É PROIBIDO depender de `localStorage`, do sistema de arquivos do Render (efêmero) ou de qualquer armazenamento local como fonte oficial. O armazenamento local (IndexedDB) serve apenas para RASCUNHOS não salvos.

Um registro só é considerado salvo depois que JSON, mídias e índice foram confirmados como persistidos.

## 2.5 Segurança mínima inegociável

* Nenhuma chave privada (Supabase Service Role) no frontend, no repositório ou no JSON. Apenas na API (variável de ambiente no Render).
* O cliente nunca define caminhos de Storage; o servidor gera pastas e nomes.
* Todo conteúdo vindo do JSON é renderizado por React (escape automático). Proibido `dangerouslySetInnerHTML` com dados do usuário. Links só `http:`, `https:`, `mailto:`.
* Bucket privado + URLs assinadas.

## 2.6 Escopo da primeira versão

* "Simulações e Testes" (a terceira tela do planejamento visual) fica DE FORA: sem botão, sem link, sem rota pública. Apenas estrutura atrás de feature flag desligada (seção 13).
* Importação e exportação: apenas arquitetura/stubs (P2).
* Autenticação com contas: apenas arquitetura (P2), mas com uma "trava de escrita" simples (seção 8.8) para a internet não poder apagar o acervo da equipe.

---

# 3. INVENTÁRIO DE ASSETS ENVIADOS (12 ARQUIVOS)

Todos os arquivos chegaram em `/mnt/user-data/uploads/`. Copie-os para `apps/web/src/assets/originals/` SEM alterá-los (preservar originais) e gere versões otimizadas por script (seção 5.10). Os nomes de arquivo abaixo são exatos.

## 3.1 Identidade e logos

| Arquivo | O que é (observado) | Uso obrigatório | Cuidados |
|---|---|---|---|
| `Logo.png` | Letreiro "HORTOBOTS PLANNING" em itálico pesado, preenchimento BRANCO com contorno claro, duas linhas (HORTOBOTS em cima, PLANNING embaixo, levemente inclinadas). Na pré-visualização parece quase invisível porque é branco sobre transparente. | Home (grande, centro-topo), cabeçalho (pequeno), rodapé de telas, imagem Open Graph. | Só funciona sobre fundo ESCURO. Em qualquer superfície clara (papel), NÃO usar; usar sempre sobre faixa/cabeçalho escuro. Conferir canal alfa. |
| `fll_team_logo.png` | Logo de equipe "HORTOBOTS – SESI 437 – HORTOLÂNDIA": lagarto verde sobre escudo preto, letreiro HORTOBOTS em branco com metade inferior rosa-lavanda. Fundo da imagem aparenta ser branco. | Identidade da modalidade FLL: card da home, cabeçalho FLL, capa padrão de registros FLL, estados vazios FLL. | Estes NÃO são os logos oficiais do torneio FIRST LEGO League; são os logos da equipe para a modalidade FLL. Não inventar nem baixar logo oficial de terceiros. Se o fundo for branco opaco, gerar versão transparente (seção 5.10). |
| `obr_team_logo.png` | Mesmo conceito em vermelho: lagarto amarelo/laranja, escudo vinho escuro, letreiro HORTOBOTS vermelho, "SESI 437 - HORTOLANDIA" (repare: sem acento, diferente do logo FLL). | Identidade da modalidade OBR (mesmos usos do FLL). | Mesmo cuidado de fundo branco. NÃO corrigir o texto do logo; apenas sinalizar ao humano em `docs/DECISOES.md` que a grafia difere. Estes NÃO são logos oficiais da OBR. |
| `icon.png` | Emblema circular: lagarto verde com chapéu escuro de aba larga, borda verde-limão, fundo verde escuro degradê. Margens brancas ao redor do círculo. | Fonte única do favicon, ícones PWA, apple-touch-icon e avatar da plataforma. | Recortar o círculo exato e deixar cantos transparentes; testar legibilidade em 16x16 (seção 5.11). |
| `mascote.png` | Fotografia de fantoche/pelúcia: lagarto verde de feltro com boca aberta vermelha, dentes brancos, chapéu marrom, braços abertos. Fundo branco. | Home (canto inferior direito, sobreposto ao cenário, como na tela inicial), estados vazios, tela de carregamento especial, página 404. NÃO colocar em todo lugar. | Gerar versão com fundo transparente (recorte). Não distorcer proporção. |
| `fundo.png` | Cenário 16:9 (aprox. 2576x1449): centro quase preto (#111), ondas verdes sobrepostas (verde pálido no canto superior esquerdo, verdes escuros e linha verde-limão no canto superior direito, verdes vivos na base), silhuetas pretas de lagartixas no canto superior direito e uma lagartixa verde-limão no canto inferior esquerdo. | Fundo (cenografia/"capa") da Home e do Hub de cada modalidade; moldura decorativa discreta nas telas internas (tema escuro). | Arquivo pesado: converter para WebP/AVIF em vários tamanhos. Gerar variante vermelha para OBR (seção 5.10) e variante vertical para celular. |

## 3.2 Botões/cartões das ações

Três cartões quadrados de bordas bem arredondadas (raio aproximado de 6% da largura), com moldura colorida grossa, título em versaletes serifados no topo e uma ilustração sobre papel. O texto "Novo Registro" etc. está EMBUTIDO na imagem.

| Arquivo | Descrição | Uso |
|---|---|---|
| `novo_registro_button.png` | Moldura VERDE-LIMÃO (#62B300 aprox.). Título "Novo Registro". Caderno de linhas azuis com margem vermelha, clipe de papel, lápis no canto superior direito, pilha de livros desenhada a tinta, notas musicais, gato, planeta, estrelas pretas e pontos de exclamação. | Hub da modalidade: cartão que leva a `/:modalidade/novo`. |
| `registros_salvos_button.png` | Moldura TEAL/AZUL-PETRÓLEO (#00727F aprox.). Título "Registros Salvos". Papel rasgado off-white com pontilhado, pasta amarela-ouro com folhas de contorno azul, caderno espiral preto no canto. | Hub da modalidade: cartão que leva a `/:modalidade/registros`. |
| `simulacoes_e_testes_button.png` | Moldura VERMELHO-LARANJA (#FF3300 aprox.). Título "Simulações e Testes". Papel quadriculado amassado, braço robótico em contorno preto, engrenagem, robozinho sorridente com olhos laranja. | NÃO RENDERIZAR na v1. Manter o arquivo em `assets/originals/` e referenciá-lo apenas dentro do módulo desligado (seção 13), de modo que o bundler o exclua do build público. |

Acessibilidade dos cartões: como o texto está dentro da imagem, cada cartão é um `<a>` com `aria-label` explícito ("Novo registro no diário FLL") e `alt` descritivo na imagem; foco visível com anel na cor da modalidade.

## 3.3 Telas de planejamento (apenas referência visual e estrutural)

Resolução aproximada 2576x1449 (16:9). NÃO são assets de runtime. Use para entender composição, proporções, hierarquia e clima. Reproduza com HTML/CSS/SVG, nunca colando a imagem.

| Arquivo | O que mostra | Como virar produto |
|---|---|---|
| `Tela_Inicial.png` | Fundo `fundo.png`. `Logo.png` grande no topo-centro. Linha com 3 cartões (Novo Registro / Registros Salvos / Simulações e Testes) alinhados no centro-baixo. Mascote no canto inferior direito, sobrepondo o cartão da direita. Rodapé central em itálico negrito branco: "Diário de Bordo - HORTOBOTS". | Base da **Home** (seleção FLL/OBR) e do **Hub de modalidade** (cartões de ação). Detalhado em 9.2 e 9.3. |
| `Tela_Novo_Registro.png` | Mesmo fundo; `Logo.png` pequeno no canto superior direito. Duas "páginas" brancas de bordas muito arredondadas lado a lado como livro aberto. Página esquerda: data "06 de Outubro de 2026" em negrito grande e centralizado; subtítulo "Inserir um subtítulo (Opcional)"; corpo "insira seu texto.". Página direita: grade 2 colunas x 4 linhas com 8 slots de imagem (ícone de paisagem em contorno preto). Duas setas laranja (#C8622B aprox.) nas laterais: seta esquerda na borda esquerda da página esquerda, seta direita na borda direita da página direita (virar página). Rodapé "Diário de Bordo - HORTOBOTS". | Layout de **Novo/Editar registro** e de **Visualização do registro** em desktop: livro aberto, texto à esquerda, galeria 8 slots por folha à direita, setas para virar a página da galeria. Detalhado em 9.5 e 9.6. |
| `Tela_Registros_salvos.png` | Mesmo fundo. À esquerda, um calendário gigante estilo bloco de mesa: topo vermelho com dois anéis metálicos, grade 7 colunas x 5 linhas. À direita, uma página branca de borda arredondada com data "06 de Outubro de 2026", subtítulo opcional e "insira seu texto." — prévia do registro do dia selecionado. `Logo.png` no canto superior direito parcialmente coberto pela página. | Layout da tela **Registros Salvos > Calendário**. Detalhado em 9.4. |

## 3.4 Paleta observada nos assets (valores aproximados — AMOSTRE os pixels reais)

* Preto de fundo: `#111111` / `#101311`.
* Verdes das ondas: pálido `#D4E8C8`, sálvia `#9CA98A`, escuros `#00502A` `#06773B`, vivos `#62B300` `#8DDD3A`, `#007A00`.
* Teal do cartão Registros Salvos: `#00727F`.
* Vermelho-laranja do cartão de Simulações: `#FF3300`.
* Vermelho do logo OBR: `#E32B24`; vinho `#5A0F0F`; ouro/laranja do lagarto OBR `#F6B922` / `#F28C1E`.
* Verde do logo FLL: `#2DC843`, verde escuro `#0A7A1A`, rosa-lavanda `#F7D5FA`.
* Seta laranja: `#C8622B`. Azul de contorno dos papéis: `#2E6DB4`. Ouro da pasta: `#D9970B`.
* Cabeçalho do calendário ilustrado: `#F5424A`.

Use um script (`scripts/sample-palette.mjs` com `sharp`) para extrair as cores reais e fixe-as em `config/theme.ts`. Verifique contraste (seção 5.4).

---

# 4. ARQUITETURA DE HOSPEDAGEM: RENDER + SUPABASE

## 4.1 Pergunta: "só subir o site já não bastaria? Precisa mesmo de banco extra?"

**Resposta curta: só subir o site NÃO basta. Armazenamento em nuvem é obrigatório. O banco de dados, nesta arquitetura, é um componente barato (mesmo projeto Supabase do Storage) e vale a pena. Decisão final: Render para hospedar + Supabase (Postgres + Storage) para persistir.**

Raciocínio detalhado (registre em `docs/DECISOES.md`):

1. **Render sozinho não persiste nada.** Um Static Site é apenas arquivos estáticos. Um Web Service no Render tem sistema de arquivos EFÊMERO: tudo que for gravado em disco some a cada deploy/reinício (disco persistente existe apenas em instâncias pagas, prende o serviço a uma instância, impede deploy sem queda e não é uma solução de acervo de vídeos). Logo, o Render é só a camada de COMPUTAÇÃO.
2. **O acervo (JSON, imagens, vídeos) precisa de Object Storage.** Supabase Storage resolve, com URLs assinadas e limites por bucket.
3. **Precisamos mesmo de um banco além do Storage?** Alternativa avaliada e REJEITADA: "só Storage", mantendo um `index.json` por modalidade. Problemas: (a) calendário por mês e listagem paginada exigiriam baixar o índice inteiro a cada abertura; (b) pesquisa de texto com acentos, prefixos ("MPU") e ranking é impraticável; (c) dois usuários salvando ao mesmo tempo corromperiam o `index.json` (last-write-wins); (d) contagens da home, filtros por período/mídia/tag viram varredura completa; (e) controle de concorrência otimista (`updatedAt`), trilha de auditoria, registros "pendentes" e limpeza de órfãos exigem consultas e transações. Com milhares de registros isso não escala.
4. **Custo de adicionar o banco: praticamente zero.** O Supabase já traz PostgreSQL no mesmo projeto do Storage (mesma conta, mesmas chaves, mesmo painel). NÃO usar o PostgreSQL do Render (o plano gratuito expira) e NÃO criar um terceiro serviço.
5. **A separação permanece:** Banco = catálogo; JSON = documento canônico; Storage = arquivos. Se o banco for perdido, é possível reconstruí-lo lendo os `registro.json` (script `scripts/reindex.ts`, P1). O JSON é a fonte da verdade do conteúdo; o banco é a fonte de verdade apenas do índice.

## 4.2 Diagrama

```text
 Navegador (React SPA, PWA)
   |   IndexedDB: rascunhos e mídia pendente
   |
   |-- HTTPS (JSON) -------------------------------> Render Web Service "hortobots-planning-api"
   |                                                   Fastify + TypeScript
   |                                                   - valida, autoriza, sanitiza
   |                                                   - gera pastas/nomes/URLs assinadas
   |                                                   - usa SERVICE ROLE KEY (segredo)
   |                                                      |
   |                                                      |--> Supabase Postgres (tabela records, audit_logs)
   |                                                      |--> Supabase Storage (bucket privado)
   |
   |-- upload direto via URL assinada (imagens/vídeos) --> Supabase Storage (NÃO passa pela API)
   |
   |-- HTML/JS/CSS/ícones --------------------------> Render Static Site "hortobots-planning-web" (CDN)
```

Por que o upload de mídia vai direto do navegador ao Storage: vídeos grandes não podem trafegar pela API (limites de tempo/memória e instâncias gratuitas que dormem). A API apenas AUTORIZA o upload entregando URLs assinadas de uso único, e depois VERIFICA que os objetos existem (seção 8.3).

## 4.3 Papel de cada componente

| Componente | Responsabilidade | Nunca faz |
|---|---|---|
| Render Static Site | Servir a SPA (build do Vite), reescrever `/*` para `/index.html`, cabeçalhos de segurança (CSP). | Guardar dados. |
| Render Web Service (API) | Regras de negócio, validação Zod, autorização, geração de slug/pasta/nome, assinatura de URLs, escrita do JSON, índice, exclusão, auditoria, manutenção. | Gravar em disco local; expor a Service Role Key. |
| Supabase Postgres | Índice `records`, busca de texto, calendário, contagens, `audit_logs`. RLS ligado e SEM políticas públicas (acesso só pela API com Service Role). | Guardar o conteúdo canônico. |
| Supabase Storage | Bucket privado `hortobots-planning`: `registro.json`, imagens, vídeos, miniaturas. | Ser público. |
| Navegador | UI, compressão de imagem, miniaturas, rascunhos em IndexedDB, upload via URL assinada. | Falar direto com o banco; conhecer segredos. |

## 4.4 Regiões, planos e limites (CONFIRMAR valores atuais nos sites oficiais antes de decidir)

Valores aproximados do plano gratuito na data de redação; podem ter mudado:

* **Supabase Free:** ~500 MB de banco, ~1 GB de Storage, limite de upload por arquivo de ~50 MB, banda mensal limitada, e projetos inativos por cerca de uma semana são PAUSADOS (precisam ser reativados manualmente). Plano Pro remove a pausa e amplia os limites (inclusive tamanho máximo de arquivo configurável).
* **Render Free:** Static Site gratuito; Web Service gratuito "dorme" após ~15 min sem tráfego e a primeira requisição seguinte leva ~30 a 60 s (cold start). Plano pago mínimo mantém a API sempre ligada.
* **Estimativa de espaço:** imagens comprimidas ficam em ~300 a 800 KB cada; um registro com 20 fotos e 1 vídeo curto fica em ~20 a 60 MB. 1 GB comporta algumas dezenas de registros "pesados". Para anos de acervo com vídeo, planeje o plano Pro ou use vídeo externo (YouTube não listado) para clipes longos.
* **Região recomendada:** Supabase em São Paulo (`sa-east-1`) para o upload direto de mídia ficar rápido para os usuários; Render na região mais próxima disponível (Ohio ou Virgínia). A latência API-banco (~100 a 150 ms) é aceitável desde que as consultas sejam poucas e em lote.
* **Mitigações obrigatórias de UX para cold start:** a SPA mostra a tela de carregamento especial (mascote + "CARREGANDO DIÁRIO...") e, se a API demorar mais de 4 s, a mensagem "O servidor está acordando. Isso leva até um minuto na primeira vez do dia."
* **Anti-pausa do Supabase (P1):** workflow agendado no GitHub Actions (ou cron externo) que chama `GET /api/health?deep=1` (faz uma consulta leve no banco) a cada 3 dias.

## 4.4.1 Pontos que o agente deve ter claros sobre essa escolha

* NÃO existe "banco do Render" neste projeto.
* O frontend NUNCA recebe a Service Role Key. A única chave do Supabase presente no frontend é a `anon` (pública por natureza), usada exclusivamente para o método `uploadToSignedUrl` (e o bucket é privado e RLS está ligado; a `anon` não consegue ler nem listar nada).
* Para trocar de provedor no futuro, toda a persistência fica atrás de interfaces em `apps/api/src/storage/` e `apps/api/src/db/` (padrão repositório/adaptador), nunca espalhada pelas rotas.

---

# 5. IDENTIDADE VISUAL E DESIGN SYSTEM

## 5.1 Conceito

> Diário físico + planner + documentação de engenharia + arquivo digital + identidade Hortobots.

Referências táteis: caderno de espiral, folha pautada com margem vermelha, papel quadriculado de engenharia, papel rasgado, clipe, fita adesiva, carimbo, etiqueta, marcas de corte nos cantos, numeração de folha. Referências de marca (dos assets): ondas orgânicas verdes, lagartixas, tipografia esportiva itálica, cartões com moldura grossa colorida e cantos muito arredondados, mascote de feltro.

NÃO usar: aparência de SaaS genérico, Bootstrap/Material padrão, gradientes aleatórios, excesso de sombras, excesso de bordas arredondadas, ícones desconexos, interface futurista neon genérica. A identidade deve ser reconhecível mesmo sem o texto "Hortobots".

Legibilidade em primeiro lugar: textura de papel é SUTIL (ruído de 3 a 6% de opacidade); texto longo sempre com contraste alto.

## 5.2 Variáveis de design (centralizadas em `src/styles/tokens.css`)

Tailwind lê estas variáveis (`tailwind.config.ts` mapeia cores para `var(--...)`). Nenhuma cor hexadecimal solta em componentes.

```css
:root {
  /* marca */
  --primary-fll: #62B300;
  --primary-fll-strong: #2F7D12;   /* texto/ícone sobre papel claro (contraste >= 4.5:1) */
  --primary-fll-deep: #00502A;
  --primary-fll-light: #8DDD3A;
  --primary-obr: #E32B24;
  --primary-obr-strong: #B3201A;
  --primary-obr-deep: #5A0F0F;
  --primary-obr-light: #FF6A5C;
  --accent-gold: #F6B922;          /* ouro do lagarto OBR e da pasta */
  --accent-teal: #00727F;          /* cartão Registros Salvos */
  --accent-arrow: #C8622B;         /* setas de virar página */
  --ink-blue: #2E6DB4;             /* contornos azuis de papel */

  /* modalidade ativa (preenchidas por [data-modality]) */
  --primary: var(--primary-fll);
  --primary-strong: var(--primary-fll-strong);
  --primary-deep: var(--primary-fll-deep);
  --primary-light: var(--primary-fll-light);
  --on-primary: #0A1A0A;           /* texto sobre preenchimento --primary */

  /* superfícies */
  --background: #ECE6D6;           /* mesa/papel kraft claro (tema claro) */
  --paper: #FFFEF9;
  --paper-line: #BFD3EA;           /* pauta azul clara */
  --paper-margin: #E2655B;         /* linha de margem vermelha */
  --text: #1B1F1B;
  --muted: #5B635B;
  --border: #CFC8B4;
  --shadow: 0 1px 0 rgba(0,0,0,.04), 0 8px 24px rgba(30,25,10,.12);
  --radius: 14px;                  /* cartões/botões */
  --radius-page: 28px;             /* folhas do livro (como nas telas) */
  --line-height-paper: 32px;       /* altura de pauta; texto alinhado a ela */
}

[data-modality="obr"] {
  --primary: var(--primary-obr);
  --primary-strong: var(--primary-obr-strong);
  --primary-deep: var(--primary-obr-deep);
  --primary-light: var(--primary-obr-light);
  --on-primary: #FFFFFF;
}

[data-theme="dark"] {
  --background: #111311;
  --paper: #1D211D;
  --paper-line: #2E3A33;
  --paper-margin: #8C3B36;
  --text: #ECEFE9;
  --muted: #9AA39A;
  --border: #303830;
  --shadow: 0 10px 30px rgba(0,0,0,.55);
  --primary-strong: var(--primary-light); /* em fundo escuro, o texto de destaque é o tom claro */
}
```

A modalidade controla a variável principal via atributo `data-modality="fll|obr"` no elemento `<html>`, definido pela rota. A troca FLL/OBR anima `--primary` (transição de 300 ms usando `@property` registrada para cor, com fallback sem animação).

Regra de contraste: texto normal >= 4.5:1; texto grande e componentes de UI >= 3:1. Preenchimento lima `#62B300` NÃO suporta texto branco (use `--on-primary` escuro). Vermelho `#E32B24` suporta texto branco. Verifique todas as combinações com um script de contraste (`scripts/check-contrast.mjs`) e documente os resultados.

## 5.3 Temas claro e escuro (P0)

Atributo `data-theme="light|dark"` em `<html>`, opção "Sistema" lê `prefers-color-scheme`. Um script inline no `<head>` aplica o tema ANTES da renderização (evita flash).

* **Claro:** mesa em tom papel kraft, folhas off-white com pauta azul clara, sombras suaves.
* **Escuro:** mesa quase preta com as ondas de `fundo` em baixa opacidade nas bordas, folhas em cinza-grafite esverdeado, pauta sutil, texto claro, destaque verde-limão (FLL) ou vermelho claro (OBR).
* **Opção extra "Papel claro sobre mesa escura" (P1, padrão no tema escuro):** as telas de referência mostram folhas BRANCAS sobre fundo escuro. Para fidelidade, no tema escuro exista a preferência `data-paper="light|dark"`; padrão `light` (fiel às telas). `dark` entrega o "papel escuro" do requisito original. Ambas devem passar nos contrastes.
* **Capa (Home e Hub):** sempre usa a cenografia escura de `fundo.png` nos dois temas, como a capa de um caderno. O tema afeta apenas o interior (lista, calendário, leitura, editor, menus).
* A preferência de tema/papel é uma preferência de UI e pode ficar em `localStorage` (é pequena; rascunhos NÃO).

## 5.4 Cores semânticas das caixas de conteúdo (nunca só por cor)

Cada caixa tem ícone SVG + rótulo textual + padrão de borda diferente, além da cor:

| Caixa | Rótulo | Cor base | Ícone Lucide sugerido | Borda |
|---|---|---|---|---|
| Observação | OBSERVAÇÃO | azul tinta `--ink-blue` | `Eye` ou `StickyNote` | sólida |
| Problema | PROBLEMA | vermelho/laranja de alerta | `TriangleAlert` | tracejada |
| Solução | SOLUÇÃO | verde | `Wrench` | sólida dupla |
| Decisão | DECISÃO | ouro `--accent-gold` | `Flag` | pontilhada |

## 5.5 Tipografia (self-hosted com `@fontsource`, sem Google Fonts em runtime)

* **Títulos/letreiros:** `Barlow Condensed` (700/800, também itálico) — esportiva, técnica, ecoa o letreiro itálico do logo. Usar em CAIXA ALTA para cabeçalhos de página, rótulos de seção e "HORTOBOTS FLL/OBR".
* **Títulos de cartão e versaletes (ecoando os botões `*_button.png`):** `Alegreya SC` (700).
* **Corpo e interface:** `Open Sans` (400/600/700, itálico) — as telas de referência usam Open Sans; legibilidade máxima.
* **Elemento de diário (manuscrito, uso mínimo):** `Caveat` (500/600) apenas em anotações de margem, carimbos de data/hora de criação, etiquetas curtas. NUNCA em texto longo.
* **Código:** `JetBrains Mono` (400) nos blocos de código.
* `font-display: swap`, subset latino + latino-estendido, pré-carregar apenas as 2 fontes críticas. Escala tipográfica fluida com `clamp()`. Corpo mínimo 16 px (17 a 18 px na leitura de registros), `line-height` de leitura 32 px alinhada à pauta.
* Sempre `font-family` com fallback do sistema.

## 5.6 Como a modalidade aparece (identidade evidente em TODA a experiência)

| Elemento | FLL (verde) | OBR (vermelho) |
|---|---|---|
| Cor `--primary` | `#62B300` | `#E32B24` |
| Logo | `fll_team_logo.png` | `obr_team_logo.png` |
| Cenografia da capa | `fundo` verde (original) | variante vermelha gerada por script |
| Padrão decorativo | studs/tijolos abstratos (círculos em grade, referência a construção modular) + lupa/pesquisa; NUNCA copiar peças ou marcas oficiais | traços de circuito, engrenagens, grade de pista, silhueta de robô de linha |
| Carimbo | "FLL" em moldura retangular rotacionada ~-4 graus | "OBR" em moldura circular rotacionada ~+3 graus |
| Estado vazio | mascote + "O diário FLL ainda está em branco." | mascote + "O diário OBR ainda está em branco." |
| Faixa do cabeçalho | linha inferior de 4 px na cor da modalidade | idem |
| Calendário | topo do bloco de mesa verde | topo do bloco de mesa vermelho |
| Tags | chip com borda e fundo 12% da cor da modalidade | idem |

O que NUNCA muda entre modalidades: estrutura de layout, posições, tipografia, comportamento, componentes.

## 5.7 Elementos gráficos de diário (todos SVG/CSS próprios, decorativos, `aria-hidden`)

Crie em `src/assets/graphics/` (e como componentes React) e use com economia:

* **Pauta** de caderno via `repeating-linear-gradient` (altura `--line-height-paper`) e margem vermelha vertical; `background-attachment: local` para a pauta rolar com o texto.
* **Espiral/argolas** na lombada entre as duas folhas (desktop) ou no topo da folha (mobile).
* **Clipe de papel** (como em `novo_registro_button.png`) prendendo o cabeçalho do registro.
* **Fita adesiva (washi tape)** semitransparente nos cantos de cartões e fotos, com leve rotação aleatória fixa por `id` (determinística, para não "pular" a cada render).
* **Papel rasgado** (borda irregular via `clip-path`/máscara SVG) em cartões de lista e estados vazios (como `registros_salvos_button.png`).
* **Papel quadriculado de engenharia** como fundo de áreas técnicas (galeria, tabelas).
* **Marcas de corte/registro** nos quatro cantos das folhas; **cotas** (linhas de dimensão) decorativas ao redor de imagens grandes.
* **Carimbo de modalidade** e **número da folha** ("FOLHA 03") no rodapé da página.
* **Marcador de dia com registro** no calendário: aparência de página anotada (dobra no canto + etiqueta com número de registros).
* **Ondas do `fundo`** como moldura nos cantos (tema escuro) em baixa opacidade.
* Ilustração vetorial de estado vazio (caderno em branco com lápis) — NÃO emoji.

Não exagerar: nenhuma decoração pode cobrir texto, reduzir contraste ou atrapalhar foco/cliques (`pointer-events: none`).

## 5.8 Animações (discretas, respeitando `prefers-reduced-motion`)

* Hover de cartões: elevação de 6 px e rotação máxima de 0,6 grau, 200 ms, `cubic-bezier(.2,.8,.2,1)`.
* Transição entre rotas: fade + deslocamento de 8 px em 200 a 250 ms (View Transitions API quando disponível, com fallback em CSS).
* Aparição de registros na lista: entrada escalonada (stagger de 40 ms, máximo 8 itens).
* Troca FLL/OBR: transição de cor da marca em 300 ms.
* Abertura do calendário: flip do bloco de mesa (rotateX leve) em 250 ms.
* Expansão de imagem (lightbox): escala + fade em 180 ms.
* Virar página da galeria: deslize horizontal de 220 ms.
* Mascote no carregamento: leve balanço vertical (2 px) em loop lento.
* PROIBIDO: piscar, parallax excessivo, rotação infinita sem motivo, sons, confete.
* Com `prefers-reduced-motion: reduce` todas as animações viram trocas instantâneas (opacidade apenas).

## 5.9 Responsividade (não apenas encolher o desktop)

Breakpoints: `sm` 480, `md` 768, `lg` 1100, `xl` 1440.

* **>= 1100 px (desktop/notebook):** livro aberto de duas folhas (texto + galeria), calendário-bloco ao lado do painel do dia, cabeçalho completo.
* **768 a 1099 px (tablet):** livro em folha única larga; galeria em seção abaixo do texto com grade de 4 colunas; calendário acima do painel do dia.
* **< 768 px (celular):** cabeçalho compacto (logo da modalidade + botão de menu); barra de navegação inferior fixa com 4 ações (Novo, Calendário, Lista, Buscar) e menu "Mais"; folha única com aparência de página preservada (pauta, margem, fita) em largura total; calendário em versão mobile (células grandes de toque, indicador de quantidade, painel do dia como "bottom sheet"); editor com barra de ferramentas fixa acima do teclado, rolável horizontalmente; galeria em 2 colunas; botões com alvo de toque >= 44 px; setas de virar página viram "Anterior/Próxima" abaixo da grade.
* Imagens sempre `max-width: 100%`, com `aspect-ratio` reservado (sem salto de layout).
* Testar em 360x640, 390x844, 768x1024, 1366x768, 1920x1080.
* Fundo mobile: variante vertical de `fundo` (seção 5.10); título e mascote nunca cortados ou distorcidos.

## 5.10 Pipeline de assets (scripts Node com `sharp`, executados em `npm run assets`, com saída versionada em `apps/web/src/assets/generated/`)

1. **Transparência:** para `mascote.png`, `fll_team_logo.png`, `obr_team_logo.png` e `icon.png`, inspecionar o canal alfa. Se o fundo for branco opaco, gerar `*.transparent.png` com remoção por preenchimento a partir das bordas (flood fill com tolerância, suavizando halo) e conferir visualmente sobre fundo escuro e claro. Manter o original intacto.
2. **Fundo:** converter `fundo.png` para WebP e AVIF em larguras 1280/1920/2560 (qualidade ~78). Usar `<picture>`/`image-set` com `background-size: cover`.
3. **Fundo OBR:** gerar `fundo-obr.*` por mapeamento de gradiente na luminância (preto -> vinho `#2B0707` -> vermelho `#B3201A` -> laranja `#F28C1E`), preservando as formas e as lagartixas. Fallback aceitável: filtro CSS (`hue-rotate`/`saturate`) se o resultado visual do script não ficar bom; validar visualmente.
4. **Fundo mobile:** gerar `fundo-mobile.*` em proporção vertical (por exemplo 1080x1920) compondo os cantos do `fundo` (ondas e lagartixas) sobre `#111`, para FLL e OBR.
5. **Logo.png:** gerar versão com `drop-shadow` seguro não é necessário; apenas conferir alfa e fornecer em 3 tamanhos (160, 320, 640 px de largura).
6. **Botões de ação:** gerar WebP em 1x/2x (480 e 960 px). NÃO converter o texto embutido.
7. **Favicon/PWA/OG:** seção 5.11.
8. Nenhum asset sem versão otimizada pode ir ao bundle; orçamento: cada imagem de UI <= 150 KB (exceto fundo <= 350 KB por variante), `loading="lazy"` para tudo abaixo da dobra e `fetchpriority="high"` somente para o logo da home.

## 5.11 Favicon, PWA e Open Graph

* Fonte única: `icon.png` (emblema do lagarto com chapéu). Recortar o círculo e tornar os cantos transparentes.
* Gerar: `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico` (16+32), `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (conteúdo dentro da zona segura de 80%, fundo `#0E1F10`), `favicon.svg` opcional.
* Em 16x16 o desenho deve continuar reconhecível: gerar uma versão SIMPLIFICADA (recorte apertado no rosto e chapéu, contraste alto, sem detalhes finos) e validar visualmente; se necessário, redesenhar um SVG simplificado fiel ao original.
* `manifest.webmanifest`: nome "Hortobots Planning", `short_name` "Hortobots", `display: standalone`, `theme_color` `#0E1F10`, `background_color` `#111111`, `lang: pt-BR`, ícones e atalhos "Novo registro FLL" / "Novo registro OBR".
* Open Graph e Twitter Card: `og:title` "Hortobots Planning", `og:description` "Diário de Bordo", `og:image` 1200x630 gerada por script compondo `fundo` + `Logo.png` + `mascote` (transparente), `og:locale` `pt_BR`. `<title>`, `<meta name="description">`, `theme-color`, `robots` conforme seção 12 (SEO).
* Splash screen PWA: fundo `#111111` + `Logo.png` centralizado.

---

# 6. STACK TECNOLÓGICA E ESTRUTURA DO REPOSITÓRIO

Princípio: apenas ferramentas realmente necessárias, versões atuais estáveis (fixe versões exatas no `package.json`/lockfile após a instalação). Node 20 LTS ou superior.

## 6.1 Escolhas e justificativas

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | TypeScript estrito (`strict: true`, `noUncheckedIndexedAccess`) em tudo. Proibido `any` sem comentário justificado. | Modelo de dados compartilhado e seguro. |
| Monorepo | npm workspaces: `apps/web`, `apps/api`, `packages/shared` | Um repositório, um modelo de dados, deploy independente. |
| Frontend | React 18 + Vite + React Router | SPA estática hospedada no Render Static Site; sem necessidade de SSR (app interno). Next.js NÃO é necessário. |
| Estilo | Tailwind CSS 3.4 + variáveis CSS (`tokens.css`) + CSS próprio para texturas/pauta | Velocidade com identidade própria via tokens. |
| Editor | TipTap (ProseMirror) com extensões: StarterKit, Underline, Link, Placeholder, Table (+Row/Header/Cell), e nós customizados (`image`, `video`, `callout`, `divider`, `codeBlock`) | Edição rica; é só a UI. O modelo salvo é o NOSSO (blocos). |
| Estado de servidor | TanStack Query | Cache, paginação infinita, invalidação. |
| Estado de UI | Zustand (store do editor, tema, toasts) | Leve. |
| Validação | Zod (pacote `shared`) | Mesmo schema em editor, API, renderizador e importação. |
| Datas | date-fns + locale `ptBR` | Formatação e cálculo; sem Moment. |
| Ícones | lucide-react | Vetorial, consistente, sem emoji. |
| Acessibilidade de diálogos/menus | `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu` | Foco, ARIA e teclado corretos sem reinventar. |
| Reordenação | `@dnd-kit/core` + `@dnd-kit/sortable` | Arrastar com teclado e toque. |
| Rascunhos locais | `idb` (wrapper de IndexedDB) | Blobs grandes; NÃO localStorage. |
| Compressão de imagem | `browser-image-compression` (ou canvas próprio com `createImageBitmap`) | Reduz antes do upload e gera miniaturas. |
| Upload | `@supabase/supabase-js` SOMENTE para `storage.from(bucket).uploadToSignedUrl(path, token, file)` com a chave `anon` | Upload direto autorizado pela API. |
| PWA | `vite-plugin-pwa` | Manifest + service worker (precache de assets; API sempre NetworkOnly). |
| Backend | Node + Fastify + TypeScript; `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`; `pino` (logs); `file-type` (assinatura de arquivo) | Rápido, simples, tipado. |
| Banco/Storage | Supabase (PostgreSQL + Storage) via `@supabase/supabase-js` no servidor com Service Role | Seção 4. |
| Testes | Vitest (unit/integração), Testing Library, Playwright (e2e) | Seção 15. |
| Qualidade | ESLint, Prettier, husky + lint-staged, `check-no-emoji` | Seção 2.1. |
| Scripts de assets | Node + `sharp` | Seção 5.10. |

NÃO adicionar: Redux, MUI/Chakra/Bootstrap, axios, Moment, lodash inteiro, Firebase, Next.js, bibliotecas de calendário prontas (o calendário é próprio).

## 6.2 Estrutura de pastas

```text
hortobots-planning/
├── package.json                      (workspaces, scripts raiz)
├── render.yaml                       (Blueprint do Render)
├── .env.example
├── README.md
├── docs/
│   ├── DECISOES.md
│   ├── MANUAL_DEPLOY.md
│   └── FORMATO_REGISTRO.md           (documentação do JSON e versões)
├── supabase/
│   └── migrations/0001_init.sql
├── scripts/
│   ├── check-no-emoji.mjs
│   ├── check-contrast.mjs
│   ├── sample-palette.mjs
│   ├── process-assets.mjs            (transparência, fundos, favicon, OG)
│   ├── setup-storage.ts              (cria bucket privado e limites)
│   ├── seed-demo.ts                  (registros fictícios, sem emoji, opcional)
│   ├── reindex.ts                    (reconstrói o banco a partir dos JSON)
│   └── audit-integrity.ts            (detecta órfãos e referências quebradas)
├── packages/shared/src/
│   ├── schema/                       (zod: inline, blocks, media, document, api)
│   ├── migrate/                      (migrações de versão do documento)
│   ├── constants.ts                  (modalidades, tags, limites, regex)
│   ├── slug.ts                       (slugify, nome de pasta e arquivos)
│   ├── dates.ts                      (helpers de data sem fuso)
│   ├── text.ts                       (extração de texto para busca, normalização)
│   └── index.ts
├── apps/api/src/
│   ├── server.ts, app.ts
│   ├── config/                       (env validado com zod, flags, limites)
│   ├── auth/                         (contexto de usuário/papel, trava de escrita)
│   ├── routes/                       (records, summary, calendar, media, admin, config, health)
│   ├── services/                     (recordService, mediaService, searchService, auditService)
│   ├── db/                           (repositório records/audit sobre Supabase)
│   ├── storage/                      (adaptador Storage: put/get/list/remove/signed)
│   ├── security/                     (sanitização, path guard, magic bytes)
│   └── tests/
└── apps/web/
    ├── index.html, vite.config.ts, tailwind.config.ts
    ├── public/                       (favicons, manifest, og-image, robots.txt)
    └── src/
        ├── assets/{originals,generated,hortobots,fll,obr,graphics}/
        ├── components/               (UI genérica: Button, Dialog, Toast, Tag, Spinner...)
        ├── layouts/                  (CoverLayout, DiaryLayout, BookSpread)
        ├── pages/                    (Home, ModalityHub, Records, RecordView, RecordEditor, NotFound)
        ├── editor/                   (TipTap setup, nós, toolbar, conversores, slash menu)
        ├── renderer/                 (DiaryRenderer e componentes de bloco)
        ├── calendar/                 (DeskCalendar, DayPanel, hooks)
        ├── records/                  (RecordCard, RecordList, filtros, busca)
        ├── gallery/                  (GalleryGrid, Lightbox, MediaTile)
        ├── storage/                  (drafts em IndexedDB, upload, compressão)
        ├── services/                 (api client, tipos de resposta)
        ├── hooks/
        ├── utils/
        ├── types/
        ├── styles/                   (tokens.css, paper.css, base.css)
        └── config/                   (theme.ts, features.ts, limits.ts, strings.ts)
```

Separação obrigatória: UI (components/pages) não importa SDK do Supabase (exceto `storage/upload.ts`); regras de negócio ficam em `shared` e `services`; persistência fica na API; renderização fica em `renderer/`.

Textos de interface ficam centralizados em `config/strings.ts` (pt-BR), o que facilita a checagem de emoji e uma eventual internacionalização.

---

# 7. MODELO DE DADOS

## 7.1 Constantes (em `packages/shared/src/constants.ts`)

```ts
export const MODALITIES = ['FLL', 'OBR'] as const;           // no JSON e no banco
export type Modality = (typeof MODALITIES)[number];
export const modalityToPath = (m: Modality) => m.toLowerCase(); // 'fll' | 'obr' (rotas e pastas)

export const TAGS = [
  { slug: 'programacao',  label: 'Programação' },
  { slug: 'eletronica',   label: 'Eletrônica' },
  { slug: 'mecanica',     label: 'Mecânica' },
  { slug: 'estrategia',   label: 'Estratégia' },
  { slug: 'pesquisa',     label: 'Pesquisa' },
  { slug: 'treino',       label: 'Treino' },
  { slug: 'competicao',   label: 'Competição' },
  { slug: 'reuniao',      label: 'Reunião' },
  { slug: 'documentacao', label: 'Documentação' },
  { slug: 'problema',     label: 'Problema' },
  { slug: 'solucao',      label: 'Solução' },
] as const; // v1: lista fechada; ampliável por config sem migração de dados

export const RECORD_ID_REGEX = /^[a-f0-9]{8}$/;               // ex.: a81f2e7c
export const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const MEDIA_PATH_REGEX = /^(imagens|videos|miniaturas)\/[a-z0-9][a-z0-9._-]{0,100}\.[a-z0-9]{2,5}$/;
export const CURRENT_DOC_VERSION = 1;
```

Validação adicional de data: precisa ser data real (rejeitar 2026-02-31), ano entre 2000 e 2100.

## 7.2 Schemas do documento (Zod, em `packages/shared/src/schema/`) — contrato canônico

Tipos obrigatórios exportados: `RecordDocument`, `RecordBlock`, `InlineNode`, `RecordMedia`, `RecordTag`, `RecordAuthor`, `RecordMetadata` (linha do índice), `RecordSummary` (item de lista).

```ts
// Inline (texto rico sem HTML)
type Mark =
  | { type: 'bold' } | { type: 'italic' } | { type: 'underline' } | { type: 'code' }
  | { type: 'link'; href: string };            // href validado: http, https ou mailto
type InlineNode =
  | { type: 'text'; text: string; marks?: Mark[] }   // text: 1..5000
  | { type: 'break' };                               // quebra de linha

// Blocos (todos têm id estável, 10 caracteres [a-z0-9])
type RecordBlock =
  | { id: string; type: 'heading'; level: 2 | 3; content: InlineNode[] }   // "Título" = 2, "Subtítulo" = 3
  | { id: string; type: 'paragraph'; content: InlineNode[] }
  | { id: string; type: 'list'; ordered: boolean; items: InlineNode[][] }  // v1: lista plana
  | { id: string; type: 'quote'; content: InlineNode[]; cite?: string }
  | { id: string; type: 'divider' }
  | { id: string; type: 'image'; mediaId: string; width: 'full' | 'half' } // 'half' consecutivos ficam lado a lado
  | { id: string; type: 'video'; source: 'upload'; mediaId: string }
  | { id: string; type: 'video'; source: 'external'; provider: 'youtube' | 'vimeo'; url: string; caption?: string }
  | { id: string; type: 'table'; header: boolean; rows: InlineNode[][][] } // linhas > células > inline; máx. 20x8
  | { id: string; type: 'callout'; variant: 'observation' | 'problem' | 'solution' | 'decision'; title?: string; content: InlineNode[] }
  | { id: string; type: 'code'; language?: string; text: string };        // text <= 20000

type RecordMedia = {
  id: string;                 // 10 caracteres
  kind: 'image' | 'video';
  path: string;               // RELATIVO à pasta do registro, ex.: "imagens/imagem-01.jpg" (MEDIA_PATH_REGEX)
  thumbPath?: string;         // ex.: "miniaturas/imagem-01.webp"
  originalName: string;       // nome original sanitizado para exibição
  mime: string;               // image/jpeg|png|webp ; video/mp4|webm|quicktime
  size: number;               // bytes do arquivo final enviado
  width?: number; height?: number; durationSec?: number;
  uploadedAt: string;         // ISO UTC
  caption?: string;           // legenda única (aparece no texto e na galeria)
  alt?: string;               // texto alternativo (obrigatório para imagens na UI; padrão = legenda ou "Imagem do registro")
};

type RecordDocument = {
  id: string;                 // RECORD_ID_REGEX
  version: 1;                 // CURRENT_DOC_VERSION
  status: 'published';        // 'draft' | 'archived' reservados (P2)
  modality: 'FLL' | 'OBR';
  date: string;               // "YYYY-MM-DD" — data OFICIAL do acontecimento
  title: string;              // 3..140
  summary: string;            // 0..500 (campo obrigatório na UI, pode ser curto)
  tags: string[];             // slugs de TAGS, máx. 8, sem repetição
  author: { name: string };   // 2..80
  coverMediaId: string | null;// null = automática (primeira imagem)
  content: RecordBlock[];     // máx. 500 blocos
  media: RecordMedia[];       // máx. por config (ex.: 40 imagens, 6 vídeos)
  gallery: string[];          // mediaIds em ordem de exibição na galeria
  createdAt: string;          // ISO UTC — instante da criação do registro
  updatedAt: string;          // ISO UTC — última edição
};
```

Regras de integridade (`superRefine`):

* Todo `mediaId` referenciado em blocos, `gallery` e `coverMediaId` DEVE existir em `media`, e o `kind` precisa ser coerente (bloco `image` -> mídia `image`).
* `ids` de blocos e mídias únicos; sem `..`, `/` inicial ou `\` em `path`/`thumbPath`; `path` casa com `MEDIA_PATH_REGEX`.
* `media` não referenciada em nenhum bloco nem na galeria é permitida (mídia "solta" na galeria), mas não pode ser duplicada em `gallery`.
* `date` válida; `tags` ⊆ `TAGS`; tamanho serializado do documento <= 512 KB.
* Nenhum campo pode conter HTML interpretável (o renderizador não o interpreta; ainda assim rejeitar `<script`).
* Documento com `version` maior que a suportada: erro "estrutura incompatível" (seção 17); menor: migrar (7.6).

## 7.3 Exemplo completo de `registro.json`

```json
{
  "id": "a81f2e7c",
  "version": 1,
  "status": "published",
  "modality": "OBR",
  "date": "2026-10-01",
  "title": "Testes de locomoção",
  "summary": "Testes de tração e curva no robô principal da OBR.",
  "tags": ["mecanica", "treino", "problema", "solucao"],
  "author": { "name": "Nome do integrante" },
  "coverMediaId": null,
  "content": [
    { "id": "b1x9k2m4qa", "type": "heading", "level": 2,
      "content": [{ "type": "text", "text": "Objetivo" }] },
    { "id": "c7p3d8w1ze", "type": "paragraph",
      "content": [
        { "type": "text", "text": "Hoje validamos a " },
        { "type": "text", "text": "tração nas rodas traseiras", "marks": [{ "type": "bold" }] },
        { "type": "text", "text": " depois da troca do motor." }
      ] },
    { "id": "d2n6v5r0ty", "type": "image", "mediaId": "m1a2b3c4d5", "width": "half" },
    { "id": "e9j4h7s2uk", "type": "image", "mediaId": "m6e7f8g9h0", "width": "half" },
    { "id": "f3q8z1l6xb", "type": "callout", "variant": "problem", "title": "Patinagem na curva",
      "content": [{ "type": "text", "text": "O robô perdeu aderência acima de 60% de potência." }] },
    { "id": "g5t2y9c4nm", "type": "callout", "variant": "solution",
      "content": [{ "type": "text", "text": "Trocamos o composto das rodas e reduzimos a aceleração inicial." }] },
    { "id": "h8w1a3d7pj", "type": "video", "source": "upload", "mediaId": "v1k2l3m4n5" }
  ],
  "media": [
    { "id": "m1a2b3c4d5", "kind": "image", "path": "imagens/foto-do-teste-01.jpg",
      "thumbPath": "miniaturas/foto-do-teste-01.webp", "originalName": "Foto do teste 01.jpg",
      "mime": "image/jpeg", "size": 412331, "width": 2048, "height": 1536,
      "uploadedAt": "2026-10-06T18:40:02Z", "caption": "Primeiro teste", "alt": "Robô na pista de testes" },
    { "id": "m6e7f8g9h0", "kind": "image", "path": "imagens/foto-do-teste-02.jpg",
      "thumbPath": "miniaturas/foto-do-teste-02.webp", "originalName": "Foto do teste 02.jpg",
      "mime": "image/jpeg", "size": 388120, "uploadedAt": "2026-10-06T18:40:09Z" },
    { "id": "v1k2l3m4n5", "kind": "video", "path": "videos/teste-locomocao.mp4",
      "thumbPath": "miniaturas/teste-locomocao.webp", "originalName": "teste locomoção.mp4",
      "mime": "video/mp4", "size": 18422011, "durationSec": 24,
      "uploadedAt": "2026-10-06T18:41:30Z", "caption": "Teste de locomoção" }
  ],
  "gallery": ["m1a2b3c4d5", "m6e7f8g9h0", "v1k2l3m4n5"],
  "createdAt": "2026-10-06T18:42:11Z",
  "updatedAt": "2026-10-06T19:31:42Z"
}
```

Observe: `date` = 2026-10-01 (quando aconteceu) e `createdAt` = 2026-10-06 (quando foi escrito). Isso é o caso normal e correto.

## 7.4 Regras de nomes (slug, pasta, arquivos) — implementadas em `shared/slug.ts` e testadas com unit tests

* **slugify(título):** NFD, remover diacríticos, minúsculas, trocar qualquer sequência fora de `[a-z0-9]` por `-`, aparar `-` nas pontas, limitar a 60 caracteres sem cortar no meio de palavra quando possível; se ficar vazio, usar `registro`. Exemplo: "Testes do robô principal" -> `testes-do-robo-principal`.
* **Pasta do registro:** `${modalidade_minuscula}/${YYYY-MM-DD}-${slug}`. Se já existir pasta igual (consultar banco: `folder_path` único), acrescentar `-${id.slice(0,5)}`. Exemplo final: `obr/2026-10-06-testes-de-locomocao-a81f2`.
* A pasta é IMUTÁVEL depois de criada (editar título ou data NÃO move arquivos). A fonte de verdade da data e do título é o JSON/banco, não o nome da pasta.
* **Nome de arquivo de mídia:** `{slug do nome original sem extensão | "imagem" | "video"}-{NN}.{ext}` onde `NN` é o próximo número livre de 2 dígitos para aquela base dentro do registro (o servidor decide consultando as mídias existentes). Extensão derivada do MIME validado, NUNCA do nome enviado. Sem espaços, acentos ou caracteres especiais. Exemplos: `foto-do-teste-01.jpg`, `teste-locomocao.mp4`.
* **Miniaturas:** `miniaturas/{mesmo-nome-sem-extensão}.webp` (largura máxima 480 px).
* O cliente jamais envia caminho: envia apenas `clientId`, tipo, nome original, MIME e tamanho.

## 7.5 Estrutura no Storage

Bucket único, privado: `hortobots-planning`. Dentro dele, FLL e OBR NUNCA se misturam.

```text
hortobots-planning/               (bucket)
├── fll/
│   └── 2026-10-06-testes-de-robos/
│       ├── registro.json
│       ├── imagens/    imagem-01.jpg, imagem-02.jpg, imagem-03.png
│       ├── videos/     teste-locomocao.mp4
│       └── miniaturas/ imagem-01.webp, teste-locomocao.webp
└── obr/
    └── 2026-10-06-testes-de-locomocao-a81f2/
        ├── registro.json
        ├── imagens/
        ├── videos/
        └── miniaturas/
```

(`miniaturas/` é um acréscimo ao esquema conceitual original, necessário para desempenho; registre em `docs/DECISOES.md`. A especificação original citava as raízes `hortobots-planning/` e `records/`; a decisão aqui é: bucket = `hortobots-planning`, objeto = `{fll|obr}/{pasta}/...`.)

Configuração do bucket (script `setup-storage.ts`): `public: false`; `fileSizeLimit` conforme limites; `allowedMimeTypes`: `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`, `video/quicktime`, `application/json`. Essa é uma validação REAL no servidor do Supabase além da validação da API.

## 7.6 Versionamento do formato

* `shared/migrate/index.ts` exporta `migrateDocument(raw: unknown): { doc: RecordDocument; migrated: boolean }`, com cadeia `v1 -> v2 -> ...`. Na v1 é identidade com validação.
* Documento com versão antiga lido pela API é migrado em memória e, ao próximo salvamento, regravado na versão atual.
* Testes: fixtures de versões antigas em `packages/shared/src/migrate/__fixtures__/`.
* `docs/FORMATO_REGISTRO.md` documenta cada versão.

## 7.7 Banco de dados (arquivo `supabase/migrations/0001_init.sql`)

Estratégia: texto de busca já NORMALIZADO pelo servidor (minúsculas, sem acentos) e salvo em `search_text`; o banco indexa esse texto com `tsvector` (config `portuguese`) e com trigramas (para termos curtos como "MPU" e buscas parciais). Isso evita funções não imutáveis em colunas geradas.

```sql
create extension if not exists pg_trgm with schema extensions;

create table public.records (
  id            text primary key check (id ~ '^[a-f0-9]{8}$'),
  modality      text not null check (modality in ('FLL','OBR')),
  status        text not null default 'pending' check (status in ('pending','published','deleting')),
  record_date   date not null,                      -- DATA OFICIAL (date do JSON)
  title         text not null check (char_length(title) between 3 and 140),
  summary       text not null default '' check (char_length(summary) <= 500),
  slug          text not null,
  folder_path   text not null unique,               -- ex.: obr/2026-10-06-testes-de-locomocao-a81f2
  json_path     text not null,                      -- folder_path || '/registro.json'
  cover_path    text,                               -- caminho completo no bucket (imagem de capa)
  cover_thumb_path text,
  tags          text[] not null default '{}',
  author_name   text not null default '',
  image_count   int  not null default 0,
  video_count   int  not null default 0,
  search_text   text not null default '',           -- normalizado (sem acento, minúsculo)
  doc_version   int  not null default 1,
  idempotency_key text,
  created_at    timestamptz not null default now(), -- instante técnico (igual ao createdAt do JSON)
  updated_at    timestamptz not null default now(), -- igual ao updatedAt do JSON (controle de concorrência)
  published_at  timestamptz,
  search_tsv    tsvector generated always as (to_tsvector('portuguese', coalesce(search_text,''))) stored
);

create index records_cal_idx   on public.records (modality, record_date desc, created_at desc) where status = 'published';
create index records_status_idx on public.records (status, created_at);
create index records_tags_idx  on public.records using gin (tags);
create index records_tsv_idx   on public.records using gin (search_tsv);
create index records_trgm_idx  on public.records using gin (search_text extensions.gin_trgm_ops);
create unique index records_idem_idx on public.records (idempotency_key) where idempotency_key is not null;

create table public.audit_logs (
  id        bigint generated always as identity primary key,
  at        timestamptz not null default now(),
  action    text not null check (action in ('create','update','delete','import','export','cleanup')),
  record_id text,
  modality  text,
  title     text,                    -- snapshot (o registro pode deixar de existir)
  actor     text,                    -- nome informado ou usuário futuro
  details   jsonb not null default '{}'::jsonb
);
create index audit_logs_at_idx on public.audit_logs (at desc);

alter table public.records    enable row level security;
alter table public.audit_logs enable row level security;
-- SEM políticas: anon/authenticated não acessam nada. Só a API (Service Role) lê/escreve.
```

Ajuste o nome do schema das extensões se o seu projeto instalar `pg_trgm` em outro schema. Tabelas futuras (P2, NÃO criar agora): `record_media`, `record_tags`, `record_revisions`, `profiles` (papéis).

Função RPC de busca (`public.search_records`), a ser escrita pelo agente em SQL, com assinatura e regra:

```text
search_records(p_modality text, p_q text, p_from date, p_to date, p_media text, p_tags text[],
               p_sort text, p_limit int, p_offset int)
returns setof records + total_count
```

* Só `status = 'published'`.
* `p_q` já normalizado pela API. Condição: `search_tsv @@ websearch_to_tsquery('portuguese', p_q)` OU `search_text ilike '%' || p_q || '%'` (trigramas). Pesquisar "MPU" e "locomoção" devem funcionar (exercite como teste de integração).
* Filtros: modalidade; período por `record_date`; mídia (`all|images|videos|none` usando `image_count`/`video_count`); tags (`tags && p_tags` ou `@>` conforme modo "qualquer/todas", padrão qualquer).
* Ordenação: `recent` = `record_date desc, created_at desc`; `oldest` = `record_date asc, created_at asc`; `alpha` = `title asc`; se há `p_q` e `p_sort = 'relevance'`, usar `ts_rank` desc.
* Paginação por `limit/offset` (v1) com `total_count`.

## 7.8 Texto de busca (`search_text`) — construído pela API em `shared/text.ts`

Concatenar e normalizar: título, resumo, nome da modalidade e sigla, data em formatos `2026-10-01`, `01/10/2026` e por extenso ("01 de outubro de 2026", "out"), rótulos das tags, texto de todos os blocos (inclusive células de tabela, títulos de caixas, código), legendas e nomes originais das mídias. Normalização: NFD sem diacríticos, minúsculas, espaços colapsados, limite de 100 mil caracteres.

## 7.9 Regras da capa

1. Se `coverMediaId` definido e existir (imagem ou miniatura de vídeo): usa.
2. Senão, a primeira imagem na ordem: primeiro bloco `image` do conteúdo; se não houver, a primeira imagem de `gallery`.
3. Se não houver nenhuma imagem: composição gráfica padrão da modalidade (logo + ornamento + carimbo), gerada no front.
A capa é denormalizada no banco (`cover_path`, `cover_thumb_path`) a cada salvamento. Aparece em lista, pesquisa, cards, painel do dia do calendário e página do registro.

---

# 8. API (Render Web Service)

## 8.1 Convenções

* Prefixo `/api`, JSON, UTF-8. Validação de entrada com Zod em toda rota (schemas em `shared/schema/api.ts`). Respostas de erro padronizadas (8.10).
* CORS permitindo apenas `WEB_ORIGIN`. `@fastify/helmet`. Rate limit global (ex.: 120/min/IP) e mais estrito em escrita (ex.: 30/min) e em tentativas de código de equipe (10/min).
* Corpo JSON máximo 1 MB (o documento tem limite de 512 KB). Nenhum endpoint recebe binários de mídia.
* `GET /api/health` (liveness; `?deep=1` consulta o banco e o bucket).
* IDs de registro validados por `RECORD_ID_REGEX`; modalidades por enum. Qualquer valor fora do formato retorna 400 ANTES de tocar em banco/Storage.
* Todo registro de log do servidor em JSON (pino), com `reqId`, sem dados sensíveis, sem emojis.

## 8.2 Endpoints

| Método e rota | Função | Observações |
|---|---|---|
| `GET /api/config` | Feature flags públicas, limites de upload, tags, `signedUrlTtl`. | Cacheável 60 s. O front lê no boot. |
| `GET /api/summary` | Por modalidade: total de registros, dias documentados, imagens, vídeos, registros no mês, último registro (id, título, data). | Alimenta a home. |
| `GET /api/records` | Lista paginada. Query: `modality`, `q`, `from`, `to`, `period` (today, week, month, year), `media` (all, images, videos, none), `tags`, `sort` (recent, oldest, alpha, relevance), `page`, `pageSize` (padrão 12, máx. 48). | Retorna `RecordSummary[]` com `coverThumbUrl` assinada em lote. Só `published`. |
| `GET /api/records/calendar` | Query: `modality`, `month=YYYY-MM`. Retorna `days: [{ date, count, items: [{id, title, coverThumbUrl?}] }]` (máx. 5 itens por dia, `count` total). | Usa `record_date`. |
| `GET /api/records/:id` | Registro completo: metadados do banco, `document` (JSON validado/migrado), `mediaUrls` (mapa `mediaId -> {url, thumbUrl, missing?}`), `etag = updatedAt`. | Lê `registro.json` do Storage. Se o JSON falhar na validação, 422 `INCOMPATIBLE_DOCUMENT`. |
| `POST /api/records/prepare` | Início do salvamento (criar ou editar). Corpo: `{ mode, recordId?, idempotencyKey, modality, date, title, expectedUpdatedAt?, media: [{clientId, kind, originalName, mime, size, hasThumb}] }`. Retorna `recordId`, `folderPath`, e `uploads: [{clientId, mediaId, path, thumbPath?, token, thumbToken?}]` com tokens de URL assinada de upload. | Cria linha `pending` (criar). Idempotente por `idempotencyKey`. |
| `POST /api/records/:id/commit` | Conclui. Corpo: `{ document, expectedUpdatedAt?, force? }`. | 8.3 passos 6 a 12. |
| `POST /api/records/:id/abort` | Cancela salvamento: apaga objetos enviados do rascunho de upload e remove linha `pending` (se criação). | Chamado quando o upload falha. |
| `DELETE /api/records/:id` | Exclui registro e arquivos. Corpo: `{ confirm: true, confirmText? }` (`confirmText === "EXCLUIR"` exigido quando `image_count + video_count >= DELETE_CONFIRM_THRESHOLD`). | 8.5. |
| `POST /api/records/:id/media-urls` | Reassina URLs expiradas. | Opcional. |
| `POST /api/auth/check` | Valida o código de equipe (8.8). | P0 se a trava estiver ativa. |
| `GET /api/admin/integrity` | Relatório de órfãos (8.9). | Protegido por `MAINTENANCE_TOKEN`. P1. |
| `POST /api/admin/cleanup` | Remove `pending` expirados (> 24 h) e conclui `deleting` travados. | Protegido por `MAINTENANCE_TOKEN`. P0. |
| `POST /api/records/import`, `GET /api/records/:id/export` | Respondem 501 `FEATURE_DISABLED` enquanto `ENABLE_IMPORT`/`ENABLE_EXPORT` forem falsos. | P2 (stubs com contrato definido). |

## 8.3 Fluxo de SALVAR (criação) — atômico do ponto de vista do usuário

O front só mostra "Registro salvo" depois do passo 12. Cada passo falho aciona o tratamento descrito.

1. **Cliente valida** o formulário e o documento com os schemas compartilhados (mensagens humanas por campo). Se inválido, não envia.
2. **Cliente processa mídia:** comprime/redimensiona imagens (5.10, 12.x), gera miniaturas WebP, captura quadro de vídeo como miniatura. Nada sai antes de passar nos limites.
3. **`POST /prepare`:** o servidor valida modalidade, data real, título, quantidade/tamanho/MIME declarados; gera `id` (4 bytes aleatórios em hex), slug, `folder_path` (com sufixo se colidir), `mediaId`s e caminhos finais; cria linha `pending` com `idempotency_key`; chama `createSignedUploadUrl` para cada arquivo e miniatura; devolve os tokens. Retentativa com a mesma `idempotencyKey` devolve o mesmo registro (sem duplicar).
4. **Upload direto** de cada arquivo com `uploadToSignedUrl` (até 3 em paralelo, 2 retentativas com backoff). Estado visível por arquivo: aguardando, enviando, concluído, erro. Progresso real é opcional (P1: XHR replicando o `uploadToSignedUrl`); no mínimo barra indeterminada com nome e tamanho.
5. **Se algum upload falhar definitivamente:** `POST /abort`, mantém o rascunho local intacto, exibe a mensagem de erro humana (seção 17).
6. **`POST /commit`:** servidor valida o documento com Zod, aplica `STRIP_EMOJI` se ligado, normaliza URLs/links, garante que todas as `media[].path` pertencem a objetos autorizados no `prepare` deste registro (nunca aceita caminho novo).
7. **Verificação dos objetos:** para cada mídia/miniatura, confere a existência e metadados no Storage (tamanho e MIME dentro do esperado); para imagens, lê os primeiros bytes e confirma a assinatura (magic bytes, `file-type`); vídeos idem por leitura parcial. Qualquer divergência: 422 `MEDIA_VERIFICATION_FAILED` e nada é publicado.
8. O servidor define `createdAt`/`updatedAt` (relógio do servidor, UTC) — o cliente não impõe esses campos.
9. **Escreve `registro.json`** com `upsert` e `contentType: application/json`, e **lê de volta** o tamanho/existência para confirmar.
10. **Atualiza o índice:** `update records set status='published', ... (capa, contagens, tags, search_text, datas, published_at)`.
11. **Auditoria:** insere linha em `audit_logs` (`create`).
12. **Responde** com o registro completo e `mediaUrls`. O front limpa o rascunho local e navega para a página do registro com o aviso "Registro salvo. O diário foi armazenado com sucesso."

Falha entre 9 e 10 (JSON gravado, índice não): o commit é idempotente; o cliente pode repetir. `audit-integrity` detecta "JSON sem índice".

## 8.4 Fluxo de EDITAR

Mesmo fluxo, com `mode: 'edit'` e `expectedUpdatedAt`:

* `prepare` só autoriza upload de MÍDIAS NOVAS (e miniaturas novas).
* `commit` compara `expectedUpdatedAt` com `records.updated_at`. Se diferente e `force` ≠ true: **409 `CONFLICT_UPDATED`** (8.7).
* Mídias removidas no editor NÃO são apagadas antes do sucesso. Depois de gravar o novo JSON e atualizar o índice, o servidor calcula o diff (mídias do JSON antigo que não existem no novo) e as remove do Storage; falhas de remoção são registradas em `audit_logs` (`cleanup`) e tratadas pela rotina de integridade.
* Atualiza `updatedAt`, JSON, índice, capa, contagens e `search_text`; preserva `createdAt`, `id`, `folder_path` e `modality` original (alterar modalidade antes de salvar é permitido apenas em CRIAÇÃO; em edição, mudar de FLL para OBR é uma operação de "mover" não suportada na v1 — o seletor fica bloqueado com explicação).

Nota: na criação, o seletor de modalidade vem pré-selecionado pela rota e pode ser alterado ANTES de salvar (o `prepare` usa a modalidade final).

## 8.4.1 Reabrir para edição

O editor carrega: metadados, `document`, URLs assinadas das mídias existentes (já enviadas, marcadas como "na nuvem") e restaura a ordem dos blocos, a galeria, a capa, a data e a modalidade.

## 8.5 Fluxo de EXCLUIR

1. Front: diálogo de confirmação (texto exato na seção 17). Se `image_count + video_count >= 3` (configurável), exige digitar `EXCLUIR`.
2. API valida `confirm`, localiza o registro e muda `status` para `deleting` (some de listas, calendário e busca imediatamente).
3. Lista recursivamente TODOS os objetos sob `folder_path/` (Storage lista por pasta; implementar `listAllObjects(prefix)` com paginação e recursão em `imagens/`, `videos/`, `miniaturas/`) e remove em lote.
4. Verifica que a listagem do prefixo ficou vazia.
5. Remove a linha de `records`; grava `audit_logs` (`delete`, snapshot de título/modalidade/data/contagens).
6. Responde sucesso -> toast "Registro excluído. O registro e suas mídias associadas foram removidos."
7. Se qualquer etapa falhar: a linha continua `deleting`; a resposta indica "exclusão parcial, tentaremos novamente" e `POST /api/admin/cleanup` conclui depois. Nunca deixar arquivo órfão silenciosamente.

## 8.6 Fluxo de LEITURA

1. Consultar `records` pelo `id` (+ `status = published`).
2. Baixar `json_path` do Storage (Service Role).
3. Validar com Zod; migrar se `version` antiga; checar coerência com o índice (data/título) e registrar divergência em log.
4. Assinar URLs (TTL padrão 3600 s) de todas as mídias e miniaturas em UMA chamada em lote (`createSignedUrls`). Mídia cujo objeto não existe recebe `missing: true`.
5. Responder `{ meta, document, mediaUrls, etag }`.
6. Front renderiza com `DiaryRenderer`. Mídia ausente mostra o placeholder "Mídia indisponível" sem quebrar a página (seção 17). `<img>` com erro de carregamento tenta reassinar uma vez.
7. Cache: TanStack Query com `staleTime` de 5 min para o documento e reassinatura antes de expirar o TTL (50 min). API pode manter pequeno cache LRU em memória por `id + updated_at`.

## 8.7 Concorrência (dois usuários editando)

* v1: otimismo com `updatedAt`. Se o commit chegar com `expectedUpdatedAt` desatualizado: 409 e o front abre diálogo com 3 opções: **Cancelar**, **Salvar como novo registro** (cópia com novo id; mídia reaproveitada por cópia no Storage ou reenviada), **Sobrescrever mesmo assim** (envia `force: true`). O conteúdo local nunca é descartado.
* Preparação futura: `record_revisions` guardando versões anteriores do JSON (P2).

## 8.8 Autenticação e permissões (arquitetura pronta, v1 simples)

* Módulo `auth/` expõe `getAuthContext(request): { user: { id, name } | null, role: 'ADMIN' | 'EDITOR' | 'VIEWER' }` e `can(role, action)` com a matriz:
  * ADMIN: criar, editar, excluir, gerenciar arquivos/manutenção.
  * EDITOR: criar, editar.
  * VIEWER: ler.
* **v1 (`ENABLE_AUTH=false`):** sem contas. Porém, como a API ficará na internet pública, a v1 inclui uma **trava de escrita opcional por código de equipe** (variável `WRITE_PASSCODE` no Render). Se definida, toda rota de escrita exige o cabeçalho `x-team-code` (comparação em tempo constante); o front pede o código uma vez ("Código da equipe") e guarda em `sessionStorage`/`localStorage`. Se `WRITE_PASSCODE` estiver vazia, a escrita é livre (apenas para desenvolvimento local; a API registra um aviso em log no boot de produção). A leitura continua livre dentro da aplicação, mas mídia só é servida por URL assinada. Quem tem o código = papel `ADMIN`.
* Fase futura (`ENABLE_AUTH=true`): Supabase Auth (e-mail/senha ou magic link), tabela `profiles(user_id, name, role)`, middleware que valida o JWT e resolve o papel; RLS permanece fechado (a API continua sendo a única porta). Nenhuma mudança de modelo de dados é necessária além de `profiles`.
* O nome do autor é um campo do formulário (lembrado como preferência local); no futuro vem do perfil.

## 8.9 Segurança e integridade no servidor

* **Path traversal:** o servidor nunca concatena strings recebidas do cliente em caminhos. Caminhos são construídos a partir de `modality` (enum), `date` validada, `slug` gerado, `mediaId` gerado. Função `assertSafeStoragePath(path)` rejeita `..`, `//`, `\`, caracteres de controle, prefixos fora de `fll/` ou `obr/` e qualquer coisa que não case com as regex.
* **Validação de arquivo:** extensão derivada do MIME; MIME na allowlist; tamanho dentro do limite; assinatura (magic bytes) coerente; SVG NÃO aceito na v1 (`ALLOW_SVG=false`; se habilitado no futuro exige sanitização).
* **Anti-XSS:** nenhum HTML é armazenado nem interpretado; links filtrados por protocolo; vídeo externo restrito a provedores allowlist (YouTube, Vimeo) convertidos em URL de embed canônica e exibidos em `<iframe sandbox="allow-scripts allow-same-origin allow-presentation" referrerpolicy="strict-origin-when-cross-origin" loading="lazy">`; qualquer outra URL vira link simples externo.
* **Segredos:** Service Role e `MAINTENANCE_TOKEN` só no ambiente do Render; `.env` no `.gitignore`; script de pre-commit procura padrões de chave; JSON nunca contém tokens nem URLs assinadas (somente caminhos relativos).
* **Cabeçalhos do site estático (CSP)** no `render.yaml`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' <URL_DA_API> https://*.supabase.co; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`, mais `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restritivo.
* **Auditoria de órfãos (`audit-integrity.ts` e `GET /admin/integrity`):** detecta (a) objeto no Storage sem linha no banco, (b) linha sem `registro.json`, (c) `registro.json` sem linha, (d) `media[].path` apontando para objeto inexistente, (e) objeto dentro da pasta do registro que não é referenciado pelo JSON, (f) linhas `pending` expiradas, (g) linhas `deleting` travadas. Saída em JSON/tabela; modo `--fix` apenas para casos seguros (f, g).

## 8.10 Erros: formato e mensagens

Formato: `{ "error": { "code": "CODE", "message": "mensagem humana em pt-BR", "fields"?: { campo: "mensagem" }, "reqId": "..." } }`.

Códigos: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT_UPDATED` (409), `PAYLOAD_TOO_LARGE` (413), `UNSUPPORTED_MEDIA` (415), `INCOMPATIBLE_DOCUMENT` (422), `MEDIA_VERIFICATION_FAILED` (422), `RATE_LIMITED` (429), `FEATURE_DISABLED` (501), `STORAGE_ERROR` (502), `INTERNAL` (500). A mensagem nunca expõe stack, SQL, caminhos internos ou nomes de chave. O detalhe técnico vai só para o log do servidor (e `console.error` no navegador, sem dados pessoais).

---

# 9. FRONTEND: ROTAS, TELAS E COMPONENTES

## 9.1 Rotas (React Router)

| Rota | Tela | Observações |
|---|---|---|
| `/` | Home (seleção de diário) | Capa. Introdução no primeiro acesso. |
| `/fll`, `/obr` | Hub da modalidade (cartões de ação) | Define `data-modality`. |
| `/fll/registros`, `/obr/registros` | Registros salvos (Calendário ou Lista) | Estado na URL: `?vista=calendario|lista&mes=2026-10&dia=2026-10-01&q=&ordem=&periodo=&de=&ate=&midia=&tags=&pagina=`. |
| `/fll/registro/:id`, `/obr/registro/:id` | Visualização do registro | Se a modalidade do `id` divergir da rota, redireciona para a correta. |
| `/fll/novo`, `/obr/novo` | Novo registro | Aceita `?data=YYYY-MM-DD` para pré-preencher a data (usado pelo calendário). |
| `/fll/registro/:id/editar`, `/obr/registro/:id/editar` | Edição | Mesmo editor. |
| `/:mod/testes` | Área de testes | DESLIGADA: com `ENABLE_TEST_AREA=false` a rota nem é registrada; qualquer acesso cai em 404. |
| `*` | 404 | Mascote + "Página não encontrada" + botão para voltar ao início. |

Parâmetro de modalidade inválido (diferente de `fll`/`obr`) -> 404. Carregar módulos pesados (editor/TipTap) com `React.lazy` e `Suspense`, para o bundle inicial da Home ficar <= 250 KB gzip.

## 9.2 Home (`/`) — inspirada em `Tela_Inicial.png`

Camadas, de trás para frente:

1. Fundo `fundo.png` (versão otimizada; mobile usa `fundo-mobile`), cobrindo a tela.
2. `Logo.png` ("HORTOBOTS PLANNING") grande, centralizado no topo (largura ~ 45% da tela no desktop, 80% no mobile), `fetchpriority="high"`, com `alt="Hortobots Planning"`.
3. Texto principal logo abaixo: "Nosso diário. Nossa história. Nosso processo." em Barlow Condensed itálico, branco; subtítulo "ESCOLHA O DIÁRIO" em versaletes.
4. Dois cartões grandes lado a lado (empilhados no mobile), no estilo dos botões enviados (moldura grossa colorida, cantos muito arredondados, título em Alegreya SC no topo, painel de papel interno):
   * **FLL:** moldura verde `--primary-fll`; painel de papel com `fll_team_logo` (transparente); título "Hortobots FLL"; linha "N registros" e "Último registro: 06 OUT 2026 - Título"; botão "Acessar diário".
   * **OBR:** moldura vermelha `--primary-obr`; `obr_team_logo`; mesmos campos.
   * Dados vêm de `GET /api/summary`. Se zero registros: "Nenhum registro ainda" (sem emoji). Skeleton no carregamento. Cartão inteiro é um `<a>`/botão com foco visível; hover conforme 5.8.
5. `mascote` (transparente) no canto inferior direito, ocupando ~ 22% da altura da tela no desktop, parcialmente sobreposto ao canto do cartão da direita como na referência; escondido ou reduzido em telas < 480 px se cobrir conteúdo; `aria-hidden` (decorativo) ou `alt="Mascote da equipe Hortobots: lagarto de chapéu"` uma única vez.
6. Rodapé centralizado: "Diário de Bordo - HORTOBOTS" em Open Sans itálico negrito branco.

Primeiro acesso (flag `hp:intro-seen` em `localStorage`): sobreposição breve ocupando a tela com `Logo.png` e as linhas "Registre." / "Organize." / "Documente." / "Construa a história da equipe." surgindo em sequência (total <= 3 s), botão "Entrar" e opção de pular; respeita `prefers-reduced-motion`; não reaparece depois. Depois revela "ESCOLHA O DIÁRIO" com os cartões.

Cabeçalho da Home: mínimo (sem barra pesada): no canto, alternador de tema e link "Sobre". Não existe "Simulações e Testes".

## 9.3 Hub da modalidade (`/fll`, `/obr`) — inspirada em `Tela_Inicial.png`

* Mesma cenografia de capa (variante vermelha em OBR), `Logo.png` pequeno no topo, e o logo da equipe da modalidade (`fll_team_logo`/`obr_team_logo`) com o rótulo "HORTOBOTS FLL" / "HORTOBOTS OBR" e "Diário de Bordo".
* Dois cartões de ação, usando as imagens enviadas como cartões clicáveis, centralizados e responsivos (no mobile, empilhados em largura ~ 85%):
  * `novo_registro_button.png` -> `/:mod/novo`
  * `registros_salvos_button.png` -> `/:mod/registros`
* O terceiro cartão (`simulacoes_e_testes_button.png`) NÃO é renderizado. O layout é pensado para 2 cartões e deve poder voltar a 3 apenas via flag.
* Abaixo dos cartões (P1): faixa "Últimas páginas" com os 3 registros mais recentes (cartões `tile` com capa) e contagem de registros da modalidade.
* Banner "Encontramos um rascunho não salvo." (com "Continuar edição" e "Descartar rascunho") quando houver rascunho local da modalidade (seção 9.9).
* Botão "Trocar de diário" (volta para `/`) e indicador visível da modalidade atual.
* Estado vazio da modalidade (zero registros): cartão com ilustração + texto de 17.
* Rodapé "Diário de Bordo - HORTOBOTS".

## 9.4 Registros salvos (`/:mod/registros`) — inspirada em `Tela_Registros_salvos.png`

Barra superior da tela (dentro do diário): **alternador segmentado "Calendário | Lista"** (estado selecionado inequívoco: preenchido com a cor da modalidade e `aria-pressed`/`role="tablist"`), ordenação, botão "Filtros" e campo de busca (também no cabeçalho global).

### Vista Calendário (padrão)

Desktop (>= 1100 px): à esquerda o **bloco de calendário de mesa** (`DeskCalendar`); à direita a **folha do dia** (`DayPanel`), como na referência.

`DeskCalendar` (componente próprio, NÃO biblioteca):

* Aparência de bloco de mesa: topo na cor da modalidade com dois anéis metálicos (SVG), sombra suave, papel com grade fina e linhas; cantos arredondados (`--radius-page`).
* Cabeçalho com mês e ano em caixa alta (ex.: "OUTUBRO 2026"), botões anterior/próximo mês, botão "Hoje", e seletor rápido de mês/ano (para navegar anos de acervo).
* Grade com colunas `DOM SEG TER QUA QUI SEX SÁB` (semana começa no domingo) e **até 6 linhas** (a referência mostra 5; meses que exigem 6 devem caber sem estourar).
* **Dia com registro = "página marcada":** dobra no canto superior direito, etiqueta com a contagem quando houver 2 ou mais, cor da modalidade (registros de outra modalidade aparecem com a cor dela quando a busca está em "Todas"), pequeno traço de lápis sob o número. Dia de hoje: anel/contorno. Dia selecionado: preenchimento. Dias fora do mês: atenuados e não clicáveis.
* Dia com registro é clicável e seleciona o dia; dia sem registro também seleciona (para o painel oferecer "Criar registro nesta data").
* Dados: `GET /api/records/calendar?modality=&month=`; cache por mês; pré-carregar mês vizinho.
* **Acessibilidade:** `role="grid"`; cada célula `role="gridcell"` com `aria-label` como "01 de outubro de 2026, 2 registros"; navegação por setas, `Home`/`End`, `PageUp`/`PageDown` (mês), `Enter`/`Espaço` seleciona; foco visível.
* **Mobile:** células altas para toque, indicador de quantidade como ponto numerado, e o `DayPanel` abre como painel inferior (bottom sheet) deslizável.

`DayPanel` (folha do dia):

* Título da data por extenso no formato da referência: "06 de Outubro de 2026" (mês capitalizado), subtítulo "N registros neste dia".
* Lista de registros do dia (cartões compactos: capa, título, modalidade, resumo, tags, indicadores de mídia). Clique abre o registro.
* Sem registros: "Nenhum registro neste dia." + botão "Criar registro nesta data" (vai a `/:mod/novo?data=YYYY-MM-DD`).
* Mês inteiro sem registros: mensagem do estado vazio da modalidade.

### Vista Lista

* Lista cronológica vertical, padrão "mais recente primeiro". Ordenação: "Mais recente", "Mais antigo", "Ordem alfabética" (e "Relevância" quando há busca).
* Item = cartão horizontal: bloco de data à esquerda ("06 / OUT / 2026" em Barlow Condensed), capa em miniatura, título, carimbo da modalidade, resumo (2 linhas com reticências), tags, indicadores de imagens e vídeos (ícones + contagem). Agrupamento visual por mês opcional (P1).
* Paginação incremental (infinite query, 12 por vez) com botão "Carregar mais registros" sempre disponível e `IntersectionObserver` opcional. Nunca carregar tudo.
* Cartão (`RecordCard`) segue o esquema de 58: capa (ou composição padrão), data, título, modalidade, resumo, tags, indicadores.

## 9.5 Editor de registro (`/:mod/novo` e `/:mod/registro/:id/editar`) — inspirado em `Tela_Novo_Registro.png`

### Composição desktop (>= 1100 px): livro aberto

* Fundo de mesa; `Logo.png` pequeno no canto superior direito; rodapé "Diário de Bordo - HORTOBOTS".
* **Fita superior (ribbon)** acima do livro: caminho ("Novo registro - FLL" / "Editar registro - OBR"), indicador de rascunho ("Rascunho salvo localmente às 15:42"), botões: "Pré-visualizar" (alterna o corpo para `DiaryRenderer`), "Cancelar" (terciário, confirma se houver mudanças) e **"SALVAR REGISTRO"** (primário, cor da modalidade, único botão de destaque).
* **Folha esquerda (texto):** cantos `--radius-page`, pauta, margem vermelha, marcas de corte, clipe no canto, espiral na lombada. Conteúdo, de cima para baixo:
  1. Cabeçalho da página: carimbo da modalidade + "HORTOBOTS FLL / DIÁRIO DE BORDO" e, à direita, a data por extenso.
  2. **Data** (obrigatória): campo com máscara `dd/mm/aaaa` + botão que abre calendário em popover (reutiliza a grade do `DeskCalendar` em modo compacto); no celular usa `<input type="date">` nativo. Valor padrão: hoje (fuso São Paulo) ou `?data=`. Dica fixa abaixo: "Esta é a data do acontecimento, não a data de hoje." Exibição grande centralizada, como em "06 de Outubro de 2026" da referência.
  3. **Título** (obrigatório, 3 a 140): campo grande em Barlow Condensed caixa alta, com contador.
  4. **Modalidade:** segmentado FLL/OBR com logos, pré-selecionado pela rota, alterável antes de salvar (bloqueado na edição, com explicação).
  5. **Resumo** (obrigatório, até 500): "subtítulo" da referência; campo curto com contador, placeholder "O que aconteceu, em uma frase."
  6. **Tags** (multi-seleção em chips, máx. 8) e **Autor** (texto, lembrado como preferência).
  7. **Corpo (editor rico)** na área pautada.
  8. Rodapé da página: "FOLHA 01" e a marca de página.
* **Folha direita (galeria de mídia):** grade 2 colunas x 4 linhas = **8 slots por folha**, slots vazios com ícone tracejado de imagem (como na referência), clique ou arrastar abre seletor/aceita arquivos. Setas laranja (`--accent-arrow`) nas bordas laterais do livro para virar a folha da galeria (desabilitadas com <= 8 itens ou no limite). Indicador "Folha 1 de 2". Botões "Adicionar imagens" e "Adicionar vídeo". Cada miniatura: legenda (edita em diálogo), remover, definir como capa (ícone de marcador/bookmark Lucide), inserir no texto, reordenar (arrastar OU botões "mover para trás/frente" para teclado), indicador de vídeo (ícone Play + duração) e estado de upload (na nuvem / pendente local / erro).
* A galeria é parte do registro (`gallery` no JSON), na ordem mostrada.

### Composição tablet/celular

Folha única: cabeçalho de campos recolhível (resumo dos metadados com botão "Editar dados"), corpo pautado em largura total, barra de ferramentas fixa acima do teclado (rolável na horizontal), galeria como seção abaixo ("Galeria") com setas "Anterior/Próxima", botão flutuante "Salvar" e menu "Mais".

### Editor rico (TipTap, UI de edição; modelo salvo é o NOSSO)

Aparência de diário: pauta com `--line-height-paper`, margem esquerda vermelha, cabeçalho e rodapé de página, tipografia 17 a 18 px. NÃO pode parecer `<textarea>`.

Funções obrigatórias (P0):

* Parágrafos; Título (nível 2) e Subtítulo (nível 3); negrito, itálico, sublinhado; lista com marcadores; lista numerada; citação; separador; link (diálogo com validação http/https/mailto); código (inline e bloco); tabelas pequenas (inserir 2x2 até 20x8, adicionar/remover linha e coluna, linha de cabeçalho opcional); caixas Observação, Problema, Solução e Decisão (título opcional + texto); imagem; vídeo; desfazer/refazer.
* **Menu de barra (`/`)** para inserir blocos por teclado e botão "+" na margem de cada linha vazia.
* **Mover bloco** para cima/baixo por botões acessíveis (e arrastar por alça quando disponível).
* **Atalhos:** Ctrl/Cmd+B/I/U/K, Ctrl/Cmd+Z/Shift+Z, Ctrl/Cmd+S (salvar rascunho local e, se válido, abre confirmação de "SALVAR REGISTRO").
* **Imagens:** botão (abre seletor múltiplo), arrastar e soltar sobre o editor ou sobre a galeria, colar (Ctrl/Cmd+V com imagem na área de transferência). Ao inserir: pré-visualização imediata (Blob URL), compressão, miniatura, adição à lista `media` com `id`, nome original, tipo, tamanho e data. Controles do bloco: largura (inteira/metade), legenda, texto alternativo (campo próprio; aviso se vazio), remover (remove o bloco; a mídia sai do registro se não estiver mais usada na galeria — perguntar), "mostrar na galeria".
* **Vídeos:** diálogo com duas abas — "Enviar arquivo" (MP4/WebM/MOV, limites de 12.1) e "Link do YouTube ou Vimeo". Upload: miniatura capturada do primeiro quadro, duração lida do metadado. Link: validar provider, extrair ID, guardar `provider` + `url` canônica. Na visualização, o vídeo aparece no ponto exato em que foi inserido (não vira anexo).
* **Conversores** em `editor/convert/`: `tiptapToBlocks(json) -> RecordBlock[]` e `blocksToTiptap(blocks) -> json`, com testes de ida e volta (round-trip) para todos os tipos de bloco. Marcas e nós desconhecidos são descartados com aviso em log, nunca viram HTML.

### Validação e salvamento na tela

* Botão **SALVAR REGISTRO** valida tudo (Zod): título, data real, resumo, autor, pelo menos um bloco de conteúdo OU resumo (registro vazio não é permitido), limites de mídia. Erros em linha, resumo de erros no topo e foco no primeiro campo inválido. Mensagens humanas (seção 17).
* Durante o salvamento: tela/modal bloqueante "SALVANDO REGISTRO..." com etapas ("Preparando", "Enviando mídia 2 de 5", "Gravando o diário", "Atualizando o índice"), botões desabilitados (impede cliques duplicados; `idempotencyKey` reforça).
* Sucesso: redireciona para o registro, toast "Registro salvo." + "O diário foi armazenado com sucesso."
* Falha: mantém tudo na tela e no rascunho local; mensagem do item 54 (seção 17); botão "Tentar novamente".
* Sair com alterações não salvas: bloqueio de navegação (React Router blocker) + `beforeunload`.
* Conflito 409: diálogo da seção 8.7.

## 9.6 Visualização do registro (`/:mod/registro/:id`)

Desktop (>= 1100 px): livro aberto:

* **Folha esquerda:** cabeçalho com carimbo da modalidade, "HORTOBOTS FLL/OBR" e "DIÁRIO DE BORDO", data do registro por extenso e destacada (ex.: "01 de Outubro de 2026"), título em caixa alta, linha divisória, resumo, tags (chips), autor; em seguida o conteúdo renderizado (`DiaryRenderer`), largura de leitura limitada (~ 68 caracteres), pauta e margem. Rodapé "FOLHA 01".
* **Folha direita:** galeria em grade 2x4 por folha com setas laranja para virar a folha; clique abre o lightbox.
* **Informações da atividade:** abaixo do título, linha discreta com "Data do registro: 01/10/2026" e, em fonte manuscrita pequena (`Caveat`): "Registrado no sistema em 06/10/2026 às 18:42" e, se houver, "Editado em 06/10/2026 às 19:31". Isso evita confundir data do acontecimento com data de criação.
* **Fita de ações:** "Editar" (secundário), menu "Mais" contendo "Copiar link" (P1) e **"EXCLUIR REGISTRO"** (perigo, tom vermelho de alerta distinto do vermelho OBR: rótulo e ícone `Trash2`, nunca apenas cor), "Imprimir" (P2, folha de estilo de impressão já pronta).
* **Navegação entre registros:** "Registro anterior" / "Próximo registro" por ordem cronológica dentro da modalidade (P1). Para isso `GET /api/records/:id` também devolve `neighbors: { prevId, nextId }` (consulta por `record_date, created_at`).
* Tablet/celular: folha única; galeria abaixo do texto como "Galeria".
* Se o documento for incompatível (422): tela amigável com a mensagem de 17 e botão de voltar; nunca estourar erro.
* Capa: aparece no topo da folha (imagem de capa ou composição padrão da modalidade) e nas listas/cards.

## 9.7 `DiaryRenderer` (pasta `renderer/`) — componente central

Assinatura: `<DiaryRenderer doc={RecordDocument} mediaUrls={MediaUrlMap} mode="read" | "preview" />`.

Regras:

1. Recebe SOMENTE o documento validado (nunca HTML). Itera `content` e renderiza um componente por tipo (`HeadingBlock`, `ParagraphBlock`, `ListBlock`, `QuoteBlock`, `DividerBlock`, `ImageBlock`, `VideoBlock`, `TableBlock`, `CalloutBlock`, `CodeBlock`). Um `switch` exaustivo (checagem `never`) garante que novos tipos exijam implementação.
2. Texto inline: `InlineRenderer` converte `marks` em `<strong>`, `<em>`, `<u>`, `<code>`, `<a rel="noopener noreferrer nofollow" target="_blank">` (somente protocolos permitidos), `break` em `<br>`.
3. Imagens consecutivas com `width: "half"` formam uma linha de duas; `figure` + `figcaption`; `loading="lazy"`, `decoding="async"`, `aspect-ratio` reservado quando `width/height` conhecidos; clique abre o lightbox na posição correta.
4. Vídeo `upload`: `<video controls preload="none" playsInline poster={thumb}>`; `external`: `<iframe sandbox=...>` do provedor allowlist; ambos com legenda e dentro de `figure`.
5. Mídia ausente (`missing`) ou erro de carga: placeholder "Mídia indisponível" com ícone, mantendo a página.
6. Tabelas rolam horizontalmente em contêiner próprio (`overflow-x: auto`) com cabeçalho semântico (`<th scope>`).
7. Caixas: ícone SVG + rótulo textual + borda característica (5.4).
8. Estilo da modalidade herdado por variáveis CSS; o mesmo componente é usado no editor (modo `preview`) e na leitura (compartilham modelo e estilos).
9. Print CSS: oculta chrome do app, mantém folha e galeria em sequência (base para exportar PDF no futuro).
10. Testes: snapshot por bloco, teste de que `<script>` e HTML em texto aparecem como texto literal, teste de links `javascript:` bloqueados.

## 9.8 Galeria e lightbox (`gallery/`)

* `GalleryGrid`: 8 itens por folha (2 colunas x 4 linhas desktop; 2 colunas mobile), ordem original, miniaturas (`thumbUrl`), legenda truncada, selo de vídeo (Play + duração), `loading="lazy"`.
* `Lightbox` acessível (Radix Dialog): imagem ampliada, legenda e `alt`, contador "3 de 12", setas na tela e no teclado, `Esc` fecha, `Home`/`End`, deslizar no toque, foco aprisionado e devolvido ao fechar, pré-carga das vizinhas; vídeos tocam dentro dele. Mesma ordem da galeria; imagens incorporadas no texto e galeria formam a mesma sequência (galeria primeiro, depois as demais na ordem do texto, sem duplicar).

## 9.9 Rascunhos locais, autosave e recuperação (IndexedDB, via `idb`)

* Banco `hortobots-planning`, store `drafts`, chave `${modalidade}:${recordId|'novo'}` (um rascunho de "novo" por modalidade; vários rascunhos de edição por registro).
* Conteúdo do rascunho: metadados do formulário, documento em blocos (JSON), lista de mídias PENDENTES com seus Blobs já comprimidos e miniaturas, `baseUpdatedAt` (para edições), `savedAt`, `schemaVersion` do rascunho.
* **Autosave:** debounce de 2 s após qualquer mudança, mais salvar em `visibilitychange`, `pagehide` e troca de rota. Indicador "Rascunho salvo localmente às HH:mm" (relógio local). O autosave NÃO substitui "SALVAR REGISTRO" e NUNCA grava no servidor.
* Pedir armazenamento persistente (`navigator.storage.persist()`), monitorar cota (`estimate()`) e avisar ao se aproximar do limite ("O espaço deste dispositivo está acabando. Salve o registro na nuvem."). Falha de escrita no IndexedDB não pode derrubar o editor: mostrar aviso discreto.
* **Recuperação:** ao abrir `/novo`, `/editar` ou o Hub e existir rascunho: diálogo/banner "Encontramos um rascunho não salvo." com "Continuar edição" e "Descartar rascunho" (descartar pede confirmação). Em edição, se o `updatedAt` do servidor for mais novo que o `baseUpdatedAt` do rascunho, avisar: "Este registro foi alterado depois que o rascunho foi criado."
* Após salvar com sucesso: apagar o rascunho correspondente.
* Rascunhos ficam só no navegador (decisão registrada): o registro oficial só existe na nuvem depois de salvar. Estrutura preparada para `status: 'draft' | 'archived'` na nuvem no futuro (P2).
* Menu de configurações lista "Rascunhos neste dispositivo" (P1) com abrir/descartar.

## 9.10 Estados de carregamento, vazio e erro

* **Carregamento de rota:** skeletons em formato de página (linhas de pauta pulsando de forma discreta). **Boot da aplicação** e espera maior que 600 ms: tela especial com mascote (balanço suave) e o texto "CARREGANDO DIÁRIO...". Cold start da API > 4 s: mensagem de 4.4.
* **Operações:** "SALVANDO REGISTRO...", "EXCLUINDO REGISTRO...", "ENVIANDO MÍDIA...". Botões desabilitados enquanto pendentes.
* **Vazios:** textos exatos na seção 17, com ilustração vetorial e mascote (somente em vazios principais). Resultado de busca sem itens: "Nenhum registro encontrado." + sugestão de limpar filtros.
* **Erros:** `ErrorBoundary` por rota; mensagem humana + "Tentar novamente"; detalhe técnico apenas em `console.error`. Offline: faixa "Você está sem conexão." (leitura em cache continua; salvar desabilitado; rascunhos continuam).
* **Toasts** acessíveis (`role="status"`/`aria-live="polite"`), sem emoji, ícone Lucide por tipo, fechamento por teclado, duração 5 s (erros ficam até fechar).

## 9.11 Cabeçalho do diário, menu e navegação móvel

Cabeçalho (sempre faixa escura com linha inferior na cor da modalidade, nos dois temas):

* Esquerda: `Logo.png` pequeno (link para `/`), divisor, logo da modalidade, "HORTOBOTS FLL" ou "HORTOBOTS OBR" e, abaixo, "Diário de Bordo".
* Centro/direita: botões **"+ Novo Registro"** (primário; o "+" é ícone SVG `Plus`), **"Calendário"**, **"Todos os Registros"**, campo de pesquisa (ícone `Search`), menu de configurações (ícone `Settings`).
* Menu de configurações: Tema (Claro, Escuro, Sistema); Papel no tema escuro (Claro, Escuro); Reduzir animações; Código da equipe (alterar/sair); Nome padrão do autor; Rascunhos neste dispositivo; "Trocar de diário"; Sobre (versão da aplicação, link para o repositório se houver). Nenhum item "Testar".
* O botão "Novo Registro" está SEMPRE acessível dentro da modalidade (cabeçalho no desktop, botão flutuante e barra inferior no mobile).
* **Mobile:** cabeçalho compacto (logo da modalidade + título curto + botão de menu); barra inferior fixa com "Novo", "Calendário", "Lista", "Buscar" e "Mais"; busca abre em tela cheia.
* Fluxo ideal de navegação (poucos cliques): Home -> FLL/OBR -> Calendário ou Lista -> Dia -> Registro; ou Home -> FLL/OBR -> Pesquisar -> Registro.

## 9.12 Pesquisa e filtros

* **Busca:** campo no cabeçalho; ao digitar (debounce 300 ms) ou Enter, vai para `/:mod/registros?vista=lista&q=...`. Atalho `/` foca a busca; `Esc` limpa. A API normaliza (minúsculas, sem acentos) e procura em: título, resumo, conteúdo, legendas, tags, modalidade e data. Reconhece datas digitadas (`01/10/2026`, `2026-10-01`) como filtro de data exata. Termos curtos como "MPU" funcionam. Destacar o termo nos resultados (P1).
* **Filtros** (painel "Filtros", popover no desktop, gaveta no mobile): Modalidade (Todas, FLL, OBR; padrão = modalidade atual), Período (Hoje, Esta semana, Este mês, Este ano, Intervalo personalizado — semana começa no domingo, igual ao calendário), Tipo de mídia (Todos, Com imagens, Com vídeos, Sem mídia), Tags (multi-seleção), Ordem (Mais recente, Mais antigo, Ordem alfabética; Relevância se há busca).
* Filtros ativos aparecem como chips removíveis e "Limpar filtros". Estado inteiro na URL (compartilhável, funciona com o botão voltar).
* "Hoje/Esta semana/Este mês/Este ano" calculados no fuso `America/Sao_Paulo`, aplicados sobre `record_date`.

## 9.13 Hierarquia de botões (não tornar tudo chamativo)

* **Primário (um por tela):** "NOVO REGISTRO" e "SALVAR REGISTRO" — preenchimento `--primary`, texto `--on-primary`.
* **Secundário:** "EDITAR", "CALENDÁRIO"/"LISTA" (segmentado), "Filtros" — contorno de 2 px na cor da modalidade, fundo transparente.
* **Terciário:** "Cancelar", "Limpar filtros", links — apenas texto sublinhado ao foco/hover.
* **Perigo:** "EXCLUIR REGISTRO" — contorno em vermelho de alerta com ícone e rótulo; só vira preenchido dentro do diálogo de confirmação.
* **Ícone:** pesquisar, configurações, fechar — com `aria-label` e tooltip.
* Todos: foco visível de 3 px, alvo de toque >= 44 px, estado desabilitado claro, estado de carregamento com spinner SVG.

---

# 10. REQUISITOS FUNCIONAIS (RF)

Legenda: P0 obrigatório, P1 esperado, P2 apenas estrutura. Cada RF deve ter ao menos um teste (seção 15).

## 10.1 Navegação e identidade

* **RF-01 (P0)** Home com `Logo.png`, tagline, dois cartões (FLL e OBR) com logo da equipe, total de registros e último registro, e botão "Acessar diário".
* **RF-02 (P0)** Introdução de primeiro acesso (uma única vez) e "ESCOLHA O DIÁRIO".
* **RF-03 (P0)** Hub por modalidade com cartões `novo_registro_button.png` e `registros_salvos_button.png`; "Simulações e Testes" NÃO aparece.
* **RF-04 (P0)** Modalidade ativa evidente em toda a interface (cor, logo, carimbo, rótulo, linha do cabeçalho) e atributo `data-modality` controlando as variáveis.
* **RF-05 (P0)** Cabeçalho do diário com logo, rótulo "HORTOBOTS FLL/OBR", "Diário de Bordo", Novo Registro, Calendário, Todos os Registros, pesquisa e configurações.
* **RF-06 (P0)** Rotas da seção 9.1, 404 amigável, redirecionamento quando a modalidade da URL diverge do registro.
* **RF-07 (P0)** Tema claro/escuro/sistema sem flash; preferência persistida.

## 10.2 Criar, editar, excluir

* **RF-10 (P0)** Criar registro com data manual (calendário + máscara), título, modalidade, resumo, tags, autor e conteúdo em blocos.
* **RF-11 (P0)** A data informada é a oficial e nunca é substituída pela data de upload/criação (testar com data passada e verificar `date` x `createdAt`).
* **RF-12 (P0)** Editor rico com todos os blocos da seção 9.5; conversão bidirecional sem perda.
* **RF-13 (P0)** Inserir, pré-visualizar, legendar, reordenar e remover imagens (seleção, arrastar, colar).
* **RF-14 (P0)** Inserir vídeos por upload ou por link (YouTube/Vimeo), posicionados no ponto exato do texto.
* **RF-15 (P0)** Galeria do registro (8 por folha) com ordem, legenda, capa e lightbox.
* **RF-16 (P0)** Botão SALVAR REGISTRO executa o fluxo da seção 8.3 inteiro e só confirma após persistência.
* **RF-17 (P0)** Editar registro existente carrega tudo (dados, blocos, mídia, ordem, data, modalidade) e salva atualizando `updatedAt`, JSON e índice; mídias adicionadas/removidas refletidas no Storage.
* **RF-18 (P0)** Excluir registro com diálogo de confirmação e, quando houver muita mídia, digitação de `EXCLUIR`; remove JSON, imagens, vídeos, miniaturas e linha do índice, sem órfãos.
* **RF-19 (P0)** Detecção de conflito por `updatedAt` com diálogo de 3 opções.
* **RF-20 (P0)** Capa do registro conforme 7.9.

## 10.3 Consultar

* **RF-30 (P0)** Calendário próprio com marcação dos dias que têm registros, contagem, navegação por mês/ano, clique no dia mostra os registros.
* **RF-31 (P0)** Lista cronológica com ordenação (recente, antigo, alfabética), paginação incremental e cartões com capa, data, título, modalidade, resumo, tags e indicadores.
* **RF-32 (P0)** Alternância Calendário/Lista com estado visível e persistido na URL.
* **RF-33 (P0)** Pesquisa por título, resumo, conteúdo, tags, modalidade e data (inclui termos curtos e com acento).
* **RF-34 (P0)** Filtros por modalidade, período, mídia e tags; chips ativos e limpar.
* **RF-35 (P0)** Visualização do registro como página de diário, renderizada a partir do JSON, com mídia nos pontos corretos, metadados e identidade da modalidade.
* **RF-36 (P0)** Mídia indisponível não quebra a página.
* **RF-37 (P1)** Registro anterior/próximo; copiar link.
* **RF-38 (P1)** Faixa "Últimas páginas" no Hub.

## 10.4 Rascunhos e resiliência

* **RF-40 (P0)** Autosave local em IndexedDB durante a edição, com indicador de horário.
* **RF-41 (P0)** Recuperação de rascunho ao voltar ("Continuar edição" / "Descartar rascunho").
* **RF-42 (P0)** Falha de salvamento não apaga nada; conteúdo permanece como rascunho local e a mensagem explica.
* **RF-43 (P0)** Bloqueio de saída com alterações pendentes.
* **RF-44 (P0)** Idempotência: múltiplos cliques ou retentativas não geram registros duplicados.

## 10.5 Preparação futura (P2: estrutura, rotas stub, tipos, flags desligadas)

* **RF-50** Exportar registro (JSON, PDF, ZIP com `registro/registro.json`, `imagens/`, `videos/`): interface `RecordExporter` e rota 501 documentada.
* **RF-51** Importar pacote: validação de estrutura, versão, campos obrigatórios, arquivos referenciados e tipos; a importação preserva a `date` do JSON (ex.: `2025-05-12` cria o registro em 12/05/2025, independentemente de quando foi importado). Interface `RecordImporter`, rota 501.
* **RF-52** Autenticação e papéis (8.8).
* **RF-53** Área de testes ("TESTAR"): módulo isolado atrás de `ENABLE_TEST_AREA=false`, futuramente cobrindo testes de componentes, JSON, mídia, renderização, importação e sincronização. Nada visível ao usuário.
* **RF-54** Timeline (`ENABLE_TIMELINE`), estatísticas por modalidade (`ENABLE_STATS`: registros totais, dias documentados, imagens, vídeos, registros no mês — o endpoint `/api/summary` já entrega os números), arquivo histórico por ano (navegação 2024, 2025, 2026...), revisões de documento, rascunhos/arquivados na nuvem.
* **RF-55** Logs de auditoria (criação, edição, exclusão, importação, exportação) — tabela e escrita já implementadas em criação/edição/exclusão.
* **RF-56** Backup por registro: pacote completo JSON + mídia (via exportação ZIP futura).

---

# 11. REQUISITOS NÃO FUNCIONAIS (RNF)

## 11.1 Desempenho

* **RNF-01** Lighthouse mobile (4G simulada) na Home: Performance >= 85, Acessibilidade >= 95, Boas práticas >= 95, SEO >= 90. LCP <= 2,5 s; CLS <= 0,1; INP <= 200 ms.
* **RNF-02** JS inicial <= 250 KB gzip; o editor (TipTap) em chunk separado carregado sob demanda.
* **RNF-03** Listas paginadas (12 por página); calendário carrega só o mês visível (+ prefetch do vizinho); nunca listar o Storage para montar telas (o índice do banco é a fonte).
* **RNF-04** Imagens: miniaturas em listas, `loading="lazy"`, `decoding="async"`, dimensões reservadas; vídeos com `preload="none"` e pôster; URLs assinadas em lote.
* **RNF-05** API: respostas de listagem p95 <= 400 ms (excluindo cold start); consultas indexadas; `EXPLAIN` validado para busca e calendário com 5.000 registros de teste (seed de carga em `scripts/seed-demo.ts --load 5000`).
* **RNF-06** Cache: `staleTime` e `gcTime` do TanStack Query ajustados por recurso; `Cache-Control` imutável com hash para assets estáticos; service worker NUNCA cacheia respostas da API nem URLs assinadas.

## 11.2 Segurança

* **RNF-10** Itens da seção 8.9 e 2.5 integralmente. Rate limit, CORS restrito, Helmet, CSP, validação de entrada em todas as rotas, sem segredo no cliente.
* **RNF-11** `npm audit` sem vulnerabilidades altas/críticas ao fechar a versão; dependências com versões fixadas; Dependabot (ou Renovate) configurado.
* **RNF-12** Teste automatizado de path traversal (`../`, `%2e%2e`, barras invertidas, ids malformados) e de upload de arquivo com extensão enganosa (executável renomeado para `.jpg`).
* **RNF-13** Logs sem dados sensíveis; nenhuma URL assinada ou código de equipe em log.

## 11.3 Acessibilidade (WCAG 2.2 AA como meta)

* Contraste de 4.5:1/3:1 (5.2); navegação completa por teclado; ordem de foco lógica; foco visível; `label` em todo campo; `aria-label` em botões de ícone; `aria-live` em toasts e estados de salvamento; `alt` em todas as imagens informativas (decorativas com `alt=""`/`aria-hidden`); diálogos com foco aprisionado; calendário como `grid`; erros de formulário associados por `aria-describedby`; `prefers-reduced-motion` e `prefers-color-scheme` respeitados; botões semânticos (`<button>`, `<a>`); idioma `lang="pt-BR"`.
* Teste com leitor de tela (NVDA/VoiceOver) nos fluxos principais e `axe` automatizado em e2e.

## 11.4 Compatibilidade e responsividade

* Chrome, Edge, Firefox e Safari (duas versões mais recentes), iOS 15+, Android Chrome atual. Telas de 360 px a 2560 px (5.9).

## 11.5 Confiabilidade e integridade

* Nenhum estado "salvo pela metade" visível ao usuário (`pending` invisível). Operações idempotentes. Retentativas com backoff. Exclusão sem órfãos. Rotina de auditoria. Falha do banco ou do Storage nunca apaga conteúdo local.

## 11.6 Manutenibilidade

* TypeScript estrito, lint/format automáticos, camadas separadas (6.2), adaptadores para Storage/DB, flags e limites em configuração central, ADRs em `docs/DECISOES.md`, cobertura de testes >= 80% em `shared` (schemas, slug, datas, migração, conversores) e >= 70% na API.

## 11.7 Observabilidade

* Logs estruturados com `reqId`; `GET /api/health`; erros do navegador registrados com `console.error` (gancho `reportError()` pronto para um serviço futuro, P2).

## 11.8 Internacionalização e fuso

* Interface em pt-BR; datas `dd/MM/yyyy` e por extenso; `America/Sao_Paulo`; textos centralizados em `config/strings.ts`.

---

# 12. REQUISITOS EXTRAS RECOMENDADOS (o que "o projeto precisa para funcionar de verdade")

## 12.1 Upload, limites e compressão (todos centralizados em `UPLOAD_LIMITS`, compartilhados front/API)

```ts
export const UPLOAD_LIMITS = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], // SVG: ALLOW_SVG=false
    maxOriginalMB: 20,        // antes de comprimir
    maxFinalMB: 5,            // depois de comprimir (o que vai para a nuvem)
    maxLongSidePx: 2560,
    jpegWebpQuality: 0.85,
    thumbLongSidePx: 480, thumbFormat: 'image/webp',
    maxPerRecord: 40,
  },
  video: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxMB: 50,                // alinhado ao limite do Supabase Free; subir se usar Pro
    maxPerRecord: 4,
    maxDurationSec: 600,      // aviso, não bloqueio rígido
  },
  document: { maxJsonKB: 512, maxBlocks: 500 },
  fileNameMaxLength: 100,
} as const;
```

* Imagem: ler com `createImageBitmap` (respeitando orientação EXIF), redimensionar para o lado maior <= 2560, comprimir (JPEG/WebP 0,85; PNG sem transparência e > 2 MB vira JPEG; PNG com transparência mantém), gerar miniatura WebP de 480 px. Recusar HEIC/HEIF com mensagem clara ("Esse formato de foto não é aceito. Envie em JPG ou PNG."), sem quebrar.
* Vídeo: NÃO transcodificar. Validar tipo/tamanho/duração; capturar primeiro quadro como miniatura; avisar que `.mov` pode não tocar em todos os navegadores e que MP4 (H.264/AAC) é o recomendado; sugerir link externo para vídeos maiores que o limite.
* Mensagens de limite sempre claras e acionáveis; validação repetida no servidor (`prepare` e `commit`) e no bucket (limites do Supabase).

## 12.2 SEO, Open Graph e metadados (P1)

`index.html` com `<title>Hortobots Planning - Diário de Bordo</title>`, `description`, `theme-color`, favicons, manifest, Open Graph/Twitter (5.11), `lang="pt-BR"`. Como o conteúdo é interno, `robots.txt` e `<meta name="robots" content="noindex, nofollow">` por padrão (configurável). Título da aba dinâmico por rota ("Testes de locomoção - Hortobots OBR").

## 12.3 PWA (P1: instalação e cache de assets; offline completo é P2)

Manifest, service worker do `vite-plugin-pwa` com precache dos assets do build, página de fallback offline simples, API em NetworkOnly, atualização com aviso "Nova versão disponível" (sem recarregar sozinho para não perder rascunho).

## 12.4 Higiene de repositório e DX

`README` com passo a passo; `npm run dev` (web + api via `concurrently`); `npm run build`, `lint`, `typecheck`, `test`, `test:e2e`, `assets`, `db:migrate` (instruções), `storage:setup`, `seed:demo`, `audit:integrity`, `check:emoji`. Husky + lint-staged. GitHub Actions: lint, typecheck, testes, build, `check-no-emoji`, e agendamento anti-pausa do Supabase (4.4).

## 12.5 Ambiente local

Duas opções documentadas: (a) projeto Supabase separado de desenvolvimento; (b) Supabase CLI local (`supabase start`, Docker) com a mesma migração e `setup-storage`. `.env.example` completo (13.3). NUNCA apontar testes automatizados para o projeto de produção.

## 12.6 Dados de demonstração

`seed-demo.ts` cria 6 registros fictícios (3 FLL, 3 OBR) com datas variadas (inclusive passadas), imagens geradas por canvas/sharp (placeholders sem emoji), tags e um vídeo curto sintético opcional. Flag `--clean` remove. Nunca roda em produção sem `--force`.

---

# 13. CONFIGURAÇÃO CENTRAL E FEATURE FLAGS

## 13.1 Flags (variáveis na API, expostas em `/api/config`; o front também tem defaults em `config/features.ts`)

```text
ENABLE_TEST_AREA=false     # Simulações e Testes. NADA visível. Rota nem é registrada.
ENABLE_IMPORT=false        # Importar diário (P2)
ENABLE_EXPORT=false        # Exportar registro JSON/PDF/ZIP (P2)
ENABLE_AUTH=false          # Contas e papéis (P2). v1 usa apenas a trava WRITE_PASSCODE.
ENABLE_TIMELINE=false      # P2
ENABLE_STATS=false         # P2
STRIP_EMOJI_FROM_USER_INPUT=false
ALLOW_SVG=false
```

Implementação da área de testes: pasta `apps/web/src/features/test-area/` carregada por `React.lazy` e importada SOMENTE dentro de um bloco condicionado a `features.ENABLE_TEST_AREA` (constante de build `import.meta.env.VITE_ENABLE_TEST_AREA`), de modo que o bundler elimine o módulo e o asset `simulacoes_e_testes_button.png` do build público. Contém apenas um componente "Em breve" interno e a documentação do que será testado (componentes, JSON, mídia, renderização, importação, sincronização). Um teste garante que, com a flag falsa, não existe link, rota nem texto "Simulações" na interface.

## 13.2 Configuração tipada (`config/` no web e `apps/api/src/config/`)

* `FLL_THEME`, `OBR_THEME`: nome, rótulo, cores, caminhos de logos/fundos/ornamentos, carimbo.
* `FEATURE_FLAGS`, `UPLOAD_LIMITS` (12.1), `STORAGE_CONFIG` (`bucket`, `signedUrlTtlSeconds`, `uploadTokenTtl`, `pendingTtlHours: 24`, `deleteConfirmThreshold: 3`), `PAGINATION` (`pageSize: 12`, `maxPageSize: 48`), `TAGS`, `PAGE_LINE_HEIGHT`.
* Logos como assets configuráveis (estrutura `assets/hortobots/`, `assets/fll/`, `assets/obr/`) mapeados em `FLL_THEME`/`OBR_THEME`; NUNCA importar logo direto dentro de componente de página.
* O env da API é validado com Zod no boot; faltou variável obrigatória: o servidor não sobe e imprime mensagem clara (sem valores secretos).

## 13.3 Variáveis de ambiente

API (Render Web Service):

```text
NODE_ENV=production
PORT=10000                         # o Render injeta; respeitar process.env.PORT e escutar em 0.0.0.0
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...      # SEGREDO. Apenas aqui.
SUPABASE_BUCKET=hortobots-planning
WEB_ORIGIN=https://hortobots-planning-web.onrender.com
WRITE_PASSCODE=...                 # código da equipe (segredo)
MAINTENANCE_TOKEN=...              # segredo para rotas admin/cron
SIGNED_URL_TTL_SECONDS=3600
LOG_LEVEL=info
ENABLE_TEST_AREA=false
ENABLE_IMPORT=false
ENABLE_EXPORT=false
ENABLE_AUTH=false
STRIP_EMOJI_FROM_USER_INPUT=false
ALLOW_SVG=false
```

Web (Render Static Site, variáveis expostas ao build; NUNCA segredos):

```text
VITE_API_BASE_URL=https://hortobots-planning-api.onrender.com
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=...         # chave pública anon, usada só para uploadToSignedUrl
VITE_ENABLE_TEST_AREA=false
VITE_APP_VERSION=1.0.0
```

---

# 14. MANUAL DE IMPLANTAÇÃO: RENDER + SUPABASE (o que o humano faz e o que o agente automatiza)

Este capítulo é o "manual" que deve ser copiado para `docs/MANUAL_DEPLOY.md`. Deixa claro que **o site é hospedado no Render e os dados vivem no Supabase**. Os valores de planos/limites devem ser conferidos nos sites oficiais no momento da implantação.

## 14.1 Pré-requisitos (ações do humano)

1. Conta no GitHub (repositório privado `hortobots-planning`).
2. Conta no Supabase (https://supabase.com).
3. Conta no Render (https://render.com), conectada ao GitHub.
4. Node 20+ e Git na máquina de desenvolvimento.
5. Decidir o código da equipe (`WRITE_PASSCODE`): frase longa, compartilhada só com a equipe.

## 14.2 Supabase (passo a passo)

1. **Criar projeto:** região São Paulo (`sa-east-1`) se disponível; guardar a senha do banco em gerenciador de senhas.
2. **Copiar credenciais** (Project Settings > API): `Project URL`, chave `anon` (pública) e chave `service_role` (SEGREDO; nunca vai para o GitHub nem para o front).
3. **Criar as tabelas:** executar `supabase/migrations/0001_init.sql` no SQL Editor (ou `supabase db push` com a CLI). Conferir que `records` e `audit_logs` existem com RLS ligado e SEM políticas.
4. **Criar o bucket:** rodar `npm run storage:setup` (usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do `.env` local) ou criar manualmente: nome `hortobots-planning`, **privado**, limite de tamanho por arquivo conforme `UPLOAD_LIMITS` (e <= limite global do projeto em Settings > Storage), tipos MIME permitidos (7.5). Conferir que NÃO há políticas públicas de leitura.
5. **Testar** com `npm run audit:integrity` (deve retornar vazio) e `GET /api/health?deep=1` após o deploy da API.
6. **Backups:** os backups automáticos de banco do Supabase (planos pagos) NÃO incluem os arquivos do Storage. Implementar `scripts/backup-storage.ts` (P1) que baixa todo o bucket para uma pasta/ZIP local com data (`backup/2026-10-06/`), e agendar uso mensal manual. Como cada registro é `JSON + mídia`, o backup por registro é cópia da pasta. `scripts/reindex.ts` reconstrói o índice do banco a partir dos `registro.json`.
7. **Plano:** acompanhar uso (Settings > Usage). Se o acervo passar de ~1 GB ou os vídeos excederem 50 MB, migrar para o plano Pro e aumentar `maxMB` em `UPLOAD_LIMITS` + limite do bucket.

## 14.3 GitHub

1. Subir o repositório. `.gitignore` com `.env*`, `node_modules`, `dist`, `backup/`.
2. Secrets do GitHub Actions (somente para o workflow anti-pausa/CI): `API_BASE_URL`, `MAINTENANCE_TOKEN`.

## 14.4 Render (Blueprint `render.yaml`)

Crie na raiz do repositório (o agente deve validar o esquema contra a documentação atual do Render):

```yaml
services:
  - type: web
    name: hortobots-planning-api
    runtime: node
    plan: free                       # trocar por starter para API sempre ligada
    region: ohio
    buildCommand: npm ci && npm run check:emoji && npm run build -w @hortobots/shared && npm run build -w @hortobots/api
    startCommand: npm run start -w @hortobots/api
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - { key: NODE_VERSION, value: "20" }
      - { key: NODE_ENV, value: production }
      - { key: SUPABASE_BUCKET, value: hortobots-planning }
      - { key: SIGNED_URL_TTL_SECONDS, value: "3600" }
      - { key: ENABLE_TEST_AREA, value: "false" }
      - { key: ENABLE_IMPORT, value: "false" }
      - { key: ENABLE_EXPORT, value: "false" }
      - { key: ENABLE_AUTH, value: "false" }
      - { key: SUPABASE_URL, sync: false }
      - { key: SUPABASE_SERVICE_ROLE_KEY, sync: false }
      - { key: WEB_ORIGIN, sync: false }
      - { key: WRITE_PASSCODE, sync: false }
      - { key: MAINTENANCE_TOKEN, sync: false }

  - type: web
    name: hortobots-planning-web
    runtime: static
    buildCommand: npm ci && npm run check:emoji && npm run build -w @hortobots/shared && npm run build -w @hortobots/web
    staticPublishPath: apps/web/dist
    routes:
      - { type: rewrite, source: /*, destination: /index.html }
    headers:
      - { path: /*, name: X-Content-Type-Options, value: nosniff }
      - { path: /*, name: Referrer-Policy, value: strict-origin-when-cross-origin }
      - { path: /*, name: Content-Security-Policy, value: "<CSP da seção 8.9 com a URL real da API>" }
      - { path: /assets/*, name: Cache-Control, value: "public, max-age=31536000, immutable" }
      - { path: /sw.js, name: Cache-Control, value: "no-cache" }
    envVars:
      - { key: VITE_API_BASE_URL, sync: false }
      - { key: VITE_SUPABASE_URL, sync: false }
      - { key: VITE_SUPABASE_ANON_KEY, sync: false }
      - { key: VITE_ENABLE_TEST_AREA, value: "false" }
```

Ordem de implantação (há dependência circular de URLs):

1. Criar a API (variáveis `sync: false` preenchidas no painel). Anotar a URL pública.
2. Criar o Static Site com `VITE_API_BASE_URL` = URL da API.
3. Voltar à API e definir `WEB_ORIGIN` = URL do Static Site; fazer novo deploy.
4. Atualizar o CSP com a URL real da API e redeploy do site.
5. (Opcional) Domínio próprio nos dois serviços (por exemplo `planning.seudominio.com.br` e `api.seudominio.com.br`) e ajustar `WEB_ORIGIN`/CSP.

Pontos obrigatórios: a API escuta em `0.0.0.0:$PORT`; nada é gravado em disco; SPA com rewrite `/*`; mensagem de cold start na UI (4.4).

## 14.5 Verificação pós-deploy (executar e registrar no README)

1. `GET /api/health?deep=1` retorna ok (banco e bucket).
2. Abrir o site: Home carrega fundo, logo e dois cartões; cartões mostram "0 registros" (ou os do seed).
3. Rodar os 4 fluxos de aceitação (seção 15) em produção com um registro de teste e depois excluí-lo.
4. Conferir no painel do Supabase que a pasta foi criada em `obr/...` com JSON, imagens, vídeos e miniaturas, e que após excluir NÃO sobra nada.
5. Testar do celular real (upload de foto da câmera e vídeo curto).
6. Rodar `npm run audit:integrity` apontando para produção (somente leitura).

## 14.6 Custos e riscos operacionais (resumo para o humano decidir)

| Item | Gratuito | Quando migrar |
|---|---|---|
| Render Static Site | Sim | Raramente. |
| Render API | Sim, mas dorme (cold start de ~1 min) | Plano pago de entrada quando a espera incomodar. |
| Supabase | Sim, com ~1 GB de arquivos, upload ~50 MB e pausa por inatividade | Pro quando o acervo/vídeos crescerem ou para evitar pausa. |
| Domínio próprio | Não incluso | Opcional. |

---

# 15. TESTES E CRITÉRIOS DE ACEITAÇÃO

O projeto só está concluído quando os 4 fluxos abaixo passarem em produção (e em teste automatizado Playwright contra o ambiente de desenvolvimento), a lista de verificação de 15.3 estiver completa e `npm run lint && npm run typecheck && npm test && npm run test:e2e` passarem.

## 15.1 Os quatro fluxos (literais)

**FLUXO 1 — Criar.** Abrir o site. Selecionar "HORTOBOTS OBR". Clicar em "Novo Registro". Escolher a data **01/10/2026** (hoje é 06/10/2026). Título "Testes de locomoção". Escrever conteúdo (título, parágrafo com negrito, uma caixa Problema, uma caixa Solução). Adicionar duas imagens e um vídeo. Marcar tags. Clicar em "SALVAR REGISTRO". Esperado: tela "SALVANDO REGISTRO...", depois confirmação "Registro salvo." e abertura da página do registro. No banco: `record_date = 2026-10-01`, `created_at` de hoje. No Storage: `obr/2026-10-01-testes-de-locomocao/registro.json`, `imagens/` com 2 arquivos, `videos/` com 1, `miniaturas/`.

**FLUXO 2 — Reabrir após fechar tudo.** Fechar o navegador, abrir novamente (outro dispositivo/perfil, sem cache). Entrar em OBR > Calendário > outubro de 2026 > clicar no dia **01**. Encontrar "Testes de locomoção" no painel do dia e abrir. Esperado: título, texto formatado, caixas, as duas imagens nos pontos corretos, o vídeo tocando, a data "01 de Outubro de 2026" (e "Registrado no sistema em 06/10/2026"), tags e toda a identidade OBR (vermelho, logo OBR, carimbo OBR). O dia 06 do calendário NÃO deve ter marca.

**FLUXO 3 — Editar.** Abrir o registro, "Editar". Verificar que tudo foi carregado (data, modalidade, blocos, imagens, vídeo, galeria). Alterar o texto, adicionar uma nova imagem, remover outra, salvar. Reabrir. Esperado: alterações persistidas; `updatedAt` > `createdAt`; imagem removida não existe mais no Storage; imagem nova existe; `createdAt` e `date` intactos.

**FLUXO 4 — Excluir.** Excluir o registro; o diálogo aparece; por ter 3 ou mais mídias, exige digitar `EXCLUIR`; confirmar. Esperado: toast "Registro excluído."; o registro desaparece da lista, do calendário e da pesquisa; NENHUM objeto resta sob `obr/2026-10-01-testes-de-locomocao/`; linha removida do banco; linha de `audit_logs` com a ação `delete`.

## 15.2 Testes automatizados por camada

* **`shared` (Vitest):** schemas (válidos e inválidos para cada bloco), integridade de referências de mídia, `slugify` (acentos, vazio, comprimento), nome de pasta com colisão, nomes de arquivo, datas sem fuso (`2026-10-01` nunca vira 30/09), validação de data real, migração de versões (fixtures), `search_text` (normalização, datas em vários formatos).
* **API (Vitest + Supabase de teste ou CLI local):** criação completa (`prepare` -> upload -> `commit`) com verificação de objetos; idempotência (mesma `idempotencyKey`); recusa de caminho malicioso, MIME falso e arquivo acima do limite; conflito 409 e `force`; edição com diff de mídia; exclusão sem órfãos; `deleting` retomado por `cleanup`; busca ("MPU", "locomoção", data `01/10/2026`, tag); calendário por mês; paginação; trava `WRITE_PASSCODE`; flags 501; formato de erro.
* **Front (Vitest + Testing Library):** conversores TipTap<->blocos (round-trip de todos os tipos); `DiaryRenderer` (um teste por bloco, XSS como texto, `javascript:` bloqueado, mídia ausente); calendário (teclado, rótulos ARIA, 6 linhas); formulário (erros em linha e foco); rascunho (autosave, recuperação, descarte); status de salvamento sem duplo clique.
* **E2E (Playwright, Chromium + WebKit + um viewport mobile):** os 4 fluxos; troca de tema; troca FLL/OBR; busca e filtros; conflito entre duas abas; offline durante a edição (rascunho preservado); `axe` sem violações sérias em Home, Hub, Lista, Calendário, Editor e Registro; varredura de emoji no texto visível; ausência de "Simulações e Testes" na interface.
* **Carga leve:** 5.000 registros seed; busca e calendário dentro do orçamento (RNF-05).

## 15.3 Lista de verificação final (marcar tudo antes de entregar)

* Nenhum emoji em lugar nenhum (`npm run check:emoji` limpo; e2e limpo).
* Home, Hub, Lista, Calendário, Editor e Registro implementados e fiéis à direção das telas de referência, com `fundo`, `Logo.png`, logos de equipe, `mascote` e cartões de ação usados conforme a seção 3.
* FLL verde e OBR vermelho com a mesma estrutura; modalidade evidente em todas as telas.
* Data oficial preservada; calendário/ordenação/filtros usam `date`.
* JSON validado por Zod; migração de versão; nada de HTML armazenado ou executado.
* Upload de imagens e vídeos; compressão; miniaturas; galeria; lightbox; capa.
* Persistência em Supabase (banco + Storage) funcionando em produção no Render.
* Excluir sem órfãos; auditoria; `audit:integrity` limpo.
* Autosave, recuperação de rascunho, bloqueio de saída, idempotência, conflito.
* Pesquisa e filtros funcionando; paginação.
* Responsivo (360 a 2560) com layouts específicos; dark mode; reduced-motion.
* Acessibilidade conforme 11.3.
* Favicon (16, 32, 180, 192, 512 + maskable), manifest, Open Graph, SEO básico.
* Feature flags desligadas e área de testes inexistente para o usuário.
* Segredos somente no Render; CSP aplicado; rate limit ativo; `WRITE_PASSCODE` configurado em produção.
* README, `MANUAL_DEPLOY.md`, `DECISOES.md`, `FORMATO_REGISTRO.md` completos.

---

# 16. PLANO DE EXECUÇÃO RECOMENDADO (ordem de trabalho do agente)

Princípio herdado da especificação: **primeiro a arquitetura correta e a persistência dos dados; depois o refinamento da interface.** Construa uma "fatia vertical" funcional cedo (criar, salvar, ler, editar, excluir com UI simples) e só então embeleze.

| Fase | Entrega | Definição de pronto |
|---|---|---|
| 0. Preparação | Ler este documento e inspecionar os 12 assets (dimensões, alfa, cores). Criar `docs/DECISOES.md`. Rodar `sample-palette`. | Paleta real registrada; lista de assets que precisam de transparência. |
| 1. Fundação | Monorepo, TypeScript estrito, lint, Prettier, husky, `check-no-emoji`, CI. Pacote `shared` com constantes, schemas, slug, datas, texto de busca, migração, com testes. | `shared` com cobertura >= 80%; `check:emoji` ativo. |
| 2. Dados | `0001_init.sql`, `setup-storage.ts`, adaptadores `db/` e `storage/` da API, `listAllObjects`, assinatura de URLs. | Bucket privado e tabelas criados; testes de adaptadores passam. |
| 3. API | Todas as rotas da seção 8 (stubs 501 incluídos), env validado, erros padronizados, rate limit, CORS, Helmet, auditoria, `cleanup`, `integrity`. | Testes de integração dos fluxos 1, 3 e 4 na camada de API passam. |
| 4. Casca do front | Vite, Tailwind, tokens, temas, fontes, layouts (Capa, Diário, Livro), cabeçalho, rotas, `config/`, cliente de API, TanStack Query, scripts de assets. | Home e Hub renderizam com os assets reais; tema e modalidade trocam sem flash. |
| 5. Renderer | `DiaryRenderer` completo, galeria, lightbox. | Testes por bloco; visualização de um JSON de exemplo fiel ao exemplo 7.3. |
| 6. Editor | TipTap, conversores, toolbar, menu `/`, imagens, vídeos, tabelas, caixas, galeria editável, formulário de metadados, validação, pré-visualização. | Round-trip de todos os blocos; criação de registro de ponta a ponta contra a API. |
| 7. Consulta | Lista, calendário, painel do dia, busca, filtros, paginação, vazios. | Fluxo 2 passa. |
| 8. Edição e exclusão | Editar, diff de mídia, conflito 409, excluir com confirmação reforçada. | Fluxos 3 e 4 passam. |
| 9. Resiliência | Rascunhos em IndexedDB, recuperação, bloqueio de saída, offline, idempotência, retentativas de upload. | Testes e2e de queda de rede e fechamento do navegador. |
| 10. Acabamento | Ornamentos de diário, animações, responsividade fina, acessibilidade (axe), desempenho (Lighthouse), PWA, favicon/OG, SEO, print CSS. | RNF-01 a RNF-06 e 11.3 atendidos. |
| 11. Implantação | `render.yaml`, README, MANUAL_DEPLOY, verificação pós-deploy em produção. | Os 4 fluxos passam em produção. |

Regras de trabalho:

* Commits pequenos e frequentes; cada fase termina com testes verdes.
* Não adicionar dependência fora da seção 6.1 sem registrar o motivo em `DECISOES.md`.
* Nunca deixar `TODO` sem issue/registro; nada de código morto ou `console.log` de depuração.
* Em conflito entre fidelidade visual e acessibilidade/usabilidade, vence a acessibilidade/usabilidade (a especificação original diz que as telas são referência, não cópia literal).

---

# 17. MICROCOPY OFICIAL (pt-BR, SEM EMOJI) — centralizar em `config/strings.ts`

## 17.1 Marca e navegação

* Nome: "HORTOBOTS PLANNING". Subtítulo: "Diário de Bordo". Rodapé: "Diário de Bordo - HORTOBOTS".
* Tagline: "Nosso diário. Nossa história. Nosso processo."
* Introdução: "HORTOBOTS PLANNING" / "Registre." / "Organize." / "Documente." / "Construa a história da equipe." / "ESCOLHA O DIÁRIO".
* Botões: "Acessar diário", "Novo Registro", "Calendário", "Lista", "Todos os Registros", "Pesquisar", "Filtros", "Limpar filtros", "Editar", "SALVAR REGISTRO", "EXCLUIR REGISTRO", "Cancelar", "Excluir", "Trocar de diário", "Carregar mais registros", "Hoje", "Criar registro nesta data", "Tentar novamente".

## 17.2 Estados vazios

* FLL: "O diário FLL ainda está em branco." / "O próximo capítulo começa aqui."
* OBR: "O diário OBR ainda está em branco." / "O próximo capítulo começa aqui."
* Dia sem registro: "Nenhum registro neste dia."
* Busca sem resultado: "Nenhum registro encontrado." / "Tente outros termos ou limpe os filtros."
* 404: "Página não encontrada." / "Esta página não existe neste diário."

## 17.3 Carregamento

* "CARREGANDO DIÁRIO...", "SALVANDO REGISTRO...", "EXCLUINDO REGISTRO...", "ENVIANDO MÍDIA...", "Preparando", "Enviando mídia 2 de 5", "Gravando o diário", "Atualizando o índice".
* Cold start: "O servidor está acordando. Isso leva até um minuto na primeira vez do dia."

## 17.4 Confirmações

* Salvou: "Registro salvo." / "O diário foi armazenado com sucesso."
* Excluiu: "Registro excluído." / "O registro e suas mídias associadas foram removidos."
* Diálogo de exclusão: título "Excluir este registro?"; corpo "Esta ação removerá o registro e todos os arquivos associados, incluindo imagens e vídeos." / "Esta ação não poderá ser desfeita."; botões "CANCELAR" e "EXCLUIR". Com muita mídia: "Digite EXCLUIR para confirmar." (botão "EXCLUIR" só habilita quando o texto confere).

## 17.5 Rascunho, conflito e resiliência

* Indicador: "Rascunho salvo localmente às 15:42".
* Recuperação: "Encontramos um rascunho não salvo." / "Continuar edição" / "Descartar rascunho". Confirmação de descarte: "Descartar este rascunho? Ele não poderá ser recuperado."
* Erro ao salvar: "Não foi possível salvar o registro." / "O conteúdo foi mantido neste dispositivo como rascunho." / "Nenhuma informação foi apagada."
* Conflito: "Este registro foi alterado por outra pessoa depois que você começou a editar." Opções: "Cancelar", "Salvar como novo registro", "Sobrescrever mesmo assim".
* Sair sem salvar: "Há alterações que ainda não foram salvas na nuvem. Deseja sair mesmo assim?" (o rascunho local é mantido).
* Offline: "Você está sem conexão. Seus rascunhos continuam sendo salvos neste dispositivo."
* Espaço local: "O espaço deste dispositivo está acabando. Salve o registro na nuvem."

## 17.6 Documento e mídia

* Mídia: "Mídia indisponível".
* Documento incompatível: "Este registro possui uma estrutura incompatível com esta versão da plataforma."
* Formato recusado: "Esse formato de arquivo não é aceito."; HEIC: "Esse formato de foto não é aceito. Envie em JPG ou PNG."; tamanho: "O arquivo é maior que o limite de X MB."; vídeo grande: "Para vídeos maiores, use um link do YouTube ou do Vimeo."
* Data futura: "Esta data está no futuro."; dica de data: "Esta é a data do acontecimento, não a data de hoje."

## 17.7 Validação (campo a campo)

* Título: "Informe um título com pelo menos 3 caracteres." Data: "Informe uma data válida (dd/mm/aaaa)." Resumo: "Escreva um resumo curto do que aconteceu." Autor: "Informe quem está registrando." Link: "Use um endereço que comece com http, https ou mailto." Tags: "Escolha no máximo 8 tags."

## 17.8 Erros genéricos

* "Algo deu errado nesta página." / "Tente novamente em instantes. Se o problema continuar, avise a equipe." Detalhes técnicos NUNCA aparecem para o usuário; vão apenas ao log.
* Código de equipe: "Digite o código da equipe para salvar alterações." / "Código incorreto."

---

# 18. DECISÕES TOMADAS, AMBIGUIDADES RESOLVIDAS E ALERTAS (registrar em `docs/DECISOES.md`)

| Tema | Situação | Decisão neste documento |
|---|---|---|
| Logos "oficiais" | A especificação original fala em "logo oficial da FLL/OBR", mas os arquivos enviados são logos da EQUIPE por modalidade (`fll_team_logo.png`, `obr_team_logo.png`). | Usar exatamente esses arquivos. Não baixar nem recriar marcas oficiais de terceiros. |
| Acento no logo OBR | "HORTOLANDIA" sem acento no logo OBR e "HORTOLÂNDIA" no FLL. | Não alterar arquivos; avisar o humano. |
| Três cartões na tela inicial de referência | A referência tem Novo Registro, Registros Salvos e Simulações e Testes. | Home = escolha FLL/OBR; Hub = dois cartões de ação; terceiro cartão fora da v1 e atrás de flag. |
| Página branca vs papel escuro | As telas mostram páginas brancas sobre fundo escuro; o requisito de dark mode pede papel escuro. | Preferência `data-paper` (padrão claro no tema escuro, opção escura). |
| Cabeçalho vermelho do calendário ilustrado | A referência usa topo vermelho, mas FLL é verde. | Topo do calendário assume a cor da modalidade. |
| Livro de 2 folhas x editor de blocos | A referência é um livro com texto à esquerda e 8 fotos à direita; o requisito exige mídia inline e galeria. | Esquerda = editor/leitura em blocos com mídia inline; direita = galeria (8 por folha) com setas; mobile em folha única. |
| Estrutura do Storage | Duas raízes citadas (`hortobots-planning/` e `records/`). | Bucket `hortobots-planning`; objetos `{fll|obr}/{pasta}/...`; pasta `miniaturas/` acrescentada. |
| Nome da pasta ao editar | Título/data podem mudar. | Pasta imutável; verdade está no JSON/banco. |
| Legenda | Imagens têm legenda opcional. | Legenda única na mídia (reaproveitada no texto e na galeria). |
| Rascunhos | Só locais na v1. | IndexedDB; linha `pending` no banco é técnica e invisível, não é "rascunho". |
| Autenticação | Preparada, não ativa. | Trava `WRITE_PASSCODE` para não deixar o acervo apagável por qualquer pessoa com o link. |
| Banco de dados extra | Pergunta do humano. | Sim: Supabase Postgres no mesmo projeto do Storage (seção 4.1). |
| Emoji em texto digitado por usuários | "Nunca emoji" vs integridade do conteúdo. | Plataforma 100% sem emoji; texto do usuário preservado; flag opcional. |
| Mudar modalidade na edição | Mover pasta entre `fll` e `obr`. | Não suportado na v1 (seletor bloqueado). |
| SVG enviado por usuário | "Somente quando seguro". | Desabilitado na v1. |
| Progresso real de upload | `uploadToSignedUrl` não expõe progresso. | Estado por arquivo + barra indeterminada; progresso real via XHR é P1. |

Riscos conhecidos a monitorar: pausa do projeto Supabase gratuito por inatividade; cold start da API gratuita; limite de 50 MB por arquivo no plano gratuito; Storage fora do backup de banco; compatibilidade de `.mov`; fotos HEIC; cotas do IndexedDB em celulares; diferenças de comportamento de Safari com `MediaRecorder`/captura de quadro de vídeo (usar `<video>` + canvas após `loadeddata`).

---

# 19. ENTREGÁVEIS FINAIS (checklist de 30 itens da especificação, mapeados)

1. Aplicação frontend funcional. 2. Backend/API funcional. 3. Banco configurado. 4. Storage configurado. 5. Schema do banco (`0001_init.sql`). 6. Schema de validação dos JSON (`shared/schema`). 7. Editor funcional. 8. Renderizador funcional (`DiaryRenderer`). 9. Upload de imagens. 10. Upload de vídeos. 11. Calendário. 12. Lista. 13. Pesquisa. 14. Filtros. 15. Criação. 16. Edição. 17. Exclusão. 18. Autosave local. 19. Sistema de rascunho. 20. Identidade FLL. 21. Identidade OBR. 22. Responsividade. 23. Dark mode. 24. Favicon (e PWA/OG). 25. Estrutura preparada para autenticação. 26. Feature flags. 27. Estrutura preparada para importação. 28. Estrutura preparada para exportação. 29. Estrutura preparada para versionamento. 30. Área de testes DESATIVADA.

---

# 20. RESULTADO ESPERADO

Ao final, o Hortobots Planning deve ser um **diário de bordo digital visualmente imersivo, estruturado como documento, com armazenamento em nuvem, um `registro.json` independente por registro, mídia associada, calendário, pesquisa, edição, exclusão e caminho aberto para evoluir por anos** — usado pela equipe durante temporadas inteiras de FLL e OBR, acumulando um histórico organizado.

A experiência deve ser reconhecível como:

```text
DIÁRIO FÍSICO + PLANNER + DOCUMENTAÇÃO DE ENGENHARIA + ARQUIVO DIGITAL + IDENTIDADE HORTOBOTS
```

e jamais como:

```text
CRUD DE POSTS
```

Conceito central: **"Documentar não apenas o que fizemos, mas a história de como chegamos lá."**

Lembrete final, acima de qualquer preferência de estilo: **NENHUM EMOJI, EM LUGAR ALGUM, NUNCA.**

--- FIM DO PROMPT MESTRE ---
