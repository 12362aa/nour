# -*- coding: utf-8 -*-
with open('src/NourApp.tsx', 'r', encoding='utf8') as f:
    code = f.read()

splash_component = '''
import Animated, { FadeOut, ZoomIn, useSharedValue, withTiming, runOnJS, useAnimatedStyle, Easing } from "react-native-reanimated";

function AnimatedSplash({ onAnimationComplete, children }: { onAnimationComplete: () => void, children: React.ReactNode }) {
  const [appReady, setAppReady] = useState(false);
  const splashOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    // Wait for initial things, then start animation
    setTimeout(() => {
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
      
      logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
      logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }, () => {
        // Hold for a moment, then fade out the whole splash
        setTimeout(() => {
          splashOpacity.value = withTiming(0, { duration: 600, easing: Easing.inOut(Easing.cubic) }, () => {
            runOnJS(onAnimationComplete)();
          });
        }, 800);
      });
    }, 500);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }]
  }));

  return (
    <View style={{ flex: 1 }}>
      {children}
      {appReady && (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: palette.cream, justifyContent: 'center', alignItems: 'center', zIndex: 9999 }, containerStyle]}>
          <Animated.Image source={require("../assets/nour-logo.jpg")} style={[{ width: 180, height: 180, resizeMode: "contain", borderRadius: 40 }, logoStyle]} />
        </Animated.View>
      )}
    </View>
  );
}
'''

# Find the right place to inject it
import_idx = code.find('export default function NourApp')
if import_idx != -1:
    code = code[:import_idx] + splash_component + '\n' + code[import_idx:]

app_func = '''
export default function NourApp() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <NourThemeProvider>
      <NourAuthProvider>
        <AnimatedSplash onAnimationComplete={() => setSplashDone(true)}>
          {splashDone ? <AuthenticatedApp /> : null}
        </AnimatedSplash>
      </NourAuthProvider>
    </NourThemeProvider>
  );
}
'''

code = re.sub(r'export default function NourApp\(\) \{.*?\n  \}', app_func.strip(), code, flags=re.DOTALL)

with open('src/NourApp.tsx', 'w', encoding='utf8') as f:
    f.write(code)
print("Injected AnimatedSplash")