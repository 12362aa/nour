import {  useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, 
   FlatList,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text as NativeText,
  TextInput as NativeTextInput,
  TextInputProps,
  TextProps,
  Pressable as NativePressable,
  PressableProps,
  PressableStateCallbackType,
  View as NativeView,
  ViewProps,
  useWindowDimensions,
  DimensionValue,
  Linking,
  Share,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./services/auth";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { LinearGradient } from "expo-linear-gradient";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import notifee, { EventType } from "@notifee/react-native";
import { Audio } from "expo-av";
import Animated, { FadeInDown, FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withTiming, withRepeat, Easing } from "react-native-reanimated";
import { ChevronDown, AlarmClock, ArrowLeft, Bell, BellOff, BookMarked, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, CloudOff, Compass, Flame, Heart, Home, Landmark, Library, ListMusic, MoonStar, MapPin, Pause, Play, Radio, RotateCcw, Search, Settings, Gift, Share2, Sparkles, Sun, Sunrise, Sunset, Moon, UserRound, Volume2, X, Zap, ShieldCheck, Clock, ChevronUp, Info } from "lucide-react-native";
import {
  AllahName,
  ContentError,
  describeContentError,
  DhikrCategory,
  DhikrItem,
  fallbackPrayerTimes,
  getAdhkar,
  getAllahNames,
  getPrayerTimes,
  getRadioStations,
  getSurah,
  getTafsir,
  PrayerTimes,
  RadioStation,
  searchQuran,
  SearchResult,
  Surah,
  verifyHadith,
} from "./services/content";
// fullScreenNotifications — الشاشة التفاعلية تم إلغاؤها. الملف مُبقى للتوافق مع imports فقط.
import { formatPrayerTime } from "./utils/time";
import {
  NourThemeProvider,
  PrayerAlertKey,
  useNourTheme,
} from "./theme/NourTheme";
import {
  AccountScreen,
  BookLibraryScreen,
  HadithBooksScreen,
  QiblaScreen,
  ToolsScreen,
  TrackerScreen,
  KhatmaScreen,
  AnimatedFlame,
} from "./features/RestoredFeatures";
import { FloatingAudioPlayer } from "./components/FloatingAudioPlayer";
import { AnimatedHeaderVisual, AnimatedFlameVisual, HeroPrayerVisual } from "./components/AnimatedVisuals";
import { loadTrackerData, calculatePrayerStreak } from "./services/tracker";
import { getAyahOfTheDay, getDhikrOfTheDay, loadKhatmaConfig, getKhatmaProgressPercent, getDailyPagesGoal, TOTAL_QURAN_PAGES, KhatmaConfig } from "./services/khatma";
import { isBatteryOptimizationActive, requestIgnoreBatteryOptimization, isXiaomiDevice, openExactAlarmSettings, openXiaomiAutostartSettings } from "./services/batteryOptimization";
import { useNourStore } from "./store/useNourStore";
import { getMonthlyCalendar } from "./services/aladhan";
import {
  requestNotificationReschedule,
  rescheduleAllNotifications,
  subscribeNotificationReschedule,
  getAllScheduledDebugItems,
  ScheduledDebugItem,
  scheduleTestReminder,
  scheduleTestAdhan,
  prepareNotifications,
} from "./services/notifications";
import { syncFCMPrefsToSupabase, setupFCMForegroundHandler, setupFCMBackgroundHandler, setupFCMTokenRefreshHandler } from "./services/fcm";
import { MoreScreen } from "./features/MoreScreen";
import { NourAuthProvider, useNourAuth } from "./auth/NourAuthProvider";
import { AuthGate } from "./features/AuthGate";
import { warmQuranIndex } from "./services/local-quran";
import { SURAHS } from "./data/quran-index";
import { getCurrentCloudProfile } from "./services/auth";

const palette = {
  cream: "#FAF8F3",
  white: "#FFFFFF",
  gold: "#C9A24B",
  goldSoft: "#F7EDD4",
  ink: "#2B2B2B",
  muted: "#70716D",
  border: "#EDE7D9",
  sage: "#315B4C",
  sageSoft: "#E8F1EC",
  danger: "#A44444",
  dark: "#18211E",
};

SplashScreen.preventAutoHideAsync().catch(() => {});

function SplashAnimation({ isAppReady, onFinish }: { isAppReady: boolean; onFinish: () => void }) {
  const { colors, darkMode } = useNourTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.5)) });
  }, []);

  useEffect(() => {
    if (isAppReady) {
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 400, easing: Easing.inOut(Easing.quad) });
        scale.value = withTiming(0.9, { duration: 400, easing: Easing.inOut(Easing.quad) });
        setTimeout(onFinish, 400);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isAppReady]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <NativeView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <Animated.View style={[{ alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }, style]}>
        <View style={{ borderRadius: 36, overflow: "hidden", elevation: 10 }}>
          <Image 
            source={require("../assets/icon.png")} 
            style={{ width: 140, height: 140, resizeMode: "cover" }} 
          />
        </View>
        <NativeText style={{ color: colors.ink, fontSize: 32, fontWeight: "900", marginTop: 24, letterSpacing: 1.5 }}>نور</NativeText>
        <NativeText style={{ color: colors.muted, fontSize: 16, marginTop: 8, fontWeight: "600" }}>رفيقك اليومي</NativeText>
      </Animated.View>
    </NativeView>
  );
}

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 };
const FONT = { h1: 28, h2: 20, body: 16, caption: 13 };

type ThemeStyleKey = "backgroundColor" | "borderColor" | "color" | "shadowColor";

function mapThemeColor(value: unknown, colors: ReturnType<typeof useNourTheme>["colors"], key: ThemeStyleKey) {
  if (typeof value !== "string") return value;
  if (key === "color") {
    if (value === palette.ink) return colors.ink;
    if (value === palette.muted) return colors.muted;
    if (value === palette.sage) return colors.primary;
    if (value === "#214137") return colors.ink;
    return value;
  }
  if (value === palette.white) return colors.surface;
  if (value === palette.cream || value === "#FFFDF8") return colors.background;
  if (value === palette.goldSoft || value === palette.sageSoft || value === "#FFF8E9" || value === "#FFF9E9" || value === "#F3E2B5" || value === "#EEE8DD") return colors.surfaceSoft;
  if (value === palette.ink) return colors.ink;
  if (value === palette.muted) return colors.muted;
  if (value === palette.sage) return colors.primary;
  if (value === palette.border || value === "#CDDFD4" || value === "#C9E1CF") return colors.border;
  return value;
}

function themedStyle(style: any, colors: ReturnType<typeof useNourTheme>["colors"]): any {
  const flattened = StyleSheet.flatten(style as never) as Record<string, unknown> | undefined;
  if (!flattened) return style;
  const mapped = { ...flattened };
  for (const key of ["backgroundColor", "borderColor", "color", "shadowColor"] as ThemeStyleKey[]) {
    if (key in mapped) mapped[key] = mapThemeColor(mapped[key], colors, key);
  }
  return [style, mapped] as never;
}

function Text({ style, ...props }: TextProps) {
  const { colors } = useNourTheme();
  return <NativeText {...props} style={themedStyle(style, colors)} />;
}

function TextInput({ style, ...props }: TextInputProps) {
  const { colors } = useNourTheme();
  return <NativeTextInput {...props} style={themedStyle(style, colors)} />;
}

function View({ style, ...props }: ViewProps) {
  const { colors } = useNourTheme();
  return <NativeView {...props} style={themedStyle(style, colors)} />;
}

function Pressable({ style, ...props }: PressableProps) {
  const { colors } = useNourTheme();
  const themed = typeof style === "function"
    ? (state: PressableStateCallbackType) => themedStyle(style(state), colors)
    : themedStyle(style, colors);
  return <NativePressable {...props} style={themed} />;
}
const prayerLabels: Array<[keyof PrayerTimes, string]> = [
  ["Fajr", "الفجر"],
  ["Sunrise", "الشروق"],
  ["Dhuhr", "الظهر"],
  ["Asr", "العصر"],
  ["Maghrib", "المغرب"],
  ["Isha", "العشاء"],
];

type PrayerVisualKey = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
const prayerBackgrounds: Record<PrayerVisualKey, number> = {
  Fajr: require("../assets/prayer-backgrounds/fajr-bg.png"),
  Dhuhr: require("../assets/prayer-backgrounds/dhuhr-bg.png"),
  Asr: require("../assets/prayer-backgrounds/asr-bg.png"),
  Maghrib: require("../assets/prayer-backgrounds/maghrib-bg.png"),
  Isha: require("../assets/prayer-backgrounds/isha-bg.png"),
};

const prayerVisualLabels: Array<[PrayerVisualKey, string]> = prayerLabels.filter(
  (item): item is [PrayerVisualKey, string] => item[0] !== "Sunrise",
);

function prayerTarget(time: string, base: Date, tomorrow = false) {
  const [hour, minute] = time.replace(/\s*\(.+?\)/g, "").split(":").map(Number);
  const target = new Date(base);
  if (tomorrow) target.setDate(target.getDate() + 1);
  target.setHours(hour, minute, 0, 0);
  return target;
}

function formatCountdown(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds]
    .map((value) => value.toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false }))
    .join(":");
}

type Route =
  | "home"
  | "quran"
  | "adhkar"
  | "radio"
  | "library"
  | "books"
  | "hadith-books"
  | "qibla"
  | "account"
  | "tools"
  | "names"
  | "settings"
  | "more"
  | "adhan"
  | "reminder"
  | "about"
  | "tracker"
  | "khatma";
type Resource<T> = { phase: "loading" | "success" | "error"; data?: T; error?: unknown };

function useResource<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [resource, setResource] = useState<Resource<T>>({ phase: "loading" });
  const reload = useCallback(async () => {
    setResource({ phase: "loading" });
    try {
      setResource({ phase: "success", data: await loader() });
    } catch (error) {
      setResource({ phase: "error", error });
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    void reload();
  }, [reload]);
  return { resource, reload };
}

function toArabicNumber(value: number | string) {
  return String(value);
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors } = useNourTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>;
}

function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { colors } = useNourTheme();
  if (!scroll) return <View style={[styles.screen, { backgroundColor: colors.background }]}>{children}</View>;
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

function Header({ title, subtitle, onBack, navigate, onInfoPress, showInfoBadge }: { title: string; subtitle?: string; onBack?: () => void; navigate?: (route: Route) => void; onInfoPress?: () => void; showInfoBadge?: boolean; }) {
  const { colors } = useNourTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [displayName, setDisplayName] = useState<string | undefined>();
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 18;

  useEffect(() => {
    if (navigate && !onBack) {
      void getCurrentCloudProfile().then((profile) => {
        setAvatarUrl(profile?.avatarUri);
        setDisplayName(profile?.name);
      }).catch(() => undefined);
    }
  }, [navigate, onBack]);

  const displayTitle = (title === "نور" && displayName && displayName !== "مستخدم جديد") ? `مرحبًا يا ${displayName}` : title;

  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityLabel="رجوع" onPress={onBack} style={styles.iconButton}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
      ) : (
        <View style={[styles.logoMark, { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.surfaceSoft, justifyContent: "center", alignItems: "center" }]}>
          <AnimatedHeaderVisual isNight={isNight} />
        </View>
      )}
      <View style={styles.headerCopy}>
        <NativeText style={[styles.headerTitle, { color: colors.ink }]}>{displayTitle}</NativeText>
        {subtitle ? <NativeText style={styles.headerSubtitle}>{subtitle}</NativeText> : null}
      </View>
      {navigate && !onBack ? (
        <Pressable
          onPress={() => navigate("account")}
          style={[styles.iconButton, { overflow: "hidden" }]}
          accessibilityLabel="إدارة الحساب"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 48, height: 48, borderRadius: 17 }} />
          ) : (
            <UserRound color={colors.primary} size={24} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  icon: Icon,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: typeof Play;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useNourTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <NativePressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => { scale.value = withTiming(0.96, { duration: 80 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
      style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, (pressed || disabled) && styles.pressed]}
    >
      <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1, justifyContent: "center" }, animStyle]}>
        {Icon ? <Icon size={20} color={secondary ? colors.primary : colors.onPrimary} /> : null}
        <NativeText numberOfLines={2} style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</NativeText>
      </Animated.View>
    </NativePressable>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useNourTheme();
  return (
    <View style={styles.sectionTitleRow}>
      {action && onAction ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : <View />}
      <Text style={[styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
    </View>
  );
}

function SkeletonPulse({ width, height = 14, borderRadius = 8 }: { width: DimensionValue; height?: number; borderRadius?: number }) {
  const { colors } = useNourTheme();
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + shimmer.value * 0.5,
  }));
  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: colors.border }, shimmerStyle]} />
  );
}

function LoadingState({ lines = 3, card = true }: { lines?: number; card?: boolean }) {
  const inner = (
    <View style={[styles.stateCard, { gap: spacing.md }]}>
      <SkeletonPulse width="40%" height={18} borderRadius={9} />
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonPulse key={index} width={`${92 - index * 14}%`} height={13} />
      ))}
    </View>
  );
  return card ? <Card>{inner}</Card> : inner;
}

function EmptyState({ title, subtitle, onRetry }: { title: string; subtitle: string; onRetry?: () => void }) {
  return (
    <Card style={styles.stateCard}>
      <Sparkles color={palette.gold} size={32} />
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{subtitle}</Text>
      {onRetry ? <PrimaryButton label="إعادة المحاولة" onPress={onRetry} icon={RotateCcw} secondary /> : null}
    </Card>
  );
}

function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void; onDetails?: () => void }) {
  const description = describeContentError(error);
  return (
    <Card style={[styles.stateCard, styles.errorCard]}>
      <CloudOff color={palette.gold} size={32} />
      <Text style={styles.stateTitle}>{description.title}</Text>
      <Text style={styles.stateText}>{description.message}</Text>
      <PrimaryButton label="إعادة المحاولة" onPress={onRetry} icon={RotateCcw} />
    </Card>
  );
}

function ErrorDialog({ error, onRetry, onClose }: { error: unknown; onRetry: () => void; onClose: () => void }) {
  const { colors } = useNourTheme();
  const description = describeContentError(error);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={[styles.errorModal, { backgroundColor: colors.surface }]}>
          <Image source={require("../assets/connection-empty-v2.png")} style={styles.errorIllustration} />
          <Text style={styles.errorTitle}>{description.title}</Text>
          <Text style={styles.errorMessage}>{description.message}</Text>
          <PrimaryButton label="إعادة المحاولة" onPress={onRetry} icon={RotateCcw} />
          <Pressable onPress={onClose} style={styles.closeModal}><Text style={styles.closeModalText}>إغلاق</Text></Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}



function NotificationSetupModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useNourTheme();
  const isXiaomi = isXiaomiDevice();
  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <View style={{ width: "100%", maxWidth: 360, backgroundColor: colors.surface, borderRadius: 24, padding: 24, alignItems: "center", gap: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceSoft, justifyContent: "center", alignItems: "center" }}>
            <Sparkles color={colors.gold} size={34} />
          </View>
          <NativeText style={{ fontSize: 19, fontWeight: "900", color: colors.ink, textAlign: "center" }}>إعدادات الإشعارات الضرورية</NativeText>
          <NativeText style={{ fontSize: 14, lineHeight: 22, color: colors.muted, textAlign: "center" }}>
            لضمان وصول التنبيهات في موعدها الدقيق:
          </NativeText>
          <View style={{ width: "100%", gap: 10, marginTop: 4 }}>
            <PrimaryButton
              label="1. السماح بالعمل بدون قيود"
              icon={Zap}
              secondary
              onPress={() => void requestIgnoreBatteryOptimization()}
            />
            <PrimaryButton
              label="2. السماح بالمنبهات الدقيقة"
              icon={Clock}
              secondary
              onPress={() => void openExactAlarmSettings()}
            />
            {isXiaomi && (
              <PrimaryButton
                label="3. تفعيل التشغيل التلقائي (Xiaomi)"
                icon={Sparkles}
                secondary
                onPress={() => void openXiaomiAutostartSettings()}
              />
            )}
            <View style={{ marginTop: 10 }}>
              <PrimaryButton
                label="تم تفعيل الإعدادات"
                onPress={onClose}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FullScreenPermissionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useNourTheme();
  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <View style={{ width: "100%", maxWidth: 360, backgroundColor: colors.surface, borderRadius: 24, padding: 24, alignItems: "center", gap: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceSoft, justifyContent: "center", alignItems: "center" }}>
            <MoonStar color={colors.gold} size={34} />
          </View>
          <NativeText style={{ fontSize: 19, fontWeight: "900", color: colors.ink, textAlign: "center", writingDirection: "rtl" }}>تنبيه الأذان عبر الشاشة</NativeText>
          <NativeText style={{ fontSize: 14, lineHeight: 24, color: colors.muted, textAlign: "center", writingDirection: "rtl" }}>
            عشان يقدر نور يعرض شاشة تنبيه الأذان حتى وأنت مستخدم تطبيق تاني، محتاجين إذنك بـ "الظهور فوق التطبيقات الأخرى" (Display over other apps).
          </NativeText>
          <View style={{ width: "100%", gap: 10, marginTop: 4 }}>
            <PrimaryButton
              label="تفعيل الصلاحية الآن"
              icon={ShieldCheck}
              onPress={() => {
                onClose();
                void Linking.openSettings();
              }}
            />
            <Pressable onPress={onClose} style={{ paddingVertical: 10, alignItems: "center" }}>
              <NativeText style={{ fontSize: 13, color: colors.muted, fontWeight: "700" }}>سأكتفي بالإشعار العادي</NativeText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BatteryOptimizationCard() {
  const { colors } = useNourTheme();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      void isBatteryOptimizationActive().then(setActive);
    }
  }, []);

  if (!active) return null;

  return (
    <Card style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => void requestIgnoreBatteryOptimization()} style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
          <NativeText style={{ fontSize: 12, fontWeight: "800", color: colors.onPrimary }}>إعفاء الآن</NativeText>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ alignItems: "flex-end" }}>
            <NativeText style={{ fontSize: 14, fontWeight: "900", color: colors.ink }}>السماح بالعمل في الخلفية</NativeText>
            <NativeText style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>لتفادي كتم إشعارات الأذكار من النظام</NativeText>
          </View>
          <Sparkles color={colors.gold} size={22} />
        </View>
      </View>
    </Card>
  );
}

function HomeScreen({
  navigate,
  showError,
  showToast,
}: {
  navigate: (route: Route) => void;
  showError: (error: unknown, retry: () => void) => void;
  showToast: (message: string) => void;
}) {
  const { colors, prayerAlerts, setPrayerAlert } = useNourTheme();
  const coordinates = useNourStore((state) => state.coordinates);
  const locationReady = useNourStore((state) => state.locationReady);
  const setCoordinates = useNourStore((state) => state.setCoordinates);
  const useDefaultLocation = useNourStore((state) => state.useDefaultLocation);
  const [locationDenied, setLocationDenied] = useState(false);
  
  const [clock, setClock] = useState(() => new Date());
  const [khatmaConfig, setKhatmaConfig] = useState<KhatmaConfig | null>(null);
  const { resource, reload } = useResource(() => getPrayerTimes(coordinates.latitude, coordinates.longitude), [coordinates.latitude, coordinates.longitude]);
  const times = resource.data ?? fallbackPrayerTimes;
  const next = useMemo(() => {
    const future = prayerVisualLabels.find(([key]) => prayerTarget(times[key], clock) > clock);
    const item = future ?? prayerVisualLabels[0];
    const target = prayerTarget(times[item[0]], clock, !future);
    return { key: item[0], label: item[1], target };
  }, [clock, times]);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1_000);
    void loadKhatmaConfig().then(setKhatmaConfig);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (locationReady) return;
    let active = true;
    void (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active) return;
      if (!permission.granted) {
        setLocationDenied(true);
        return;
      }
      const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const places = await Location.reverseGeocodeAsync(point.coords).catch(() => []);
      if (!active) return;
      setCoordinates({
        latitude: point.coords.latitude,
        longitude: point.coords.longitude,
        city: places[0]?.city || places[0]?.region || "موقعك الحالي",
      });
    })().catch((error) => {
      console.warn("[nour:location] first location failed", error);
      if (active) setLocationDenied(true);
    });
    return () => { active = false; };
  }, [locationReady, setCoordinates]);

  const testAdhan = async () => {
    try {
      await scheduleTestAdhan(10);
      showToast("ستظهر شاشة الأذان التفاعلية تلقائياً بعد ١٠ ثوانٍ.");
    } catch (error) {
      showError(error, testAdhan);
    }
  };

  return (
      <Screen>
      <Header title="نور" subtitle="رفيقك اليومي للذكر والقرآن" navigate={navigate}  />
      <ImageBackground source={prayerBackgrounds[next.key]} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroOverlay}>
          <View style={styles.heroTop}>
            <Text style={styles.heroEyebrow}>الصلاة القادمة</Text>
            <HeroPrayerIcon
              isNight={next.key === "Fajr" || next.key === "Isha" || next.key === "Maghrib"}
              remainingMs={next.target.getTime() - clock.getTime()}
            />
          </View>
          <Text style={styles.heroPrayer}>{next.label}</Text>
          <Text style={styles.heroCountdown}>{formatCountdown(next.target.getTime() - clock.getTime())}</Text>
          <Text style={styles.heroTime}>{formatPrayerTime(times[next.key])}</Text>
          <View style={styles.heroFooter}><Text style={styles.heroFooterText}>{coordinates.city} · طريقة الهيئة المصرية</Text><Compass color="#DDEBE3" size={17} /></View>
        </View>
      </ImageBackground>
      {locationDenied && !locationReady ? <Card><Text style={styles.cardTitle}>اختر موقع المواقيت</Text><Text style={styles.cardBody}>لم يُسمح بالموقع، لذلك لن يجدول نور أي إشعار حتى تختار موقعاً صحيحاً.</Text><PrimaryButton label="استخدام القاهرة مؤقتاً" onPress={() => { useDefaultLocation(); setLocationDenied(false); }} icon={MapPin} /></Card> : null}
      <Image source={require("../assets/home-features-v2.png")} style={styles.homeBanner} />

      {/* Ayah of the Day & Dhikr of the Day */}
      {(() => {
        const todayAyah = getAyahOfTheDay();
        const todayDhikr = getDhikrOfTheDay();

        const shareText = (text: string, title: string) => {
          void Share.share({
            message: `${title}\n\n"${text}"\n\nتطبيق نور - رفيقك اليومي للذكر والقرآن`,
          });
        };

        return (
          <>
            {/* Ayah of the Day */}
            <Card style={{ backgroundColor: colors.surface, borderColor: colors.border, gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Pressable onPress={() => shareText(todayAyah.text, `آية اليوم - سورة ${todayAyah.surahName}`)} style={{ padding: 4 }}>
                  <Share2 color={colors.gold} size={20} />
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <NativeText style={{ fontSize: 15, fontWeight: "900", color: colors.ink }}>آية اليوم</NativeText>
                  <BookOpen color={colors.gold} size={20} />
                </View>
              </View>
              <NativeText selectable style={{ fontSize: 17, lineHeight: 30, color: colors.ink, textAlign: "center", fontWeight: "700" }}>
                « {todayAyah.text} »
              </NativeText>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <Pressable onPress={() => navigate("quran")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <ChevronLeft color={colors.primary} size={18} />
                  <NativeText style={{ fontSize: 13, fontWeight: "800", color: colors.primary }}>اقرأ في المصحف</NativeText>
                </Pressable>
                <NativeText style={{ fontSize: 12, color: colors.muted, fontWeight: "700" }}>
                  سورة {todayAyah.surahName} · الآية {toArabicNumber(todayAyah.verseNumber)}
                </NativeText>
              </View>
            </Card>

            {/* Dhikr of the Day */}
            <Card style={{ backgroundColor: colors.surface, borderColor: colors.border, gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Pressable onPress={() => shareText(todayDhikr.text, "ذكر اليوم")} style={{ padding: 4 }}>
                  <Share2 color={colors.gold} size={20} />
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <NativeText style={{ fontSize: 15, fontWeight: "900", color: colors.ink }}>ذكر اليوم</NativeText>
                  <Sparkles color={colors.gold} size={20} />
                </View>
              </View>
              <NativeText selectable style={{ fontSize: 15, lineHeight: 26, color: colors.ink, textAlign: "right" }}>
                {todayDhikr.text}
              </NativeText>
              <NativeText style={{ fontSize: 11, color: colors.muted, textAlign: "left" }}>
                {todayDhikr.source}
              </NativeText>
            </Card>
          </>
        );
      })()}

      {/* Prayer & Fasting Tracker Home Card */}
      <Card style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
        <NativePressable onPress={() => navigate("tracker")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <ChevronLeft color={colors.muted} size={20} />
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
            <View style={{ alignItems: "flex-end" }}>
              <NativeText style={{ fontSize: 15, fontWeight: "900", color: colors.ink }}>متتبع الصلاة والصيام</NativeText>
              <NativeText style={{ fontSize: 12, fontWeight: "700", color: colors.primary, marginTop: 2 }}>حافظ على الفرائض والأيام المباركة</NativeText>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
              <AnimatedFlame color={colors.gold} size={25} />
            </View>
          </View>
        </NativePressable>
      </Card>

      {/* Khatma Progress Home Card */}
      {khatmaConfig && khatmaConfig.active ? (
        <Card style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
          <NativePressable onPress={() => navigate("khatma")} style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <ChevronLeft color={colors.muted} size={20} />
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                <View style={{ alignItems: "flex-end" }}>
                  <NativeText style={{ fontSize: 15, fontWeight: "900", color: colors.ink }}>الختمة مع نور</NativeText>
                  <NativeText style={{ fontSize: 12, fontWeight: "700", color: colors.gold, marginTop: 2 }}>
                    {getKhatmaProgressPercent(khatmaConfig.completedPages)}٪ مكتمل · Streak {khatmaConfig.streak} يوم
                  </NativeText>
                </View>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                  <BookOpen color={colors.gold} size={24} />
                </View>
              </View>
            </View>

            {/* Progress bar */}
            <View style={{ width: "100%", height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" }}>
              <View style={{ width: `${getKhatmaProgressPercent(khatmaConfig.completedPages)}%`, height: "100%", backgroundColor: colors.gold, borderRadius: 4 }} />
            </View>

            <NativeText style={{ fontSize: 12, color: colors.muted, textAlign: "right" }}>
              ورد اليوم: من صفحة {Math.min(TOTAL_QURAN_PAGES, khatmaConfig.completedPages + 1)} إلى {Math.min(TOTAL_QURAN_PAGES, khatmaConfig.completedPages + getDailyPagesGoal(khatmaConfig.targetDays))}
            </NativeText>
          </NativePressable>
        </Card>
      ) : null}

      <BatteryOptimizationCard />

      <SectionTitle title="مواقيت اليوم" />
      {resource.phase === "loading" ? <LoadingState /> : null}
      {resource.phase === "error" ? <ErrorState error={resource.error} onRetry={reload} onDetails={() => showError(resource.error, reload)} /> : null}
      <Card style={styles.prayerCard}>
        {prayerLabels.map(([key, label]) => {
          const active = key === next.key;
          return (
          <View key={key} style={[styles.prayerRow, active && { backgroundColor: colors.selectedSurface, borderBottomWidth: 0, borderRadius: 12 }]}>
            <Text style={[styles.prayerTime, active && { color: colors.selectedText }]}>{formatPrayerTime(times[key])}</Text>
            <View style={styles.prayerLabelWrap}>
              <Text style={[styles.prayerLabel, active && { color: colors.selectedText }]}>{label}</Text>
              <Pressable
                accessibilityLabel={`${prayerAlerts[key as PrayerAlertKey] ? "تعطيل" : "تفعيل"} تنبيه ${label}`}
                onPress={() => {
                  setPrayerAlert(key as PrayerAlertKey, !prayerAlerts[key as PrayerAlertKey]);
                  requestNotificationReschedule();
                }}
                style={styles.prayerBell}
              >
                {(() => {
                  const isActive = prayerAlerts[key as PrayerAlertKey];
                  const IconProps = {
                    size: 21,
                    color: isActive ? colors.gold : colors.muted,
                  };
                  if (key === "Fajr" || key === "Sunrise") return <Sunrise {...IconProps} />;
                  if (key === "Dhuhr" || key === "Asr") return <Sun {...IconProps} />;
                  if (key === "Maghrib") return <Sunset {...IconProps} />;
                  if (key === "Isha") return <Moon {...IconProps} />;
                  return <Bell color={isActive ? colors.gold : colors.muted} size={21} />;
                })()}
              </Pressable>
            </View>
          </View>
        );})}
      </Card>

      <SectionTitle title="وجهتك الآن" />
      <View style={styles.actionGrid}>
        <ActionCard title="القرآن الكريم" subtitle="تلاوة وتفسير" icon={BookOpen} onPress={() => navigate("quran")} />
        <ActionCard title="أذكارك" subtitle="كل الفئات كاملة" icon={Sparkles} onPress={() => navigate("adhkar")} />
        <ActionCard title="راديو القرآن" subtitle="بث مباشر" icon={Radio} onPress={() => navigate("radio")} />
        <ActionCard title="تحقق من حديث" subtitle="الموسوعة الحديثية" icon={CircleHelp} onPress={() => navigate("library")} />
        <ActionCard title="اتجاه القبلة" subtitle="من موقعك الحالي" icon={Compass} onPress={() => navigate("qibla")} />
        <ActionCard title="مكتبة نور" subtitle="كتب للقراءة والحفظ" icon={BookMarked} onPress={() => navigate("books")} />
        <ActionCard title="كتب الحديث الستة" subtitle="المتون العربية الكاملة" icon={Library} onPress={() => navigate("hadith-books")} />
        <ActionCard title="أسماء الله الحسنى" subtitle="معانٍ وتأملات" icon={Heart} onPress={() => navigate("names")} />
        <ActionCard title="الختمة مع نور" subtitle="خطة الورد والختم" icon={BookOpen} onPress={() => navigate("khatma")} />
        <ActionCard title="متتبع الصلاة والصيام" subtitle="الفرائض وStreaks" icon={Flame} onPress={() => navigate("tracker")} />
        <ActionCard title="الزكاة ورمضان" subtitle="حاسبة وخطة عبادة" icon={Landmark} onPress={() => navigate("tools")} />
      </View>

      <Card style={styles.nativeCard}>
        <AlarmClock color={palette.gold} size={28} />
        <View style={styles.cardGrow}>
          <Text style={styles.cardTitle}>شاشة أذان تفاعلية</Text>
          <Text style={styles.cardBody}>تظهر في موعد الصلاة مع الإيقاف والتأجيل وتسجيل الصلاة.</Text>
        </View>
        <Pressable onPress={testAdhan} style={styles.smallGoldButton}><Text style={styles.smallGoldButtonText}>اختبار</Text></Pressable>
      </Card>

      

    </Screen>
  );
}

function ActionCard({ title, subtitle, icon: Icon, onPress }: { title: string; subtitle: string; icon: typeof BookOpen; onPress: () => void }) {
  const { colors } = useNourTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={styles.actionIcon}><Icon color={palette.gold} size={25} /></View>
      <View style={styles.cardGrow}><Text numberOfLines={2} style={styles.actionTitle}>{title}</Text><Text numberOfLines={1} style={styles.actionSubtitle}>{subtitle}</Text></View>
      <ChevronLeft color={palette.muted} size={20} />
    </Pressable>
  );
}

function QuranScreen({ onBack, showError }: { onBack: () => void; showError: (error: unknown, retry: () => void) => void }) {
  const { colors } = useNourTheme();
  const [surahNumber, setSurahNumber] = useState(1);
  const [surahInput, setSurahInput] = useState("1");
  const [showIndex, setShowIndex] = useState(false);
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<Resource<SearchResult[]> | null>(null);
  const [tafsir, setTafsir] = useState<{ verse: number; text: string } | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState<number | null>(null);
  const [tafsirFontSize, setTafsirFontSize] = useState(18);
  const player = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const { resource, reload } = useResource(() => getSurah(surahNumber), [surahNumber]);

  useEffect(() => {
    void warmQuranIndex().catch((error) => console.warn("[nour:quran] local index", error));
  }, []);

  useEffect(() => () => player.current?.remove(), []);

  const loadSurah = useCallback((number?: number) => {
    const target = number ?? Number(surahInput);
    if (Number.isInteger(target) && target >= 1 && target <= 114) {
      setTafsir(null);
      setSurahNumber(target);
      setSurahInput(String(target));
      setShowIndex(false);
    }
  }, [surahInput]);

  const play = async (url?: string) => {
    if (!url) return;
    try {
      player.current?.remove();
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
      player.current = createAudioPlayer(url);
      player.current.play();
    } catch (error) {
      showError(error, () => void play(url));
    }
  };
  const runSearch = async () => {
    if (query.trim().length < 2) return;
    setSearchState({ phase: "loading" });
    try {
      const data = await searchQuran(query);
      setSearchState({ phase: "success", data });
    } catch (error) {
      setSearchState({ phase: "error", error });
    }
  };
  const loadTafsir = async (verse: number) => {
    setTafsirLoading(verse);
    try {
      setTafsir({ verse, text: await getTafsir(surahNumber, verse) });
    } catch (error) {
      showError(error, () => void loadTafsir(verse));
    } finally {
      setTafsirLoading(null);
    }
  };

  const renderSurahItem = useCallback(({ item }: { item: typeof SURAHS[0] }) => (
    <NativePressable
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 18,
          padding: spacing.md,
          marginHorizontal: spacing.lg,
        },
        pressed && styles.pressed,
      ]}
      onPress={() => loadSurah(item.id)}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" }}>
          <NativeText style={{ color: colors.gold, fontWeight: "800", fontSize: 13 }}>{item.id}</NativeText>
        </View>
        <View>
          <NativeText style={{ color: colors.ink, fontSize: 15, fontWeight: "800", textAlign: "right" }}>سورة {item.name}</NativeText>
          <NativeText style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{item.type} • {item.ayahs} آية</NativeText>
        </View>
      </View>
      <ChevronLeft color={colors.border} size={20} />
    </NativePressable>
  ), [colors, loadSurah]);

  const surah = resource.data;

  const quranHeader = (
    <View style={{ gap: spacing.md, paddingTop: spacing.sm }}>
      <Header title="القرآن الكريم" subtitle="تلاوة · استماع · تفسير" onBack={onBack} />
      <Card style={styles.readerControls}>
        <Pressable onPress={() => { setSurahInput(String(Math.min(114, surahNumber + 1))); setSurahNumber((value) => Math.min(114, value + 1)); }} style={styles.numberControl}><ChevronRight color={palette.sage} size={22} /></Pressable>
        <TextInput value={surahInput} onChangeText={setSurahInput} onSubmitEditing={() => loadSurah()} keyboardType="number-pad" style={styles.surahInput} textAlign="center" accessibilityLabel="رقم السورة" />
        <Pressable onPress={() => loadSurah()} style={styles.loadSurah}><Text style={styles.loadSurahText}>فتح السورة</Text></Pressable>
        <Pressable onPress={() => { setSurahInput(String(Math.max(1, surahNumber - 1))); setSurahNumber((value) => Math.max(1, value - 1)); }} style={styles.numberControl}><ChevronLeft color={palette.sage} size={22} /></Pressable>
      </Card>
      <View style={{ paddingHorizontal: spacing.sm }}>
        <Pressable onPress={() => { setShowIndex(!showIndex); setSearchState(null); }} style={[styles.button, styles.buttonSecondary]}>
          <ListMusic color={colors.primary} size={20} />
          <Text style={styles.buttonTextSecondary}>{showIndex ? "إخفاء الفهرس" : "فهرس السور الـ ١١٤"}</Text>
        </Pressable>
      </View>
    </View>
  );

  const quranFooter = showIndex ? null : (
    <View style={{ gap: spacing.md, paddingBottom: spacing.xxl }}>
      <View style={styles.searchBox}>
        <Search color={palette.muted} size={22} />
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={runSearch} placeholder="ابحث في القرآن الكريم" placeholderTextColor={palette.muted} textAlign="right" style={styles.searchInput} />
        <Pressable onPress={runSearch} style={styles.searchAction}><Text style={styles.searchActionText}>بحث</Text></Pressable>
      </View>
      {searchState?.phase === "loading" ? <LoadingState lines={2} /> : null}
      {searchState?.phase === "error" ? <ErrorState error={searchState.error} onRetry={runSearch} onDetails={() => showError(searchState.error, runSearch)} /> : null}
      {searchState?.phase === "success" && !searchState.data?.length ? <EmptyState title="لا توجد نتائج" subtitle="جرّب كلمة مختلفة أو اكتب جزءاً منها." /> : null}
      {searchState?.phase === "success" && searchState.data?.length ? (
        <Card>{searchState.data.map((item, index) => <Pressable onPress={() => { if (item.surahNumber) { setSurahNumber(item.surahNumber); setSurahInput(String(item.surahNumber)); setSearchState(null); } }} key={`${item.surah}-${item.verse}-${index}`} style={styles.searchResult}><Text style={styles.searchResultText}>{item.text}</Text><Text style={styles.searchResultMeta}>{item.surah} · آية {toArabicNumber(item.verse)}</Text></Pressable>)}</Card>
      ) : null}
      <SectionTitle title={surah ? `${surah.name} · ${surah.englishName}` : "نص السورة"} />
      {resource.phase === "loading" ? <LoadingState lines={5} /> : null}
      {resource.phase === "error" ? <ErrorState error={resource.error} onRetry={reload} onDetails={() => showError(resource.error, reload)} /> : null}
      {surah ? (
        <Card style={styles.versesCard}>
          {surah.verses.map((verse) => <VerseRow key={verse.number} verse={verse} onPlay={() => void play(verse.audio)} onTafsir={() => void loadTafsir(verse.number)} loading={tafsirLoading === verse.number} />)}
        </Card>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList
        data={showIndex ? SURAHS : []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSurahItem}
        ListHeaderComponent={quranHeader}
        ListFooterComponent={quranFooter}
        contentContainerStyle={{ gap: showIndex ? spacing.sm : 0, backgroundColor: colors.background, paddingBottom: showIndex ? spacing.xxl : 0 }}
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        getItemLayout={(_, index) => ({ length: 70, offset: 70 * index, index })}
      />
      <Modal visible={Boolean(tafsir)} animationType="slide" onRequestClose={() => setTafsir(null)}>
        <SafeAreaView style={[styles.tafsirModal, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
          <View style={[styles.tafsirModalHeader, { borderBottomColor: colors.border }]}>
            <Pressable accessibilityLabel="إغلاق التفسير" onPress={() => setTafsir(null)} style={[styles.iconButton, { backgroundColor: colors.surface }]}><X color={colors.primary} size={24} /></Pressable>
            <View style={styles.cardGrow}><Text style={[styles.modalTitle, { color: colors.ink }]}>{surah?.name ?? "السورة"} · الآية {toArabicNumber(tafsir?.verse ?? 1)}</Text><Text style={[styles.headerSubtitle, { color: colors.muted }]}>التفسير الميسّر</Text></View>
          </View>

          <ScrollView contentContainerStyle={styles.tafsirModalContent}>
            <View style={[styles.tafsirVerseCard, { backgroundColor: colors.selectedSurface }]}><Text selectable style={[styles.tafsirVerseText, { color: colors.selectedText }]}>{surah?.verses.find((item) => item.number === tafsir?.verse)?.text}</Text></View>
            <View style={styles.tafsirFontControls}><Pressable onPress={() => setTafsirFontSize((value) => Math.min(28, value + 2))} style={[styles.fontButton, { backgroundColor: colors.surfaceSoft }]}><Text style={[styles.fontButtonText, { color: colors.primary }]}>أ+</Text></Pressable><Text style={[styles.settingValue, { color: colors.muted }]}>حجم الخط</Text><Pressable onPress={() => setTafsirFontSize((value) => Math.max(15, value - 2))} style={[styles.fontButton, { backgroundColor: colors.surfaceSoft }]}><Text style={[styles.fontButtonText, { color: colors.primary }]}>أ−</Text></Pressable></View>
            {tafsirLoading ? <ActivityIndicator color={colors.gold} /> : <Text selectable style={[styles.tafsirModalText, { color: colors.ink, fontSize: tafsirFontSize, lineHeight: tafsirFontSize * 1.8 }]}>{tafsir?.text}</Text>}
          </ScrollView>
          <View style={[styles.tafsirNavigation, { borderTopColor: colors.border }]}><PrimaryButton label="الآية السابقة" onPress={() => { if (tafsir && tafsir.verse > 1) void loadTafsir(tafsir.verse - 1); }} icon={ChevronRight} secondary /><PrimaryButton label="الآية التالية" onPress={() => { if (tafsir && surah && tafsir.verse < surah.verses.length) void loadTafsir(tafsir.verse + 1); }} icon={ChevronLeft} /></View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function VerseRow({ verse, onPlay, onTafsir, loading }: { verse: Surah["verses"][number]; onPlay: () => void; onTafsir: () => void; loading: boolean }) {
  return (
    <View style={styles.verseRow}>
      <Text style={styles.verseText}>{verse.text} <Text style={styles.verseNumber}>﴿{toArabicNumber(verse.number)}﴾</Text></Text>
      <View style={styles.verseActions}>
        <Pressable onPress={onPlay} style={styles.verseAction}><Volume2 color={palette.sage} size={20} /><Text style={styles.verseActionText}>استمع</Text></Pressable>
        <Pressable onPress={onTafsir} style={styles.verseAction}><BookOpen color={palette.sage} size={20} /><Text style={styles.verseActionText}>{loading ? "جاري..." : "التفسير"}</Text></Pressable>
      </View>
    </View>
  );
}

function AdhkarScreen({ onBack, openReminder, showError }: { onBack: () => void; openReminder: (items: DhikrItem[], index: number, categoryId: string) => void; showError: (error: unknown, retry: () => void) => void }) {
  const { resource, reload } = useResource(getAdhkar, []);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const categories = resource.data ?? [];
  const selected = categories.find((category) => category.id === categoryId) ?? categories[0];
  useEffect(() => { if (categories.length && !categoryId) setCategoryId(categories[0].id); }, [categories, categoryId]);
  const increment = (item: DhikrItem) => setCounts((current) => ({ ...current, [item.id]: Math.min(item.count, (current[item.id] ?? 0) + 1) }));
  return (
    <Screen>
      

      

      <Header title="الأذكار" subtitle="المجموعة الكاملة المحفوظة محلياً" onBack={onBack} />
      {resource.phase === "loading" ? <LoadingState lines={5} /> : null}
      {resource.phase === "error" ? <ErrorState error={resource.error} onRetry={reload} onDetails={() => showError(resource.error, reload)} /> : null}
      {categories.length ? <Text style={styles.categoryCount}>{toArabicNumber(categories.length)} فئات · {toArabicNumber(categories.reduce((total, category) => total + category.items.length, 0))} ذكراً</Text> : null}
      {categories.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryStrip}>
          {categories.map((category) => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.categoryChip, selected?.id === category.id && styles.categoryChipActive]}><Text numberOfLines={1} style={[styles.categoryChipText, selected?.id === category.id && styles.categoryChipTextActive]}>{category.title}</Text></Pressable>)}
        </ScrollView>
      ) : null}
      {selected ? (
        <>
          <View style={styles.dhikrHeading}><View><Text style={styles.dhikrTitle}>{selected.title}</Text><Text style={styles.dhikrSubtitle}>{toArabicNumber(selected.items.length)} أذكار موثقة في هذه الفئة</Text></View><Pressable accessibilityLabel="فتح وضع قراءة الأذكار" onPress={() => openReminder(selected.items, 0, selected.id)} style={styles.voiceShortcut}><BookOpen color={palette.sage} size={22} /></Pressable></View>
          {selected.items.map((item, index) => {
            const value = counts[item.id] ?? 0;
            const complete = value >= item.count;
            return <Card key={item.id} style={complete ? styles.completedDhikr : undefined}>
              <Text style={styles.dhikrText}>{item.text}</Text>
              {item.benefit ? <Text style={styles.dhikrBenefit}>{item.benefit}</Text> : null}
              {item.source ? <Text style={styles.dhikrSource}>{item.source}</Text> : null}
              <View style={styles.dhikrFooter}>
                <Pressable accessibilityLabel="قراءة الذكر" onPress={() => openReminder(selected.items, index, selected.id)} style={styles.listenButton}><BookOpen color={palette.sage} size={20} /></Pressable>
                <Pressable onPress={() => increment(item)} style={[styles.countButton, complete && styles.countButtonDone]}><Text style={styles.countButtonText}>{complete ? "تم" : `${toArabicNumber(value)} / ${toArabicNumber(item.count)}`}</Text></Pressable>
              </View>
            </Card>;
          })}
        </>
      ) : null}
    </Screen>
  );
}

function RadioScreen({ onBack, showError }: { onBack: () => void; showError: (error: unknown, retry: () => void) => void }) {
  const { colors } = useNourTheme();
  const { resource, reload } = useResource(getRadioStations, []);
  const [playing, setPlaying] = useState<number | null>(null);
  const player = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const playerSubscription = useRef<{ remove: () => void } | null>(null);
  const currentStation = useRef<number | null>(null);
  const startupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (startupTimeout.current) clearTimeout(startupTimeout.current);
    playerSubscription.current?.remove();
    player.current?.pause();
    player.current?.remove();
  }, []);
  const toggle = async (station: RadioStation) => {
    try {
      if (currentStation.current === station.id && player.current) {
        if (player.current.playing) player.current.pause();
        else player.current.play();
        return;
      }
      if (startupTimeout.current) clearTimeout(startupTimeout.current);
      playerSubscription.current?.remove();
      player.current?.pause();
      player.current?.remove();
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
      const nextPlayer = createAudioPlayer(station.url, { updateInterval: 300 });
      currentStation.current = station.id;
      player.current = nextPlayer;
      let failureShown = false;
      const fail = () => {
        if (failureShown) return;
        failureShown = true;
        if (startupTimeout.current) clearTimeout(startupTimeout.current);
        playerSubscription.current?.remove();
        nextPlayer.pause();
        nextPlayer.remove();
        if (player.current === nextPlayer) player.current = null;
        if (currentStation.current === station.id) currentStation.current = null;
        setPlaying(null);
        showError(new Error("تعذّر تشغيل هذه المحطة حاليًا، حاول مرة أخرى."), () => void toggle(station));
      };
      playerSubscription.current = nextPlayer.addListener("playbackStatusUpdate", (status) => {
        if (status.error) {
          fail();
          return;
        }
        if (status.isLoaded || status.playing) {
          if (startupTimeout.current) clearTimeout(startupTimeout.current);
          startupTimeout.current = null;
        }
        setPlaying(status.playing ? currentStation.current : null);
      });
      startupTimeout.current = setTimeout(() => {
        if (player.current === nextPlayer && !nextPlayer.currentStatus.isLoaded && !nextPlayer.currentStatus.error) fail();
      }, 10_000);
      nextPlayer.play();
    } catch (error) {
      if (startupTimeout.current) clearTimeout(startupTimeout.current);
      setPlaying(null);
      console.error("[nour:radio] playback failed", station.url, error);
      showError(new Error("تعذّر تشغيل هذه المحطة حاليًا، حاول مرة أخرى."), () => void toggle(station));
    }
  };
  return (
    <Screen>
      

      <Header title="راديو القرآن" subtitle="محطات مباشرة من قراء متنوعين" onBack={onBack} />
      <Card style={[styles.radioHero, { backgroundColor: colors.selectedSurface, borderColor: colors.border }]}><Radio color={colors.gold} size={38} /><View style={styles.cardGrow}><Text style={[styles.cardTitle, { color: colors.selectedText }]}>بث حي هادئ</Text><Text style={[styles.cardBody, { color: colors.selectedText }]}>اختر محطة واستمع في الخلفية أثناء استخدام نور.</Text></View></Card>
      {resource.phase === "loading" ? <LoadingState lines={5} /> : null}
      {resource.phase === "error" ? <ErrorState error={resource.error} onRetry={reload} onDetails={() => showError(resource.error, reload)} /> : null}
      {resource.phase === "success" && !resource.data?.length ? <EmptyState title="لا توجد محطات الآن" subtitle="تحقق من الاتصال وحاول مجدداً." onRetry={reload} /> : null}
      {resource.data?.map((station) => <Card key={station.id} style={styles.radioRow}><Pressable onPress={() => void toggle(station)} style={[styles.radioPlay, playing === station.id && styles.radioPlayActive]}>{playing === station.id ? <Pause color={palette.white} size={24} /> : <Play color={palette.sage} size={24} />}</Pressable><View style={styles.cardGrow}><Text style={styles.radioName}>{station.name}</Text><Text style={styles.radioMeta}>{playing === station.id ? "يعمل الآن" : "بث مباشر"}</Text></View><ListMusic color={palette.gold} size={24} /></Card>)}
    </Screen>
  );
}

function LibraryScreen({ onBack, showError, navigate }: { onBack: () => void; showError: (error: unknown, retry: () => void) => void; navigate: (route: Route) => void }) {
  const { colors } = useNourTheme();
  const [query, setQuery] = useState("");
  const [resource, setResource] = useState<Resource<Awaited<ReturnType<typeof verifyHadith>>> | null>(null);
  const check = async () => {
    if (query.trim().length < 8) return;
    setResource({ phase: "loading" });
    try { setResource({ phase: "success", data: await verifyHadith(query) }); } catch (error) { setResource({ phase: "error", error }); }
  };
  return (
    <Screen>
      

      <Header title="المكتبة والحديث" subtitle="تحقق من الحديث من مصدره" onBack={onBack} />
      <View style={styles.libraryActions}>
        <PrimaryButton label="مكتبة الكتب" onPress={() => navigate("books")} icon={BookMarked} secondary />
        <PrimaryButton label="كتب الحديث الستة" onPress={() => navigate("hadith-books")} icon={Library} secondary />
      </View>
      <Card style={[styles.hadithIntro, { backgroundColor: colors.selectedSurface, borderColor: colors.border }]}><Landmark color={colors.gold} size={34} /><Text style={[styles.hadithIntroTitle, { color: colors.selectedText }]}>تحقق من حديث</Text><Text style={[styles.cardBody, { color: colors.selectedText }]}>الصق نص الحديث؛ يعرض نور نتيجة بحث الموسوعة الحديثية ودرجة الحديث ومصدره عند توفرها.</Text></Card>
      <View style={[styles.searchBox, styles.hadithInput, { backgroundColor: colors.surfaceSoft, borderColor: colors.primary, borderWidth: 1, padding: 12, borderRadius: 16 }]}><TextInput value={query} multiline onChangeText={setQuery} placeholder="ابحث عن نص حديث للتحقق..." placeholderTextColor={colors.muted} textAlign="right" style={[styles.hadithTextInput, { color: colors.ink, minHeight: 120 }]} /><View style={{ alignItems: "flex-start", marginTop: 8 }}><Pressable onPress={check} style={{ borderRadius: 12, overflow: "hidden" }}><LinearGradient colors={[colors.primary, "#1f3b30"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 24, paddingVertical: 10, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>تحقق من الحديث</Text></LinearGradient></Pressable></View></View>
      {resource?.phase === "loading" ? <LoadingState lines={3} /> : null}
      {resource?.phase === "error" ? <ErrorState error={resource.error} onRetry={check} onDetails={() => showError(resource.error, check)} /> : null}
      {resource?.phase === "success" && !resource.data?.length ? <EmptyState title="لا توجد نتيجة مطابقة" subtitle="عدّل النص أو جرّب عبارة أقصر من الحديث." /> : null}
      {resource?.data?.map((item, index) => <Card key={index}><Text style={styles.hadithText}>{item.text}</Text>{item.grade ? (() => {
  const isSahih = item.grade.includes("صحيح") || item.grade.includes("حسن");
  const isDaif = item.grade.includes("ضعيف") || item.grade.includes("موضوع") || item.grade.includes("منكر") || item.grade.includes("باطل");
  const gradeBg = isSahih ? "rgba(31, 193, 109, 0.15)" : isDaif ? "rgba(220, 38, 38, 0.15)" : colors.surfaceSoft;
  const gradeColor = isSahih ? "#1fc16d" : isDaif ? "#dc2626" : colors.primary;
  return <View style={[styles.gradePill, { backgroundColor: gradeBg, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6 }]}><Text style={[styles.gradeText, { color: gradeColor }]}>{item.grade}</Text></View>;
})() : null}{item.source ? <Text style={styles.hadithSource}>{item.source}</Text> : null}{item.takhrij ? <Text style={styles.hadithTakhrij}>{item.takhrij}</Text> : null}</Card>)}
      <Text style={styles.sourceNote}>المصدر: dorar.net. إن حجبت الخدمة الطلب، ستظهر رسالة حالة الخادم بدلاً من نسبة السبب لاتصالك.</Text>
    </Screen>
  );
}


function NameDetail({ item, all, onSelect, onBack }: { item: AllahName; all: AllahName[]; onSelect: (i: AllahName) => void; onBack: () => void }) {
  const { colors } = useNourTheme();
  const currentIndex = all.findIndex((a) => a.number === item.number);
  const next = all[currentIndex + 1];
  const prev = all[currentIndex - 1];

  return (
    <Screen>
      <Header title="أسماء الله الحسنى" onBack={onBack} />
      <View style={{ padding: 24, alignItems: "center", gap: 16 }}>
        <ImageBackground source={{ uri: item.imageUrl }} style={{ width: 160, height: 160, justifyContent: "center", alignItems: "center", borderRadius: 80, overflow: "hidden" }} imageStyle={{ opacity: 0.2 }}>
          <NativeText style={{ fontSize: 42, fontWeight: "900", color: colors.gold }}>{item.name}</NativeText>
        </ImageBackground>
        
        <Card style={{ width: "100%", padding: 24, gap: 16 }}>
          <View>
            <NativeText style={{ fontSize: 18, color: colors.primary, fontWeight: "800", marginBottom: 8, textAlign: "right" }}>المعنى</NativeText>
            <NativeText style={{ fontSize: 16, color: colors.ink, lineHeight: 26, textAlign: "right" }}>{item.meaning}</NativeText>
          </View>
          
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          
          <View>
            <NativeText style={{ fontSize: 18, color: colors.primary, fontWeight: "800", marginBottom: 8, textAlign: "right" }}>الدليل من القرآن أو السنة</NativeText>
            <NativeText style={{ fontSize: 16, color: colors.ink, lineHeight: 26, textAlign: "right" }}>{item.evidence}</NativeText>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
          
          <View>
            <NativeText style={{ fontSize: 18, color: colors.primary, fontWeight: "800", marginBottom: 8, textAlign: "right" }}>الفوائد والأحكام</NativeText>
            <NativeText style={{ fontSize: 16, color: colors.ink, lineHeight: 26, textAlign: "right" }}>{item.benefit}</NativeText>
          </View>

          {(item as any).reflections ? (
            <>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
              <View>
                <NativeText style={{ fontSize: 18, color: colors.primary, fontWeight: "800", marginBottom: 8, textAlign: "right" }}>وقفات تأملية</NativeText>
                <NativeText style={{ fontSize: 16, color: colors.ink, lineHeight: 26, textAlign: "right" }}>{(item as any).reflections}</NativeText>
              </View>
            </>
          ) : null}

          {(item as any).duaa ? (
            <>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
              <View>
                <NativeText style={{ fontSize: 18, color: colors.primary, fontWeight: "800", marginBottom: 8, textAlign: "right" }}>الدعاء بالاسم</NativeText>
                <NativeText style={{ fontSize: 16, color: colors.ink, lineHeight: 26, textAlign: "right" }}>{(item as any).duaa}</NativeText>
              </View>
            </>
          ) : null}

          {(item as any).scholarsSayings ? (
            <>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
              <View>
                <NativeText style={{ fontSize: 18, color: colors.primary, fontWeight: "800", marginBottom: 8, textAlign: "right" }}>أقوال العلماء</NativeText>
                <NativeText style={{ fontSize: 16, color: colors.ink, lineHeight: 26, textAlign: "right" }}>{(item as any).scholarsSayings}</NativeText>
              </View>
            </>
          ) : null}
        </Card>

        <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 16 }}>
          <PrimaryButton label="السابق" secondary onPress={() => prev && onSelect(prev)} disabled={!prev} icon={ChevronRight} />
          <PrimaryButton label="التالي" secondary onPress={() => next && onSelect(next)} disabled={!next} icon={ChevronLeft} />
        </View>
      </View>
    </Screen>
  );
}

function NamesScreen({ onBack, showError }: { onBack: () => void; showError: (error: unknown, retry: () => void) => void }) {
  const { colors } = useNourTheme();
  const { resource, reload } = useResource(getAllahNames, []);
  const [selected, setSelected] = useState<AllahName | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "favorites">("all");
  
  const favoriteNames = useNourStore((state) => state.favoriteNames);
  const toggleFavoriteName = useNourStore((state) => state.toggleFavoriteName);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (selected) return <NameDetail item={selected} all={resource.data ?? []} onSelect={setSelected} onBack={() => setSelected(null)} />;
  
  let displayed = resource.data ?? [];
  if (filterMode === "favorites") {
    displayed = displayed.filter(item => favoriteNames.includes(item.number));
  }
  if (searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase();
    displayed = displayed.filter(item => item.name.includes(q) || item.meaning.includes(q));
  }

  return (
    <Screen>
      <Header title="أسماء الله الحسنى" subtitle="تعرف على الله بأسمائه وصفاته" onBack={onBack} />
      
      <View style={{ paddingHorizontal: 24, paddingBottom: 16, gap: 16 }}>
        {/* Search */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSoft, borderRadius: 12, paddingHorizontal: 12, height: 48 }}>
          <Search color={colors.muted} size={20} />
          <TextInput 
            placeholder="ابحث بالاسم أو المعنى..." 
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, textAlign: "right", fontSize: 16, color: colors.ink, paddingHorizontal: 12, height: "100%" }}
          />
        </View>
        
        {/* Filter Segment */}
        <View style={{ flexDirection: "row", backgroundColor: colors.surfaceSoft, borderRadius: 12, padding: 4 }}>
          <Pressable onPress={() => setFilterMode("all")} style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: filterMode === "all" ? colors.surface : "transparent" }}>
            <NativeText style={{ color: filterMode === "all" ? colors.ink : colors.muted, fontWeight: filterMode === "all" ? "800" : "600", fontSize: 14 }}>الكل</NativeText>
          </Pressable>
          <Pressable onPress={() => setFilterMode("favorites")} style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: filterMode === "favorites" ? colors.surface : "transparent" }}>
            <NativeText style={{ color: filterMode === "favorites" ? colors.ink : colors.muted, fontWeight: filterMode === "favorites" ? "800" : "600", fontSize: 14 }}>المفضلة</NativeText>
          </Pressable>
        </View>
      </View>

      {resource.phase === "loading" ? <LoadingState lines={6} /> : null}
      {resource.phase === "error" ? <ErrorState error={resource.error} onRetry={reload} onDetails={() => showError(resource.error, reload)} /> : null}
      
      {resource.data?.length ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: 40, gap: 12 }}>
          {displayed.length > 0 ? displayed.map((item, index) => {
            const isExpanded = expandedId === item.number;
            const isFav = favoriteNames.includes(item.number);
            return (
              <Animated.View key={item.number} entering={FadeInDown.delay(Math.min(index * 20, 400)).springify()}>
                <Pressable
                  onPress={() => setExpandedId(isExpanded ? null : item.number)}
                  style={[styles.nameCard, { width: "100%", backgroundColor: colors.surface, borderColor: isExpanded ? colors.primary : colors.border, borderWidth: 1, overflow: "hidden", flexDirection: "column", alignItems: "stretch", padding: 0 }]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
                    <Pressable onPress={() => toggleFavoriteName(item.number)} style={{ padding: 8 }}>
                      <Heart color={isFav ? "#ef4444" : colors.muted} fill={isFav ? "#ef4444" : "transparent"} size={22} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <NativeText style={{ fontSize: 24, fontWeight: "900", color: colors.gold, textAlign: "right" }}>{item.name}</NativeText>
                    </View>
                    <View style={{ width: 32, alignItems: "center" }}>
                      {isExpanded ? <ChevronUp color={colors.muted} size={20} /> : <ChevronDown color={colors.muted} size={20} />}
                    </View>
                  </View>
                  
                  {isExpanded && (
                    <Animated.View entering={FadeIn.duration(200)} style={{ padding: 16, paddingTop: 0, gap: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 }}>
                      <NativeText style={{ fontSize: 15, color: colors.ink, textAlign: "right", lineHeight: 24, marginTop: 12 }}>{item.meaning}</NativeText>
                      <Pressable onPress={() => setSelected(item)} style={{ backgroundColor: colors.surfaceSoft, paddingVertical: 10, borderRadius: 8, alignItems: "center", marginTop: 8 }}>
                        <NativeText style={{ color: colors.primary, fontWeight: "800", fontSize: 14 }}>التفاصيل والدليل</NativeText>
                      </Pressable>
                    </Animated.View>
                  )}
                </Pressable>
              </Animated.View>
            );
          }) : (
            <NativeText style={{ color: colors.muted, textAlign: "center", marginTop: 40, fontSize: 16 }}>لا توجد أسماء مطابقة لبحثك</NativeText>
          )}
        </View>
      ) : null}
    </Screen>
  );
}




function SettingsScreen({ onBack, showToast, showError, navigate }: { onBack: () => void; showToast: (message: string) => void; showError: (error: unknown, retry: () => void) => void; navigate: (route: Route) => void }) {
  const { colors, darkMode, setDarkMode, prayerAlerts, setPrayerAlert } = useNourTheme();
  const [method, setMethod] = useState("الهيئة المصرية العامة للمساحة");
  const setMethodNumber = useNourStore((state) => state.setMethod);
  const reminderSettings = useNourStore((state) => state.reminders);
  const setReminder = useNourStore((state) => state.setReminder);
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugItems, setDebugItems] = useState<ScheduledDebugItem[]>([]);
  const [debugLoading, setDebugLoading] = useState(false);
  const openDebug = async () => {
    setDebugVisible(true);
    setDebugLoading(true);
    try {
      setDebugItems(await getAllScheduledDebugItems());
    } catch (error) {
      showError(error, openDebug);
    } finally {
      setDebugLoading(false);
    }
  };
  const testReminder = async () => {
    try {
      await scheduleTestReminder(15);
      showToast("سيصل إشعار أذكار المساء التجريبي بعد ١٥ ثانية ⏱️");
    } catch (error) {
      showError(error, testReminder);
    }
  };
  const enableNative = async () => { showToast("طلب الأذونات تم."); };
  return (
    <Screen>
      

      <Header title="الإعدادات" subtitle="خصّص نور كما يناسب يومك" onBack={onBack} />
      <SettingsGroup title="المواقيت"><SettingsChoice label="طريقة الحساب" value={method} options={["الهيئة المصرية العامة للمساحة", "أم القرى — مكة", "رابطة العالم الإسلامي", "ISNA"]} onChange={(value) => { setMethod(value); setMethodNumber({ "الهيئة المصرية العامة للمساحة": 5, "أم القرى — مكة": 4, "رابطة العالم الإسلامي": 3, ISNA: 2 }[value] ?? 5); }} /></SettingsGroup>
      <SettingsGroup title="الإشعارات">
        <SettingToggle label="الفجر" value={prayerAlerts.Fajr} onChange={(value) => { setPrayerAlert("Fajr", value); requestNotificationReschedule(); }} />
        <SettingToggle label="الشروق" value={prayerAlerts.Sunrise} onChange={(value) => { setPrayerAlert("Sunrise", value); requestNotificationReschedule(); }} />
        <SettingToggle label="الظهر" value={prayerAlerts.Dhuhr} onChange={(value) => { setPrayerAlert("Dhuhr", value); requestNotificationReschedule(); }} />
        <SettingToggle label="العصر" value={prayerAlerts.Asr} onChange={(value) => { setPrayerAlert("Asr", value); requestNotificationReschedule(); }} />
        <SettingToggle label="المغرب" value={prayerAlerts.Maghrib} onChange={(value) => { setPrayerAlert("Maghrib", value); requestNotificationReschedule(); }} />
        <SettingToggle label="العشاء" value={prayerAlerts.Isha} onChange={(value) => { setPrayerAlert("Isha", value); requestNotificationReschedule(); }} />
        <SettingToggle label="أذكار الصباح" value={reminderSettings.morning} onChange={(value) => { setReminder("morning", value); requestNotificationReschedule(); }} />
        <SettingToggle label="أذكار المساء" value={reminderSettings.evening} onChange={(value) => { setReminder("evening", value); requestNotificationReschedule(); }} />
        <SettingToggle label="ورد القرآن" value={reminderSettings.dailyQuran} onChange={(value) => { setReminder("dailyQuran", value); requestNotificationReschedule(); }} />
        <SettingToggle label="حديث اليوم" value={reminderSettings.hadith} onChange={(value) => { setReminder("hadith", value); requestNotificationReschedule(); }} />
        <SettingToggle label="الوتر" value={reminderSettings.witr} onChange={(value) => { setReminder("witr", value); requestNotificationReschedule(); }} />
        <SettingToggle label="سورة الكهف يوم الجمعة" value={reminderSettings.fridayKahf} onChange={(value) => { setReminder("fridayKahf", value); requestNotificationReschedule(); }} />
        <SettingToggle label="الصلاة على النبي يوم الجمعة" value={reminderSettings.fridaySalawat} onChange={(value) => { setReminder("fridaySalawat", value); requestNotificationReschedule(); }} />
        <SettingToggle label="تذكير صيام الاثنين والخميس" value={reminderSettings.fastDays} onChange={(value) => { setReminder("fastDays", value); requestNotificationReschedule(); }} />

      </SettingsGroup>
      <SettingsGroup title="التجربة"><SettingToggle label="الوضع الداكن" value={darkMode} onChange={setDarkMode} /><SettingRow label="الحساب" value="إدارة الحساب" onPress={() => navigate("account")} /><SettingRow label="عن التطبيق" value="عن نور" onPress={() => navigate("about")} /></SettingsGroup>
      <SettingsGroup title="عن التطبيق">
        <Text style={[styles.settingAbout, { color: colors.muted }]}>نور {Constants.expoConfig?.version ?? "١.٤"} — الإصدار السحابي</Text>
      </SettingsGroup>
      <Modal visible={debugVisible} animationType="slide" onRequestClose={() => setDebugVisible(false)}>
        <SafeAreaView style={[styles.debugScreen, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
          <View style={[styles.debugHeader, { borderBottomColor: colors.border }]}><Pressable onPress={() => setDebugVisible(false)} style={[styles.iconButton, { backgroundColor: colors.surface }]}><X color={colors.primary} size={24} /></Pressable><View style={styles.cardGrow}><Text style={[styles.modalTitle, { color: colors.ink }]}>فحص الإشعارات</Text><Text style={[styles.settingAbout, { color: colors.muted }]}>{debugItems.length.toLocaleString("en-US")} إشعاراً مجدولاً في Expo وNotifee</Text></View></View>
          <ScrollView contentContainerStyle={styles.debugContent}>
            {debugLoading ? <ActivityIndicator color={colors.gold} /> : null}
            {!debugLoading && !debugItems.length ? <View style={[styles.debugEmpty, { backgroundColor: colors.surface }]}><Text style={[styles.cardTitle, { color: colors.ink }]}>لا توجد إشعارات مجدولة</Text><Text style={[styles.cardBody, { color: colors.muted }]}>هذا طبيعي قبل تحديد الموقع أو عندما تكون كل التنبيهات مغلقة.</Text></View> : null}
            {debugItems.map((item) => <View key={`${item.source}-${item.id}`} style={[styles.debugCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text selectable style={[styles.debugId, { color: colors.gold }]}>{item.id}</Text><Text style={[styles.cardTitle, { color: colors.ink }]}>{item.title}</Text><Text style={[styles.cardBody, { color: colors.muted }]}>{item.source} · {item.type}</Text><Text selectable style={[styles.debugTime, { color: colors.primary }]}>{new Date(item.triggerAt).toLocaleString("en-US")}</Text></View>)}
          </ScrollView>
          <View style={styles.debugFooter}><PrimaryButton label="تحديث القائمة" onPress={() => void openDebug()} icon={RotateCcw} /></View>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

function HeroPrayerIcon({ isNight, remainingMs }: { isNight: boolean; remainingMs: number }) {
  const ratio = Math.max(0.25, Math.min(1.0, remainingMs / (3 * 3600 * 1000)));

  return (
    <View style={{ opacity: ratio }}>
      <HeroPrayerVisual isNight={isNight} proximityRatio={ratio} />
    </View>
  );
}

function AnimatedHeaderIcon({ isNight }: { isNight: boolean }) {
  return <AnimatedHeaderVisual isNight={isNight} />;
}

function AboutScreen({ onBack }: { onBack: () => void }) {
  const { colors } = useNourTheme();
  const openLink = (url: string) => { void Linking.openURL(url); };
  return (
    <Screen>
      

      <Header title="عن نور" subtitle="رسالة وتواصل" onBack={onBack} />
      <Card style={{ alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl }}>
        <Image
          source={require("../assets/nour-logo.jpg")}
          style={{ width: 140, height: 140, resizeMode: "contain" }}
        />
        <Text style={[styles.cardTitle, { color: colors.ink, fontSize: 24, textAlign: "center", fontWeight: "900" }]}>نور</Text>
        <Text style={[styles.cardBody, { color: colors.muted, textAlign: "center", lineHeight: 24 }]}>
          تطبيق إسلامي اتعمل لوجه الله الكريم من مطور مصري مسلم، هدفه مساعدة المسلمين على إقامة شعائرهم وذكر الله في يومهم. لا يجمع بيانات شخصية ولا يعرض إعلانات.
        </Text>
      </Card>

      <SectionTitle title="نور على منصات أخرى" />
      <Card style={{ gap: spacing.md }}>
        <Pressable onPress={() => openLink("https://t.me/Islamic72_bot")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>افتح البوت</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>بوت تليجرام (Islamic72_bot)</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>نسخة مصغرة من التطبيق على تليجرام يمكنك استخدامها في أي وقت.</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => openLink("https://wa.me/201004886479")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>افتح البوت</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>بوت واتساب نور</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>تفاعل مع نور مباشرة عبر الواتساب للخدمات الإسلامية.</Text>
          </View>
        </Pressable>
      </Card>

      <SectionTitle title="التواصل مع المطور" />
      <Card style={{ gap: spacing.md }}>
        <Pressable onPress={() => openLink("https://wa.me/201098612184")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>محادثة واتساب</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>رقم المطور</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>تواصل مباشر للمقترحات أو الدعم الفني.</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => openLink("mailto:ahmedkhalifaw3@gmail.com")} style={[styles.settingRow, { paddingVertical: spacing.md }]}>
          <Text style={[styles.settingValue, { color: colors.primary, fontWeight: "800" }]}>إرسال بريد</Text>
          <View style={{ flex: 1, alignItems: "flex-end", marginRight: 8 }}>
            <Text style={[styles.settingLabel, { color: colors.ink }]}>البريد الإلكتروني</Text>
            <Text style={[styles.settingAbout, { color: colors.muted, textAlign: "right" }]}>ahmedkhalifaw3@gmail.com</Text>
          </View>
        </Pressable>
      </Card>

      <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.lg }}>
        <Sparkles color={colors.gold} size={28} />
        <Text style={[styles.cardBody, { color: colors.muted, textAlign: "center" }]}>لو أفادك التطبيق، دعوة صادقة في ظهر الغيب أفضل من كل تقييم.</Text>
        <Text style={[styles.settingAbout, { color: colors.border, textAlign: "center" }]}>الإصدار {Constants.expoConfig?.version ?? "1.5.1"}</Text>
      </Card>
    </Screen>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) { return <><SectionTitle title={title} /><Card style={styles.settingsCard}>{children}</Card></>; }
function SettingToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const { colors } = useNourTheme();
  return <View style={styles.settingRow}><Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.selectedSurface }} thumbColor={value ? colors.gold : colors.surface} /><Text style={styles.settingLabel}>{label}</Text></View>;
}
function SettingRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) { return <Pressable disabled={!onPress} onPress={onPress} style={styles.settingRow}><Text style={styles.settingValue}>{value}</Text><Text style={styles.settingLabel}>{label}</Text></Pressable>; }
function SettingsChoice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { const { colors } = useNourTheme(); return <View style={styles.choiceWrap}><Text style={styles.settingLabel}>{label}</Text>{options.map((option) => { const active = value === option; return <Pressable key={option} onPress={() => onChange(option)} style={[styles.choice, { backgroundColor: active ? colors.selectedSurface : colors.surfaceSoft }]}><View style={[styles.radioDot, active && styles.radioDotActive]} /><Text style={[styles.choiceText, active && { color: colors.selectedText, fontWeight: "800" }]}>{option}</Text></Pressable>; })}</View>; }



function ReminderScreen({ items, initialIndex, categoryId, onClose }: { items: DhikrItem[]; initialIndex: number; categoryId: string; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  const item = items[index];
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  const toggleSound = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      setIsLoadingSound(true);
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
        let url = "";
        if (categoryId === "morning") {
          url = "https://archive.org/download/Azkar_Al-Saba7/Azkar_Al-Saba7.mp3";
        } else if (categoryId === "evening") {
          url = "https://archive.org/download/azkar_almasaa_20201111/azkar_almasaa.mp3";
        } else {
          return; // No audio for this category
        }
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) setIsPlaying(false);
          }
        });
        setSound(newSound);
        setIsPlaying(true);
      } catch (err) {
        console.error("Failed to load sound", err);
      } finally {
        setIsLoadingSound(false);
      }
    }
  };

  const hasAudio = categoryId === "morning" || categoryId === "evening";

  if (!item) return null;
  return (
    <LinearGradient colors={["#315B4C", "#1D3A31"]} style={styles.reminderScreen}>
      <SafeAreaView style={styles.alertSafe} edges={["top", "bottom"]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", paddingHorizontal: 24 }}>
          {hasAudio ? (
             <Pressable onPress={toggleSound} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 }}>
               {isLoadingSound ? <ActivityIndicator color="#F4D57C" size="small" /> : isPlaying ? <Pause color="#F4D57C" size={20} /> : <Play color="#F4D57C" size={20} />}
               <Text style={{ color: "#F4D57C", fontWeight: "bold", fontSize: 14 }}>استماع للتلاوة الكاملة</Text>
             </Pressable>
          ) : <View />}
          <Pressable onPress={onClose} style={styles.reminderClose}><X color={palette.white} size={27} /></Pressable>
        </View>
        <Text style={styles.reminderEyebrow}>وضع القراءة · {toArabicNumber(index + 1)} من {toArabicNumber(items.length)}</Text>
        <Sparkles color="#F4D57C" size={60} />
        <Text style={styles.reminderText}>{item.text}</Text>
        <Text style={styles.reminderCount}>يُكرّر {toArabicNumber(item.count)} مرات</Text>
        <View style={styles.reminderActions}><PrimaryButton label="تخطي" onPress={() => setIndex((value) => Math.min(items.length - 1, value + 1))} secondary /><PrimaryButton label="التالي" onPress={() => setIndex((value) => Math.min(items.length - 1, value + 1))} icon={ChevronLeft} /></View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function BottomNav({ route, navigate }: { route: Route; navigate: (route: Route) => void }) {
  const { colors } = useNourTheme();
  const entries: Array<{ route: Route; label: string; icon: typeof Home }> = [
    { route: "home", label: "الرئيسية", icon: Home }, { route: "quran", label: "القرآن", icon: BookOpen }, { route: "adhkar", label: "الأذكار", icon: Sparkles }, { route: "more", label: "المزيد", icon: Landmark }, { route: "settings", label: "الإعدادات", icon: Settings },
  ];
  return <View style={[styles.bottomNav, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>{entries.map((entry) => { const Icon = entry.icon; const active = route === entry.route; return <Pressable key={entry.route} onPress={() => navigate(entry.route)} style={styles.navItem}><Icon color={active ? colors.gold : colors.muted} size={24} /><Text style={[styles.navLabel, active && styles.navLabelActive]}>{entry.label}</Text></Pressable>; })}</View>;
}

function NourAppRoot() {
  const { colors, darkMode, prayerAlerts } = useNourTheme();
  const [route, setRoute] = useState<Route>("home");
  const [error, setError] = useState<{ error: unknown; retry: () => void } | null>(null);
  const [toast, setToast] = useState("");
  const [reminder, setReminder] = useState<{ items: DhikrItem[]; index: number, categoryId: string } | null>(null);
  const [homeOpened, setHomeOpened] = useState(false);
  const hydrated = useNourStore((state) => state.hydrated);
  const hydrate = useNourStore((state) => state.hydrate);
  const coordinates = useNourStore((state) => state.coordinates);
  const locationReady = useNourStore((state) => state.locationReady);
  const method = useNourStore((state) => state.method);
  const muteToday = useNourStore((state) => state.muteToday);
  const reminders = useNourStore((state) => state.reminders);
  const navigate = (destination: Route) => setRoute(destination);
  const showError = (item: unknown, retry: () => void) => setError({ error: item, retry });
  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(""), 4_500); };

  const scheduleNotifications = useCallback(async () => {
    if (!hydrated || !locationReady || !homeOpened) return;
    try {
      const now = new Date();
      const currentMonth = await getMonthlyCalendar(now, coordinates, method);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonth = now.getDate() > 24
        ? await getMonthlyCalendar(nextMonthDate, coordinates, method)
        : [];
      await rescheduleAllNotifications({
        days: [...currentMonth, ...nextMonth],
        muteToday,
        reminders,
        prayerAlerts,
      });
    } catch (error) {
      console.warn("[nour:notifications] schedule failed", error);
    }
  }, [coordinates, hydrated, homeOpened, locationReady, method, muteToday, prayerAlerts, reminders]);

  // ── FCM: Sync prefs to Supabase backend whenever they change ────────────
  const syncFCMPrefs = useCallback(async () => {
    if (!hydrated || !locationReady) return;
    try {
      await prepareNotifications();
      await syncFCMPrefsToSupabase({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        calcMethod: method,
        reminders,
        prayerAlerts,
        muteToday,
        khatma: null, // khatma prefs synced separately from khatma screen
      });
    } catch (err) {
      console.warn("[nour:fcm] Failed to sync prefs", err);
    }
  }, [coordinates, hydrated, locationReady, method, muteToday, prayerAlerts, reminders]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated || !locationReady || !homeOpened) return;
    // In FCM mode: scheduleNotifications is a no-op; syncFCMPrefs does real work.
    void scheduleNotifications();
    void syncFCMPrefs();
    const unsubscribe = subscribeNotificationReschedule(() => { void syncFCMPrefs(); });
    // Set up FCM foreground handler
    const unsubscribeForeground = setupFCMForegroundHandler();
    return () => {
      unsubscribe();
      unsubscribeForeground();
    };
  }, [hydrated, homeOpened, locationReady, scheduleNotifications, syncFCMPrefs]);

  useEffect(() => {
    if (route === "home") setHomeOpened(true);
  }, [route]);

  useEffect(() => {
    // Expo Notifications response listener (Action buttons & Banner taps)
    const subscription = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const reminderId = String(data?.reminder ?? "");
      const kind = data?.kind;
      const type = data?.type;

      if (actionId === "mark_prayed" && data?.prayer) {
        useNourStore.getState().setPrayerStatus(new Date().toISOString().split('T')[0], data.prayer as any, "onTime");
        showToast("تقبل الله صلاتك.");
      } else if (actionId === "mute_today") {
        useNourStore.getState().setMuteToday(true);
        showToast("تم كتم إشعارات الصلاة لهذا اليوم.");
      } else if (kind === "nour-adhan" || type === "prayer") {
        // الأذان إشعار عادي — الضغط عليه يفتح الشاشة الرئيسية فقط.
        setRoute("home");
      } else if (actionId === "read_morning" || reminderId.startsWith("morning") || type === "morning") {
        setRoute("adhkar");
      } else if (actionId === "read_evening" || reminderId.startsWith("evening") || type === "evening") {
        setRoute("adhkar");
      } else if (actionId === "read_kahf" || reminderId.startsWith("kahf") || type === "kahf") {
        setRoute("quran");
      } else if (actionId === "open_quran" || reminderId.startsWith("quran") || type === "quran") {
        setRoute("quran");
      } else if (actionId === "open_hadith" || reminderId.startsWith("hadith") || type === "hadith") {
        setRoute("library");
      } else if (actionId === "open_fasting" || reminderId.startsWith("monday-fast") || reminderId.startsWith("thursday-fast") || type === "monday-fast" || type === "thursday-fast") {
        setRoute("tracker");
      } else if (actionId === "open_witr" || reminderId.startsWith("witr") || type === "witr") {
        setRoute("tracker");
      } else if (actionId === "open_salawat" || reminderId.startsWith("salawat") || type === "salawat") {
        setRoute("adhkar");
      } else if (actionId === "open_khatma" || data?.scope === "khatma" || type === "khatma") {
        setRoute("khatma");
      }

    });

    return () => {
      subscription.remove();
    };
  }, []);

  const back = () => setRoute("home");
  const content = useMemo(() => {
    if (route === "reminder" && reminder) return <ReminderScreen items={reminder.items} initialIndex={reminder.index} categoryId={reminder.categoryId} onClose={() => setRoute("adhkar")} />;
    const shared = { showError };
    if (route === "quran") return <QuranScreen onBack={back} {...shared} />;
    if (route === "adhkar") return <AdhkarScreen onBack={back} {...shared} openReminder={(items, index, categoryId) => { setReminder({ items, index, categoryId }); setRoute("reminder"); }} />;
    if (route === "radio") return <RadioScreen onBack={back} {...shared} />;
    if (route === "library") return <LibraryScreen onBack={back} {...shared} navigate={navigate} />;
    if (route === "books") return <BookLibraryScreen onBack={back} {...shared} showToast={showToast} />;
    if (route === "hadith-books") return <HadithBooksScreen onBack={back} {...shared} />;
    if (route === "qibla") return <QiblaScreen onBack={back} {...shared} />;
    if (route === "account") return <AccountScreen onBack={back} {...shared} showToast={showToast} />;
    if (route === "tools") return <ToolsScreen onBack={back} {...shared} />;
    if (route === "tracker") return <TrackerScreen onBack={back} {...shared} />;
    if (route === "khatma") return <KhatmaScreen onBack={back} navigate={navigate} {...shared} />;
    if (route === "names") return <NamesScreen onBack={back} {...shared} />;
    if (route === "settings") return <SettingsScreen onBack={back} {...shared} showToast={showToast} navigate={navigate} />;
    if (route === "about") return <AboutScreen onBack={back} />;
    if (route === "more") return <MoreScreen showError={showError} showToast={showToast} />;
    return <HomeScreen navigate={navigate} {...shared} showToast={showToast} />;
  }, [route, reminder, error]);
  const [showBatteryPrompt, setShowBatteryPrompt] = useState(false);
  const [showOverlayPrompt, setShowOverlayPrompt] = useState(false);

  useEffect(() => {
    if (Platform.OS === "android") {
      void isBatteryOptimizationActive().then((active) => {
        if (active) setShowBatteryPrompt(true);
      });
      void AsyncStorage.getItem("nour:overlay_prompted").then((prompted) => {
        if (!prompted) {
          setShowOverlayPrompt(true);
          void AsyncStorage.setItem("nour:overlay_prompted", "true");
        }
      });
    }
  }, []);

  const isOverlay = route === "adhan" || route === "reminder";
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.app, { backgroundColor: colors.background }]} edges={["top"]}>
        <StatusBar style={isOverlay || darkMode ? "light" : "dark"} />
        <Animated.View key={route} style={[styles.app, { backgroundColor: colors.background }]}>{content}</Animated.View>
        {!isOverlay ? <BottomNav route={route} navigate={navigate} /> : null}
        {toast ? <Animated.View entering={FadeIn} style={[styles.toast, { backgroundColor: colors.primary }]}><Text style={styles.toastText}>{toast}</Text></Animated.View> : null}
        {error ? <ErrorDialog error={error.error} onRetry={() => { setError(null); void error.retry(); }} onClose={() => setError(null)} /> : null}
        <NotificationSetupModal visible={showBatteryPrompt} onClose={() => setShowBatteryPrompt(false)} />
        <FullScreenPermissionModal visible={showOverlayPrompt} onClose={() => setShowOverlayPrompt(false)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function AuthenticatedApp() {
  const { mode, showWelcome } = useNourAuth();
  const [splashFinished, setSplashFinished] = useState(false);

  if (!splashFinished) {
    return <SplashAnimation isAppReady={mode !== "loading"} onFinish={() => setSplashFinished(true)} />;
  }

  if (mode === "signed-out" || showWelcome) return <AuthGate />;
  return (
    <>
      <NourAppRoot />
      <FloatingAudioPlayer />
    </>
  );
}






export default function NourApp() {
  return (
    <NourThemeProvider>
      <NourAuthProvider>
        <AuthenticatedApp />
      </NourAuthProvider>
    </NourThemeProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: palette.cream },
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 56 },
  headerCopy: { flex: 1, alignItems: "flex-end", minWidth: 0 },
  headerTitle: { fontSize: FONT.h1, color: palette.ink, fontWeight: "800", textAlign: "right" },
  headerSubtitle: { color: palette.muted, fontSize: FONT.caption, marginTop: 2, textAlign: "right" },
  logoMark: { width: 48, height: 48, alignItems: "center", justifyContent: "center", backgroundColor: palette.white, borderRadius: 17, borderWidth: 1, borderColor: palette.border },
  iconButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border },
  card: { backgroundColor: palette.white, borderRadius: 21, padding: spacing.lg, borderWidth: 1, borderColor: palette.border, gap: spacing.md },
  hero: { minHeight: 250, borderRadius: 28, overflow: "hidden" },
  heroImage: { borderRadius: 28 },
  heroOverlay: { flex: 1, padding: spacing.xl, justifyContent: "space-between", backgroundColor: "rgba(11, 24, 29, 0.28)" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroEyebrow: { color: "#F9E6B4", fontSize: FONT.caption, fontWeight: "700" },
  heroPrayer: { color: palette.white, fontSize: FONT.h2, fontWeight: "800", textAlign: "right", marginTop: spacing.lg },
  heroTime: { color: "#F6D587", fontSize: 44, fontWeight: "300", textAlign: "right", marginTop: -4 },
  heroCountdown: { color: palette.white, fontSize: 32, fontWeight: "900", letterSpacing: 1, textAlign: "right", fontVariant: ["tabular-nums"] },
  heroFooter: { flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "flex-end" },
  heroFooterText: { color: "#DDEBE3", fontSize: FONT.caption, textAlign: "right" },
  homeBanner: { width: "100%", height: 150, borderRadius: 24, resizeMode: "cover" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  sectionTitle: { color: palette.ink, fontSize: FONT.h2, fontWeight: "800", textAlign: "right" },
  sectionAction: { color: palette.sage, fontSize: FONT.caption, fontWeight: "800" },
  stateCard: { alignItems: "center", justifyContent: "center", minHeight: 180, gap: spacing.md },
  skeleton: { height: 12, backgroundColor: "#EEE8DD", borderRadius: 8 },
  stateTitle: { color: palette.ink, fontSize: FONT.h2, fontWeight: "800", textAlign: "center" },
  stateText: { color: palette.muted, fontSize: FONT.body, lineHeight: 25, textAlign: "center" },
  errorCard: { backgroundColor: "#FFFDF8" },
  button: { minHeight: 48, flexDirection: "row", gap: spacing.sm, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg, backgroundColor: palette.gold, borderRadius: 14 },
  buttonSecondary: { backgroundColor: palette.sageSoft, borderWidth: 1, borderColor: "#CDDFD4" },
  buttonText: { color: palette.white, fontSize: FONT.caption, fontWeight: "800", textAlign: "center", flexShrink: 1 },
  buttonTextSecondary: { color: palette.sage },
  pressed: { opacity: 0.72 },
  textAction: { minHeight: 36, justifyContent: "center" },
  textActionLabel: { color: palette.sage, fontSize: FONT.caption, fontWeight: "700" },
  prayerCard: { paddingVertical: spacing.sm, gap: 0 },
  prayerRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.border },
  prayerLabelWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1, justifyContent: "flex-end" },
  prayerBell: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  prayerLabel: { color: palette.ink, fontSize: FONT.body, fontWeight: "700", textAlign: "right", flexShrink: 1 },
  prayerTime: { color: palette.sage, fontSize: FONT.body, fontWeight: "800", minWidth: 56, textAlign: "left" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  actionCard: { flexBasis: "47%", flexGrow: 1, minHeight: 118, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 20, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  actionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.goldSoft, alignItems: "center", justifyContent: "center" },
  actionTitle: { color: palette.ink, fontSize: 14, fontWeight: "800", textAlign: "right" },
  actionSubtitle: { color: palette.muted, fontSize: 11, marginTop: 3, textAlign: "right" },
  cardGrow: { flex: 1, minWidth: 0, alignItems: "flex-end" },
  nativeCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardTitle: { color: palette.ink, fontSize: FONT.body, fontWeight: "800", textAlign: "right" },
  cardBody: { color: palette.muted, fontSize: FONT.caption, lineHeight: 20, textAlign: "right", marginTop: 4 },
  smallGoldButton: { minWidth: 64, minHeight: 48, borderRadius: 13, backgroundColor: palette.gold, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
  smallGoldButtonText: { color: palette.white, fontSize: FONT.caption, fontWeight: "800" },
  readerControls: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm },
  numberControl: { width: 48, height: 48, borderRadius: 13, backgroundColor: palette.sageSoft, alignItems: "center", justifyContent: "center" },
  surahInput: { flex: 1, height: 48, borderRadius: 13, backgroundColor: palette.cream, color: palette.ink, fontSize: FONT.body, fontWeight: "800", minWidth: 48 },
  loadSurah: { minHeight: 48, paddingHorizontal: spacing.md, borderRadius: 13, backgroundColor: palette.sage, justifyContent: "center", alignItems: "center" },
  loadSurahText: { color: palette.white, fontWeight: "800", fontSize: FONT.caption, textAlign: "center" },
  searchBox: { minHeight: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, gap: spacing.sm, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 16 },
  searchInput: { flex: 1, minWidth: 0, color: palette.ink, fontSize: FONT.body, height: 50 },
  searchAction: { minHeight: 40, minWidth: 52, paddingHorizontal: spacing.sm, backgroundColor: palette.sage, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  searchActionText: { color: palette.white, fontSize: FONT.caption, fontWeight: "800" },
  searchResult: { paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.border },
  searchResultText: { color: palette.ink, fontSize: FONT.body, lineHeight: 26, textAlign: "right" },
  searchResultMeta: { color: palette.gold, fontSize: FONT.caption, marginTop: spacing.sm, textAlign: "right", fontWeight: "700" },
  versesCard: { paddingVertical: spacing.sm, gap: 0 },
  verseRow: { padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.border, gap: spacing.md },
  verseText: { color: "#214137", fontSize: 22, lineHeight: 43, textAlign: "right", writingDirection: "rtl" },
  verseNumber: { color: palette.gold, fontSize: 15, fontWeight: "700" },
  verseActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.md },
  verseAction: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: 10, backgroundColor: palette.sageSoft },
  verseActionText: { color: palette.sage, fontSize: FONT.caption, fontWeight: "800" },
  tafsirModal: { flex: 1 },
  tafsirModalHeader: { minHeight: 70, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: spacing.md },
  tafsirModalContent: { padding: spacing.lg, gap: spacing.lg },
  tafsirVerseCard: { borderRadius: 20, padding: spacing.lg },
  tafsirVerseText: { fontSize: 24, lineHeight: 45, textAlign: "right", writingDirection: "rtl" },
  tafsirFontControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.md },
  fontButton: { minWidth: 45, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  fontButtonText: { fontSize: 18, fontWeight: "900" },
  tafsirModalText: { textAlign: "right", writingDirection: "rtl" },
  tafsirNavigation: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: spacing.md },
  categoryCount: { color: palette.muted, fontSize: FONT.caption, textAlign: "right", marginTop: -8 },
  categoryStrip: { gap: spacing.sm, paddingVertical: 2 },
  categoryChip: { minHeight: 44, maxWidth: 190, paddingHorizontal: spacing.md, justifyContent: "center", borderRadius: 99, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border },
  categoryChipActive: { backgroundColor: palette.sage, borderColor: palette.sage },
  categoryChipText: { color: palette.ink, fontSize: FONT.caption, fontWeight: "700", textAlign: "center" },
  categoryChipTextActive: { color: palette.white },
  dhikrHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dhikrTitle: { color: palette.ink, fontSize: FONT.h2, fontWeight: "800", textAlign: "right" },
  dhikrSubtitle: { color: palette.muted, fontSize: FONT.caption, textAlign: "right", marginTop: 3 },
  voiceShortcut: { width: 48, height: 48, borderRadius: 16, backgroundColor: palette.goldSoft, alignItems: "center", justifyContent: "center" },
  dhikrText: { color: palette.ink, fontSize: 19, lineHeight: 33, textAlign: "right", writingDirection: "rtl" },
  dhikrBenefit: { color: palette.sage, fontSize: FONT.caption, lineHeight: 20, textAlign: "right" },
  dhikrSource: { color: palette.muted, fontSize: 11, textAlign: "right" },
  dhikrFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  listenButton: { minWidth: 48, minHeight: 48, borderRadius: 14, backgroundColor: palette.sageSoft, justifyContent: "center", alignItems: "center" },
  countButton: { minHeight: 48, minWidth: 96, paddingHorizontal: spacing.lg, borderRadius: 14, justifyContent: "center", alignItems: "center", backgroundColor: palette.sage },
  countButtonDone: { backgroundColor: palette.gold },
  countButtonText: { color: palette.white, fontSize: FONT.caption, fontWeight: "800" },
  completedDhikr: { borderColor: "#C9E1CF" },
  radioHero: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: "#FFF8E9" },
  radioRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  radioPlay: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: palette.sageSoft },
  radioPlayActive: { backgroundColor: palette.gold },
  radioName: { color: palette.ink, fontSize: FONT.body, fontWeight: "800", textAlign: "right" },
  radioMeta: { color: palette.muted, fontSize: FONT.caption, marginTop: 4, textAlign: "right" },
  hadithIntro: { alignItems: "flex-end", backgroundColor: "#FFF9E9" },
  hadithIntroTitle: { color: palette.ink, fontSize: FONT.h2, fontWeight: "800", textAlign: "right", width: "100%" },
  hadithInput: { alignItems: "stretch", minHeight: 116 },
  hadithTextInput: { flex: 1, minHeight: 94, color: palette.ink, fontSize: FONT.body, lineHeight: 25, textAlignVertical: "top" },
  hadithText: { color: palette.ink, fontSize: FONT.body, lineHeight: 27, textAlign: "right" },
  libraryActions: { flexDirection: "row", gap: spacing.sm },
  gradePill: { alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: palette.sageSoft, borderRadius: 99 },
  gradeText: { color: palette.sage, fontSize: FONT.caption, fontWeight: "800" },
  hadithSource: { color: palette.gold, textAlign: "right", fontSize: FONT.caption, fontWeight: "700" },
  hadithTakhrij: { color: palette.muted, textAlign: "right", fontSize: FONT.caption, lineHeight: 20 },
  sourceNote: { color: palette.muted, textAlign: "center", fontSize: 11, lineHeight: 18 },
  nameGrid: { gap: spacing.md },
  nameCard: { minHeight: 174, backgroundColor: palette.white, borderColor: palette.border, borderWidth: 1, borderRadius: 20, padding: spacing.md, alignItems: "center", justifyContent: "center", gap: spacing.sm },
  nameArabic: { color: palette.gold, fontSize: 23, fontWeight: "800", textAlign: "center" },
  namePronunciation: { color: palette.sage, fontSize: FONT.caption, fontWeight: "700", textAlign: "center" },
  nameMeaning: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
  nameDetailHero: { minHeight: 190, borderRadius: 26, justifyContent: "center", alignItems: "center", gap: spacing.sm },
  nameDetailArabic: { color: palette.gold, fontSize: 39, fontWeight: "800", textAlign: "center" },
  nameDetailPronunciation: { color: palette.sage, fontSize: FONT.body, fontWeight: "700", textAlign: "center" },
  detailLabel: { color: palette.gold, fontSize: FONT.caption, fontWeight: "800", textAlign: "right" },
  detailMeaning: { color: palette.ink, fontSize: FONT.body, lineHeight: 27, textAlign: "right" },
  detailText: { color: palette.ink, fontSize: FONT.body, lineHeight: 28, textAlign: "right" },
  detailSource: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: "right" },
  detailNavigation: { flexDirection: "row", gap: spacing.md },
  settingsCard: { gap: 0 },
  settingRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.border },
  settingLabel: { color: palette.ink, fontSize: FONT.body, textAlign: "right", flexShrink: 1 },
  settingValue: { color: palette.sage, fontSize: FONT.caption, textAlign: "left" },
  choiceWrap: { gap: spacing.sm },
  choice: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: 13, backgroundColor: palette.cream },
  choiceActive: { backgroundColor: palette.sageSoft },
  radioDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: palette.muted },
  radioDotActive: { borderColor: palette.gold, backgroundColor: palette.gold },
  choiceText: { color: palette.muted, fontSize: FONT.caption, flex: 1, textAlign: "right" },
  choiceTextActive: { color: palette.sage, fontWeight: "800" },
  settingAbout: { color: palette.muted, fontSize: FONT.caption, lineHeight: 21, textAlign: "right" },
  debugText: { color: palette.muted, fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: spacing.sm },
  debugScreen: { flex: 1 },
  debugHeader: { minHeight: 74, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: spacing.md },
  debugContent: { padding: spacing.lg, gap: spacing.md },
  debugCard: { borderWidth: 1, borderRadius: 17, padding: spacing.md, gap: spacing.xs },
  debugEmpty: { padding: spacing.xl, borderRadius: 18, gap: spacing.sm },
  debugId: { fontSize: 10, textAlign: "right" },
  debugTime: { fontSize: 12, fontWeight: "800", textAlign: "right" },
  debugFooter: { padding: spacing.lg },
  alertScreen: { flex: 1 },
  alertSafe: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center", gap: spacing.xl },
  alertOverlay: { backgroundColor: "rgba(6, 17, 31, 0.48)" },
  alertEyebrow: { color: "#FFF2C8", fontSize: FONT.body, fontWeight: "800", textAlign: "center" },
  alertPrayer: { color: palette.white, fontSize: 42, fontWeight: "800", textAlign: "center" },
  alertWave: { width: 172, height: 172, borderRadius: 86, borderWidth: 1, borderColor: "#D8B35E", backgroundColor: "#FFF7DF", alignItems: "center", justifyContent: "center" },
  stopButton: { width: 172, height: 172, borderRadius: 86, backgroundColor: palette.sage, alignItems: "center", justifyContent: "center", gap: spacing.sm, borderWidth: 8, borderColor: "#E7C56F" },
  stopButtonText: { color: palette.white, fontSize: FONT.body, fontWeight: "800" },
  alertActions: { flexDirection: "row", gap: spacing.md, width: "100%" },
  nextPrayerText: { color: "#FFF2C8", fontSize: FONT.body, fontWeight: "700", textAlign: "center" },
  reminderScreen: { flex: 1 },
  reminderClose: { position: "absolute", top: spacing.lg, right: spacing.lg, width: 48, height: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  reminderEyebrow: { color: "#D7E8DF", fontSize: FONT.caption, textAlign: "center" },
  reminderText: { color: palette.white, fontSize: 23, lineHeight: 39, fontWeight: "600", textAlign: "center", writingDirection: "rtl" },
  reminderCount: { color: "#F4D57C", fontSize: FONT.body, fontWeight: "800" },
  reminderActions: { flexDirection: "row", gap: spacing.md, width: "100%" },
  bottomNav: { minHeight: 72, backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.border, flexDirection: "row", justifyContent: "space-around", paddingTop: spacing.sm, paddingBottom: spacing.xs },
  navItem: { minWidth: 52, flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  navLabel: { color: palette.muted, fontSize: 10, fontWeight: "700", textAlign: "center" },
  navLabelActive: { color: palette.sage },
  toast: { position: "absolute", bottom: 90, left: spacing.lg, right: spacing.lg, borderRadius: 15, backgroundColor: palette.sage, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 },
  toastText: { color: palette.white, fontSize: FONT.caption, fontWeight: "700", textAlign: "center", lineHeight: 20 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(20, 24, 22, 0.45)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  errorModal: { width: "100%", maxWidth: 390, borderRadius: 28, padding: spacing.xl, alignItems: "center", backgroundColor: palette.white, gap: spacing.md },
  errorIllustration: { width: 176, height: 176, resizeMode: "contain" },
  errorTitle: { color: palette.ink, fontSize: FONT.h2, fontWeight: "800", textAlign: "center" },
  errorMessage: { color: palette.muted, fontSize: FONT.body, lineHeight: 25, textAlign: "center" },
  errorCode: { color: palette.muted, fontSize: 11, textAlign: "center" },
  closeModal: { minHeight: 40, paddingHorizontal: spacing.lg, justifyContent: "center" },
  closeModalText: { color: palette.sage, fontSize: FONT.caption, fontWeight: "800" },
  modalTitle: { color: palette.ink, fontSize: FONT.h2, fontWeight: "800", textAlign: "right" },
});


