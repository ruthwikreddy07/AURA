import { Switch } from "react-native";
import { useColors } from "../context/ThemeContext";

export default function Toggle({ value, onValueChange }) {
  const c = useColors();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: c.border, true: c.indigo }}
      thumbColor={"#fff"}
    />
  );
}
