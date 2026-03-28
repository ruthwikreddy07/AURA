import { useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

// We reuse the visual elements from the web landing page
// Dark background, gradient glow elements, and features text

const SLIDES = [
  {
    id: "1",
    title: "Pay Anyone.\nZero Internet.",
    subtitle: "Military-grade cryptography across 5 hardware channels enabling peer-to-peer payments completely off-grid.",
    icon: "Ω",
    glowColor: "rgba(99, 102, 241, 0.2)"
  },
  {
    id: "2",
    title: "5 Hardware\nChannels",
    subtitle: "QR Code, Bluetooth LE, NFC, Ultrasonic Sound, and Li-Fi Light. Every sensor becomes a payment terminal.",
    icon: "📡",
    glowColor: "rgba(16, 185, 129, 0.2)"
  },
  {
    id: "3",
    title: "Bank-Grade\nCryptography",
    subtitle: "AES-256-GCM encryption, RSA-2048 token signing, and real-time ML risk scoring on every transaction.",
    icon: "🛡️",
    glowColor: "rgba(139, 92, 246, 0.2)"
  }
];

export default function WelcomeScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  const goToNextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      navigation.replace("Auth");
    }
  };

  return (
    <View style={styles.root}>
      {/* Background Glow based on current slide */}
      <Animated.View style={[
        styles.bgGlow, 
        { 
          backgroundColor: SLIDES[currentIndex].glowColor,
          transform: [
            { scale: scrollX.interpolate({ inputRange: [0, width * 2], outputRange: [1, 1.5] }) }
          ]
        }
      ]} />

      <SafeAreaView style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {SLIDES.map((slide, index) => {
            return (
              <View key={slide.id} style={styles.slide}>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>{slide.icon}</Text>
                </View>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.bottomSection}>
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                outputRange: [8, 24, 8],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });
              return (
                <Animated.View
                  key={index.toString()}
                  style={[styles.dot, { width: dotWidth, opacity }]}
                />
              );
            })}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={goToNextSlide} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>
              {currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.replace("Auth")} activeOpacity={0.6}>
            <Text style={styles.secondaryButtonText}>Skip Introduction</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030014" },
  bgGlow: {
    position: "absolute",
    width: height * 0.8,
    height: height * 0.8,
    borderRadius: height * 0.4,
    top: -height * 0.2,
    left: -width * 0.5,
    opacity: 0.4,
    ...StyleSheet.absoluteFillObject,
  },
  container: { flex: 1 },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  iconText: {
    fontSize: 48,
    color: "#ffffff",
    fontWeight: "900",
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: "row",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#030014",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
});
