const TOKEN_KEY = "alphagym_token";

export function isAuthed() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
