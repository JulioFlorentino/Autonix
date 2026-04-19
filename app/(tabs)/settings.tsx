import { Alert, Pressable, ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/providers/auth-provider";

export default function SettingsScreen() {
  const { logout, session } = useAuth();

  const onLogout = () => {
    Alert.alert("Cerrar sesion", "Estas seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText type="title">Ajustes</ThemedText>
        <ThemedText style={styles.subtitle}>
          Gestiona tu sesion y preferencias de la cuenta.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Cuenta</ThemedText>
        <ThemedText style={styles.value}>{session?.user.correo || "Sin correo"}</ThemedText>

        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <ThemedText style={styles.logoutText}>Cerrar sesion</ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DFE5F0",
    gap: 10,
  },
  subtitle: {
    opacity: 0.7,
  },
  value: {
    fontSize: 14,
    opacity: 0.85,
  },
  logoutButton: {
    marginTop: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#D62828",
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
