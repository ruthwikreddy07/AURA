import { View, StyleSheet } from "react-native";
import { useColors } from "../context/ThemeContext";

export default function Card({ children, style, variant = 'default' }) {
  const c = useColors();
  
  const variants = {
    default: {
      backgroundColor: c.card,
      borderColor: c.border,
    },
    glow: {
      backgroundColor: c.card,
      borderColor: c.indigo + '30',
      shadowColor: c.indigo,
      shadowOpacity: 0.15,
      shadowRadius: 20,
    },
    elevated: {
      backgroundColor: c.card,
      borderColor: c.border,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 8,
    }
  };
  
  const v = variants[variant] || variants.default;
  
  return (
    <View style={[styles.card, v, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
});
