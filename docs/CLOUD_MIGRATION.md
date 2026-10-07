# Preparação para Supabase e Render

O ambiente local continua usando `Logs/registros`, `Logs/testes` e `Logs/eventos` como fonte de dados. Na publicação, o conteúdo equivalente será armazenado no Supabase Storage, mantendo a mesma hierarquia de pastas e os arquivos `dados.json`.

## Variáveis necessárias

- `STORAGE_DRIVER`: `local` durante o desenvolvimento e `supabase` no Render.
- `LOGS_ROOT`: caminho da pasta local, normalmente `./Logs`.
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: chave privada disponível somente no serviço da API.
- `SUPABASE_BUCKET`: bucket privado, por padrão `hortobots-planning`.
- `WEB_ORIGIN`: endereço público do frontend no Render.
- `VITE_API_BASE_URL`: endereço público da API no Render.
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: reservadas para autenticação futura no navegador.

## Sequência de integração

1. Criar o projeto e o bucket privado no Supabase.
2. Executar as migrações em `supabase/migrations`.
3. Copiar cada diretório de `Logs` para o bucket, preservando caminhos e nomes.
4. Configurar as variáveis secretas no serviço da API no Render.
5. Publicar a API e informar sua URL em `VITE_API_BASE_URL` no serviço web.
6. Validar autenticação, leitura pública, gravação por perfil e URLs assinadas de mídia.

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend ou no repositório.
