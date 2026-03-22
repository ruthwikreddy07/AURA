import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AppNavigation from "./Navigation";

function Root() {
  const { dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <AppNavigation />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
