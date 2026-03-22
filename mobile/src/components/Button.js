import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useColors } from "../context/ThemeContext";

export default function Button({ children, variant = "primary", onPress, disabled, style }) {
  const c = useColors();

  const variants = {
    primary: { bg: c.indigo, text: "#fff" },
    secondary: { bg: "transparent", text: c.indigo, border: c.indigo },
    ghost: { bg: "transparent", text: c.textSecondary },
  };
  const v = variants[variant] || variants.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        { backgroundColor: v.bg },
        v.border && { borderWidth: 1.5, borderColor: v.border },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: v.text }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 15, fontWeight: "700" },
});
