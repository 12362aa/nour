import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as Linking from "expo-linking";
import { isCloudAuthConfigured, supabase } from "../services/auth";

type AuthMode = "loading" | "signed-out" | "guest" | "authenticated";

type NourAuthValue = {
  mode: AuthMode;
  showWelcome: boolean;
  continueAsGuest: () => Promise<void>;
  leaveGuestMode: () => Promise<void>;
  finishWelcome: () => Promise<void>;
  refresh: () => Promise<void>;
};

const GUEST_KEY = "nour:auth:guest-v1";
const WELCOME_KEY = "nour:auth:welcome-v1";

const NourAuthContext = createContext<NourAuthValue>({
  mode: "loading",
  showWelcome: false,
  continueAsGuest: async () => undefined,
  leaveGuestMode: async () => undefined,
  finishWelcome: async () => undefined,
  refresh: async () => undefined,
});

export function NourAuthProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AuthMode>("loading");
  const [showWelcome, setShowWelcome] = useState(false);

  const refresh = async () => {
    const guest = (await AsyncStorage.getItem(GUEST_KEY)) === "true";
    if (!isCloudAuthConfigured || !supabase) {
      setMode(guest ? "guest" : "signed-out");
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const welcomed = await AsyncStorage.getItem(WELCOME_KEY);
      setShowWelcome(!welcomed);
      setMode("authenticated");
    } else {
      setMode(guest ? "guest" : "signed-out");
    }
  };

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !supabase) return;
      try {
        // Parse safely manually since `new URL()` and `Linking.parse` can drop hash fragments in some RN versions
        const hashIndex = url.indexOf("#");
        const queryIndex = url.indexOf("?");
        const paramString = hashIndex !== -1 ? url.substring(hashIndex + 1) : (queryIndex !== -1 ? url.substring(queryIndex + 1) : "");
        const params = new URLSearchParams(paramString);
        
        const code = params.get("code") || Linking.parse(url).queryParams?.code;
        if (code) {
          await supabase.auth.exchangeCodeForSession(String(code));
          return;
        }
        
        const accessToken = params.get("access_token") || Linking.parse(url).queryParams?.access_token;
        const refreshToken = params.get("refresh_token") || Linking.parse(url).queryParams?.refresh_token;
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: String(accessToken), refresh_token: String(refreshToken) });
        }
      } catch (e) {
        console.warn("[nour:auth] deep link error", e);
      }
    };

    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", (event) => {
      void handleUrl(event.url);
    });

    void refresh();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setMode("authenticated");
        if (event === "SIGNED_IN") {
          void AsyncStorage.getItem(WELCOME_KEY).then((value) =>
            setShowWelcome(!value),
          );
        }
      } else if (event === "SIGNED_OUT") {
        void AsyncStorage.getItem(GUEST_KEY).then((value) =>
          setMode(value === "true" ? "guest" : "signed-out"),
        );
      }
    });
    return () => {
      data.subscription.unsubscribe();
      sub.remove();
    };
  }, []);

  const value = useMemo<NourAuthValue>(
    () => ({
      mode,
      showWelcome,
      continueAsGuest: async () => {
        await AsyncStorage.setItem(GUEST_KEY, "true");
        setMode("guest");
      },
      leaveGuestMode: async () => {
        await AsyncStorage.removeItem(GUEST_KEY);
        setMode("signed-out");
      },
      finishWelcome: async () => {
        await AsyncStorage.setItem(WELCOME_KEY, new Date().toISOString());
        setShowWelcome(false);
      },
      refresh,
    }),
    [mode, showWelcome],
  );

  return <NourAuthContext.Provider value={value}>{children}</NourAuthContext.Provider>;
}

export function useNourAuth() {
  return useContext(NourAuthContext);
}
