# Histórico de versões

As versões futuras devem ser acrescentadas no topo deste arquivo, preservando o histórico já publicado.

## [2.0.0] — 2026-10-15

### Orientações e Demandas do Projeto (Prompts Originais)

Esta versão consolida os trabalhos de expansão e correções estruturais solicitadas pela coordenação e desenvolvimento:

1. **Notificações por E-mail e Calendário Contínuo:**
   > *"O principal trabalho que teremos será o de enviar email avisando quando um evento for lançado: Ambos estilizados, mas um contendo o conteudo do evento do tipo COMUM com um botão Visualizar Evento para entrar no site, na pagina de login do perfil GESTÃO que, quando autenticado vá direto para o calendário onde tem esse evento. Segundo, o segundo tipo de evento, URGENTE, também terá um email estilizado no tema do site com o mesmo botão e funcionalidade, mas a propósta é ir com a finalidade de aprovar o evento. Os emails precisam ser enviados automaticamente visto que são para a direção escolar. Um novo email deverá ser enviado se um evento for editado. Somente se o evento for excluído que não será enviado nenhum email. Também, é preciso atualizar o calendário que só está contemplando os meses OUTUBRO, NOVEMBRO e DEZEMBRO quando na verdade eles deveriam contemplar todos os meses com navegação contínua."*

2. **Pesquisa de Registros e Lei Geral de Visualização Irrestrita:**
   > *"Troque o texto do botão 'Pesquisa geral' para 'Pesquisar registros'. Também, veja que em determinados perfis, principalmente os de alunos, alguns registros de outras equipes são omitidos. Isso não deve acontecer. Lei geral: TODOS os registros devem poder ser VISUALIZADOS por TODOS os perfis, incluindo se for alunos de uma equipe DIFERENTE. Ou seja, conserte a busca para garantir que tudo possa ser visualizado INDEPENDENTE do perfil. Analise para descobrir se existe alguma incongruência."*

3. **Elementos das Competições e Estúdio de Banner para Canva:**
   > *"Existe orientações para incluir elementos das competições nos cadernos dos alunos específicos. Ou seja, mais FLL nos criar registro e testes e simulações dos times FLL, incluindo desempenho, CRIAÇÃO DE BANNER sob elementos do CANVA, ou seja, um arquivo pré feito que possa ser editado dentro da própria plataforma/web site Canva.com separando os elementos, caixas textuais e etc. Garanta que esse arquivo seja completado ao final do seu trabalho."*

4. **Unificação de Branches na MAIN:**
   > *"Unifique as branchs. A atualização deve pertencer a branch principal MAIN, portanto todo o projeto deve ser unificado e a versão a se preservar é esta. Portanto, unifique as branchs, delete a segunda branch mantendo somente a branch main e faça novamente o push para lá."*

---

### Diagnóstico e Solução Arquitetural

#### 1. Lei Geral de Visualização Irrestrita de Cadernos e Registros
- **Diagnóstico da incongruência:**
  - Na tela inicial (`Home`), se a conta logada não tivesse privilégio de escrita (`canCreateTeamContent`), os links das equipes direcionavam para `teamArchiveUrl(key)` (`/calendario?view=list&team=...`), aplicando um filtro compulsório de time.
  - No componente `Hub` de cada caderno, contas sem permissão de escrita eram barradas com um `<Navigate to={teamArchiveUrl} replace />`.
  - Na tela de busca (`CalendarView`), o parâmetro `&team=` permanecia na URL e no estado local mesmo após o usuário tentar ver outros itens.
- **Implementações e Solução:**
  - **Acesso direto aos cadernos:** O seletor de cadernos na Home agora direciona **todas as contas** para o diário da equipe (`/${team.route}`).
  - **Hub flexível para visualização:** Perfis sem escrita (como alunos da outra modalidade ou visitantes) agora visualizam o Hub completo com os botões **Registros salvos** e **Testes salvos**, mantendo ocultos apenas os botões de criação e edição.
  - **Abertura universal de detalhes:** Os visualizadores de registros (`RecordView`) e testes (`TestView`) permitem leitura, reprodução de mídias anexadas (imagens e vídeos) e geração de relatórios oficiais em PDF A4 para todos os perfis.
  - **Purga de filtros de time:** Ao alternar para a visão de lista ("Pesquisar registros") ou acionar o botão "Limpar filtros", os parâmetros de time são removidos da URL e do estado, garantindo acervo 100% visível para todas as equipes.

#### 2. Nomenclatura Intuitiva da Busca
- Substituição global do termo "Pesquisa geral" para **"Pesquisar registros"** no cabeçalho do calendário, na barra de alternância de abas, nos atalhos rápidos da Home, no menu lateral móvel (`SideMenu`) e na tela de detalhes dos testes.

#### 3. Elementos Oficiais das Competições FLL e OBR
- **Formulário de Registros do Diário (`Editor`):**
  - **FIRST LEGO League (SESI Hortobots e Under Construction):** Inclusão de atalhos rápidos (*chips*) com um clique para adicionar as tags dos pilares oficiais: `+projeto-de-inovacao`, `+design-do-robo`, `+core-values`, `+treino-de-mesa`, `+missao-bioglow`, `+programacao`, `+mecanica` e `+calibracao`.
  - **Olimpíada Brasileira de Robótica (Hortobots OBR):** Inclusão de atalhos rápidos para as regras de Resgate 2026: `+resgate-2026`, `+seguidor-de-linha`, `+area-de-resgate`, `+vitimas`, `+obstaculos`, `+gangorra-redutor`, `+sensores` e `+programacao`.
- **Formulário de Simulações e Testes FLL (`Tests`):**
  - Integração com os dados oficiais da temporada BIOGLOW 2026/2027 (`BIOGLOW_SEASON`).
  - Painel orientativo dinâmico que exibe pontuação mínima e máxima da missão selecionada, critérios de pontuação detalhados, alertas de missão compartilhada ou pontos perdíveis e o teto oficial de 530 pontos.

#### 4. Estúdio de Banner Científico A × B Editável no Canva
- Mecanismo em `bannerService.ts` que sintetiza os cadernos da equipe e arquivos anexos (DOCX, XLSX, PDF, TXT) em uma narrativa visual.
- Exportação nativa para formato `.pptx` (PowerPoint) estruturado estritamente em **elementos independentes**: caixas de texto com tamanhos de fonte ajustáveis (`fit: shrink`), blocos geométricos coloridos com a identidade da equipe e linhas separadas.
- **Compatibilidade total com Canva.com:** O arquivo gerado pode ser importado diretamente no Canva, onde cada frase, título, fundo e forma geométrica se torna um elemento editável, viabilizando o acabamento gráfico final pela equipe.

#### 5. Notificações Automáticas e Deep Links
- Disparo automático de e-mails responsivos via API Gmail para eventos do tipo **COMUM** (notificação informativa) e **URGENTE** (solicitação de deliberação pela Direção/Gestão).
- Deep link com preservação de autenticação que redireciona a Gestão diretamente para o evento no calendário após o login.
- Reenvio automático de alertas caso o evento seja alterado.

#### 6. Painel Administrativo do Sistema
- Nova rota `/admin` com autenticação própria criptografada via `scrypt`, permitindo monitorar o status do banco de dados, armazenamento no Supabase Storage/Local, reset de senhas de usuários e troca da chave mestra administrativa.

---

### Plano de Testes e Garantias de Homologação

#### Testes Automatizados Executados (100% de Aprovação)
- **Suite `@hortobots/shared`:** Validação do teto oficial de 530 pontos da FLL BIOGLOW, consistência das 15 missões, cálculo de aproveitamento e matriz de permissões por perfil (`fll`, `obr`, `mentor`, `management`).
- **Suite `@hortobots/api`:** Teste de extração segura de anexos em Word, Excel e PDF; validação de integridade do arquivo PPTX com PptxGenJS; verificação de formato e deep links do e-mail de notificação.
- **Suite `@hortobots/web`:** Testes de algoritmo de busca sem regressões e ordenação cronológica decrescente.
- **Build de Produção:** Compilação com `tsc` e empacotamento com Vite sem erros de tipagem ou módulos ausentes.

#### Checklist para Homologação e Testes Manuais com Usuários Reais

Para os testes finais no ambiente de homologação e produção, seguir o roteiro abaixo:

1. **Navegação Cruzada entre Alunos:**
   - [ ] Fazer login com o perfil **Aluno FLL** (`aluno_fll`).
   - [ ] Na Home, clicar no caderno **Hortobots (OBR)**.
   - [ ] Confirmar que o diário OBR abre normalmente sem redirecionar para a busca com filtro forçado.
   - [ ] Entrar em **Registros salvos** e **Testes salvos** do caderno OBR e verificar a visualização dos itens.
   - [ ] Confirmar que os botões de edição e exclusão estão ocultos para este perfil.
   - [ ] Repetir o teste invertido: logar como **Aluno OBR** (`aluno_obr`) e abrir os cadernos **SESI Hortobots (FLL)** e **Under Construction (FLL)**.

2. **Validação da Busca Universal:**
   - [ ] Clicar no botão **Pesquisar registros** no calendário ou na Home.
   - [ ] Verificar que todos os registros (FLL, Under e OBR) aparecem listados juntos por ordem cronológica.
   - [ ] Testar os filtros de "Time" e "Tipo" e em seguida clicar em **Limpar filtros**; confirmar que o acervo completo retorna sem parâmetros residuais na URL.

3. **Criação com Elementos de Competição:**
   - [ ] No caderno FLL, abrir **Novo registro** e clicar nos chips de competição (`+projeto-de-inovacao`, `+design-do-robo`, etc.); confirmar que são adicionados às tags com um clique.
   - [ ] No caderno FLL, abrir **Simulações e testes**, selecionar uma missão (ex.: `M01 Drone Survey`) e confirmar se o card com os critérios oficiais e pontuação máxima/mínima é exibido.
   - [ ] No caderno OBR, verificar se os chips de Resgate 2026 aparecem no formulário de registros.

4. **Importação do Banner no Canva:**
   - [ ] No caderno de qualquer equipe, acessar a aba **Banner A × B**.
   - [ ] Clicar em **Baixar modelo editável para o Canva (.pptx)**.
   - [ ] Acessar [Canva.com](https://www.canva.com), fazer upload do arquivo baixado e abri-lo.
   - [ ] Confirmar que cada caixa de texto e cada forma geométrica podem ser movidas, editadas e coloridas separadamente.

5. **Disparo Real de E-mails via Gmail:**
   - [ ] Como Mentor, acessar **Configurações de Notificação** e cadastrar os e-mails da Direção/Gestão.
   - [ ] Lançar um evento urgente e um evento comum com o backend conectado às credenciais OAuth2 do Google Cloud Console.
   - [ ] Abrir a caixa de entrada dos destinatários e verificar a formatação dos e-mails e o funcionamento do botão de deep link para o login.

6. **Painel Administrativo:**
   - [ ] Acessar `/admin` (ou clicar no ícone discreto no rodapé da tela de login).
   - [ ] Informar a senha mestra administrativa e validar a exibição das métricas do banco de dados e perfis.

---

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
