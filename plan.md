# Plano — Login Google

## Escopo aprovado

Construir uma experiência de autenticação responsiva que substitua o login tradicional por email e senha por uma entrada via Google OAuth 2.0. A tela inicial deve destacar o botão “Entrar com o Google”; após o retorno do provedor, o servidor cria uma sessão segura, a aplicação mostra uma área autenticada com nome, email e foto do perfil e oferece saída segura.

O OAuth será implementado no servidor para que o `client_secret` nunca chegue ao navegador. O servidor controlará `state` e nonce em cookie de curta duração, trocará o código no endpoint do Google, buscará `userinfo` e assinará uma sessão própria em cookie `HttpOnly`, `SameSite=None; Secure` para o Preview HTTPS embutido. O fluxo terá rotas explícitas para iniciar login, callback, perfil da sessão e logout.

## Estrutura do projeto

- `client/src/pages/Home.tsx`: tela pública e estado autenticado, com loading, erro, login e perfil.
- `client/src/index.css`: sistema visual completo da direção papel editorial.
- `server/googleAuth.ts`: configuração, URLs OAuth, troca de tokens, validação de claims e assinatura/verificação da sessão.
- `server/_core/index.ts`: rotas HTTP do Google e endpoint de health.
- `client/src/const.ts`: ação de início do login Google e logout.
- `public/manus-routes.json`: manifesto das rotas renderizadas.
- `.env.example`: nomes das variáveis necessárias para o Google Cloud Console.

## Design — papel editorial

### Movimentos considerados

- Papel editorial / modernismo suíço — probabilidade 0,07.
- Brutalismo de arquivo — probabilidade 0,04.
- Galeria silenciosa — probabilidade 0,08.

**Escolha:** papel editorial / modernismo suíço.

### Movimento e princípios

Uma capa de revista contemporânea: composição assimétrica, tipografia grande, linhas finas, margens generosas e pequenos marcadores de edição. A interface deve parecer uma peça editorial impressa, mas operar com a precisão de uma ferramenta digital.

Princípios: confiança sem excesso de ornamento; hierarquia tipográfica forte; informação em camadas; foco total na ação de autenticação.

### Filosofia de cor

O fundo usa um tom de papel quente, `#F4EFE6`, para comunicar proximidade e permanência. Tinta quase preta, `#20252B`, dá legibilidade e caráter. Terracota `#C85C45` funciona como cor proprietária de ação e marcação editorial; azul petróleo `#315B6B` aparece em detalhes de segurança e estado positivo.

### Paradigma de layout

Composição em duas faixas: uma coluna de capa/manifesto à esquerda e um painel de ação à direita. A assimetria evita o cartão genérico centralizado. Em telas pequenas, as faixas viram uma sequência vertical, preservando o ritmo de revista.

### Elementos de assinatura

1. Etiqueta superior “EDIÇÃO / 01” e índice lateral com linhas de registro.
2. Monograma circular “G” desenhado em CSS como marca do acesso Google.
3. Rodapé com a frase “Acesso direto. Sem senha para lembrar.” e um selo de sessão segura.

### Interação e animação

O botão principal tem deslocamento sutil de 2px no hover, mudança de sombra e seta que avança. O conteúdo entra com uma animação curta de fade/translate para reforçar a sensação de página virando; respeitar `prefers-reduced-motion`. Loading usa um marcador de pontuação discreto, sem spinner chamativo.

### Tipografia

`DM Sans` para interface, metadados e corpo; `Playfair Display` para o título editorial. Título grande com serif contrastante; labels em caixa alta e espaçamento amplo; textos de suporte em 14–16px.

### Essência da marca

**Posicionamento:** uma porta de entrada simples e confiável para acessar o produto sem criar mais uma senha. Personalidade: editorial, segura, direta.

### Voz

Clara, humana e objetiva. Exemplo de headline: “Entre pelo caminho mais simples.” Exemplo de microcopy: “Usaremos sua conta Google apenas para identificar seu acesso.”

### Wordmark e marca

Wordmark “access / google” em duas linhas, com a barra como gesto editorial. Marca auxiliar: círculo de registro contendo o G multicolorido.

### Cor proprietária

Terracota de registro `#C85C45` — o detalhe que identifica o produto na página sem competir com o botão de login.

## Limites e configuração

O projeto precisa das variáveis `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_OAUTH_SESSION_SECRET`. O callback registrado no Google Cloud Console deve ser `${ORIGIN}/api/auth/google/callback`; em Preview e produção, o domínio público correspondente deve estar autorizado. Sem essas variáveis, a tela informa que a integração ainda precisa ser configurada, sem simular um login.
