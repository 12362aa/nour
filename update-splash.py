# -*- coding: utf-8 -*-
import re

with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

# Let's completely replace both SplashAnimation and AnimatedSplash with a new unified SplashAnimation
# that uses the logo and supports themes properly without the black frame (by wrapping it in a View with overflow hidden or border radius, or by just making the app background match the logo if it's black? No, they want light/dark theme!)
# "اجعل لون خلفية الـ Splash يعتمد على colors.background الخاص بالثيم الحالي، بحيث تكون بيضاء في الوضع الفاتح وداكنة في الوضع الليلي، تخلص من الإطار الأسود المزعج"
# The logo has a black background? If we make it rounded or something, it might look like a floating app icon.
# Let's apply a shadow and borderRadius to the logo image, making it look like a nice icon rather than an ugly black frame.

new_splash = '''function SplashAnimation({ isAppReady, onFinish }: { isAppReady: boolean; onFinish: () => void }) {
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
            source={require("../assets/nour-logo.jpg")} 
            style={{ width: 140, height: 140, resizeMode: "cover" }} 
          />
        </View>
        <NativeText style={{ color: colors.ink, fontSize: 32, fontWeight: "900", marginTop: 24, letterSpacing: 1.5 }}>نور</NativeText>
        <NativeText style={{ color: colors.muted, fontSize: 16, marginTop: 8, fontWeight: "600" }}>رفيقك اليومي</NativeText>
      </Animated.View>
    </NativeView>
  );
}'''

# Replace the old SplashAnimation
code = re.sub(r'function SplashAnimation.*?</NativeView>\s*\);\s*\}', new_splash, code, flags=re.DOTALL)

# Delete AnimatedSplash
code = re.sub(r'function AnimatedSplash.*?</View>\s*\);\s*\}', '', code, flags=re.DOTALL)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Updated SplashAnimation and deleted AnimatedSplash")