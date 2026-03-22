import { View, Text, TextInput, StyleSheet } from "react-native";
import { useColors } from "../context/ThemeContext";

export default function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, style }) {
  const c = useColors();
  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "500",
  },
});
