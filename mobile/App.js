import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AppNavigation from "./Navigation";
import OfflineOutboxService from "./src/services/OfflineOutboxService";
import PushNotificationService from "./src/services/PushNotificationService";
import ErrorBoundary from "./src/components/ErrorBoundary";

function Root() {
  const { dark } = useTheme();
  const navigationRef = useRef(null);

  useEffect(() => {
    // Initialize the offline outbox — starts NetInfo listener for auto-sync
    OfflineOutboxService.init((status) => {
      if (status.syncing) console.log("[Outbox] Auto-syncing offline queue…");
    });

    // Initialize push notifications — requests permission + registers FCM token
    PushNotificationService.init(navigationRef.current);

    return () => {
      OfflineOutboxService.destroy();
      PushNotificationService.destroy();
    };
  }, []);

  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <AppNavigation navigationRef={navigationRef} />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
