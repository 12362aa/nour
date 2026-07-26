import { useEffect, useMemo, useState } from "react";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Asset } from "expo-asset";
import * as Location from "expo-location";
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Compass,
  Download,
  ExternalLink,
  Award,
  Crown,
  Flame,
  Headphones,
  Library,
  LogOut,
  MoonStar,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trophy,
  UserRound,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getQibla } from "../services/aladhan";
import { downloadBook } from "../services/downloads";
import { getHadithBook, Hadith, searchHadiths } from "../services/hadith";
import {
  calculateFastingStreak,
  calculatePrayerStreak,
  calculateBestPrayerStreak,
  calculateBestFastingStreak,
  calculateWeeklyPrayersCount,
  DailyPrayerRecord,
  getFastDayInfo,
  getFormattedDateKey,
  isDayPrayerComplete,
  loadTrackerData,
  PrayerKey,
  saveTrackerData,
  TrackerData,
} from "../services/tracker";
import {
  getDailyPagesGoal,
  getKhatmaBadges,
  getKhatmaProgressPercent,
  getTargetTextByUnit,
  KhatmaConfig,
  KhatmaUnit,
  loadKhatmaConfig,
  saveKhatmaConfig,
  TOTAL_QURAN_PAGES,
} from "../services/khatma";
import { AnimatedFlameVisual, AnimatedFastingMoon } from "../components/AnimatedVisuals";
import { HADITH_EDITIONS, LIBRARY_BOOKS, LibraryBook } from "../data/library";
import {
  getCurrentCloudProfile,
  isCloudAuthConfigured,
  sendEmailOtp,
  signOut,
  updateCloudProfile,
  uploadAvatar,
  verifyEmailOtp,
} from "../services/auth";
import { GoogleSignInButton } from "./AuthGate";
import { useNourTheme } from "../theme/NourTheme";
import { scheduleKhatmaReminder } from "../services/notifications";
import { useAudioStore } from "../store/useAudioStore";


type CommonProps = {
  onBack: () => void;
  showError: (error: unknown, retry: () => void) => void;
  showToast?: (message: string) => void;
};

function FeatureScreen({ children, noScroll }: { children: React.ReactNode; noScroll?: boolean }) {
  const { colors } = useNourTheme();
  
  if (noScroll) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

function FeatureHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  const { colors } = useNourTheme();
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} accessibilityLabel="رجوع" style={[styles.iconButton, { backgroundColor: colors.surface }]}>
        <ArrowLeft color={colors.primary} size={23} />
      </Pressable>
      <View style={styles.grow}>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function FeatureCard({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors } = useNourTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

function ActionButton({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  const { colors } = useNourTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: secondary ? colors.surfaceSoft : colors.primary, borderColor: colors.border },
        (pressed || disabled) && styles.faded,
      ]}
    >
      <Text style={[styles.buttonText, { color: secondary ? colors.primary : colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

﻿export function QiblaScreen({ onBack, showError }: CommonProps) {
  const { colors } = useNourTheme();
  const [direction, setDirection] = useState<number | null>(null);
  const [cityHint, setCityHint] = useState("جاري تحديد الموقع");
  const [loading, setLoading] = useState(true);
  const heading = useSharedValue(0);

  const load = async () => {
    setLoading(true);
    let sub: any;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error("يجب إعطاء صلاحية الموقع لتحديد اتجاه القبلة");
      const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const bearing = await getQibla({ latitude: point.coords.latitude, longitude: point.coords.longitude, city: "" });
      setDirection(bearing);
      const places = await Location.reverseGeocodeAsync(point.coords).catch(() => []);
      setCityHint(places[0]?.city || places[0]?.region || "مدينة غير معروفة");

      sub = await Location.watchHeadingAsync((data) => {
        let angle = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
        let diff = angle - heading.value;
        let adjustedDiff = ((diff + 540) % 360) - 180;
        heading.value = withTiming(heading.value + adjustedDiff, { duration: 200, easing: Easing.out(Easing.quad) });
      });
    } catch (error) {
      showError(error, () => void load());
    } finally {
      setLoading(false);
    }
    return () => sub?.remove();
  };

  useEffect(() => {
    let cleanup: any;
    void load().then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, []);

  const compassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-heading.value}deg` }],
  }));

  return (
    <FeatureScreen>
      <FeatureHeader title="اتجاه القبلة" subtitle={`محسوب بدقة من ${cityHint}`} onBack={onBack} />
      <FeatureCard style={styles.qiblaCard}>
        {loading ? <ActivityIndicator color={colors.gold} size="large" /> : null}
        {direction !== null ? (
          <>
            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <View style={[styles.compassRing, { borderColor: "transparent", backgroundColor: colors.surfaceSoft, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 15, width: 280, height: 280, borderRadius: 140 }]}>
                <LinearGradient
                  colors={["#e0e5ec", "#ffffff", "#e0e5ec"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: "absolute", width: "100%", height: "100%", borderRadius: 140, borderWidth: 4, borderColor: "#cbd5e1" }}
                />
                <Animated.View style={[{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }, compassStyle]}>
                  {Array.from({ length: 72 }).map((_, i) => (
                    <View key={i} style={{ position: "absolute", width: "100%", height: "100%", alignItems: "center", transform: [{ rotate: `${i * 5}deg` }] }}>
                      <View style={{ width: i % 18 === 0 ? 4 : 2, height: i % 18 === 0 ? 12 : 8, backgroundColor: i === 0 ? colors.primary : "#94a3b8", marginTop: 4, borderRadius: 2 }} />
                      {i === 0 && <Text style={[styles.north, { color: colors.primary }]}>N</Text>}
                    </View>
                  ))}
                  <View style={{ position: "absolute", transform: [{ rotate: `${direction}deg` }], alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                    <View style={{ width: 4, height: 110, backgroundColor: colors.gold, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginTop: -130 }} />
                    <MoonStar color={colors.gold} size={48} fill={colors.gold} style={{ position: "absolute", top: 15 }} />
                  </View>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#334155", borderWidth: 3, borderColor: "#cbd5e1", zIndex: 10 }} />
                </Animated.View>
              </View>
            </View>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[styles.qiblaDegree, { color: colors.ink }]}>{Math.round(direction)}°</Text>
              <Text style={{ color: colors.muted, fontSize: 15, fontWeight: "700" }}>اتجاه الكعبة المشرفة</Text>
            </View>
          </>
        ) : !loading && <Text style={styles.body}>تعذر تحديد القبلة. تأكد من تفعيل الموقع الجغرافي.</Text>}
      </FeatureCard>
    </FeatureScreen>
  );
}

export function BookLibraryScreen({ onBack, showError, showToast }: CommonProps) {
  const { colors } = useNourTheme();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [readingBookUrl, setReadingBookUrl] = useState<string | null>(null);
  const { playBook, currentBook, isPlaying } = useAudioStore();

  const downloadLocalBook = async (book: LibraryBook) => {
    try {
      if (book.downloadUrl) {
        setProgress((current) => ({ ...current, [book.id]: 0.01 }));
        await downloadBook(book, (value) => setProgress((current) => ({ ...current, [book.id]: value })));
        if (showToast) showToast("تم تحميل الكتاب بنجاح ويمكنك تصفحه.");
      }
    } catch (error) {
      showError(error, () => void downloadLocalBook(book));
    } finally {
      setProgress((current) => ({ ...current, [book.id]: 0 }));
    }
  };

  const openBook = async (book: LibraryBook) => {
    // If it's an archive.org URL, we use the embed UI for a native reading experience
    const bookUrl = book.downloadUrl || book.url;
    if (bookUrl.includes("archive.org/details/")) {
      const embedUrl = bookUrl.replace("/details/", "/embed/") + "?ui=embed";
      setReadingBookUrl(embedUrl);
    } else {
      setReadingBookUrl(bookUrl);
    }
  };

  if (readingBookUrl) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ height: 60, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={() => setReadingBookUrl(null)} style={{ padding: 8 }}>
            <ArrowLeft color={colors.ink} size={24} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: colors.ink }}>قراءة الكتاب</Text>
          <View style={{ width: 40 }} />
        </View>
        <WebView source={{ uri: readingBookUrl }} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <FeatureScreen>
      <FeatureHeader title="مكتبة نور" subtitle="كتب إسلامية مختارة للقراءة والحفظ" onBack={onBack} />
      <Image source={require("../../assets/library-hero.png")} style={styles.libraryHero} />
      {LIBRARY_BOOKS.map((book) => {
        const downloading = Boolean(progress[book.id]);
        return (
          <Pressable key={book.id} onPress={() => void openBook(book)}>
            <FeatureCard style={styles.bookRow}>
              {book.cover.startsWith("http") ? (
                <Image source={{ uri: book.cover }} style={[styles.bookCover, { backgroundColor: colors.surfaceSoft }]} resizeMode="cover" />
              ) : (
                <View style={[styles.bookCover, { backgroundColor: colors.primary }]}><Text style={styles.bookCoverText}>{book.cover}</Text></View>
              )}
              <View style={styles.grow}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>{book.title}</Text>
                <Text style={[styles.meta, { color: colors.gold }]}>{book.author} · {book.category}</Text>
                <Text style={[styles.smallBody, { color: colors.muted }]}>{book.description}</Text>
                {downloading ? <Text style={[styles.progress, { color: colors.primary }]}>جاري التحميل... {Math.round(progress[book.id] * 100)}%</Text> : null}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => void openBook(book)} style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.primary, height: 42, paddingHorizontal: 16, borderRadius: 21 }]}>
                  <BookOpen color="#FFFFFF" size={18} />
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>قراءة</Text>
                </Pressable>
                {book.downloadUrl ? (
                  <Pressable disabled={downloading} onPress={() => void downloadLocalBook(book)} style={[styles.roundAction, { backgroundColor: colors.surfaceSoft }]}>
                    <Download color={colors.primary} size={21} />
                  </Pressable>
                ) : (
                  <Pressable onPress={() => void openBook(book)} style={[styles.roundAction, { backgroundColor: colors.surfaceSoft }]}>
                    <ExternalLink color={colors.primary} size={21} />
                  </Pressable>
                )}
                {book.audioUrl ? (
                  <Pressable onPress={() => playBook(book)} style={[styles.roundAction, { backgroundColor: currentBook?.id === book.id && isPlaying ? colors.gold : colors.surfaceSoft }]}>
                    <Headphones color={currentBook?.id === book.id && isPlaying ? "#FFFFFF" : colors.primary} size={21} />
                  </Pressable>
                ) : null}
              </View>
            </FeatureCard>
          </Pressable>
        );
      })}
      <View style={{ height: 40 }} />
    </FeatureScreen>
  );
}

type Edition = typeof HADITH_EDITIONS[0];

export function HadithBooksScreen({ onBack, showError }: CommonProps) {
  const { colors } = useNourTheme();
  const [edition, setEdition] = useState<Edition | null>(null);
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(30);

  const openEdition = async (selected: Edition) => {
    setEdition(selected);
    setLoading(true);
    setQuery("");
    setVisible(30);
    try {
      setHadiths(await getHadithBook(selected.id));
    } catch (error) {
      showError(error, () => void openEdition(selected));
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return searchHadiths(hadiths, query);
  }, [hadiths, query]);

  if (!edition) {
    return (
      <FeatureScreen>
        <FeatureHeader title="كتب الحديث الستة" subtitle="المتون العربية الكاملة مع العدد الموثّق" onBack={onBack} />
        {HADITH_EDITIONS.map((item) => (
          <Pressable key={item.id} onPress={() => void openEdition(item)}>
            <FeatureCard style={styles.editionRow}>
              <View style={[styles.roundAction, { backgroundColor: colors.surfaceSoft }]}><Library color={colors.gold} size={23} /></View>
              <View style={styles.grow}><Text style={[styles.cardTitle, { color: colors.ink }]}>{item.title}</Text><Text style={[styles.meta, { color: colors.muted }]}>{item.count}</Text></View>
              <BookOpen color={colors.primary} size={22} />
            </FeatureCard>
          </Pressable>
        ))}
      </FeatureScreen>
    );
  }

  return (
    <FeatureScreen>
      <FeatureHeader title={edition.title} subtitle={hadiths.length ? `${hadiths.length.toLocaleString("en-US")} حديثاً في النسخة المحمّلة` : edition.count} onBack={() => setEdition(null)} />
      <View style={[styles.searchBox, { backgroundColor: colors.surfaceSoft, borderColor: colors.primary, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }]}>
        <Search color={colors.primary} size={22} />
        <TextInput value={query} onChangeText={setQuery} placeholder="ابحث داخل هذا الكتاب برقم الحديث أو بجزء من النص..." placeholderTextColor={colors.muted} style={[styles.input, { color: colors.ink, flex: 1, fontSize: 16 }]} textAlign="right" />
      </View>
      {loading ? <ActivityIndicator color={colors.gold} size="large" style={{ marginVertical: 40 }} /> : null}
      {!loading && !filtered.length ? (
        <FeatureCard style={{ alignItems: "center", paddingVertical: 32 }}>
          <Text style={[styles.body, { color: colors.muted, fontSize: 16 }]}>لا توجد نتائج مطابقة لبحثك في هذا الكتاب.</Text>
        </FeatureCard>
      ) : null}
      {filtered.slice(0, visible).map((hadith, index) => (
        <FeatureCard key={`${hadith.hadithnumber ?? index}-${index}`} style={{ backgroundColor: colors.surface, padding: 0, overflow: "hidden" }}>
          <View style={{ backgroundColor: colors.surfaceSoft, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            {hadith.grades?.[0]?.grade ? (
              <View style={{ backgroundColor: "rgba(31, 193, 109, 0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>{hadith.grades[0].grade}</Text>
              </View>
            ) : <View />}
            <Text style={[styles.hadithNumber, { color: colors.gold, fontSize: 15, fontWeight: "900" }]}>
              رقم الحديث: {String(hadith.hadithnumber ?? index + 1)}
            </Text>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={[styles.hadithText, { color: colors.ink, fontSize: 18, lineHeight: 34, textAlign: "justify" }]}>{hadith.text}</Text>
          </View>
        </FeatureCard>
      ))}
      {visible < filtered.length ? <ActionButton label="عرض المزيد" onPress={() => setVisible((value) => value + 30)} secondary /> : null}
    </FeatureScreen>
  );
}

export function AccountScreen({ onBack, showError, showToast }: CommonProps) {
  const { colors } = useNourTheme();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getCurrentCloudProfile>>>(null);
  const [mode, setMode] = useState<"form" | "sent">("form");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [usageDays, setUsageDays] = useState(0);

  useEffect(() => {
    void getCurrentCloudProfile()
      .then(setProfile)
      .catch((error) => console.warn("[nour:account] profile load", error));
    void import("../services/tracker").then(({ loadTrackerData }) => {
      loadTrackerData().then(data => {
        const days = new Set([...Object.keys(data.prayers), ...Object.keys(data.fasting)]);
        setUsageDays(days.size);
      });
    });
  }, []);

  const submit = async () => {
    setBusy(true);
    try {
      await sendEmailOtp(email);
      setMode("sent");
      showToast?.("تم إرسال رابط الدخول إلى بريدك.");
    } catch (error) {
      showError(error, () => void submit());
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setProfile(null);
      showToast?.("تم تسجيل الخروج.");
    } catch (error) {
      showError(error, () => void logout());
    }
  };

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setEditName(profile?.name || "");
    setEditMode(true);
  };

  const saveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateCloudProfile(editName);
      setProfile(await getCurrentCloudProfile());
      setEditMode(false);
      showToast?.("تم تحديث الملف الشخصي.");
    } catch (error) {
      showError(error, () => void saveProfile());
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0].uri) {
        setSaving(true);
        await uploadAvatar(result.assets[0].uri);
        setProfile(await getCurrentCloudProfile());
        showToast?.("تم تحديث الصورة الشخصية.");
      }
    } catch (error) {
      showError(error, () => void pickAvatar());
    } finally {
      setSaving(false);
    }
  };

  return (
    <FeatureScreen>
      <FeatureHeader title="إدارة الحساب" subtitle="مزامنة آمنة لتفضيلاتك وبياناتك" onBack={onBack} />
      {profile ? (
        <>
          <FeatureCard style={styles.accountCard}>
          <Pressable onPress={() => void pickAvatar()} style={[styles.avatar, { backgroundColor: colors.surfaceSoft, overflow: "hidden" }]}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={{ width: "100%", height: "100%" }} />
            ) : (
              <UserRound color={colors.primary} size={42} />
            )}
          </Pressable>
          {editMode ? (
            <>
              <TextInput value={editName} onChangeText={setEditName} placeholder="اسم المستخدم" placeholderTextColor={colors.muted} style={[styles.formInput, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surfaceSoft }]} textAlign="right" />
              <View style={{ flexDirection: "row", gap: 10, alignSelf: "stretch" }}>
                <ActionButton label={saving ? "جارٍ الحفظ…" : "حفظ"} onPress={() => void saveProfile()} disabled={saving} />
                <ActionButton label="إلغاء" onPress={() => setEditMode(false)} secondary disabled={saving} />
              </View>
            </>
          ) : (
              <>
                <Text style={[styles.cardTitle, { color: colors.ink, fontSize: 24, fontWeight: "900" }]}>{profile.name}</Text>
                <Text style={[styles.meta, { color: colors.muted, marginBottom: 16 }]}>{profile.email}</Text>
                
                <View style={{ flexDirection: "row", gap: 12, width: "100%", marginBottom: 20 }}>
                  <View style={{ flex: 1, backgroundColor: colors.surfaceSoft, padding: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.gold, fontSize: 18, fontWeight: "900" }}>{profile.joinedAt ? new Date(profile.joinedAt).getFullYear() : new Date().getFullYear()}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>سنة الانضمام</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: colors.surfaceSoft, padding: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.gold, fontSize: 18, fontWeight: "900" }}>{usageDays.toLocaleString("en-US")}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>أيام النشاط</Text>
                  </View>
                </View>

                <ActionButton label="تعديل الحساب" onPress={startEditing} />
                <ActionButton label="تسجيل الخروج" onPress={() => void logout()} secondary />
              </>
            )}
          </FeatureCard>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 12 }}>
            <Pressable onPress={() => Linking.openURL("https://nour-app.com/privacy")}><Text style={{ color: colors.muted, fontSize: 13, textDecorationLine: "underline" }}>سياسة الخصوصية</Text></Pressable>
            <Pressable onPress={() => Linking.openURL("https://nour-app.com/terms")}><Text style={{ color: colors.muted, fontSize: 13, textDecorationLine: "underline" }}>الشروط والأحكام</Text></Pressable>
          </View>
        </>
      ) : (
        <>
          {!isCloudAuthConfigured ? (
            <FeatureCard style={styles.noticeCard}>
              <ShieldCheck color={colors.gold} size={28} />
              <Text style={[styles.cardTitle, { color: colors.ink }]}>الحساب السحابي غير متاح في هذه النسخة</Text>
              <Text style={[styles.smallBody, { color: colors.muted }]}>يمكن تفعيله بأمان في البناء القادم دون إنشاء حساب وهمي على الهاتف.</Text>
            </FeatureCard>
          ) : null}
          <GoogleSignInButton
            onSignedIn={() => void getCurrentCloudProfile().then(setProfile).catch(() => undefined)}
            onError={(error) => showError(error, () => undefined)}
          />
          <FeatureCard>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{mode === "sent" ? "تم إرسال الرابط" : "المتابعة بالبريد الإلكتروني"}</Text>
            {mode === "sent" ? (
              <Text style={[styles.smallBody, { color: colors.muted, textAlign: "right" }]}>
                تم إرسال رابط تسجيل الدخول إلى بريدك. افتح الإيميل واضغط على الرابط للمتابعة.
              </Text>
            ) : null}
            <TextInput value={email} onChangeText={setEmail} editable={mode !== "sent"} keyboardType="email-address" autoCapitalize="none" placeholder="البريد الإلكتروني" placeholderTextColor={colors.muted} style={[styles.formInput, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surfaceSoft }]} textAlign="right" />
            {mode !== "sent" ? (
              <ActionButton disabled={busy || !isCloudAuthConfigured || !email} label={busy ? "جارٍ الإرسال…" : "إرسال رابط الدخول"} onPress={() => void submit()} />
            ) : (
              <ActionButton label="تغيير البريد الإلكتروني" onPress={() => setMode("form")} secondary />
            )}
          </FeatureCard>
        </>
      )}
    </FeatureScreen>
  );
}

export function AnimatedFlame({ color = "#F59E0B", size = 24 }: { color?: string; size?: number }) {
  return <AnimatedFlameVisual size={size} />;
}

export function ToolsScreen({ onBack }: CommonProps) {
  const { colors } = useNourTheme();
  const [cash, setCash] = useState("");
  const [goldValue, setGoldValue] = useState("");
  const [debts, setDebts] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [ramadanTasks, setRamadanTasks] = useState([false, false, false, false]);
  const tasks = ["ورد القرآن", "أذكار الصباح والمساء", "صدقة اليوم", "قيام الليل والوتر"];
  const calculate = () => {
    const wealth = Math.max(0, (Number(cash) || 0) + (Number(goldValue) || 0) - (Number(debts) || 0));
    setResult(wealth * 0.025);
  };
  return (
    <FeatureScreen>
      <FeatureHeader title="الزكاة ووضع رمضان" subtitle="أدوات عملية لعباداتك اليومية" onBack={onBack} />
      <FeatureCard>
        <View style={styles.toolTitle}><Calculator color={colors.gold} size={26} /><Text style={[styles.cardTitle, { color: colors.ink }]}>حاسبة الزكاة التقديرية</Text></View>
        <Text style={[styles.smallBody, { color: colors.muted }]}>أدخل القيم بعملتك بعد تحقق الحول والنصاب. الناتج إرشادي بنسبة ٢٫٥٪ وليس فتوى فردية.</Text>
        <TextInput value={cash} onChangeText={setCash} keyboardType="decimal-pad" placeholder="النقد والمدخرات" placeholderTextColor={colors.muted} style={[styles.formInput, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surfaceSoft }]} textAlign="right" />
        <TextInput value={goldValue} onChangeText={setGoldValue} keyboardType="decimal-pad" placeholder="قيمة الذهب وعروض التجارة" placeholderTextColor={colors.muted} style={[styles.formInput, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surfaceSoft }]} textAlign="right" />
        <TextInput value={debts} onChangeText={setDebts} keyboardType="decimal-pad" placeholder="الديون الحالة القابلة للخصم" placeholderTextColor={colors.muted} style={[styles.formInput, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surfaceSoft }]} textAlign="right" />
        <ActionButton label="احسب الزكاة" onPress={calculate} />
        {result !== null ? <Text style={[styles.zakatResult, { color: colors.primary }]}>الزكاة التقديرية: {result.toLocaleString("en-US", { maximumFractionDigits: 2 })}</Text> : null}
      </FeatureCard>
      <FeatureCard>
        <View style={styles.toolTitle}><MoonStar color={colors.gold} size={27} /><Text style={[styles.cardTitle, { color: colors.ink }]}>وضع رمضان</Text></View>
        <Text style={[styles.smallBody, { color: colors.muted }]}>قائمة يومية بسيطة تحفظ تقدمك ما دمت داخل الشاشة.</Text>
        {tasks.map((task, index) => (
          <Pressable key={task} onPress={() => setRamadanTasks((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value))} style={[styles.taskRow, { borderColor: colors.border }]}>
            <View style={[styles.check, { borderColor: colors.gold, backgroundColor: ramadanTasks[index] ? colors.gold : "transparent" }]}>{ramadanTasks[index] ? <Check color="#FFFFFF" size={16} /> : null}</View>
            <Text style={[styles.taskText, { color: colors.ink }]}>{task}</Text>
          </Pressable>
        ))}
      </FeatureCard>
    </FeatureScreen>
  );
}

const PRAYER_ITEMS: Array<{ key: PrayerKey; label: string; isSunnah?: boolean }> = [
  { key: "Fajr", label: "صلاة الفجر" },
  { key: "Duha", label: "صلاة الضحى", isSunnah: true },
  { key: "Dhuhr", label: "صلاة الظهر" },
  { key: "Asr", label: "صلاة العصر" },
  { key: "Maghrib", label: "صلاة المغرب" },
  { key: "Isha", label: "صلاة العشاء" },
];

const WEEKDAY_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function TrackerScreen({ onBack }: CommonProps) {
  const { colors } = useNourTheme();
  const [data, setData] = useState<TrackerData>({ prayers: {}, fasting: {} });
  const [selectedDateKey, setSelectedDateKey] = useState<string>(getFormattedDateKey());

  useEffect(() => {
    void loadTrackerData().then(setData);
  }, []);

  const dateList = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d;
    });
  }, []);

  const selectedDate = useMemo(() => {
    const found = dateList.find((d) => getFormattedDateKey(d) === selectedDateKey);
    return found ?? new Date();
  }, [dateList, selectedDateKey]);

  const prayerStreak = useMemo(() => calculatePrayerStreak(data.prayers), [data.prayers]);
  const bestPrayerStreak = useMemo(() => calculateBestPrayerStreak(data.prayers), [data.prayers]);
  const fastingStreak = useMemo(() => calculateFastingStreak(data.fasting), [data.fasting]);
  const bestFastingStreak = useMemo(() => calculateBestFastingStreak(data.fasting), [data.fasting]);
  const weeklyPrayers = useMemo(() => calculateWeeklyPrayersCount(data.prayers), [data.prayers]);

  const togglePrayer = async (key: PrayerKey) => {
    const currentDayRecord = data.prayers[selectedDateKey] || {};
    const updatedRecord = { ...currentDayRecord, [key]: !currentDayRecord[key] };
    const newData = {
      ...data,
      prayers: {
        ...data.prayers,
        [selectedDateKey]: updatedRecord,
      },
    };
    setData(newData);
    await saveTrackerData(newData);
  };

  const setFastingStatus = async (status: boolean) => {
    const newData = {
      ...data,
      fasting: {
        ...data.fasting,
        [selectedDateKey]: status,
      },
    };
    setData(newData);
    await saveTrackerData(newData);
  };

  const selectedDayRecord = data.prayers[selectedDateKey] || {};
  const isSelectedDayPrayerComplete = isDayPrayerComplete(selectedDayRecord);
  const selectedDayFasting = data.fasting[selectedDateKey];
  const fastDayInfo = getFastDayInfo(selectedDate);

  return (
    <FeatureScreen>
      <FeatureHeader title="متتبع الصلاة والصيام" subtitle="حافظ على فرائضك وسنتك وثبّت إنجازك" onBack={onBack} />

      {/* Streaks Banner */}
      <View style={{ flexDirection: "column", gap: 12, marginBottom: 8 }}>
        <View style={{ borderRadius: 16, overflow: "hidden" }}>
          <LinearGradient
            colors={[colors.primary, "#1f3b30"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Flame color="#fff" size={24} />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, fontWeight: "700" }}>شعلة الصلاة</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900" }}>{prayerStreak.toLocaleString("en-US")}</Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" }}>أيام</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>أفضل شعلة: {bestPrayerStreak.toLocaleString("en-US")}</Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>هذا الأسبوع: {weeklyPrayers.toLocaleString("en-US")}/35 صلاة</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={{ borderRadius: 16, overflow: "hidden" }}>
          <LinearGradient
            colors={[colors.surfaceSoft, colors.surfaceSoft]} // Placeholder for dark/light consistency
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 16 }}
          >
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MoonStar color={colors.gold} size={24} />
                <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "700" }}>أيام الصيام</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                <Text style={{ color: colors.primary, fontSize: 24, fontWeight: "900" }}>{fastingStreak.toLocaleString("en-US")}</Text>
                <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>يوم متتالي</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View style={{ backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: "700" }}>أطول صيام: {bestFastingStreak.toLocaleString("en-US")}</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 11 }}>الأيام المكتملة</Text>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Date Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {dateList.map((d) => {
          const key = getFormattedDateKey(d);
          const isSelected = key === selectedDateKey;
          const complete = isDayPrayerComplete(data.prayers[key]);
          const dayNum = d.getDate().toLocaleString("en-US");
          const weekdayStr = WEEKDAY_AR[d.getDay()];

          return (
            <Pressable
              key={key}
              onPress={() => setSelectedDateKey(key)}
              style={[
                {
                  width: 58,
                  paddingVertical: 10,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ fontSize: 11, color: isSelected ? colors.onPrimary : colors.muted, fontWeight: "700" }}>{weekdayStr}</Text>
              <Text style={{ fontSize: 16, color: isSelected ? colors.onPrimary : colors.ink, fontWeight: "900", marginVertical: 2 }}>{dayNum}</Text>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: complete ? colors.gold : "transparent" }} />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Selected Day Status */}
      <FeatureCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[styles.meta, { color: colors.gold }]}>
            {isSelectedDayPrayerComplete ? "الصلوات الخمس مكتملة" : "الصلوات الخمس غير مكتملة بعد"}
          </Text>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>
            صلوات {WEEKDAY_AR[selectedDate.getDay()]} ({selectedDate.getDate().toLocaleString("en-US")})
          </Text>
        </View>

        {PRAYER_ITEMS.map((item) => {
          const checked = Boolean(selectedDayRecord[item.key]);
          return (
            <Pressable
              key={item.key}
              onPress={() => void togglePrayer(item.key)}
              style={[styles.taskRow, { borderColor: colors.border }]}
            >
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                {item.isSunnah ? (
                  <Text style={{ fontSize: 11, color: colors.gold, fontWeight: "700" }}>(سنة اختيارية)</Text>
                ) : (
                  <Text style={{ fontSize: 11, color: colors.muted }}>(فريضة)</Text>
                )}
              </View>
              <Text style={[styles.taskText, { color: colors.ink, textDecorationLine: checked ? "line-through" : "none" }]}>
                {item.label}
              </Text>
              <View style={[styles.check, { borderColor: colors.gold, backgroundColor: checked ? colors.gold : "transparent" }]}>
                {checked ? <Check color="#FFFFFF" size={16} /> : null}
              </View>
            </Pressable>
          );
        })}
      </FeatureCard>

      {/* Fasting Card for Selected Day */}
      <FeatureCard>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>متابعة صيام اليوم</Text>
          <AnimatedFastingMoon size={26} />
        </View>

        {fastDayInfo.isRecommended && fastDayInfo.reason ? (
          <View style={{ backgroundColor: colors.surfaceSoft, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
            <Text style={[styles.smallBody, { color: colors.primary, textAlign: "right", fontWeight: "700" }]}>
              ✨ {fastDayInfo.reason}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.smallBody, { color: colors.muted }]}>هل أتممت صيام هذا اليوم؟</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <ActionButton
            label={selectedDayFasting === true ? "تم الصيام ✓" : "نعم، أتممت الصيام"}
            onPress={() => void setFastingStatus(true)}
            secondary={selectedDayFasting !== true}
          />
          <ActionButton
            label={selectedDayFasting === false ? "لم أصم ✓" : "لم أصُم اليوم"}
            onPress={() => void setFastingStatus(false)}
            secondary={selectedDayFasting !== false}
          />
        </View>
      </FeatureCard>
    </FeatureScreen>
  );
}

export function KhatmaScreen({ onBack, navigate, showToast }: CommonProps & { navigate?: (route: any) => void; showToast?: (msg: string) => void }) {
  const { colors } = useNourTheme();
  const [config, setConfig] = useState<KhatmaConfig>({
    active: false,
    targetDays: 30,
    unit: "pages",
    preferredTime: "09:00",
    startDate: new Date().toISOString().split("T")[0],
    completedPages: 0,
    streak: 0,
  });

  const [setupDays, setSetupDays] = useState<number>(30);
  const [customDays, setCustomDays] = useState<string>("30");
  const [setupUnit, setSetupUnit] = useState<KhatmaUnit>("pages");
  const [setupTime, setSetupTime] = useState<string>("09:00");

  useEffect(() => {
    void loadKhatmaConfig().then(setConfig);
  }, []);

  const saveSetup = async (targetDays: number) => {
    const newConfig: KhatmaConfig = {
      active: true,
      targetDays,
      unit: setupUnit,
      preferredTime: setupTime,
      startDate: new Date().toISOString().split("T")[0],
      completedPages: 0,
      streak: 0,
    };
    setConfig(newConfig);
    await saveKhatmaConfig(newConfig);
    if (showToast) showToast("تم تفعيل خطة الختمة المباركة بنجاح!");
    // جدولة إشعار ذكي بمجرد بدء الختمة
    void scheduleKhatmaReminder().catch((e) => console.warn("[nour:khatma] reminder schedule failed", e));

  };

  const markTodayRead = async () => {
    const dailyGoal = getDailyPagesGoal(config.targetDays);
    const newCompleted = Math.min(TOTAL_QURAN_PAGES, config.completedPages + dailyGoal);
    const todayStr = new Date().toISOString().split("T")[0];
    const newStreak = config.lastReadDate === todayStr ? config.streak : config.streak + 1;

    const newConfig: KhatmaConfig = {
      ...config,
      completedPages: newCompleted,
      streak: newStreak,
      lastReadDate: todayStr,
    };
    setConfig(newConfig);
    await saveKhatmaConfig(newConfig);

    if (showToast) {
      if (newCompleted >= TOTAL_QURAN_PAGES) {
        showToast("هنيئاً لك! أتممت الختمة الشريفة كاملة.");
      } else {
        showToast(`تقبل الله! تم تسجيل ورد اليوم. (الـ Streak: ${newStreak} يوم)`);
      }
    }

    if (navigate) {
      navigate("quran");
    }
    // إعادة جدولة الإشعار لليوم التالي بمحتوى محدّث
    void scheduleKhatmaReminder().catch((e) => console.warn("[nour:khatma] reminder reschedule failed", e));

  };

  const resetKhatma = async () => {
    const newConfig: KhatmaConfig = {
      active: false,
      targetDays: 30,
      unit: "pages",
      preferredTime: "09:00",
      startDate: new Date().toISOString().split("T")[0],
      completedPages: 0,
      streak: 0,
    };
    setConfig(newConfig);
    await saveKhatmaConfig(newConfig);
    if (showToast) showToast("تم إعادة ضبط خطة الختمة.");
  };

  const redistributeRemaining = async () => {
    const remainingPages = TOTAL_QURAN_PAGES - config.completedPages;
    if (remainingPages <= 0) return;
    const dailyGoal = getDailyPagesGoal(config.targetDays);
    const newTargetDays = Math.max(1, Math.ceil(remainingPages / dailyGoal));
    const newConfig: KhatmaConfig = {
      ...config,
      targetDays: newTargetDays,
    };
    setConfig(newConfig);
    await saveKhatmaConfig(newConfig);
    if (showToast) showToast("تم إعادة توزيع الصفحات المتبقية على الأيام المتبقية.");
  };

  const dailyGoalPages = getDailyPagesGoal(config.targetDays);
  const progressPercent = getKhatmaProgressPercent(config.completedPages);
  const badges = getKhatmaBadges(config.completedPages);

  const startPage = Math.min(TOTAL_QURAN_PAGES, config.completedPages + 1);
  const endPage = Math.min(TOTAL_QURAN_PAGES, config.completedPages + dailyGoalPages);

  if (!config.active) {
    return (
      <FeatureScreen>
        <FeatureHeader title="الختمة مع نور" subtitle="خطط لختم كتاب الله وضاعف أركان أداءك" onBack={onBack} />
        <FeatureCard style={{ alignItems: "center", gap: 12, paddingVertical: 20 }}>
          <BookOpen color={colors.gold} size={48} />
          <Text style={[styles.cardTitle, { color: colors.ink, fontSize: 20, textAlign: "center" }]}>ابدأ ختمتك المباركة</Text>
          <Text style={[styles.smallBody, { color: colors.muted, textAlign: "center", lineHeight: 22 }]}>
            اختر المدة الزمنية ووحدة القياس التي تناسبك، وسيقوم نور بتنظيم وتذكيرك بوردك اليومي بدقة.
          </Text>
        </FeatureCard>

        {/* 1. Target Duration */}
        <FeatureCard style={{ paddingVertical: 16 }}>
          <Text style={[styles.cardTitle, { color: colors.ink, marginBottom: 12 }]}>١. اختر مدة الختمة المفضلة</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[15, 30, 60].map((days) => {
              const isSelected = setupDays === days;
              return (
              <Pressable
                key={days}
                onPress={() => { setSetupDays(days); setCustomDays(String(days)); }}
                style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={isSelected ? [colors.primary, "#1f3b30"] : [colors.surfaceSoft, colors.surfaceSoft]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ padding: 12, alignItems: "center", justifyContent: "center", borderWidth: isSelected ? 0 : 1, borderColor: colors.border, borderRadius: 12, height: 48 }}
                >
                  <Text style={[styles.buttonText, { color: isSelected ? "#fff" : colors.ink, fontSize: 16 }]}>
                    {days.toLocaleString("en-US")} يوم
                  </Text>
                </LinearGradient>
              </Pressable>
            )})}
          </View>
          <TextInput
            value={customDays}
            onChangeText={(v) => { setCustomDays(v); const num = Number(v); if (num > 0) setSetupDays(num); }}
            keyboardType="number-pad"
            placeholder="أو اكتب عدد الأيام يدوياً"
            placeholderTextColor={colors.muted}
            style={[styles.formInput, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surfaceSoft, marginTop: 12 }]}
            textAlign="right"
          />
        </FeatureCard>

        {/* 2. Unit Selection */}
        <FeatureCard style={{ paddingVertical: 16 }}>
          <Text style={[styles.cardTitle, { color: colors.ink, marginBottom: 12 }]}>٢. وحدة قياس الورد اليومي</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { id: "pages", label: "بالصفحات" },
              { id: "juz", label: "بالأجزاء" },
              { id: "hizb", label: "بالأحزاب" },
            ].map((item) => {
              const isSelected = setupUnit === item.id;
              return (
              <Pressable
                key={item.id}
                onPress={() => setSetupUnit(item.id as KhatmaUnit)}
                style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={isSelected ? [colors.primary, "#1f3b30"] : [colors.surfaceSoft, colors.surfaceSoft]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ padding: 12, alignItems: "center", justifyContent: "center", borderWidth: isSelected ? 0 : 1, borderColor: colors.border, borderRadius: 12, height: 48 }}
                >
                  <Text style={[styles.buttonText, { color: isSelected ? "#fff" : colors.ink, fontSize: 14 }]}>
                    {item.label}
                  </Text>
                </LinearGradient>
              </Pressable>
            )})}
          </View>
        </FeatureCard>

        {/* 3. Preferred Time */}
        <FeatureCard style={{ paddingVertical: 16 }}>
          <Text style={[styles.cardTitle, { color: colors.ink, marginBottom: 12 }]}>٣. وقت التذكير اليومي المفضّل</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { time: "07:00", label: "07:00 ص" },
              { time: "09:00", label: "09:00 ص" },
              { time: "17:00", label: "05:00 م" },
              { time: "21:00", label: "09:00 م" },
            ].map((item) => {
              const isSelected = setupTime === item.time;
              return (
              <Pressable
                key={item.time}
                onPress={() => setSetupTime(item.time)}
                style={{ flex: 1, borderRadius: 10, overflow: "hidden" }}
              >
                <LinearGradient
                  colors={isSelected ? [colors.gold, "#b8860b"] : [colors.surfaceSoft, colors.surfaceSoft]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ padding: 10, alignItems: "center", justifyContent: "center", borderWidth: isSelected ? 0 : 1, borderColor: colors.border, borderRadius: 10, height: 44 }}
                >
                  <Text style={[styles.buttonText, { color: isSelected ? "#fff" : colors.ink, fontSize: 13 }]}>
                    {item.label}
                  </Text>
                </LinearGradient>
              </Pressable>
            )})}
          </View>
        </FeatureCard>

        {/* Calculated Daily Target Summary */}
        <FeatureCard>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>الورد اليومي المحسوب</Text>
          <View style={{ backgroundColor: colors.surfaceSoft, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
            <Text style={[styles.cardTitle, { color: colors.primary, fontSize: 18, textAlign: "center" }]}>
              {getTargetTextByUnit(getDailyPagesGoal(setupDays), setupUnit)}
            </Text>
            <Text style={[styles.smallBody, { color: colors.muted, textAlign: "center" }]}>
              (في خطة الـ {setupDays.toLocaleString("en-US")} يوماً)
            </Text>
          </View>
          <ActionButton label="ابدأ خطة الختمة الآن" onPress={() => void saveSetup(setupDays)} />
        </FeatureCard>
      </FeatureScreen>
    );
  }

  return (
    <FeatureScreen>
      <FeatureHeader title="الختمة مع نور" subtitle={`خطة الـ ${config.targetDays.toLocaleString("en-US")} يوماً`} onBack={onBack} />

      {/* Progress Banner */}
      <FeatureCard style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Flame color={colors.gold} size={18} />
            <Text style={[styles.meta, { color: colors.primary, fontSize: 13 }]}>Streak الورد: {config.streak.toLocaleString("en-US")} يوم</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.ink, fontSize: 18 }]}>{progressPercent.toLocaleString("en-US")}٪ مكتمل</Text>
        </View>

        {/* Progress bar with milestones */}
        <View style={{ width: "100%", gap: 6 }}>
          <View style={{ width: "100%", height: 14, borderRadius: 7, backgroundColor: colors.border, overflow: "hidden" }}>
            <LinearGradient
              colors={["#D97706", "#C9A24B", "#F7D070"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${progressPercent}%`, height: "100%", borderRadius: 7 }}
            />
          </View>
          {/* Milestone markers */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 }}>
            {[{ label: "ربع", at: 25 }, { label: "نصف", at: 50 }, { label: "ثلاثة أرباع", at: 75 }, { label: "الختمة", at: 100 }].map((m) => (
              <Text key={m.at} style={{ fontSize: 9, fontWeight: "800", color: progressPercent >= m.at ? colors.gold : colors.muted }}>{m.label}</Text>
            ))}
          </View>
        </View>

        <Text style={[styles.smallBody, { color: colors.muted, textAlign: "center" }]}>
          تم قراءة {config.completedPages.toLocaleString("en-US")} من إجمالي {TOTAL_QURAN_PAGES.toLocaleString("en-US")} صفحة
        </Text>
      </FeatureCard>

      {/* Today's Goal Card */}
      <FeatureCard style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>ورد اليوم المطلوب</Text>
          <BookOpen color={colors.gold} size={24} />
        </View>

        <View style={{ backgroundColor: colors.surfaceSoft, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: 4 }}>
          <Text style={[styles.cardTitle, { color: colors.primary, fontSize: 20 }]}>
            من صفحة {startPage.toLocaleString("en-US")} إلى صفحة {endPage.toLocaleString("en-US")}
          </Text>
          <Text style={[styles.smallBody, { color: colors.muted }]}>
            ({getTargetTextByUnit(dailyGoalPages, config.unit)})
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <ActionButton label="تم قراءة الورد" onPress={() => void markTodayRead()} />
          {navigate ? (
            <ActionButton label="اقرأ الآن بالمصحف" onPress={() => navigate("quran")} secondary />
          ) : null}
        </View>
      </FeatureCard>

      {/* Badges Milestone */}
      <FeatureCard style={{ gap: 12 }}>
        <Text style={[styles.cardTitle, { color: colors.ink, fontSize: 17 }]}>شارات الإنجاز والمحطات</Text>
        <View style={{ gap: 12 }}>
          {badges.map((b) => (
            <View
              key={b.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                padding: 12,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: b.unlocked ? colors.border : colors.border,
                backgroundColor: colors.surface,
                opacity: b.unlocked ? 1 : 0.55,
              }}
            >
              <LinearGradient
                colors={b.unlocked ? b.gradient : [colors.surfaceSoft, colors.surfaceSoft]}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {b.iconKey === "sprout" ? <Sprout color={b.unlocked ? "#FFFFFF" : colors.muted} size={22} /> : null}
                {b.iconKey === "book" ? <BookOpen color={b.unlocked ? "#FFFFFF" : colors.muted} size={22} /> : null}
                {b.iconKey === "sparkles" ? <Sparkles color={b.unlocked ? "#FFFFFF" : colors.muted} size={22} /> : null}
                {b.iconKey === "moon" ? <MoonStar color={b.unlocked ? "#FFFFFF" : colors.muted} size={22} /> : null}
                {b.iconKey === "award" ? <Award color={b.unlocked ? "#FFFFFF" : colors.muted} size={22} /> : null}
                {b.iconKey === "crown" ? <Crown color={b.unlocked ? "#FFFFFF" : colors.muted} size={22} /> : null}
              </LinearGradient>

              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.cardTitle, { color: b.unlocked ? colors.ink : colors.muted, fontSize: 14, textAlign: "right" }]}>
                  {b.title}
                </Text>
                <Text style={[styles.smallBody, { color: colors.muted, fontSize: 12, textAlign: "right" }]}>
                  {b.description}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 10,
                  backgroundColor: b.unlocked ? colors.selectedSurface : colors.surfaceSoft,
                }}
              >
                <Text style={{ fontSize: 11, color: b.unlocked ? colors.gold : colors.muted, fontWeight: "800" }}>
                  {b.unlocked ? "مكتسبة" : "مغلقة"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </FeatureCard>

      {/* Settings / Reset Options */}
      <FeatureCard style={{ gap: 8 }}>
        <Text style={[styles.cardTitle, { color: colors.ink }]}>إدارة الختمة</Text>
        <ActionButton label="إعادة توزيع الصفحات المتبقية" onPress={() => void redistributeRemaining()} secondary />
        <ActionButton label="إلغاء الخطة وبدء ختمة جديدة" onPress={() => void resetKhatma()} secondary />
      </FeatureCard>
    </FeatureScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  iconButton: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  grow: { flex: 1 },
  headerTitle: { fontSize: 25, fontWeight: "900", textAlign: "right" },
  headerSubtitle: { fontSize: 13, lineHeight: 20, textAlign: "right", marginTop: 2 },
  card: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: "900", textAlign: "right" },
  body: { fontSize: 15, lineHeight: 25, textAlign: "center" },
  smallBody: { fontSize: 13, lineHeight: 21, textAlign: "right" },
  meta: { fontSize: 12, lineHeight: 19, fontWeight: "700", textAlign: "right" },
  button: { minHeight: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, alignItems: "center", justifyContent: "center", flex: 1 },
  buttonText: { fontSize: 14, fontWeight: "900", textAlign: "center" },
  faded: { opacity: 0.55 },
  qiblaCard: { minHeight: 510, alignItems: "center", justifyContent: "center", gap: 20 },
  compassRing: { width: 238, height: 238, borderRadius: 119, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  north: { position: "absolute", top: 10, fontSize: 16, fontWeight: "900" },
  qiblaDegree: { fontSize: 24, fontWeight: "900" },
  libraryHero: { width: "100%", height: 170, borderRadius: 24, resizeMode: "cover" },
  bookRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bookCover: { width: 62, height: 82, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bookCoverText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },
  roundAction: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  progress: { fontSize: 12, fontWeight: "800", textAlign: "right" },
  editionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchBox: { minHeight: 54, borderWidth: 1, borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  hadithNumber: { fontSize: 12, fontWeight: "900", textAlign: "right" },
  hadithText: { fontSize: 17, lineHeight: 30, textAlign: "right", writingDirection: "rtl" },
  grade: { fontSize: 13, fontWeight: "900", textAlign: "right" },
  accountCard: { alignItems: "center" },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  noticeCard: { alignItems: "center" },
  segmented: { flexDirection: "row", gap: 10 },
  formInput: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 },
  toolTitle: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  zakatResult: { fontSize: 19, fontWeight: "900", textAlign: "center", paddingVertical: 8 },
  taskRow: { minHeight: 52, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 },
  check: { width: 25, height: 25, borderRadius: 8, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  taskText: { fontSize: 15, fontWeight: "700", textAlign: "right" },
});



