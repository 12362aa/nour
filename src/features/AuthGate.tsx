import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LogIn, ShieldCheck, Sparkles } from "lucide-react-native";
import { useNourAuth } from "../auth/NourAuthProvider";
import {
  isCloudAuthConfigured,
  sendEmailOtp,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  supabase,
  verifyEmailOtp,
} from "../services/auth";
import { useNourTheme } from "../theme/NourTheme";

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onSignedIn?: () => void;
  onError?: (error: unknown) => void;
};

/** Shared Google action used by onboarding and Settings > Account. */
export function GoogleSignInButton({
  disabled = false,
  onSignedIn,
  onError,
}: GoogleSignInButtonProps) {
  const { colors } = useNourTheme();
  const { refresh } = useNourAuth();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      await refresh();
      onSignedIn?.();
      setBusy(false);
    } catch (error) {
      if (error instanceof Error && error.message === "تم إلغاء تسجيل الدخول") {
        // Wait up to 3 seconds for the deep link handler to set the session
        // before we give up, because WebBrowser might cancel prematurely.
        for (let i = 0; i < 15; i++) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (!supabase) break;
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            onSignedIn?.();
            setBusy(false);
            return;
          }
        }
      }
      onError?.(error);
      setBusy(false);
    }
  };

  const unavailable = disabled || busy || !isCloudAuthConfigured;
  return (
    <Pressable
      disabled={unavailable}
      onPress={() => void signIn()}
      style={[
        styles.google,
        { backgroundColor: colors.surface, borderColor: colors.border },
        unavailable && styles.disabled,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <LogIn color={colors.primary} size={22} />
      )}
      <Text style={[styles.googleText, { color: colors.ink }]}>المتابعة باستخدام Google</Text>
    </Pressable>
  );
}

export function AuthGate() {
  const { colors } = useNourTheme();
  const { mode, showWelcome, continueAsGuest, finishWelcome, refresh } = useNourAuth();
  const [email, setEmail] = useState("");
  const [emailStep, setEmailStep] = useState<"form" | "sent">("form");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (mode === "loading") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Image source={require("../../assets/icon.png")} style={styles.logo} />
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={[styles.muted, { color: colors.muted }]}>نراجع جلستك بأمان…</Text>
      </View>
    );
  }

  if (mode === "authenticated" && showWelcome) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Sparkles color={colors.gold} size={48} />
        <Text style={[styles.title, { color: colors.ink }]}>أهلًا بك في نور</Text>
        <Text style={[styles.body, { color: colors.muted }]}>تم ربط حسابك. المفضلة والختمة وسجل الاستمرار أصبحت جاهزة للمزامنة الآمنة.</Text>
        <Pressable onPress={() => void finishWelcome()} style={[styles.primary, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryText}>ابدأ رحلتك</Text>
        </Pressable>
      </View>
    );
  }

  const submitEmail = async () => {
    setBusy(true);
    setMessage("");
    try {
      await sendEmailOtp(email);
      setEmailStep("sent");
      setMessage("تم إرسال رابط تسجيل الدخول إلى بريدك. افتح الإيميل واضغط على الرابط للمتابعة.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر إكمال تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  const googleError = (error: unknown) =>
    setMessage(error instanceof Error ? error.message : "تعذر إكمال تسجيل الدخول باستخدام Google");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Image source={require("../../assets/icon.png")} style={styles.logo} />
      <Text style={[styles.title, { color: colors.ink }]}>مرحبًا بك في نور</Text>
      <Text style={[styles.body, { color: colors.muted }]}>سجّل الدخول لمزامنة تقدمك، أو تابع كضيف واستخدم كل المزايا محليًا على جهازك.</Text>

      {!isCloudAuthConfigured ? (
        <View style={[styles.notice, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
          <ShieldCheck color={colors.gold} size={25} />
          <Text style={[styles.noticeText, { color: colors.muted }]}>Google والحساب السحابي يحتاجان مفاتيح Supabase في ملف البيئة. وضع الضيف يعمل بالكامل الآن.</Text>
        </View>
      ) : null}

      <GoogleSignInButton onError={googleError} />

      <View style={styles.divider}><View style={[styles.line, { backgroundColor: colors.border }]} /><Text style={[styles.or, { color: colors.muted }]}>أو بالبريد</Text><View style={[styles.line, { backgroundColor: colors.border }]} /></View>
      <TextInput value={email} onChangeText={setEmail} editable={emailStep === "form"} autoCapitalize="none" keyboardType="email-address" placeholder="البريد الإلكتروني" placeholderTextColor={colors.muted} textAlign="right" style={[styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.border }]} />
      {emailStep === "sent" ? (
        <Pressable disabled={busy} onPress={() => { setEmailStep("form"); setMessage(""); }}><Text style={[styles.link, { color: colors.primary }]}>تغيير البريد الإلكتروني</Text></Pressable>
      ) : null}
      {emailStep === "form" ? (
        <Pressable
          disabled={busy || !isCloudAuthConfigured || !email}
          onPress={() => void submitEmail()}
          style={[styles.primary, { backgroundColor: colors.primary }, (!isCloudAuthConfigured || busy || !email) && styles.disabled]}
        >
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>إرسال رابط الدخول</Text>}
        </Pressable>
      ) : null}
      {message ? <Text selectable style={[styles.error, { color: message.startsWith("تم إرسال") ? colors.primary : "#C65A5A" }]}>{message}</Text> : null}
      <Pressable onPress={() => void continueAsGuest()} style={[styles.guest, { borderColor: colors.gold }]}><Text style={[styles.guestText, { color: colors.gold }]}>المتابعة كضيف</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 18 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 14 },
  logo: { width: 92, height: 92, borderRadius: 26, alignSelf: "center" },
  title: { fontSize: 29, fontWeight: "900", textAlign: "center" },
  body: { fontSize: 15, lineHeight: 25, textAlign: "center" },
  muted: { fontSize: 14 },
  notice: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 9, alignItems: "center" },
  noticeText: { fontSize: 13, lineHeight: 21, textAlign: "center" },
  google: { minHeight: 54, borderWidth: 1, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  googleText: { fontSize: 15, fontWeight: "800" },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  or: { fontSize: 12 },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 17, paddingHorizontal: 15, fontSize: 15 },
  primary: { minHeight: 54, borderRadius: 17, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  link: { textAlign: "center", fontSize: 14, fontWeight: "800", padding: 8 },
  error: { textAlign: "center", fontSize: 13, lineHeight: 20 },
  guest: { minHeight: 52, borderWidth: 1.5, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  guestText: { fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.48 },
});
