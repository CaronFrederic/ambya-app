import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AppState } from "react-native";
import {
  Stack,
  useRouter,
  useSegments,
} from "expo-router";
import * as SecureStore from "expo-secure-store";

import { QueryProvider } from "../src/providers/QueryProvider";
import { BookingProvider } from "../src/providers/BookingProvider";
import { ProfileProvider } from "../src/providers/ProfileProvider";
import { PaymentProvider } from "../src/providers/PaymentProvider";
import { AuthRefreshProvider } from "../src/providers/AuthRefreshProvider";
import { OfflineProvider } from "../src/providers/OfflineProvider";

import {
  AUTH_TOKEN_KEY,
  ROLE_KEY,
  subscribeToSessionExpired,
} from "../src/session/session";

type Role =
  | "CLIENT"
  | "PROFESSIONAL"
  | "EMPLOYEE"
  | "ADMIN";

function normalizeRole(role: string | null): Role {
  const normalized = (
    role ?? "CLIENT"
  ).toUpperCase();

  if (
    normalized === "CLIENT" ||
    normalized === "PROFESSIONAL" ||
    normalized === "EMPLOYEE" ||
    normalized === "ADMIN"
  ) {
    return normalized;
  }

  return "CLIENT";
}

function homeForRole(role: Role) {
  switch (role) {
    case "PROFESSIONAL":
      return "/(professional)/dashboard" as const;

    case "EMPLOYEE":
      return "/(employee)/dashboard" as const;

    case "ADMIN":
      return "/(admin)/dashboard" as const;

    case "CLIENT":
    default:
      return "/(tabs)/home" as const;
  }
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [ready, setReady] = useState(false);

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [role, setRole] =
    useState<Role>("CLIENT");

  const refreshAuth = useCallback(async () => {
    try {
      const [token, storedRole] =
        await Promise.all([
          SecureStore.getItemAsync(
            AUTH_TOKEN_KEY,
          ),
          SecureStore.getItemAsync(
            ROLE_KEY,
          ),
        ]);

      setIsLoggedIn(Boolean(token));
      setRole(normalizeRole(storedRole));
    } catch (error) {
      console.warn(
        "Unable to refresh local auth state:",
        error,
      );

      setIsLoggedIn(false);
      setRole("CLIENT");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      await refreshAuth();

      if (mounted) {
        setReady(true);
      }
    })();

    const appStateSubscription =
      AppState.addEventListener(
        "change",
        (state) => {
          if (state === "active") {
            void refreshAuth();
          }
        },
      );

    return () => {
      mounted = false;
      appStateSubscription.remove();
    };
  }, [refreshAuth]);

  /*
   * Écoute globale de l'expiration de session.
   *
   * client.ts supprime d'abord les credentials,
   * puis émet cet événement.
   *
   * On synchronise immédiatement l'état React.
   * Le guard de navigation ci-dessous se charge
   * ensuite de renvoyer l'utilisateur vers login.
   */
  useEffect(() => {
    const unsubscribe =
      subscribeToSessionExpired(() => {
        setIsLoggedIn(false);
        setRole("CLIENT");
      });

    return unsubscribe;
  }, []);

  const allowedGroups = useMemo(() => {
    switch (role) {
      case "CLIENT":
        return new Set([
          "(auth)",
          "(tabs)",
          "(screens)",
        ]);

      case "PROFESSIONAL":
        return new Set([
          "(auth)",
          "(professional)",
        ]);

      case "EMPLOYEE":
        return new Set([
          "(auth)",
          "(employee)",
        ]);

      case "ADMIN":
        return new Set([
          "(auth)",
          "(admin)",
        ]);

      default:
        return new Set(["(auth)"]);
    }
  }, [role]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const group = segments[0];
    const inAuth = group === "(auth)";

    /*
     * Pas de token :
     * toute zone protégée renvoie vers login.
     */
    if (!isLoggedIn && !inAuth) {
      router.replace("/(auth)/login");
      return;
    }

    /*
     * Token présent :
     * un utilisateur connecté ne doit pas
     * rester sur les écrans d'authentification.
     */
    if (isLoggedIn && inAuth) {
      router.replace(
        homeForRole(role) as never,
      );
      return;
    }

    /*
     * Token présent mais tentative d'accès
     * à une zone correspondant à un autre rôle.
     */
    if (
      isLoggedIn &&
      group &&
      !allowedGroups.has(group)
    ) {
      router.replace(
        homeForRole(role) as never,
      );
    }
  }, [
    allowedGroups,
    isLoggedIn,
    ready,
    role,
    router,
    segments,
  ]);

  if (!ready) {
    return null;
  }

  return (
    <AuthRefreshProvider
      refreshAuth={refreshAuth}
    >
      <OfflineProvider>
        <QueryProvider>
          <BookingProvider>
            <ProfileProvider>
              <PaymentProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                >
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(screens)" />

                  <Stack.Screen
                    name="(professional)"
                  />

                  <Stack.Screen
                    name="(employee)"
                  />

                  <Stack.Screen
                    name="(admin)"
                  />
                </Stack>
              </PaymentProvider>
            </ProfileProvider>
          </BookingProvider>
        </QueryProvider>
      </OfflineProvider>
    </AuthRefreshProvider>
  );
}