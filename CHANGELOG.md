# Histórico de versões

As versões futuras devem ser acrescentadas no topo deste arquivo, preservando o histórico já publicado.

## [1.0.0] — 2026-10-10

Primeira versão estável do Hortobots Planning, reunindo o fluxo completo de planejamento, documentação e consulta das equipes de robótica do SESI 437 Hortolândia.

### Plataforma e identidade

- Aplicação responsiva em React, TypeScript e Node.js, preparada para desktop, notebook, tablet e celular.
- Três cadernos independentes: SESI Hortobots FLL, Under Construction FLL e Hortobots OBR.
- Identidade visual própria por equipe, com fundos, cores, logos e transições dedicadas.
- Home centralizada para escolha do diário e acesso rápido ao calendário, acervos, pesquisa geral e créditos.
- Backgrounds fixos, rolagem exclusivamente vertical e barras de rolagem visualmente ocultas.
- Navegação por teclado, foco visível, alvos de toque e comportamento adaptado a telas sensíveis ao toque.
- Tela de carregamento que aguarda fontes, imagens críticas e estabilização visual antes de revelar a interface.

### Contas e permissões

- Autenticação por quatro perfis: Gestão, Mentor, Aluno FLL e Aluno OBR.
- Modo visitante para consultar calendário, pesquisa e conteúdos publicados sem alterar dados.
- Gestão com visualização geral, criação de eventos e aprovação de eventos pendentes.
- Mentor com gestão completa de eventos e consulta dos conteúdos técnicos.
- Alunos com criação, edição e exclusão restritas aos registros e testes dos próprios cadernos.
- Validação de permissões tanto na interface quanto na API.

### Registros técnicos

- Criação e edição de registros com data, título, resumo, relato técnico e tags personalizadas.
- Separação automática por equipe e modalidade.
- Upload, visualização ampliada e persistência de imagens e vídeos.
- Acervo pesquisável por texto, tag e data.
- Cartões responsivos com ações condicionadas à autoria e ao perfil autenticado.

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

### Exportação e armazenamento

- Exportação gratuita e ilimitada de registros e testes para PDF A4 em retrato.
- PDFs com identidade da equipe, logo da competição, textos, tags, tentativas, gráficos e mídias.
- Persistência local estruturada na pasta `Logs/` para desenvolvimento.
- Infraestrutura preparada para Supabase Database, Supabase Storage e deploy contínuo no Render.
- API Express responsável por autenticação, permissões, registros, testes, eventos e entrega da SPA.

### Qualidade e compatibilidade

- Layout sem overflow horizontal nos principais fluxos entre 320 px e 1920 px de largura.
- Formulários reorganizados por breakpoint para reduzir rolagem sem remover campos.
- Créditos enquadrados em um único viewport, inclusive em celulares no modo paisagem.
- Suporte a preferências de movimento reduzido sem perder feedback visual de seleção.
- Testes automatizados de permissões, busca, atividades e recursos visuais críticos.

[1.0.0]: https://github.com/TiagoFG-DEV/Hortobots-Planning/releases/tag/v1.0.0
