export const TOKEN_KEY = 'retailflow_admin_jwt';
export const USER_KEY = 'retailflow_admin_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// This only checks format and expiry. The API verifies the signature and account.
export function isUsableToken(token: string | null): token is string {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.userId === 'string' && payload.userId.length > 0 &&
      (payload.role === 'ADMIN' || payload.role === 'SALESPERSON') &&
      typeof payload.exp === 'number' && Number.isFinite(payload.exp) && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function clearStoredSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Signing out must still work when browser storage is unavailable.
  }
}

const expiryListeners = new Set<() => void>();

export function subscribeToSessionExpiry(listener: () => void) {
  expiryListeners.add(listener);
  return () => { expiryListeners.delete(listener); };
}

export function expireSession(requestToken: string) {
  // An old request must never sign out a more recent login.
  if (getStoredToken() !== requestToken) return;
  clearStoredSession();
  expiryListeners.forEach((listener) => listener());
}
