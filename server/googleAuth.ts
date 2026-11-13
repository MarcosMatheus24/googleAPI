import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { CookieOptions, Express, Request, Response } from "express";
import { parse as parseCookie } from "cookie";
import { SignJWT, jwtVerify } from "jose";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const STATE_COOKIE = "google_oauth_state";
const PUBLIC_STATE_COOKIE = "__Host-google_oauth_state";
const SESSION_COOKIE = "google_session";
const STATE_MAX_AGE_SECONDS = 10 * 60;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type GoogleProfile = {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
};

type SessionPayload = GoogleProfile & {
  aud: string;
};

type StatePayload = {
  value: string;
  redirectUri: string;
  issuedAt: number;
};

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
}

function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
}

function getSessionSecret() {
  return process.env.GOOGLE_OAUTH_SESSION_SECRET?.trim() ?? "";
}

export function isGoogleConfigured() {
  return Boolean(getGoogleClientId() && getGoogleClientSecret() && getSessionSecret());
}

function isLocalRequest(req: Request) {
  const hostname = req.hostname.toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function getCookieOptions(req: Request): CookieOptions {
  const local = isLocalRequest(req);
  return {
    httpOnly: true,
    path: "/",
    sameSite: local ? "lax" : "none",
    secure: !local,
  };
}

function getStateCookieName(req: Request) {
  return isLocalRequest(req) ? STATE_COOKIE : PUBLIC_STATE_COOKIE;
}

function getPublicOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto.split(",")[0].trim() : "";
  if (protocol === "http" || protocol === "https") {
    return `${protocol}://${req.get("host")}`;
  }
  return `${isLocalRequest(req) ? "http" : "https"}://${req.get("host")}`;
}

function getRedirectUri(req: Request) {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || `${getPublicOrigin(req)}/api/auth/google/callback`;
}

function encodeState(payload: StatePayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeState(value: string): StatePayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<StatePayload>;
    if (
      typeof parsed.value !== "string" ||
      typeof parsed.redirectUri !== "string" ||
      typeof parsed.issuedAt !== "number"
    ) {
      return null;
    }
    return parsed as StatePayload;
  } catch {
    return null;
  }
}

function randomState() {
  return randomBytes(32).toString("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = createHash("sha256").update(left).digest();
  const rightBuffer = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getSessionKey() {
  const secret = getSessionSecret();
  return secret ? new TextEncoder().encode(secret) : null;
}

async function createSession(profile: GoogleProfile) {
  const secret = getSessionKey();
  if (!secret) throw new Error("Google session secret is not configured");
  return new SignJWT({ ...profile, aud: "google-login-app" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(profile.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);
}

export async function readGoogleSession(req: Request): Promise<GoogleProfile | null> {
  const cookies = parseCookie(req.headers.cookie ?? "");
  const token = cookies[SESSION_COOKIE];
  const secret = getSessionKey();
  if (!token || !secret) return null;

  try {
    const result = await jwtVerify<SessionPayload>(token, secret, {
      algorithms: ["HS256"],
      audience: "google-login-app",
    });
    const { sub, name, email, picture, email_verified } = result.payload;
    if (typeof sub !== "string" || typeof name !== "string" || typeof email !== "string") return null;
    return { sub, name, email, picture, email_verified };
  } catch {
    return null;
  }
}

async function exchangeCode(code: string, redirectUri: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Google token exchange failed");
  }
  return payload.access_token;
}

async function fetchProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json().catch(() => ({}))) as Partial<GoogleProfile>;
  if (!response.ok || typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Google profile could not be verified");
  }
  return {
    sub: payload.sub,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name : payload.email,
    email: payload.email,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
    email_verified: payload.email_verified === true,
  };
}

function redirectWithError(res: Response, error: string) {
  res.redirect(302, `/?error=${encodeURIComponent(error)}`);
}

export function registerGoogleAuthRoutes(app: Express) {
  app.get("/api/auth/config", (_req, res) => {
    res.json({ configured: isGoogleConfigured() });
  });

  app.get("/api/auth/google", (req, res) => {
    if (!isGoogleConfigured()) {
      redirectWithError(res, "config");
      return;
    }

    const state = randomState();
    const redirectUri = getRedirectUri(req);
    const cookiePayload = encodeState({ value: state, redirectUri, issuedAt: Date.now() });
    res.cookie(getStateCookieName(req), cookiePayload, {
      ...getCookieOptions(req),
      maxAge: STATE_MAX_AGE_SECONDS,
    });

    const authorizeUrl = new URL(GOOGLE_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("client_id", getGoogleClientId());
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("scope", "openid email profile");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("access_type", "online");
    authorizeUrl.searchParams.set("prompt", "select_account");
    res.redirect(302, authorizeUrl.toString());
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const providerError = typeof req.query.error === "string" ? req.query.error : "";
    if (providerError === "access_denied") {
      redirectWithError(res, "cancelled");
      return;
    }
    if (!code || !state) {
      redirectWithError(res, "callback");
      return;
    }

    const cookies = parseCookie(req.headers.cookie ?? "");
    const rawStateCookie = cookies[getStateCookieName(req)];
    const savedState = rawStateCookie ? decodeState(rawStateCookie) : null;
    res.clearCookie(getStateCookieName(req), getCookieOptions(req));

    if (
      !savedState ||
      Date.now() - savedState.issuedAt > STATE_MAX_AGE_SECONDS * 1000 ||
      !safeEqual(state, savedState.value) ||
      savedState.redirectUri !== getRedirectUri(req)
    ) {
      redirectWithError(res, "state");
      return;
    }

    try {
      const accessToken = await exchangeCode(code, savedState.redirectUri);
      const profile = await fetchProfile(accessToken);
      const session = await createSession(profile);
      res.cookie(SESSION_COOKIE, session, {
        ...getCookieOptions(req),
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error instanceof Error ? error.message : error);
      redirectWithError(res, "provider");
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const profile = await readGoogleSession(req);
    if (!profile) {
      res.status(401).json({ authenticated: false });
      return;
    }
    res.json({ authenticated: true, user: profile });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie(SESSION_COOKIE, getCookieOptions(req));
    res.json({ success: true });
  });
}
