# -*- coding: utf-8 -*-
import os
import re

with open('src/features/RestoredFeatures.tsx', 'r', encoding='utf8') as f:
    code = f.read()

deleted_code = """
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

export function QiblaScreen({ onBack, showError }: CommonProps) {
  const { colors } = useNourTheme();
  const [direction, setDirection] = useState<number | null>(null);
  const [cityHint, setCityHint] = useState("موقعك الحالي");
  const [loading, setLoading] = useState(true);
  const heading = useSharedValue(0);

  const load = async () => {
    setLoading(true);
    let sub;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error("يلزم السماح بالموقع لحساب اتجاه القبلة بدقة");
      const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const bearing = await getQibla({ latitude: point.coords.latitude, longitude: point.coords.longitude, city: "" });
      setDirection(bearing);
      const places = await Location.reverseGeocodeAsync(point.coords).catch(() => []);
      setCityHint(places[0]?.city || places[0]?.region || "موقعك الحالي");

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
    let cleanup;
    void load().then((fn) => { cleanup = fn; });
    return () => cleanup?.();
  }, []);

  const compassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: f"{-heading.value}deg" }],
  }));

  return (
    <FeatureScreen>
      <FeatureHeader title="اتجاه القبلة" subtitle={f"محسوب بدقة من {cityHint}"} onBack={onBack} />
      <FeatureCard style={styles.qiblaCard}>
        {loading ? <ActivityIndicator color={colors.gold} size="large" /> : null}
        {direction !== null ? (
          <>
            <View style={{ alignItems: "center", marginVertical: 20 }}>
"""

deleted_code = deleted_code.replace('f"{-heading.value}deg"', '${-heading.value}deg')
deleted_code = deleted_code.replace('f"محسوب بدقة من {cityHint}"', 'محسوب بدقة من ')


marker1 = 'import { useAudioStore } from "../store/useAudioStore";'
marker2 = '<View style={[styles.compassRing, { borderColor: "transparent", backgroundColor: colors.surfaceSoft, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 15, width: 280, height: 280, borderRadius: 140 }]}>'

p1 = code.find(marker1)
p2 = code.find(marker2)

if p1 != -1 and p2 != -1:
    new_code = code[:p1 + len(marker1)] + '\n\n' + deleted_code + code[p2:]
    with open('src/features/RestoredFeatures.tsx', 'w', encoding='utf8') as f:
        f.write(new_code)
    print('Fixed successfully')
else:
    print('Markers not found')