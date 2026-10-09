# Equipes e pesquisa no calendário

A visualização padrão de `/calendario` continua sendo o calendário mensal. A guia **Pesquisa geral** (`?view=list`) reúne registros, testes e eventos pela data da atividade, da mais recente para a mais antiga. Em datas iguais, o horário de criação desempata a ordenação.

A busca combina palavras-chave, time e tipo. Palavras são pesquisadas sem distinção de maiúsculas ou acentos, nos títulos, conteúdos, tags, datas e nomes de mídias. Os resultados são paginados em grupos de 20.

## Tema e identificação

- O seletor **TEMA · FLL**, na página do caderno e no menu lateral, alterna entre SESI Hortobots e Under Construction. A preferência fica no navegador e não muda permissões nem separa a modalidade FLL.
- Novos registros recebem uma tag de time. Novos testes usam o campo `team` já existente. O seletor de time do formulário permite confirmar a identificação antes de salvar.
- Ao editar, a identificação salva prevalece sobre o tema escolhido, evitando reclassificar registros antigos por acidente.
- Registros FLL antigos sem identificação são exibidos como SESI Hortobots. É possível corrigir a equipe na edição; nenhum registro é migrado automaticamente.
- Eventos sem equipe específica pertencem à **Agenda geral** e aparecem em **Todos os times**.

Nenhuma alteração de esquema do Supabase é necessária: registros usam `tags`, e testes mantêm os valores compatíveis `Hortobots` e `UnderConstruction` em `team`.

## Verificação

Execute `npm run test -w @hortobots/web` para testar identificação, preservação de tags, busca combinada e ordenação. Execute `npm run build` para validar o projeto completo.
