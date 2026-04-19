import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/providers/auth-provider";

export default function HomeScreen() {
  const { logout, session } = useAuth();

  const fullName = useMemo(() => {
    if (!session?.user) {
      return "";
    }

    return `${session.user.nombre} ${session.user.apellido}`.trim();
  }, [session?.user]);

  const modules = [
    "Vehiculos",
    "Mantenimientos",
    "Combustible",
    "Estado de gomas",
    "Gastos e ingresos",
    "Foro comunitario",
    "Videos educativos",
    "Catalogo vehicular",
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.headerCard}>
        <ThemedText type="title">Autonix</ThemedText>
        <ThemedText style={styles.subtitle}>Bienvenido, {fullName}</ThemedText>
        <ThemedText style={styles.caption}>{session?.user.correo}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionCard}>
        <ThemedText type="subtitle">Menu completo</ThemedText>
        <View style={styles.grid}>
          {modules.map((module) => (
            <View key={module} style={styles.moduleChip}>
              <ThemedText>{module}</ThemedText>
            </View>
          ))}
        </View>
      </ThemedView>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <ThemedText style={styles.logoutText}>Cerrar sesion</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DFE5F0",
    gap: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  caption: {
    fontSize: 13,
    opacity: 0.7,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DFE5F0",
    gap: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moduleChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD6EA",
    backgroundColor: "#F5F8FF",
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
