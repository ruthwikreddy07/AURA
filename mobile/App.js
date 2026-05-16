import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AppNavigation from "./Navigation";
import OfflineOutboxService from "./src/services/OfflineOutboxService";

function Root() {
  const { dark } = useTheme();

  useEffect(() => {
    // Initialize the offline outbox — starts NetInfo listener for auto-sync
    OfflineOutboxService.init((status) => {
      if (status.syncing) console.log("[Outbox] Auto-syncing offline queue…");
    });
    return () => OfflineOutboxService.destroy();
  }, []);

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
