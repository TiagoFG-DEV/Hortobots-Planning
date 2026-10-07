# Formato do registro

Cada registro é armazenado como `registro.json`, validado pelo pacote compartilhado. A versão atual é 1. O documento contém identidade, modalidade, data oficial do acontecimento, metadados, blocos estruturados, catálogo de mídias e ordem da galeria. Nenhum HTML é armazenado.

Os caminhos de mídia são relativos à pasta imutável do registro. A API é a única camada autorizada a criar caminhos e assinar operações no Storage.
