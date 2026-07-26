import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library/legacy";
import {
  BookOpen,
  CalendarDays,
  Download,
  Sparkles,
} from "lucide-react-native";
import { useNourTheme } from "../theme/NourTheme";
import {
  getHijriMonth,
  getUnsplashWallpapers,
  hasUnsplashAccess,
  HijriCalendarDay,
  trackUnsplashDownload,
  UnsplashWallpaper,
} from "../services/more";

const BUILT_IN_WALLPAPERS = [
  { id: "fajr", label: "سكينة الفجر", source: require("../../assets/prayer-backgrounds/fajr-bg.png") },
  { id: "dhuhr", label: "نور الظهر", source: require("../../assets/prayer-backgrounds/dhuhr-bg.png") },
  { id: "asr", label: "ذهبيات العصر", source: require("../../assets/prayer-backgrounds/asr-bg.png") },
  { id: "maghrib", label: "غروب المغرب", source: require("../../assets/prayer-backgrounds/maghrib-bg.png") },
  { id: "isha", label: "ليلة العشاء", source: require("../../assets/prayer-backgrounds/isha-bg.png") },
];

const WUDU_STEPS = [
  "النية في القلب للوضوء للصلاة، ثم التسمية.",
  "غسل الكفين إلى الرسغين ثلاثاً مع إيصال الماء بين الأصابع.",
  "المضمضة ثلاثاً، ثم الاستنشاق والاستنثار ثلاثاً.",
  "غسل الوجه كاملاً ثلاثاً.",
  "غسل الذراع اليمنى إلى المرفق ثلاثاً، ثم اليسرى.",
  "مسح الرأس باليدين المبللتين من مقدمته إلى خلفه ثم العودة.",
  "مسح الأذنين، ثم غسل القدمين إلى الكعبين ثلاثاً بدءاً باليمنى.",
];

const PRAYER_STEPS = [
  "استقبال القبلة قائماً مع نية الصلاة في القلب.",
  "تكبيرة الإحرام بقول «الله أكبر»، ثم قراءة الفاتحة وما تيسر.",
  "الركوع مع التكبير، ثم الرفع منه والاعتدال قائماً.",
  "السجود، ثم الجلوس بين السجدتين، ثم السجدة الثانية.",
  "تُكرر الركعة، ويُقرأ التشهد بعد الركعة الثانية.",
  "في الصلاة الثلاثية أو الرباعية تُستكمل الركعات، ثم التشهد الأخير والصلاة الإبراهيمية.",
  "تُختتم الصلاة بالتسليم عن اليمين ثم اليسار.",
];

type Props = {
  showError: (error: unknown, retry: () => void) => void;
  showToast: (message: string) => void;
};

export function MoreScreen({ showError, showToast }: Props) {
  const { colors } = useNourTheme();
  const [calendar, setCalendar] = useState<HijriCalendarDay[]>([]);
  const [wallpapers, setWallpapers] = useState<UnsplashWallpaper[]>([]);
  const [busy, setBusy] = useState(false);
  const [wallpaperMessage, setWallpaperMessage] = useState("");

  const load = async () => {
    setBusy(true);
    const now = new Date();
    const [calendarResult, wallpaperResult] = await Promise.allSettled([
      getHijriMonth(now.getMonth() + 1, now.getFullYear()),
      getUnsplashWallpapers(),
    ]);
    if (calendarResult.status === "fulfilled") setCalendar(calendarResult.value);
    else showError(calendarResult.reason, load);
    if (wallpaperResult.status === "fulfilled") {
      setWallpapers(wallpaperResult.value);
      setWallpaperMessage(hasUnsplashAccess() ? "" : "الخلفيات المحلية متاحة بدون إنترنت. خلفيات Unsplash تحتاج مفتاح وصول اختياري.");
    } else {
      console.error("[nour:wallpapers] list failed", wallpaperResult.reason);
      setWallpaperMessage("تعذّر تحميل خلفيات الإنترنت؛ يمكنك حفظ الخلفيات المحلية الموجودة هنا.");
    }
    setBusy(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveUri = async (uri: string) => {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) throw new Error("يلزم السماح بحفظ الصور");
    await MediaLibrary.createAssetAsync(uri);
    showToast("تم حفظ الخلفية في صور الهاتف.");
  };

  const saveBuiltIn = async (module: number) => {
    try {
      const asset = Asset.fromModule(module);
      if (!asset.localUri) {
        await asset.downloadAsync();
      }
      if (!asset.localUri) throw new Error("تعذر تجهيز الخلفية للحفظ");

      let extension = asset.localUri.split(".").pop()?.toLowerCase() ?? "png";
      if (!["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
        extension = "png"; // Force valid image extension if it's a hash
      }
      const dest = `${FileSystem.cacheDirectory}nour-builtin-${asset.name ?? Date.now()}.${extension}`;
      await FileSystem.copyAsync({ from: asset.localUri, to: dest });
      await saveUri(dest);
    } catch (error) {
      showError(error, () => void saveBuiltIn(module));
    }
  };

  const saveRemote = async (wallpaper: UnsplashWallpaper) => {
    try {
      const destination = `${FileSystem.cacheDirectory}nour-wallpaper-${wallpaper.id}.jpg`;
      const result = await FileSystem.downloadAsync(wallpaper.fullUrl, destination);
      if (result.status < 200 || result.status >= 300) {
        console.error("[nour:wallpapers] download failed", result.status, result.uri);
        throw new Error("تعذّر تنزيل هذه الخلفية حاليًا.");
      }
      await trackUnsplashDownload(wallpaper.downloadLocation).catch((error) => {
        console.warn("[nour:wallpapers] download tracking failed", error);
      });
      await saveUri(result.uri);
    } catch (error) {
      showError(error, () => void saveRemote(wallpaper));
    }
  };

  const today = new Date().toLocaleDateString("en-GB").replaceAll("/", "-");
  const upcoming = calendar.filter((day) => day.occasion || day.gregorian === today);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}><View><Text style={[styles.title, { color: colors.ink }]}>المزيد</Text><Text style={[styles.subtitle, { color: colors.muted }]}>خدمات عملية ومحتوى موثّق</Text></View><Sparkles color={colors.gold} size={30} /></View>
      {busy ? <ActivityIndicator color={colors.gold} /> : null}

      <Section title="خلفيات إسلامية" icon={Download}>
        {wallpaperMessage ? <Text style={[styles.body, { color: colors.muted }]}>{wallpaperMessage}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wallpaperStrip}>
          {BUILT_IN_WALLPAPERS.map((item) => <View key={item.id} style={styles.wallpaperCard}><Image source={item.source} style={styles.wallpaperImage} /><Text style={[styles.wallpaperLabel, { color: colors.ink }]}>{item.label}</Text><Pressable onPress={() => void saveBuiltIn(item.source)} style={[styles.save, { backgroundColor: colors.primary }]}><Download color="#FFFFFF" size={17} /></Pressable></View>)}
          {wallpapers.map((item) => <View key={item.id} style={styles.wallpaperCard}><Image source={{ uri: item.imageUrl }} style={styles.wallpaperImage} /><Text style={[styles.wallpaperLabel, { color: colors.ink }]}>تصوير {item.author} · Unsplash</Text><Pressable onPress={() => void saveRemote(item)} style={[styles.save, { backgroundColor: colors.primary }]}><Download color="#FFFFFF" size={17} /></Pressable></View>)}
        </ScrollView>
      </Section>

      <Section title="صفة الوضوء الصحيحة" icon={BookOpen}>
        {WUDU_STEPS.map((step, idx) => (
          <View key={idx} style={[styles.stepRow, { borderColor: colors.border }]}>
            <View style={[styles.stepBadge, { backgroundColor: colors.surfaceSoft }]}><Text style={[styles.stepNumber, { color: colors.primary }]}>{idx + 1}</Text></View>
            <Text style={[styles.stepText, { color: colors.ink }]}>{step}</Text>
          </View>
        ))}
      </Section>

      <Section title="صفة الصلاة الصحيحة" icon={BookOpen}>
        {PRAYER_STEPS.map((step, idx) => (
          <View key={idx} style={[styles.stepRow, { borderColor: colors.border }]}>
            <View style={[styles.stepBadge, { backgroundColor: colors.surfaceSoft }]}><Text style={[styles.stepNumber, { color: colors.primary }]}>{idx + 1}</Text></View>
            <Text style={[styles.stepText, { color: colors.ink }]}>{step}</Text>
          </View>
        ))}
      </Section>

      <Section title="التقويم الهجري" icon={CalendarDays}>
        {upcoming.length ? upcoming.map((day) => {
          const isToday = day.gregorian === today;
          return (
            <View key={day.gregorian} style={[styles.calendarDay, { backgroundColor: isToday ? colors.primary : colors.surface, borderColor: isToday ? colors.primary : colors.border, borderWidth: 1, padding: 16, borderRadius: 20, minHeight: 90, elevation: isToday ? 4 : 0, shadowColor: isToday ? colors.primary : "#000", shadowOpacity: isToday ? 0.2 : 0, shadowRadius: 10 }]}>
              <View style={{ backgroundColor: isToday ? "rgba(255,255,255,0.2)" : colors.surfaceSoft, width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" }}>
                <Text style={[styles.calendarNumber, { color: isToday ? "#FFFFFF" : colors.primary, fontSize: 28, fontWeight: "900" }]}>{day.hijriDay.toLocaleString("en-US")}</Text>
              </View>
              <View style={[styles.grow, { justifyContent: "center" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={[styles.rowTitle, { color: isToday ? "#FFFFFF" : colors.ink, fontSize: 17, fontWeight: "800" }]}>{day.occasion || "يوم عادي"}</Text>
                  {isToday ? <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}><Text style={{ color: colors.primary, fontSize: 11, fontWeight: "900" }}>اليوم</Text></View> : null}
                </View>
                <Text style={[styles.rowMeta, { color: isToday ? "rgba(255,255,255,0.9)" : colors.muted, fontSize: 14, fontWeight: "600", textAlign: "right" }]}>{day.weekday} · {day.hijriMonthName} {day.hijriYear} هـ</Text>
              </View>
            </View>
          );
        }) : <Text style={[styles.body, { color: colors.muted }]}>لا توجد مناسبات قادمة.</Text>}
      </Section>
    </ScrollView>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Download; children: React.ReactNode }) {
  const { colors } = useNourTheme();
  return <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.sectionHeader}><Icon color={colors.gold} size={20} /><Text style={[styles.sectionTitle, { color: colors.ink }]}>{title}</Text></View>{children}</View>;
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { fontSize: 14 },
  section: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  body: { fontSize: 14, lineHeight: 22 },
  wallpaperStrip: { gap: 12 },
  wallpaperCard: { width: 140, height: 210, borderRadius: 16, overflow: "hidden", position: "relative" },
  wallpaperImage: { width: "100%", height: "100%" },
  wallpaperLabel: { position: "absolute", bottom: 8, right: 8, left: 8, fontSize: 11, fontWeight: "700", color: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.6)", padding: 4, borderRadius: 6, textAlign: "center" },
  save: { position: "absolute", top: 8, left: 8, width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  stepBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  stepNumber: { fontSize: 13, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22, textAlign: "right" },
  calendarDay: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14 },
  calendarNumber: { fontSize: 20, fontWeight: "900" },
  grow: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "700", textAlign: "right" },
  rowMeta: { fontSize: 12, textAlign: "right", marginTop: 2 },
});
