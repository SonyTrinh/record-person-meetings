import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { bootstrapApp } from "@/lib/bootstrap";
import { handleNotification } from "@/utils/notification";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    bootstrapApp();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => handleNotification(response),
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0c0f15" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { color: "#ffffff" },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="meetings/[id]"
          options={{ title: "Meeting Details" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
