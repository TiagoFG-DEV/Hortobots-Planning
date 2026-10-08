# Layout responsivo

As adaptações estão em `apps/web/src/responsive.css`, importado após os estilos da identidade visual. O desktop mantém a ordem e as colunas principais; as telas menores reorganizam essas mesmas seções conforme o espaço disponível.

## Fundo e rolagem

- `.app-backdrop` é um irmão das rotas, fixo à janela. Nenhuma transição de página ou altura do conteúdo altera sua posição.
- O fundo mantém a proporção original com `cover`, centralizado, com o recorte necessário para cada proporção de tela. A altura `100lvh` evita redimensionamentos causados pela barra do navegador móvel durante a rolagem.
- A página é o único contêiner de rolagem normal. Calendário, formulários e folhas não têm rolagem interna.
- Enquanto um menu ou diálogo estiver aberto, a rolagem da página é bloqueada e apenas a sobreposição pode rolar.
- Conteúdo longo continua acessível verticalmente; não se reduz o tamanho do texto para forçar tudo a caber na janela.

## Acessibilidade

Os perfis aceitam as setas do teclado. Diálogos e menu mantêm o foco dentro da sobreposição, fecham com Escape quando permitido e devolvem o foco ao acionador. Campos e controles de mídia têm nomes acessíveis, foco visível e áreas maiores em telas de toque. O movimento reduzido do sistema é respeitado. As caixas de texto recalculam a altura ao mudar a largura da tela.

## Verificação em 8 de outubro de 2026

Foram verificadas 12 rotas em 9 resoluções: 1920×1080, 1366×768, 1280×600, 1024×768, 768×1024, 390×844, 360×640, 320×568 e 844×390. A inspeção automatizada em Chromium e a revisão das capturas não encontraram conteúdo transbordando horizontalmente, contêineres internos roláveis nas páginas ou deslocamento do fundo durante a rolagem.

Também foram exercitados: seleção de perfil por teclado, foco e Escape no menu, formulário de evento em celular, calendário com pouco conteúdo sem scroll em 1366×768, texto longo após redimensionar, adição e visualização de mídia, cancelamento de exclusão, gráficos e troca para o fundo UnderConstruction. Os testes usaram dados simulados, sem escrever no servidor ou no Supabase.

As resoluções foram emuladas; isso não substitui uma verificação posterior em aparelhos físicos com Safari e Chrome. Para novas telas, testar tanto estados vazios quanto títulos longos, listas preenchidas e diálogos, mantendo o fundo fora dos contêineres animados.
