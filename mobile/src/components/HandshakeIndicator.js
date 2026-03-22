import { View, StyleSheet, Animated, Easing } from "react-native";
import { useEffect, useRef } from "react";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "../context/ThemeContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HandshakeIndicator({ state = "searching" }) {
  const c = useColors();
  const spinAnim = useRef(new Animated.Value(0)).current;

  const states = {
    searching: { color: c.indigo, spin: true },
    connecting: { color: c.indigo, spin: true },
    handshake: { color: c.emerald, spin: true },
    verified: { color: c.emerald, spin: false },
    failed: { color: c.red, spin: false },
  };
  const s = states[state] || states.searching;

  useEffect(() => {
    if (s.spin) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
    }
  }, [s.spin]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.svgWrapper, s.spin && { transform: [{ rotate: spin }] }]}>
        <Svg width="120" height="120" viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="44" fill="none" stroke={c.border} strokeWidth="4" />
          <AnimatedCircle 
            cx="50" cy="50" r="44" 
            fill="none" 
            stroke={s.color} 
            strokeWidth="4" 
            strokeDasharray={`${2 * Math.PI * 44}`} 
            strokeDashoffset={state === "verified" ? 0 : 2 * Math.PI * 44 * 0.25}
            strokeLinecap="round" 
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  svgWrapper: { width: 120, height: 120 },
});
