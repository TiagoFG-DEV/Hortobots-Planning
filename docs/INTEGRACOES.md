# Integrações da versão 1.1

## API Gmail para eventos importantes

1. No Google Cloud Console, crie ou escolha um projeto e habilite a **Gmail API**.
2. Configure a tela de consentimento OAuth e crie um cliente OAuth 2.0.
3. Autorize uma única vez a conta remetente com o escopo `https://www.googleapis.com/auth/gmail.send` e obtenha um refresh token.
4. Configure no servidor `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GMAIL_SENDER=me`, `GMAIL_FROM_EMAIL` e `PUBLIC_APP_URL`.
5. Entre como Mentor e abra **E-mails dos eventos** para cadastrar exatamente os endereços da Gestão, Coordenação e Técnico.

Um evento marcado como **Importante** (ou com prioridade Urgente) é salvo e o servidor tenta enviá-lo aos três destinatários. O status `ENVIADO`, `PENDENTE` ou `FALHOU` fica registrado no evento. O e-mail contém um botão para `/login?profile=gestao`, preserva o destino e abre o evento no calendário após a autenticação.

## Síntese de banner com OpenAI

Configure `OPENAI_API_KEY` para ativar a síntese interpretativa. O modelo padrão é `gpt-5-nano`, alterável por `OPENAI_BANNER_MODEL`. A chamada usa saída JSON estruturada, baixa verbosidade, limite de 650 tokens de saída e `store: false`.

Sem chave ou em caso de indisponibilidade, a plataforma cria o banner por síntese local determinística; portanto, o fluxo e o arquivo PPTX continuam disponíveis.

Os arquivos aceitos são DOCX, XLSX/XLSM, PDF, TXT, MD e CSV, com até 8 MB cada e no máximo oito anexos por grupo. Arquivos binários XLS antigos não são interpretados; salve-os como XLSX antes do envio.

## Supabase

Execute a migração `supabase/migrations/0003_collaboration_banner_notifications.sql` antes de publicar a API. Ela adiciona os campos de evento/teste e cria `app_settings`, `feedbacks` e `banners` com as políticas de leitura necessárias. Escritas continuam passando pela API e por sua matriz de permissões.
