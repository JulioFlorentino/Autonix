import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/providers/auth-provider";

const AutonixDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0D0D0D",
    card: "#141414",
    text: "#F5F5F5",
    border: "#1E3A5F",
    primary: "#FF7A1A",
    notification: "#FF7A1A",
  },
};

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={AutonixDarkTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="noticias-detalle"
            options={{
              title: "Noticia",
              headerStyle: { backgroundColor: "#141414" },
              headerTintColor: "#FF7A1A",
              headerTitleStyle: { color: "#F5F5F5", fontWeight: "700" },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="acerca-de"
            options={{
              title: "Acerca De",
              headerStyle: { backgroundColor: "#141414" },
              headerTintColor: "#FF7A1A",
              headerTitleStyle: { color: "#F5F5F5", fontWeight: "700" },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}
