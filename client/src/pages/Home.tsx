import { ArrowUpRight, Check, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { logoutGoogle, startGoogleLogin } from "@/const";

type GoogleUser = {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
};

type AuthResponse = {
  authenticated: boolean;
  user?: GoogleUser;
};

const errorCopy: Record<string, string> = {
  config: "A integração ainda precisa das credenciais do Google Cloud Console.",
  cancelled: "O acesso foi cancelado. Você pode tentar novamente quando quiser.",
  callback: "O retorno do Google não foi concluído. Tente iniciar o acesso outra vez.",
  state: "Não foi possível validar esta tentativa de acesso. Inicie um novo login.",
  provider: "O Google não conseguiu concluir a autenticação. Tente novamente em instantes.",
};

function GoogleMark() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.4h3.14c1.84-1.69 2.92-4.18 2.92-7.36Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.4c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.47A9.75 9.75 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.54 13.88a5.86 5.86 0 0 1 0-3.76V7.65H3.3a9.76 9.76 0 0 0 0 8.7l3.24-2.47Z" />
      <path fill="#EA4335" d="M12 6.09c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.2 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.4l3.24 2.47C7.31 7.81 9.46 6.09 12 6.09Z" />
    </svg>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Ir para início">
          <span>access</span>
          <i>/</i>
          <strong>google</strong>
        </a>
        <div className="issue-label">
          <span>AUTH / 01</span>
          <span className="issue-dot" aria-hidden="true" />
          <span>SECURE ENTRY</span>
        </div>
      </header>
      {children}
      <footer className="footer">
        <span>Acesso direto. Sem senha para lembrar.</span>
        <span className="footer-rule" aria-hidden="true" />
        <span className="footer-meta">GOOGLE OAUTH 2.0 · 2026</span>
      </footer>
    </main>
  );
}

function LoginPage({ configured, error }: { configured: boolean; error?: string }) {
  const displayedError = error ? errorCopy[error] ?? errorCopy.provider : undefined;

  return (
    <PageFrame>
      <section className="login-layout" aria-labelledby="login-title">
        <div className="editorial-column">
          <div className="edition-tag"><span>EDIÇÃO</span><strong>01</strong></div>
          <div className="vertical-index" aria-hidden="true">
            <span>01</span><span>/</span><span>GOOGLE</span>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">UMA FORMA MAIS SIMPLES DE ENTRAR</p>
            <h1 id="login-title">Entre pelo caminho que você já conhece.</h1>
            <p className="hero-description">
              Uma entrada limpa, segura e sem mais uma senha para decorar. Use sua conta Google e siga direto para o seu espaço.
            </p>
          </div>
          <div className="hero-note">
            <span className="note-mark">↳</span>
            <p>Seu acesso permanece seu.<br />Nós só precisamos reconhecer você.</p>
          </div>
        </div>

        <div className="auth-column">
          <div className="auth-sheet">
            <div className="sheet-head">
              <span className="sheet-kicker">ENTRADA / GOOGLE</span>
              <span className="sheet-number">01—01</span>
            </div>
            <div className="sheet-mark"><GoogleMark /></div>
            <h2>Seu acesso começa aqui.</h2>
            <p className="sheet-copy">Entre usando sua conta Google. Não criamos uma senha nova e não pedimos mais do que o necessário.</p>

            {displayedError && (
              <div className="status-message error" role="alert">
                <span className="status-symbol">!</span>
                <span>{displayedError}</span>
              </div>
            )}

            {!configured && (
              <div className="setup-message" role="status">
                <span className="status-symbol">i</span>
                <span>Modo de configuração: adicione as credenciais do Google para ativar o acesso.</span>
              </div>
            )}

            <button className="google-button" type="button" onClick={startGoogleLogin} disabled={!configured}>
              <GoogleMark />
              <span>{configured ? "Entrar com o Google" : "Google ainda não configurado"}</span>
              <ArrowUpRight size={18} strokeWidth={1.8} />
            </button>

            <div className="sheet-footnote">
              <ShieldCheck size={16} strokeWidth={1.7} />
              <span>Conexão protegida por OAuth 2.0</span>
            </div>
          </div>
          <div className="auth-caption">
            <span>01 / CONTROLE DE ACESSO</span>
            <span className="caption-line" aria-hidden="true" />
            <span>SEM EMAIL + SENHA</span>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function AccountPage({ user, onLogout }: { user: GoogleUser; onLogout: () => Promise<void> }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <PageFrame>
      <section className="account-layout" aria-labelledby="account-title">
        <div className="account-intro">
          <div className="edition-tag"><span>SESSÃO</span><strong>OK</strong></div>
          <p className="eyebrow">ACESSO CONFIRMADO</p>
          <h1 id="account-title">Olá, <em>{user.name.split(" ")[0]}.</em></h1>
          <p className="hero-description">Sua identidade foi confirmada pelo Google. Este é o seu espaço, pronto para continuar.</p>
          <div className="verified-line"><Check size={16} /><span>Conta verificada e sessão ativa</span></div>
        </div>
        <div className="profile-column">
          <div className="profile-card">
            <div className="profile-card-top"><span>PERFIL / 01</span><span className="profile-live">LIVE</span></div>
            <div className="profile-main">
              {user.picture ? <img className="profile-photo" src={user.picture} alt={`Foto de ${user.name}`} /> : <div className="profile-photo profile-initials">{initials}</div>}
              <div>
                <p className="profile-label">NOME</p>
                <h2>{user.name}</h2>
                <p className="profile-email">{user.email}</p>
              </div>
            </div>
            <div className="profile-details">
              <div><span>PROVEDOR</span><strong>Google</strong></div>
              <div><span>EMAIL</span><strong>{user.email_verified ? "Verificado" : "Confirmado"}</strong></div>
            </div>
            <button className="logout-button" type="button" onClick={handleLogout} disabled={loggingOut}>
              <LogOut size={17} strokeWidth={1.8} />
              <span>{loggingOut ? "Encerrando sessão…" : "Sair da conta"}</span>
            </button>
          </div>
          <p className="profile-note">Você pode encerrar esta sessão a qualquer momento. Seus dados ficam com o Google; aqui usamos apenas o necessário para identificar seu acesso.</p>
        </div>
      </section>
    </PageFrame>
  );
}

export default function Home() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const queryError = new URLSearchParams(window.location.search).get("error") ?? undefined;
    setError(queryError);
    Promise.all([
      fetch("/api/auth/me", { credentials: "include" }),
      fetch("/api/auth/config", { credentials: "include" }),
    ])
      .then(async ([sessionResponse, configResponse]) => {
        const session = sessionResponse.ok ? (await sessionResponse.json() as AuthResponse) : { authenticated: false };
        const config = await configResponse.json() as { configured?: boolean };
        setUser(session.authenticated ? session.user ?? null : null);
        setConfigured(config.configured === true);
      })
      .catch(() => setError("provider"))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logoutGoogle();
    setUser(null);
  }

  if (loading) {
    return <PageFrame><div className="loading-state"><span className="loading-mark" />Carregando seu acesso</div></PageFrame>;
  }

  return user ? <AccountPage user={user} onLogout={handleLogout} /> : <LoginPage configured={configured} error={error} />;
}
