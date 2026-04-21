import { Stack } from "expo-router";

export default function ForoLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#141414" },
        headerTintColor: "#FF7A1A",
        headerTitleStyle: { color: "#F5F5F5", fontWeight: "700" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Foro Comunitario" }} />
      <Stack.Screen name="crear" options={{ title: "Nuevo Tema" }} />
      <Stack.Screen name="detalle" options={{ title: "Tema" }} />
    </Stack>
  );
}
