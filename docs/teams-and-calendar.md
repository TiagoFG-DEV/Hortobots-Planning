# Equipes e pesquisa no calendário

A visualização padrão de `/calendario` continua sendo o calendário mensal. A guia **Pesquisa geral** (`?view=list`) reúne registros, testes e eventos pela data da atividade, da mais recente para a mais antiga. Em datas iguais, o horário de criação desempata a ordenação.

A busca combina palavras-chave, time e tipo. Palavras são pesquisadas sem distinção de maiúsculas ou acentos, nos títulos, conteúdos, tags, datas e nomes de mídias. Os resultados são paginados em grupos de 20.

## Três cadernos independentes

- `/fll`: SESI Hortobots, modalidade FLL, verde e branco.
- `/underconstruction`: Under Construction, modalidade FLL, roxo, rosa e preto.
- `/obr`: Hortobots, modalidade OBR, vermelho, dourado e preto.

A página inicial apresenta os três cadernos. Cada um tem logo, capa, navegação, formulários e listas próprias. O caderno determina a equipe: registros recebem sua tag canônica e testes usam o campo `team`. Não existe mais um seletor que mistura os dois times dentro do mesmo formulário.

- A conta Aluno FLL continua atendendo ambos os cadernos FLL; a separação dos cadernos não cria um novo perfil de acesso.
- Registros e testes já identificados como Under Construction aparecem no terceiro caderno. Links antigos são redirecionados para o caderno correto antes de permitir edição.
- Registros FLL antigos sem identificação continuam em SESI Hortobots. Nenhum arquivo é migrado ou reclassificado automaticamente, e a antiga preferência de tema do navegador não influencia os dados.
- Eventos sem equipe específica pertencem à **Agenda geral** e aparecem em **Todos os times**.

Os fundos continuam fixos, com transição de opacidade entre cadernos. A preferência de movimento reduzido é respeitada. As barras de rolagem ficam invisíveis, mas mouse, toque e teclado continuam permitindo rolar o conteúdo.

Nenhuma alteração de esquema do Supabase é necessária: registros usam `tags`, e testes mantêm os valores compatíveis `Hortobots` e `UnderConstruction` em `team`.

## Verificação

Execute `npm run test -w @hortobots/web` para testar identificação, preservação de tags, busca combinada e ordenação. Execute `npm run build` para validar o projeto completo.
