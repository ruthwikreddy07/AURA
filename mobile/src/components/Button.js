import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useColors } from "../context/ThemeContext";

export default function Button({ children, variant = "primary", onPress, disabled, style, icon }) {
  const c = useColors();

  const variants = {
    primary: { bg: c.indigo, text: "#fff" },
    secondary: { bg: c.indigo + '12', text: c.indigo, border: c.indigo + '40' },
    ghost: { bg: "transparent", text: c.textSecondary },
    danger: { bg: c.red + '15', text: c.red, border: c.red + '30' },
    success: { bg: c.emerald + '15', text: c.emerald, border: c.emerald + '30' },
  };
  const v = variants[variant] || variants.primary;

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : "Button"}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        { backgroundColor: v.bg },
        v.border && { borderWidth: 1.5, borderColor: v.border },
        variant === 'primary' && styles.primaryShadow,
        variant === 'primary' && { shadowColor: c.indigo },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <View style={styles.inner}>
        {icon && <Text style={{ marginRight: 8 }}>{icon}</Text>}
        <Text style={[styles.text, { color: v.text }]}>{children}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  primaryShadow: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
});
