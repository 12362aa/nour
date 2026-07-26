import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isCloudAuthConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = isCloudAuthConfigured
  ? createClient(url!, key!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    })
  : null;

/** Return the callback registered by the native `nour` app scheme. */
export function getGoogleRedirectUri() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "nour" });
  console.log("Redirect URI:", redirectUri);
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(redirectUri)) {
    throw new Error("تعذر فتح تسجيل Google داخل التطبيق. ثبّت أحدث نسخة من نور ثم حاول مجددًا.");
  }
  return redirectUri;
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error("أضف مفاتيح Supabase أولاً لتفعيل تسجيل Google");
  const redirectUri = getGoogleRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error("لم يصل رابط تسجيل الدخول من Supabase");

  console.log("OAuth URL redirect:", new URL(data.url).searchParams.get("redirect_to"));
  if (decodeURIComponent(data.url).includes("localhost")) {
    throw new Error("تعذّر فتح تسجيل الدخول بـ Google. تأكد من اتصالك بالإنترنت ثم حاول مجدداً، أو تواصل مع الدعم.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  if (result.type !== "success") throw new Error("تم إلغاء تسجيل الدخول");
  const returned = new URL(result.url);
  const oauthError = returned.searchParams.get("error_description");
  if (oauthError) throw new Error(oauthError);
  const code = returned.searchParams.get("code");
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;
    return;
  }

  const hash = new URLSearchParams(returned.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (!accessToken || !refreshToken) {
    throw new Error("لم تكتمل جلسة Google؛ راجع Redirect URLs في Supabase");
  }
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) throw sessionError;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) throw new Error("حساب نور السحابي لم يُفعّل بعد");
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
}

/** Send a Supabase Magic Link email. */
export async function sendEmailOtp(email: string) {
  if (!supabase) throw new Error("Supabase auth is not configured");
  const redirectUri = getGoogleRedirectUri();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectUri,
    },
  });
  if (error) throw error;
}

/** Verify the code delivered by Supabase's email OTP template. */
export async function verifyEmailOtp(email: string, token: string) {
  if (!supabase) throw new Error("Supabase auth is not configured");
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });
  if (error) throw error;
  return data.session;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error("حساب نور السحابي لم يُفعّل بعد");
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
}

export async function verifySignupCode(email: string, token: string) {
  if (!supabase) throw new Error("حساب نور السحابي لم يُفعّل بعد");
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "signup",
  });
  if (error) throw error;
}

export async function sendPasswordReset(email: string) {
  if (!supabase) throw new Error("حساب نور السحابي لم يُفعّل بعد");
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
  );
  if (error) throw error;
}

export async function verifyRecoveryCode(email: string, token: string) {
  if (!supabase) throw new Error("حساب نور السحابي لم يُفعّل بعد");
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "recovery",
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  if (!supabase) throw new Error("حساب نور السحابي لم يُفعّل بعد");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function updateCloudProfile(name: string) {
  if (!supabase) throw new Error("حساب نور السحابي لم يُفعّل بعد");
  const trimmed = name.trim();
  const { data: userData } = await supabase.auth.getUser();
  if (userData?.user) {
    const userId = userData.user.id;
    const existing = await AsyncStorage.getItem(`nour:custom_profile:${userId}`).catch(() => null);
    const parsed = existing ? JSON.parse(existing) : {};
    await AsyncStorage.setItem(
      `nour:custom_profile:${userId}`,
      JSON.stringify({ ...parsed, name: trimmed })
    );
  }
  const { error } = await supabase.auth.updateUser({
    data: { name: trimmed, nour_custom_name: trimmed },
  });
  if (error) throw error;
}

export async function uploadAvatar(uri: string) {
  if (!supabase) throw new Error("حساب نور السحابي لم يُفعّل بعد");
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user)
    throw userError ?? new Error("سجّل الدخول أولاً");
  const userId = userData.user.id;
  const extension =
    uri.split(".").pop()?.toLowerCase() === "png" ? "png" : "jpg";
  const contentType = extension === "png" ? "image/png" : "image/jpeg";
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const path = `${userId}/avatar.${extension}`;

  let uploadResult = await supabase.storage
    .from("avatars")
    .upload(path, decode(base64), { contentType, upsert: true });

  if (uploadResult.error) {
    const msg = uploadResult.error.message ?? "";
    if (msg.toLowerCase().includes("bucket") || msg.includes("not found")) {
      throw new Error(
        'لم يتم العثور على مساحة التخزين (avatars bucket). يرجى إنشاء bucket باسم "avatars" في لوحة تحكم Supabase وضبط سياسة الوصول العامة له.',
      );
    }
    console.error("[nour:avatar] upload error:", uploadResult.error);
    throw uploadResult.error;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  
  const existing = await AsyncStorage.getItem(`nour:custom_profile:${userId}`).catch(() => null);
  const parsed = existing ? JSON.parse(existing) : {};
  await AsyncStorage.setItem(
    `nour:custom_profile:${userId}`,
    JSON.stringify({ ...parsed, avatarUri: avatarUrl })
  );

  await supabase.auth.updateUser({ data: { avatar_url: avatarUrl, nour_custom_avatar: avatarUrl } });
  return avatarUrl;
}

export async function getCurrentCloudProfile() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const userId = data.user.id;

  let localCustom: { name?: string; avatarUri?: string } | null = null;
  try {
    const raw = await AsyncStorage.getItem(`nour:custom_profile:${userId}`);
    if (raw) localCustom = JSON.parse(raw);
  } catch (e) {
    console.warn("[nour:profile] failed to load local custom profile", e);
  }

  const finalName =
    localCustom?.name ||
    data.user.user_metadata?.nour_custom_name ||
    data.user.user_metadata?.name ||
    data.user.email?.split("@")[0] ||
    "مستخدم نور";

  const finalAvatar =
    localCustom?.avatarUri ||
    data.user.user_metadata?.nour_custom_avatar ||
    (typeof data.user.user_metadata?.avatar_url === "string"
      ? data.user.user_metadata.avatar_url
      : undefined);

  return {
    name: String(finalName),
    email: data.user.email ?? "",
    avatarUri: finalAvatar,
    joinedAt: data.user.created_at,
  };
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
