import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Circle, Defs, RadialGradient, LinearGradient, Stop, G } from "react-native-svg";

/* -------------------------------------------------------------------------- */
/*                         1. Top-Left Header Visual                          */
/* -------------------------------------------------------------------------- */

export function AnimatedHeaderVisual({ isNight }: { isNight: boolean }) {
  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const starOpacity1 = useSharedValue(0.3);
  const starOpacity2 = useSharedValue(0.8);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 1400, easing: Easing.ease }),
        withTiming(0.92, { duration: 1400, easing: Easing.ease })
      ),
      -1,
      true
    );
    starOpacity1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.2, { duration: 900 })
      ),
      -1,
      true
    );
    starOpacity2.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1100 }),
        withTiming(1, { duration: 1100 })
      ),
      -1,
      true
    );
  }, []);

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: 0.6,
  }));

  const star1Style = useAnimatedStyle(() => ({ opacity: starOpacity1.value }));
  const star2Style = useAnimatedStyle(() => ({ opacity: starOpacity2.value }));

  if (!isNight) {
    return (
      <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[{ position: "absolute", width: 40, height: 40, borderRadius: 20, backgroundColor: "#FBBF24" }, glowStyle]} />
        <Animated.View style={[{ position: "absolute", width: 40, height: 40, alignItems: "center", justifyContent: "center" }, raysStyle]}>
          <Svg width={40} height={40} viewBox="0 0 40 40">
            <G stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
              <Path d="M20 3 V8" />
              <Path d="M20 32 V37" />
              <Path d="M3 20 H8" />
              <Path d="M32 20 H37" />
              <Path d="M8 8 L11.5 11.5" />
              <Path d="M28.5 28.5 L32 32" />
              <Path d="M8 32 L11.5 28.5" />
              <Path d="M28.5 11.5 L32 8" />
            </G>
          </Svg>
        </Animated.View>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="8" fill="#FBBF24" />
          <Circle cx="12" cy="12" r="6" fill="#F59E0B" />
        </Svg>
      </View>
    );
  }

  return (
    <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: 38, height: 38, borderRadius: 19, backgroundColor: "#818CF8" }, glowStyle]} />
      <Animated.View style={[{ position: "absolute", top: 4, left: 6 }, star1Style]}>
        <Svg width={8} height={8} viewBox="0 0 8 8">
          <Path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" fill="#FEE2E2" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: "absolute", bottom: 6, right: 4 }, star2Style]}>
        <Svg width={10} height={10} viewBox="0 0 10 10">
          <Path d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z" fill="#FEF08A" />
        </Svg>
      </Animated.View>
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#FDE047" stroke="#F59E0B" strokeWidth="1.5" />
      </Svg>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                 2. Grand Distinct Hero Card Visual                         */
/* -------------------------------------------------------------------------- */

export function HeroPrayerVisual({ isNight, proximityRatio = 1.0 }: { isNight: boolean; proximityRatio?: number }) {
  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const starOpacity1 = useSharedValue(0.4);
  const starOpacity2 = useSharedValue(0.9);
  const starOpacity3 = useSharedValue(0.2);

  useEffect(() => {
    // Continuous 360-degree rotation of 12-ray starburst
    rotation.value = withRepeat(
      withTiming(360, { duration: 18000, easing: Easing.linear }),
      -1,
      false
    );

    // Glowing aura pulse
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1600, easing: Easing.ease }),
        withTiming(0.85, { duration: 1600, easing: Easing.ease })
      ),
      -1,
      true
    );

    // Twinkling stars for night
    starOpacity1.value = withRepeat(withSequence(withTiming(1, { duration: 750 }), withTiming(0.2, { duration: 750 })), -1, true);
    starOpacity2.value = withRepeat(withSequence(withTiming(0.2, { duration: 1050 }), withTiming(1, { duration: 1050 })), -1, true);
    starOpacity3.value = withRepeat(withSequence(withTiming(0.9, { duration: 1300 }), withTiming(0.1, { duration: 1300 })), -1, true);
  }, []);

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value * (0.8 + proximityRatio * 0.35) }],
    opacity: 0.7 * proximityRatio,
  }));

  const star1Style = useAnimatedStyle(() => ({ opacity: starOpacity1.value * proximityRatio }));
  const star2Style = useAnimatedStyle(() => ({ opacity: starOpacity2.value * proximityRatio }));
  const star3Style = useAnimatedStyle(() => ({ opacity: starOpacity3.value * proximityRatio }));

  if (!isNight) {
    // Grand Distinct Daytime Sun for Hero Card (12 Diamond-Pointed Rays + Gradient Core)
    return (
      <View style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
        {/* Outer Proximity Glow Aura */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: "#FBBF24",
            },
            glowStyle,
          ]}
        />

        {/* 12 Diamond-Pointed Spinning Sunburst Rays */}
        <Animated.View style={[{ position: "absolute", width: 52, height: 52, alignItems: "center", justifyContent: "center" }, raysStyle]}>
          <Svg width={52} height={52} viewBox="0 0 52 52">
            <Defs>
              <LinearGradient id="heroRayGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FFF5D6" />
                <Stop offset="100%" stopColor="#F59E0B" />
              </LinearGradient>
            </Defs>
            {/* 12 Rays */}
            <G fill="url(#heroRayGrad)">
              <Path d="M26 2 L28.5 10 L26 12 L23.5 10 Z" />
              <Path d="M26 50 L28.5 42 L26 40 L23.5 42 Z" />
              <Path d="M2 26 L10 23.5 L12 26 L10 28.5 Z" />
              <Path d="M50 26 L42 23.5 L40 26 L42 28.5 Z" />

              <Path d="M9 9 L17 11.5 L17.5 14 L14 17.5 Z" />
              <Path d="M43 43 L35 40.5 L34.5 38 L38 34.5 Z" />
              <Path d="M43 9 L35.5 14 L38 17.5 L40.5 17 Z" />
              <Path d="M9 43 L16.5 38 L14 34.5 L11.5 35 Z" />
            </G>
          </Svg>
        </Animated.View>

        {/* Grand Sun Dual-Tone Core */}
        <Svg width={32} height={32} viewBox="0 0 32 32">
          <Defs>
            <RadialGradient id="sunCoreGrad" cx="35%" cy="35%" r="65%">
              <Stop offset="0%" stopColor="#FFFFFF" />
              <Stop offset="40%" stopColor="#FDE047" />
              <Stop offset="100%" stopColor="#F59E0B" />
            </RadialGradient>
          </Defs>
          <Circle cx="16" cy="16" r="13" fill="url(#sunCoreGrad)" stroke="#D97706" strokeWidth="1.5" />
        </Svg>
      </View>
    );
  }

  // Grand Distinct Nighttime Royal Moon with 4 Twinkling Constellation Stars
  return (
    <View style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
      {/* Outer Indigo-Gold Glow Aura */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#818CF8",
          },
          glowStyle,
        ]}
      />

      {/* Twinkling Star 1 (Top Left) */}
      <Animated.View style={[{ position: "absolute", top: 3, left: 4 }, star1Style]}>
        <Svg width={9} height={9} viewBox="0 0 9 9">
          <Path d="M4.5 0 L5.5 3.5 L9 4.5 L5.5 5.5 L4.5 9 L3.5 5.5 L0 4.5 L3.5 3.5 Z" fill="#FDE047" />
        </Svg>
      </Animated.View>

      {/* Twinkling Star 2 (Bottom Right) */}
      <Animated.View style={[{ position: "absolute", bottom: 4, right: 3 }, star2Style]}>
        <Svg width={11} height={11} viewBox="0 0 11 11">
          <Path d="M5.5 0 L7 4 L11 5.5 L7 7 L5.5 11 L4 7 L0 5.5 L4 4 Z" fill="#E0E7FF" />
        </Svg>
      </Animated.View>

      {/* Twinkling Star 3 (Top Right) */}
      <Animated.View style={[{ position: "absolute", top: 6, right: 6 }, star3Style]}>
        <Svg width={7} height={7} viewBox="0 0 7 7">
          <Path d="M3.5 0 L4.5 2.5 L7 3.5 L4.5 4.5 L3.5 7 L2.5 4.5 L0 3.5 L2.5 2.5 Z" fill="#FDE047" />
        </Svg>
      </Animated.View>

      {/* Royal Crescent Moon */}
      <Svg width={34} height={34} viewBox="0 0 32 32">
        <Defs>
          <LinearGradient id="moonGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FEF08A" />
            <Stop offset="70%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#CA8A04" />
          </LinearGradient>
        </Defs>
        <Path
          d="M28 17.05A12 12 0 1 1 14.95 4 9.33 9.33 0 0 0 28 17.05z"
          fill="url(#moonGrad)"
          stroke="#B45309"
          strokeWidth="1.5"
        />
      </Svg>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                         2. Realistic Organic Flame                         */
/* -------------------------------------------------------------------------- */

export function AnimatedFlameVisual({ size = 26 }: { size?: number }) {
  const flameSway = useSharedValue(0);
  const flameScale = useSharedValue(1);

  useEffect(() => {
    flameSway.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 400, easing: Easing.ease }),
        withTiming(-4, { duration: 400, easing: Easing.ease })
      ),
      -1,
      true
    );

    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.ease }),
        withTiming(0.92, { duration: 600, easing: Easing.ease })
      ),
      -1,
      true
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${flameSway.value}deg` },
      { scaleY: flameScale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value * 1.1 }],
    opacity: 0.5,
  }));

  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: "center", justifyContent: "center" }}>
      {/* Background Ember Glow */}
      <Animated.View style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: "#F59E0B" }, glowStyle]} />
      
      {/* Organic Flame SVG */}
      <Animated.View style={flameStyle}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Defs>
            <LinearGradient id="flameGrad" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0%" stopColor="#EF4444" />
              <Stop offset="50%" stopColor="#F59E0B" />
              <Stop offset="100%" stopColor="#FEF08A" />
            </LinearGradient>
          </Defs>
          {/* Outer Flame */}
          <Path
            d="M12 2C10.5 4.5 9 6.5 9 9.5C9 13.09 10.34 14.5 12 18.5C13.66 14.5 15 13.09 15 9.5C15 6.5 13.5 4.5 12 2Z"
            fill="url(#flameGrad)"
          />
          {/* Inner Flame Core */}
          <Path
            d="M12 7C11.2 8.5 10.5 9.8 10.5 11.5C10.5 13.5 11.2 14.2 12 16.5C12.8 14.2 13.5 13.5 13.5 11.5C13.5 9.8 12.8 8.5 12 7Z"
            fill="#FFFFFF"
            opacity={0.8}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                         3. Fasting Moon Breathing                          */
/* -------------------------------------------------------------------------- */

export function AnimatedFastingMoon({ size = 26 }: { size?: number }) {
  const breath = useSharedValue(1);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 1200, easing: Easing.ease }),
        withTiming(0.92, { duration: 1200, easing: Easing.ease })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value * 1.2 }],
    opacity: 0.45,
  }));

  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: "#EAB308" }, glowStyle]} />
      <Animated.View style={animatedStyle}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill="#FACC15"
            stroke="#CA8A04"
            strokeWidth="1.5"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
