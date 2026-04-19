import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
export default function NewsScreen() {
  const sampleNews = [
    "Tendencias en mantenimiento preventivo para 2026",
    "Que revisar antes de un viaje largo en carretera",
    "Comparativa de vehiculos eficientes para uso urbano",
    "Nuevas tecnologias de seguridad en el mercado automotriz",
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText type="title">Noticias Automotrices</ThemedText>
        <ThemedText style={styles.subtitle}>
          Esta seccion quedo preparada para conectar el endpoint de noticias del
          API.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Titulares recientes</ThemedText>
        <View style={styles.list}>
          {sampleNews.map((headline) => (
            <View key={headline} style={styles.item}>
              <ThemedText>{headline}</ThemedText>
            </View>
          ))}
        </View>
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
  list: {
    gap: 8,
  },
  item: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D7DFEE",
    backgroundColor: "#F7F9FD",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
