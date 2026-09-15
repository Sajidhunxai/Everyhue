import type { UserPublic } from "@photomatcher/types";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiBaseUrl } from "@/lib/config";

const TOKEN_KEY = "photomatcher.accessToken";
const USER_KEY = "photomatcher.user";

type AuthSession = {
  accessToken: string;
  user: UserPublic;
};

type AuthContextValue = {
  user: UserPublic | null;
  accessToken: string | null;
  ready: boolean;
  exchangeProviderToken: (
    provider: "google" | "facebook",
    accessToken?: string,
    idToken?: string,
  ) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseAuthError(res: Response): Promise<string> {
  let message = `Auth failed (${res.status})`;
  try {
    const text = await res.text();
    if (!text) return message;
    try {
      const json = JSON.parse(text) as { error?: string | object };
      if (typeof json.error === "string") return json.error;
      return "Invalid sign-in request. Try again.";
    } catch {
      return text;
    }
  } catch {
    return message;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const rawUser = await SecureStore.getItemAsync(USER_KEY);
        if (token && rawUser) {
          setAccessToken(token);
          setUser(JSON.parse(rawUser) as UserPublic);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistSession = useCallback(async (data: AuthSession) => {
    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const exchangeProviderToken = useCallback(
    async (
      provider: "google" | "facebook",
      providerAccessToken?: string,
      providerIdToken?: string,
    ) => {
      const body: Record<string, string> = { provider };
      if (providerAccessToken) body.accessToken = providerAccessToken;
      if (providerIdToken) body.idToken = providerIdToken;

      const res = await fetch(`${getApiBaseUrl()}/api/auth/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await parseAuthError(res));
      await persistSession((await res.json()) as AuthSession);
    },
    [persistSession],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await parseAuthError(res));
      await persistSession((await res.json()) as AuthSession);
    },
    [persistSession],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) throw new Error(await parseAuthError(res));
      await persistSession((await res.json()) as AuthSession);
    },
    [persistSession],
  );

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      ready,
      exchangeProviderToken,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [
      user,
      accessToken,
      ready,
      exchangeProviderToken,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
