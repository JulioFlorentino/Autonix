import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/providers/auth-provider";
import { API_ENDPOINTS, getJson } from "@/services/api-client";

type Noticia = {
  id: number;
  titulo: string;
  resumen: string;
  imagenUrl: string;
  fecha: string;
  fuente: string;
  link: string;
};

function formatDate(str: string): string {
  try {
    return new Date(str).toLocaleDateString("es-DO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return str;
  }
}

export default function NoticiasScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) return;
    const load = async () => {
      try {
        const data = await getJson<Noticia[]>(API_ENDPOINTS.noticias, {
          token: session.token,
        });
        setNoticias(Array.isArray(data) ? data : []);
      } catch (e) {
        Alert.alert(
          "Noticias",
          e instanceof Error ? e.message : "Error al cargar noticias.",
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [session?.token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF7A1A" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={noticias}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 100 : 110 },
        ]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ThemedText style={styles.headerTitle}>
              Noticias Automotrices
            </ThemedText>
            <ThemedText style={styles.headerSub}>
              Ultimas novedades del mundo vehicular dominicano
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <ThemedText style={styles.emptyText}>
              No hay noticias disponibles.
            </ThemedText>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              index === 0 && styles.cardFeatured,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/noticias-detalle",
                params: { id: String(item.id) },
              })
            }
          >
            {item.imagenUrl ? (
              <Image
                source={{ uri: item.imagenUrl }}
                style={index === 0 ? styles.imageFeatured : styles.image}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  index === 0 ? styles.imageFeatured : styles.image,
                  styles.imageFallback,
                ]}
              />
            )}
            <View style={styles.cardBody}>
              <View style={styles.metaRow}>
                <View style={styles.fuenteBadge}>
                  <ThemedText style={styles.fuenteText}>
                    {item.fuente}
                  </ThemedText>
                </View>
                <ThemedText style={styles.fecha}>
                  {formatDate(item.fecha)}
                </ThemedText>
              </View>
              <ThemedText
                style={[styles.titulo, index === 0 && styles.tituloFeatured]}
                numberOfLines={3}
              >
                {item.titulo}
              </ThemedText>
              {item.resumen ? (
                <ThemedText style={styles.resumen} numberOfLines={2}>
                  {item.resumen}
                </ThemedText>
              ) : null}
              <ThemedText style={styles.leerMas}>Leer mas →</ThemedText>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0D0D0D" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: { color: "#8A8A8A", fontSize: 15 },
  list: { padding: 16, gap: 12 },
  listHeader: { marginBottom: 4, gap: 4 },
  headerTitle: {
    color: "#F5F5F5",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSub: { color: "#8A8A8A", fontSize: 13 },

  // Cards
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    overflow: "hidden",
  },
  cardFeatured: {
    borderColor: "#FF7A1A44",
  },
  cardPressed: { opacity: 0.8 },
  image: {
    width: "100%",
    height: 150,
    backgroundColor: "#1E3A5F",
  },
  imageFeatured: {
    width: "100%",
    height: 210,
    backgroundColor: "#1E3A5F",
  },
  imageFallback: { backgroundColor: "#1E3A5F" },
  cardBody: { padding: 14, gap: 8 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  fuenteBadge: {
    backgroundColor: "#FF7A1A22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#FF7A1A44",
  },
  fuenteText: { color: "#FF7A1A", fontSize: 10, fontWeight: "700" },
  fecha: { color: "#8A8A8A", fontSize: 11 },
  titulo: {
    color: "#F5F5F5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  tituloFeatured: { fontSize: 17, lineHeight: 24 },
  resumen: { color: "#8A8A8A", fontSize: 12, lineHeight: 17 },
  leerMas: { color: "#FF7A1A", fontSize: 12, fontWeight: "700" },
});
