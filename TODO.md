# TODO — Login Google

## Login público via Google OAuth 2.0

- [x] A tela de login deve ser clara e responsiva, sem campos tradicionais de email e senha.
- [x] Deve existir um botão “Entrar com o Google” que inicia o fluxo OAuth 2.0.
- [x] O fluxo deve tratar o retorno da autenticação do Google, incluindo sucesso, cancelamento e falhas.
- [x] O servidor deve manter a sessão do usuário autenticado com cookie HttpOnly, `SameSite=None; Secure` no Preview HTTPS e expiração definida.
- [x] O estado OAuth deve ter proteção contra CSRF por meio de `state`/nonce de uso único.

## Área autenticada protegida

- [x] A área autenticada deve ser protegida contra acesso sem sessão válida.
- [x] A área autenticada deve exibir os dados básicos disponibilizados pelo perfil Google, como nome, email e foto.
- [x] Deve existir uma opção “Sair” que encerra a sessão e retorna à tela de login.
- [x] A aplicação não deve simular usuário ou login quando as credenciais Google não estiverem configuradas; deve informar a configuração pendente.

## Entrega técnica

- [x] O callback Google deve usar URL relativa/origem pública e nunca expor `client_secret` no frontend.
- [x] O manifesto `public/manus-routes.json` deve declarar as páginas reais do frontend.
- [x] O projeto deve passar no typecheck e no build de produção.

## Configuração necessária antes do uso real

- [ ] Adicionar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_OAUTH_SESSION_SECRET` nas variáveis protegidas do projeto e cadastrar `${ORIGIN}/api/auth/google/callback` no Google Cloud Console.
