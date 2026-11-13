export type GoogleAuthError = "config" | "cancelled" | "callback" | "state" | "provider";

export function startGoogleLogin() {
  window.location.assign("/api/auth/google");
}

// Compatibility alias for starter-only components that are not part of the
// public Google login experience.
export const startLogin = startGoogleLogin;

export async function logoutGoogle() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
