import * as SecureStore from "expo-secure-store";

export const AUTH_TOKEN_KEY = "accessToken";
export const ROLE_KEY = "userRole";

type SessionExpiredListener = () => void;

const sessionExpiredListeners = new Set<SessionExpiredListener>();

let expirationPromise: Promise<void> | null = null;

export function subscribeToSessionExpired(
  listener: SessionExpiredListener,
): () => void {
  sessionExpiredListeners.add(listener);

  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export async function expireSession(): Promise<void> {
  // Plusieurs requêtes peuvent recevoir 401 simultanément.
  // Une seule suppression / notification doit être exécutée.
  if (expirationPromise) {
    return expirationPromise;
  }

  expirationPromise = (async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        SecureStore.deleteItemAsync(ROLE_KEY),
      ]);
    } finally {
      sessionExpiredListeners.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          console.warn("Session expiration listener error:", error);
        }
      });

      expirationPromise = null;
    }
  })();

  return expirationPromise;
}