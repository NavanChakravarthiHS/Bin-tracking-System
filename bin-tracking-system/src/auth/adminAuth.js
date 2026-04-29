export const TOKEN_KEY = "admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function acceptTokenFromUrlHash() {
  const hash = String(window.location.hash || "");
  if (!hash.startsWith("#")) return null;

  const params = new URLSearchParams(hash.slice(1));
  const token = params.get("token");
  if (!token) return null;

  setToken(token);
  params.delete("token");

  const newHash = params.toString();
  const newUrl = `${window.location.pathname}${window.location.search}${newHash ? `#${newHash}` : ""}`;
  window.history.replaceState({}, document.title, newUrl);
  return token;
}

export async function fetchAdminMe(token) {
  const res = await fetch("http://localhost:5000/admin/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.admin || null;
}

export function goToLogin() {
  const next = encodeURIComponent("/app.html");
  window.location.href = `/admin-login.html?next=${next}`;
}

