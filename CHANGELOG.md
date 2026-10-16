# Histórico de versões

As versões futuras devem ser acrescentadas no topo deste arquivo, preservando o histórico já publicado.

## [2.0.0] — 2026-10-15

### Visualização Irrestrita e Pesquisa de Registros

- Troca do texto e conceito do botão de consulta geral para **Pesquisar registros**, tornando o objetivo da busca mais intuitivo para alunos, mentores e visitantes.
- Visualização irrestrita de todos os diários de bordo: alunos de uma equipe podem abrir e consultar diretamente o caderno de qualquer outra equipe (ex.: Aluno FLL navegando no diário OBR e vice-versa), sem serem ejetados ou confinados por filtros compulsórios na URL.
- Preservação estrita das regras de autoria e integridade: apenas as contas de alunos responsáveis da respectiva equipe têm permissão para criar, editar ou excluir registros e testes; perfis visitantes ou de outras equipes contam com acesso de visualização completo, incluindo visualização de mídias, gráficos e download ilimitado de relatórios em PDF.
- Aprimoramento da limpeza de filtros na listagem: ao alternar de visualização ou clicar em "Limpar filtros", parâmetros de equipe são purgados da URL e do estado, garantindo que nenhum registro de outra equipe seja omitido inadvertidamente.

### Elementos de Competição nos Cadernos Específicos

- **Cadernos FLL (SESI Hortobots e Under Construction):**
  - Inclusão de atalhos rápidos (*chips*) no formulário de criação de registros para os pilares e termos oficiais da temporada BIOGLOW: `projeto-de-inovacao`, `design-do-robo`, `core-values`, `treino-de-mesa`, `missao-bioglow`, `programacao`, `mecanica` e `calibracao`.
  - No formulário de Simulações e Testes FLL, inclusão de card orientativo dinâmico que exibe a pontuação mínima e máxima da missão BIOGLOW selecionada, critérios de pontuação, alertas de missão compartilhada ou pontos perdíveis e lembrete do teto oficial de 530 pontos.
- **Caderno OBR (Hortobots OBR):**
  - Inclusão de atalhos rápidos no formulário de criação de registros para as regras de Resgate 2026: `resgate-2026`, `seguidor-de-linha`, `area-de-resgate`, `vitimas`, `obstaculos`, `gangorra-redutor`, `sensores` e `programacao`.
  - Configuração de pontuação máxima por arena com cálculo automático de aproveitamento.

### Estúdio de Banner A × B Editável no Canva

- Ferramenta completa de síntese técnica do diário e projeto para Banner científico nas proporções configuráveis de largura e altura A × B (em centímetros).
- Extração automática de dados dos cadernos, registros técnicos e testes com suporte a anexos em DOCX, XLSX, PDF e texto.
- Exportação em `.pptx` (PowerPoint) nativo estruturado elemento por elemento (caixas textuais individuais, blocos e formas geométricas coloridas), permitindo upload e edição completa de cada elemento dentro do website [Canva.com](https://www.canva.com).

### Notificações e Administração

- Notificações por e-mail estilizadas com identidade visual do sistema e disparadas automaticamente via API Gmail para eventos comuns e urgentes.
- Painel Administrativo `/admin` exclusivo para manutenção de credenciais, monitoramento de armazenamento e verificação de saúde do sistema.

## [1.1.0] — 2026-10-14

### Temporadas e desempenho

- Teto oficial BIOGLOW 2026/2027 de 530 pontos, calculado a partir das 15 missões, inspeção de equipamento e discos de precisão.
- Tabela de pontuação parcial, máxima, compartilhada e perdível, com links para o manual e as atualizações oficiais.
- Indicadores de aproveitamento, pontos conquistados e restantes nos formulários, gráficos e detalhes de testes.
- Teto OBR por arena configurável, refletindo as regras de Resgate 2026.

### Banner, notificações e colaboração

- Criação e atualização incremental de banner A×B por equipe, com síntese por IA econômica e fallback local.
- Leitura de conteúdo de cadernos e anexos DOCX, XLSX, PDF e texto, com limites de tamanho e de contexto.
- Download em PPTX editável elemento por elemento no Canva e exclusão explícita do banner persistido.
- Configuração de três destinatários exclusiva do Mentor e disparo de e-mail responsivo via Gmail para eventos importantes.
- Deep link para login da Gestão e abertura direta do evento no calendário, com confirmação ou recusa opcional.
- Comentários de feedback da Gestão em registros, testes e eventos com tags Direção, Coordenação ou Técnico.
- Migração Supabase `0003_collaboration_banner_notifications.sql` e persistência equivalente no modo local.

### Qualidade

- Testes de regressão para o fechamento dos 530 pontos, metadados das missões, leitura segura de Office e integridade do PPTX.
- Auditoria de dependências sem vulnerabilidades conhecidas no momento da entrega.

## [1.0.0] — 2026-10-10

Primeira versão estável do Hortobots Planning, reunindo o fluxo completo de planejamento, documentação e consulta das equipes de robótica do SESI 437 Hortolândia.

### Plataforma e identidade

- Aplicação responsiva em React, TypeScript e Node.js, preparada para desktop, notebook, tablet e celular.
- Três cadernos independentes: SESI Hortobots FLL, Under Construction FLL e Hortobots OBR.
- Identidade visual própria por equipe, com fundos, cores, logos e transições dedicadas.
- Home centralizada para escolha do diário e acesso rápido ao calendário, acervos e pesquisa geral.
- Backgrounds fixos, rolagem exclusivamente vertical e barras de rolagem visualmente ocultas.
- Navegação por teclado, foco visível, alvos de toque e comportamento adaptado a telas sensíveis ao toque.
- Tela de carregamento que aguarda fontes, imagens críticas e estabilização visual antes de revelar a interface.
- Host público e responsivo para o portal independente Hortobots BIOGLOW, acessível pelo login, Home e caderno SESI Hortobots.
- Integração desacoplada por bundle estático e `postMessage`: o código-fonte permanece no repositório da equipe, enquanto o Planner publica a versão compilada sem depender de um segundo servidor.

### Contas e permissões

- Autenticação por quatro perfis: Gestão, Mentor, Aluno FLL e Aluno OBR.
- Modo visitante para consultar calendário, pesquisa e conteúdos publicados sem alterar dados.
- Gestão com visualização geral, criação de eventos e aprovação de eventos pendentes.
- Mentor com gestão completa de eventos e consulta dos conteúdos técnicos.
- Somente alunos podem criar, editar e excluir registros e testes: Aluno FLL nos dois cadernos FLL e Aluno OBR no caderno OBR, independentemente da autoria do item.
- Validação de permissões tanto na interface quanto na API.

### Registros técnicos

- Criação e edição de registros com data, título, resumo, relato técnico e tags personalizadas.
- Separação automática por equipe e modalidade.
- Upload, visualização ampliada e persistência de imagens e vídeos.
- Acervo pesquisável por texto, tag e data.
- Cartões responsivos com ações condicionadas ao perfil do aluno e à modalidade do caderno.

### Simulações e testes

- Testes FLL com missões da temporada BIOGLOW, tempo, pontuação, falhas e comentários.
- Testes OBR com objetivo, tempo, falhas e valores observados.
- Registros de 3 a 15 tentativas por teste.
- Gráficos de linha, barras e circular com análise de desempenho.
- Mídias anexadas e associação de testes a registros técnicos.
- Separação completa entre SESI Hortobots FLL, Under Construction FLL e Hortobots OBR.

### Calendário e pesquisa

- Calendário unificado para eventos, registros e testes.
- Eventos comuns ou urgentes, com períodos, horários por aula, observações e fluxo de aprovação.
- Visualização mensal e painel detalhado do dia selecionado.
- Pesquisa geral cronológica com palavras-chave e filtros por equipe e tipo de conteúdo.
- Acesso ao conteúdo completo de registros, testes e eventos para todos os perfis, inclusive visitante.
- Contrato público versionado que entrega ao BIOGLOW exclusivamente registros e testes do SESI Hortobots FLL.

### Exportação e armazenamento

- Exportação gratuita e ilimitada de registros e testes para PDF A4 em retrato.
- PDFs com identidade da equipe, logo da competição, textos, tags, tentativas, gráficos e mídias.
- Persistência local estruturada na pasta `Logs/` para desenvolvimento.
- Infraestrutura preparada para Supabase Database, Supabase Storage e deploy contínuo no Render.
- API Express responsável por autenticação, permissões, registros, testes, eventos e entrega da SPA.

### Qualidade e compatibilidade

- Layout sem overflow horizontal nos principais fluxos entre 320 px e 1920 px de largura.
- Formulários reorganizados por breakpoint para reduzir rolagem sem remover campos.
- Suporte a preferências de movimento reduzido sem perder feedback visual de seleção.
- Testes automatizados de permissões, busca, atividades e recursos visuais críticos.

[1.0.0]: https://github.com/TiagoFG-DEV/Hortobots-Planning/releases/tag/v1.0.0
