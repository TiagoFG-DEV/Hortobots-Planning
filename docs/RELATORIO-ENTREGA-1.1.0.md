# Relatório de trabalho — Hortobots Planning 1.1.0

Data do relatório: **15 de outubro de 2026**. Implementação iniciada em 14 de outubro de 2026.

Repositório: [TiagoFG-DEV/Hortobots-Planning](https://github.com/TiagoFG-DEV/Hortobots-Planning).

Branch desta entrega: `entrega/v1.1.0-relatorio-2026-10-15`.

Base da implementação: `390f03f18c27dc4ba86b4e1fe992068c8f09566a` (`main` no início do trabalho).

## 1. Situação real da entrega

Esta branch reúne o código desenvolvido para desempenho por temporada, banners científicos, notificações por Gmail e feedbacks da Gestão, além deste relatório. A versão dos pacotes foi atualizada para **1.1.0**.

**A implementação existe e compila, mas ainda não está homologada para produção.** A revisão realizada para preparar este relatório identificou bloqueios funcionais que os testes unitários anteriores não detectaram. Os principais são a ordem das rotas Express, que impede o acesso a parte das novas funcionalidades, e a ausência de preservação incremental do banner no fallback local.

Este documento retifica o alcance da mensagem anterior de conclusão: build aprovado, testes unitários e estrutura válida de PPTX não comprovam funcionamento completo das telas autenticadas, entrega de e-mails, síntese real por IA ou edição no Canva. A publicação desta branch é a entrega do estado atual para revisão, com as pendências abaixo documentadas. Não significa implantação, merge na `main` ou aprovação para uso em produção.

## 2. Pedido atendido e escopo do trabalho

O pedido original solicitou estudo do repositório e do site, pesquisa sobre FLL Challenge e OBR e quatro frentes de implementação:

1. Vincular a pontuação dos testes ao máximo da temporada e mostrar desempenho/aproveitamento.
2. Gerar um banner A×B a partir da pergunta-problema, pesquisa e design do robô, com síntese por IA e exportação editável no Canva.
3. Notificar Gestão, Coordenação e Técnico sobre eventos importantes, com endereços administrados somente pelo Mentor e acesso direto ao evento após o login da Gestão.
4. Permitir comentários da Gestão em registros, testes e eventos com identificação de Direção, Coordenação ou Técnico.

O repositório foi clonado e sua estrutura examinada. Foram estudados os componentes de autenticação, permissões, cadernos, testes, calendário, armazenamento local/Supabase, exportação e integração do portal BIOGLOW. A inspeção prática ocorreu na aplicação local; não houve homologação do site de produção.

Nesta etapa de relatório e publicação, o código funcional da entrega anterior foi preservado. As falhas descobertas foram diagnosticadas e registradas, sem apresentá-las como corrigidas.

## 3. Arquitetura encontrada e mantida

| Camada | Tecnologia e responsabilidade |
| --- | --- |
| Interface | React, TypeScript e Vite em `apps/web`; navegação por caderno e perfil |
| API | Express e TypeScript em `apps/api`; autenticação, permissões, persistência e integrações |
| Compartilhado | `packages/shared`; permissões e dados de temporada |
| Persistência local | Arquivos em `Logs/`; dados de colaboração em `Logs/colaboracao` |
| Persistência em nuvem | Supabase Database/Storage; migrações em `supabase/migrations` |
| Hospedagem prevista | Render, configurado em `render.yaml` |
| Perfis existentes | Gestão, Mentor, Aluno FLL e Aluno OBR; consultas públicas para visitantes |

O portal BIOGLOW integrado já existia na base clonada. Esta entrega não deve ser interpretada como autoria da integração anterior desse portal.

## 4. Pesquisa das competições e vínculo de pontuação

### 4.1 Fontes consultadas na implementação

- [Materiais oficiais FLL Challenge](https://www.firstinspires.org/resources/library/fll/season-materials).
- [Manual BIOGLOW 2026/2027](https://firstinspires.blob.core.windows.net/fll/challenge/2026-27/fll-challenge-bioglow-rgr.pdf).
- [Atualizações BIOGLOW](https://firstinspires.blob.core.windows.net/fll/challenge/2026-27/fll-challenge-bioglow-updates.pdf).
- [Documentos e manuais OBR](https://obr.robocup.org.br/documentos-e-manuais/).
- [Manual OBR 2026 — Regional/Estadual, versão 1.2](https://obr.robocup.org.br/wp-content/uploads/2026/07/OBR2026_REGIONAL_ESTADUAL_MANUAL-DE-REGRAS-E-INSTRUCOES_v1.2.pdf).

Os links acima registram a base de pesquisa usada. Não há atualização automática das regras na plataforma. A OBR foi modelada para Resgate, a partir do documento regional/estadual indicado; outras modalidades, fases e adaptações locais não foram integralmente modeladas.

### 4.2 O que foi implementado

Foi criado `packages/shared/src/season.ts`, com BIOGLOW 2026/2027, quinze missões, valores parciais/máximos, indicadores de missão compartilhada e de pontos perdíveis, inspeção de equipamento e tabela de discos de precisão. O teto cadastrado é **530 pontos**.

O painel `PerformancePanel.tsx` mostra melhor resultado, média, percentuais e distância até o teto. Os gráficos passaram a usar a pontuação máxima como referência de escala. Testes salvos recebem o campo `maxScore`; na OBR, o usuário pode informar o teto da arena.

No cadastro atual, a soma é 460 pontos de missões + 20 de inspeção + 50 de precisão = 530. A escala de discos cadastrada é 0→0, 1→10, 2→15, 3→25, 4→35, 5→50 e 6→50. M04 e M10 têm indicadores de perda; M07 tem indicador de compartilhamento.

### 4.3 Limites e verificações necessárias

- A soma é verificada por teste, mas isso não valida a interpretação individual das regras. Na implementação houve ajuste da M07 de 40 para 30 para compatibilizar a soma; a interpretação de cada bônus compartilhado e as quantidades de objetos por missão precisam de nova conferência independente no manual, montagem e atualizações. Não usar apenas o fechamento em 530 como comprovação regulamentar.
- O campo `minimum` representa o menor resultado positivo cadastrado, não a garantia de pontuação; uma missão não realizada pode resultar em zero.
- Não foi criada uma calculadora arbitral por condição de missão. A pontuação das tentativas continua sendo informada manualmente.
- Não há catálogo para trocar de temporada, importar atualizações oficiais ou preservar uma identificação de temporada por teste antigo.
- O percentual é limitado a 100%; valores acima do teto precisam de validação de domínio no servidor e de mensagem clara ao usuário.
- O teto de mesa não representa a pontuação global da competição. Projeto de Inovação, Design do Robô e Core Values não foram reunidos em um sistema de avaliação geral.
- Para OBR, faltam cálculo automático por obstáculos, resgate, multiplicadores e particularidades de cada nível/fase. Foi implementado somente o denominador configurável para análise de aproveitamento.

## 5. Banner científico A×B

### 5.1 Componentes implementados

`BannerStudio.tsx` apresenta pergunta-problema, largura/altura em centímetros, anexos de pesquisa e anexos de design do robô. As dimensões aceitas pela API são de 20 a 142 cm em cada eixo; o padrão é 90 × 120 cm.

O backend filtra os registros/testes por equipe e utiliza até vinte de cada. Dos registros, utiliza título, resumo e tags; dos testes, título, objetivo, comentários e missão. A geração não interpreta imagens/vídeos e não incorpora automaticamente as medições detalhadas de todas as tentativas.

`bannerService.ts` implementa extração de texto de DOCX, XLSX/XLSM, PDF e texto simples; geração de conteúdo estruturado; fallback por palavras frequentes e frases predefinidas; e exportação PPTX com formas e caixas de texto.

O ciclo previsto na interface é:

1. Sem banner: **Criar Banner**.
2. Com banner: **Atualizar Banner** e **Excluir Banner**, mais um link de download `.pptx`.
3. Exclusão: confirmação na própria interface e retorno ao estado de criação.

Há um registro persistido por equipe, contador de versão, datas e referências das fontes. A criação tenta impedir substituição acidental com resposta de conflito quando já existe um banner. Mentor e alunos da modalidade correspondente podem gerenciar; Gestão tem visualização.

### 5.2 Integração de IA implementada

A chamada usa a API Responses, modelo padrão `gpt-5-nano`, saída JSON estruturada, `store: false`, baixa verbosidade e limite de 650 tokens de saída. O texto é reduzido por limites de caracteres: pergunta até 900, pesquisa até 8.000 e design até 8.000 no payload, além do banner anterior na atualização.

Esses limites reduzem o volume enviado, mas não demonstram consumo mínimo de tokens nem custo real. Não houve chamada autenticada ao provedor nem medição de uso. O contrato do modelo/schema, a suficiência do limite de saída e o comportamento em respostas incompletas ainda precisam de teste.

Sem chave ou em erro, entra o fallback local. Ele não oferece a mesma interpretação semântica da IA e inclui frases genéricas de inovação/aprendizado, que não devem ser confundidas com resultados comprovados da equipe.

### 5.3 Pendências funcionais

- **Atualização incremental incompleta:** o fallback ignora `previous`; ao atualizar sem os anexos originais, pode perder afirmações do banner anterior. Com IA, a preservação depende do prompt e não é garantida por uma regra de mesclagem.
- Os arquivos anexados e seu texto extraído não são armazenados como acervo persistente do banner; são guardados nomes/referências. Não há histórico recuperável das versões anteriores, apenas o registro mais recente.
- A pesquisa do caderno é concatenada antes dos anexos; o corte de contexto pode excluir a documentação anexada. A prioridade solicitada para documentos de pesquisa precisa ser garantida no código.
- O limite de oito arquivos por grupo é aplicado por corte da lista. Faltam rejeição explícita de excesso, validação antecipada no navegador e controle de tamanho total; o limite JSON da API é 80 MB, inferior a alguns conjuntos possíveis após base64.
- DOC/XLS antigos não têm suporte. Planilhas complexas usam valores armazenados, sem recálculo de fórmulas; PDFs escaneados não têm OCR.
- Ainda precisam ser testados arquivos reais, PDFs protegidos/corrompidos, documentos grandes e arquivos Office muito comprimidos. Os testes atuais não constituem auditoria de segurança dos parsers.
- Erros de extração podem virar apenas uma referência ao nome do arquivo. É necessário tornar essa perda de conteúdo perceptível ao usuário.
- O PPTX foi validado como arquivo ZIP Office com slide XML. **Não foi importado no Canva**, nem renderizado para verificar cortes, fontes e legibilidade nas dimensões extremas. A edição elemento por elemento no Canva é objetivo da exportação, não uma homologação já realizada.
- Não há integração direta com a API do Canva nem sincronização de edições feitas no Canva de volta à plataforma.

## 6. E-mails de eventos importantes

### 6.1 Código implementado

Foi criada a tela `MentorSettings.tsx` com três endereços: Gestão, Coordenação e Técnico. Há verificações de papel na interface e nas rotas específicas. A configuração é global na plataforma; não há destinatários separados por cada uma das três equipes.

Na criação de evento marcado como importante ou com prioridade urgente, a API salva o evento e tenta enviar uma mensagem com os três destinatários no cabeçalho `To`. O serviço renova o token OAuth e usa `users.messages.send` da Gmail API. O HTML contém tema verde, descrição, data, período, horário e botão para o evento.

O link aponta para `/login?profile=gestao&returnTo=...`, preservando a rota de calendário com data e ID do evento. A interface contempla abertura do evento em modal e ações de confirmação/recusa para a Gestão quando o estado é `PENDENTE`.

Os resultados de envio ficam em `notificationStatus`: `ENVIADO`, `PENDENTE: ...` ou `FALHOU: ...`.

### 6.2 O que ainda falta

- Configurar a conta remetente, OAuth Google, refresh token e URL pública no servidor; cadastrar os três destinatários via Mentor depois de corrigir as rotas.
- Fazer envio real e verificar recebimento nos três endereços, conteúdo, links, acentuação e layout em clientes de e-mail de computador/celular.
- O requisito **SEMPRE** ainda não está garantido: existe uma tentativa síncrona no cadastro, sem fila persistente, retentativas, reenvio manual, deduplicação ou recuperação após reinício.
- `ENVIADO` significa aceitação da chamada pela API, não confirmação de entrega/leitura na caixa de entrada.
- Alterar um evento comum para importante não dispara e-mail; o disparo está somente no cadastro inicial.
- A edição de evento pode alterar seu status de decisão pelo payload do formulário e, em Supabase, limpar `notification_status` quando esse campo não vem no payload. É necessário preservar o histórico e definir as transições permitidas.
- Há mensagens na interface herdadas dizendo que eventos exigem autorização, enquanto o requisito novo descreve decisão opcional. Esse texto e as regras de estado precisam ser harmonizados.
- O login completo seguido da abertura do evento e da decisão não foi testado com contas autenticadas. Também falta testar o link quando já existe uma sessão de outro perfil.
- A existência de credenciais e limites da conta Google condiciona o serviço; a integração não foi validada como envio ilimitado.

## 7. Feedbacks da Gestão

`FeedbackThread.tsx` foi integrado aos detalhes de registros, testes e eventos. O formulário aceita uma tag (`DIREÇÃO`, `COORDENAÇÃO` ou `TÉCNICO`) e mensagem de até 2.000 caracteres, com data/hora de publicação. As tags são rótulos escolhidos pelo mesmo perfil Gestão, não três identidades autenticadas distintas.

Foram implementados serviço local/Supabase e rotas de leitura/criação com validação do alvo e da permissão de publicação. No desenho atual, a leitura dos comentários é pública, acompanhando o acervo público, e as políticas SQL também permitem leitura pública.

Pendências: corrigir o bloqueio das rotas; validar criação/leitura real nos três tipos de item; testar impedimento por todos os outros perfis; conferir persistência e isolamento entre itens. Não há edição/exclusão de feedback, respostas encadeadas ou limpeza de comentários órfãos ao excluir o item original. A política de leitura pública precisa ser confirmada para o uso esperado da escola.

## 8. Bloqueio confirmado: ordem das rotas da API

Em `apps/api/src/server.ts`, as rotas genéricas são registradas antes das novas rotas específicas. Elas respondem `404` quando `kind` não é `registros`, `testes` ou `eventos`, encerrando a requisição sem encaminhá-la para o próximo handler.

| Rota nova | Interceptação atual |
| --- | --- |
| `GET /api/feedbacks` | `GET /api/:kind` |
| `POST /api/feedbacks` | `POST /api/:kind`, após autenticação |
| `GET /api/configuracoes/notificacoes` | `GET /api/:kind/:id` |
| `PUT /api/configuracoes/notificacoes` | `PUT /api/:kind/:id`, após autenticação |
| `GET /api/banners/:teamKey` | `GET /api/:kind/:id` |
| `PUT /api/banners/:teamKey` | `PUT /api/:kind/:id`, após autenticação |
| `DELETE /api/banners/:teamKey` | `DELETE /api/:kind/:id`, após autenticação |

Verificação somente de leitura realizada na API local:

```text
GET /api/health                                         -> 200, ok: true, storage: local
GET /api/feedbacks?targetKind=eventos&targetId=deadbeef   -> 404, Recurso não encontrado.
GET /api/banners/fll                                    -> 404, Recurso não encontrado.
GET /api/configuracoes/notificacoes                     -> 404, Recurso não encontrado.
```

A rota de configuração deveria alcançar a autenticação e retornar `401` sem sessão. O `404` observado é evidência de interceptação. Para banners, o handler específico possui outra mensagem para banner ausente, distinguindo os dois casos.

**Correção prioritária ainda não aplicada:** registrar as rotas específicas antes das genéricas, usar routers separados ou encaminhar recursos não reconhecidos. Depois, adicionar testes HTTP de integração para cada rota, incluindo casos autenticados. A criação do banner e o download têm formatos diferentes e não sofrem a mesma interceptação; isso não resolve o bloqueio de leitura, atualização e exclusão.

## 9. Banco de dados e configuração

A migração `supabase/migrations/0003_collaboration_banner_notifications.sql` foi escrita com:

- `events.important`, `events.notification_status` e estado `RECUSADO`.
- `tests.max_score`.
- Tabelas `app_settings`, `feedbacks` e `banners`.
- RLS habilitada; leitura pública para banners e feedbacks; nenhuma política pública de leitura das configurações.

**A migração não foi executada em Supabase nesta entrega.** É necessário testar aplicação em uma base com as migrações anteriores, permissões e persistência. Sua reexecução também requer revisão, pois as políticas são criadas sem proteção contra duplicidade.

O serviço existente de armazenamento ignora alguns objetos `error` retornados pelas chamadas Supabase e usa `catch` como tratamento principal. Isso pode aparentar sucesso sem gravação quando a migração estiver ausente ou ocorrer erro de banco. Deve ser revisado antes da homologação em nuvem.

Variáveis adicionadas ao exemplo/configuração de deploy:

| Variável | Finalidade |
| --- | --- |
| `PUBLIC_APP_URL` | Origem pública absoluta usada no link do e-mail |
| `OPENAI_API_KEY` | Chave de síntese interpretativa; ausente aciona fallback |
| `OPENAI_BANNER_MODEL` | Modelo, com padrão `gpt-5-nano` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Cliente OAuth Google |
| `GOOGLE_REFRESH_TOKEN` | Renovação de autorização da conta remetente |
| `GMAIL_SENDER` | Usuário Gmail; padrão `me` |
| `GMAIL_FROM_EMAIL` | Endereço autorizado do remetente |

As chaves devem ser configuradas no servidor, fora do Git. O arquivo `.env.example` contém campos de exemplo. O guia complementar está em [INTEGRACOES.md](INTEGRACOES.md). É necessário validar a versão efetiva do Node no Render contra as dependências novas; o ambiente local usado não comprova compatibilidade com qualquer versão antiga do Node 20.

## 10. Testes e evidências

### 10.1 Testes automatizados reexecutados para o relatório

| Comando | Resultado |
| --- | --- |
| `npm test -w @hortobots/shared` | 8 testes aprovados em 2 arquivos |
| `npm exec -w @hortobots/api -- vitest run src --reporter=verbose` | 7 testes aprovados em 3 arquivos-fonte |
| `npm test -w @hortobots/web` | 13 testes aprovados em 2 arquivos |
| `npm audit --audit-level=high` | 0 vulnerabilidades reportadas na execução |
| `git diff --check` | Sem erros de whitespace; avisos de normalização LF/CRLF nos manifests |

**Total correto: 28 testes únicos aprovados.** A informação anterior de 35 vinha da execução também de cópias JavaScript dos testes da API em `dist`, geradas pelo build. São 7 casos duplicados, não sete testes adicionais. O comando acima restringe a execução da API a `src`. Ainda falta ajustar a configuração permanente do runner/build para evitar duplicidade.

Cobertura efetiva: matriz de permissões em funções isoladas; soma interna de temporada e percentuais; filtragem do acervo; busca e recursos visuais já existentes; extração básica de DOCX/XLSX artificiais; existência de estrutura de slide em PPTX; construção de URL/HTML de e-mail; recusa de envio com destinatários incompletos.

Não há cobertura de integração das novas rotas Express, CRUD real com sessão, bancos local/Supabase, resposta real da IA, entrega Gmail, importação Canva, concorrência ou recuperação de falhas. A ausência de avisos no npm audit não é uma auditoria de segurança da aplicação.

### 10.2 Build já realizado na implementação

`npm run build` terminou com código 0, compilando shared, API e frontend. O Vite reportou um aviso de bundle acima de 500 kB, principalmente no módulo de exportação PDF. O build foi validado antes deste relatório; a elaboração do relatório não modificou a lógica da aplicação.

### 10.3 Inspeção visual já realizada

- Calendário público local em 1440 × 900 e 390 × 844.
- Login por link com `profile=gestao`, confirmando a seleção visual de Gestão.
- Inspeção do destino codificado no link.

Essas verificações não abrangem as novas telas autenticadas de banner, configuração e publicação de feedback. Não houve recebimento/renderização do e-mail em Gmail/Outlook, nem inspeção visual de banner exportado em Canva. Não há evidência de execução completa do login seguido da decisão no evento.

## 11. Plano de conclusão e critérios de aceite

| Prioridade | Trabalho ainda necessário | Critério de aceite |
| --- | --- | --- |
| Bloqueante | Corrigir ordem/encaminhamento das rotas | Leitura e escrita das novas rotas alcançam seus handlers; autenticação/permissões respondem corretamente |
| Bloqueante | Preservar conteúdo incremental do banner | Atualizar sem reenviar anexos mantém fatos anteriores, acrescenta novos e conserva identidade/data original |
| Alta | Completar testes HTTP autenticados | Mentor configura; Gestão comenta/decide; alunos respeitam modalidade; visitantes não escrevem |
| Alta | Validar Gmail e recuperação de falhas | Três destinatários recebem; erro não perde o evento; pendências podem ser reenviadas sem duplicação |
| Alta | Validar IA real | Saída válida, fundamentada e completa; atualização preserva fatos; tokens/custo registrados |
| Alta | Homologar PPTX no Canva | Importação com textos/formas editáveis, proporção correta e ausência de cortes em retrato/paisagem |
| Alta | Aplicar migração em ambiente de teste | CRUD persistente, permissões verificadas e falhas de banco reportadas ao cliente |
| Alta | Conferir tabela FLL com fontes primárias | Quantidades, condições, bônus compartilhados, perdas e soma confirmados individualmente |
| Alta | Revisar status de eventos e destinatários | Decisão opcional consistente; edição preserva histórico; configuração global ou por equipe explicitamente definida |
| Média | Validar conteúdo de anexos e prioridade | Documentos de pesquisa entram no contexto antes do corte; formatos inválidos geram mensagem útil |
| Média | Fortalecer limites e concorrência | Upload grande tratado; criação/atualização simultânea não sobrescreve ou perde dados silenciosamente |
| Média | Corrigir contagem permanente dos testes | Runner não executa cópias em `dist`; contagem estável antes/depois do build |
| Média | Homologar UI das novas telas | Navegação, teclado, modal, textos longos e layouts desktop/celular aprovados com cada perfil |
| Média | Completar modelagem por temporada/OBR | Referências históricas preservadas e critérios da arena explícitos; sem confundir mesa com avaliação geral |

### Roteiro manual mínimo após as correções

1. Entrar como Mentor, salvar três endereços de teste e recarregar a página para verificar persistência.
2. Criar evento importante; comprovar recebimento nos três endereços e status de envio salvo.
3. Abrir o e-mail sem sessão, fazer login como Gestão e verificar que data e evento corretos são abertos.
4. Testar confirmar, recusar e apenas consultar sem decidir; editar como Mentor e verificar preservação do estado definido.
5. Publicar um feedback de cada tag em registro, teste e evento; verificar leitura após recarga e bloqueio dos demais perfis.
6. Criar banner em cada caderno com materiais de exemplo conhecidos; verificar que não há mistura entre equipes.
7. Atualizar com e sem anexos, com IA e fallback; conferir fatos anteriores e novos, versão e fontes.
8. Baixar e importar no Canva; editar título, parágrafos e formas separadamente e conferir tamanho físico/legibilidade.
9. Excluir um banner de teste e recriar; verificar remoção e comportamento da interface.
10. Registrar tentativas FLL e OBR, conferir percentuais manualmente, recarregar os testes e repetir nos dois modos de armazenamento.
11. Simular falha de rede, credenciais inválidas, ausência de migração, anexo inválido e atualização simultânea; conferir mensagens e integridade dos dados.

## 12. Inventário dos arquivos da entrega

| Grupo | Arquivos principais |
| --- | --- |
| Temporada | `packages/shared/src/season.ts`, `packages/shared/src/index.ts`, `packages/shared/tests/season.test.ts` |
| Permissões | `packages/shared/src/permissions.ts`, `packages/shared/tests/permissions.test.ts` |
| API e dados | `apps/api/src/server.ts`, `apps/api/src/storageService.ts`, `apps/api/src/collaborationService.ts` |
| Banner | `apps/api/src/bannerService.ts`, `apps/api/src/bannerService.test.ts`, `apps/web/src/BannerStudio.tsx` |
| Notificações | `apps/api/src/notificationService.ts`, `apps/api/src/notificationService.test.ts`, `apps/web/src/MentorSettings.tsx` |
| Interface compartilhada | `apps/web/src/App.tsx`, `CalendarView.tsx`, `ActivityCard.tsx`, `FeedbackThread.tsx`, `PerformancePanel.tsx`, `client.ts`, `styles.css` |
| Banco | `supabase/migrations/0003_collaboration_banner_notifications.sql` |
| Dependências/versão | `package.json`, `package-lock.json`, manifests de API, web e shared |
| Operação | `.env.example`, `render.yaml` |
| Documentação | `README.md`, `CHANGELOG.md`, `docs/INTEGRACOES.md` e este relatório |

Foram adotados JSZip, pdf-parse e PptxGenJS para documentos/exportação. As dependências intermediárias Mammoth/ExcelJS usadas durante o desenvolvimento foram removidas. PptxGenJS está fixado em 4.0.0 e `image-size` tem override 2.0.4; a geração básica foi testada com essa combinação.

## 13. Publicação e entrega operacional

O código-fonte atual e este documento são entregues juntos na branch indicada no cabeçalho. O identificador exato do commit pode ser consultado no histórico da branch; não está embutido aqui para evitar autorreferência de hash.

Não fazem parte da publicação arquivos `.env` com segredos, dados locais em `Logs/`, `node_modules`, diretórios `dist`, backups e caches. Eles são dados de ambiente ou artefatos regeneráveis e estão excluídos pelo `.gitignore`. As variáveis de exemplo, migrações e lockfile necessários à reprodução estão incluídos.

Não foi aplicada migração ao banco de produção, configurado OAuth real, enviado e-mail a destinatários, publicado banner no Canva nem solicitado deploy/merge da nova branch. Para operar a versão em produção, concluir os bloqueios, executar o roteiro de homologação e configurar os serviços externos.

Este relatório é a referência atual sobre os limites da entrega quando houver divergência com afirmações mais amplas do README, CHANGELOG ou mensagem anterior de conclusão.
