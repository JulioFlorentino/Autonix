import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/providers/auth-provider";
import { API_ENDPOINTS, getJson } from "@/services/api-client";

const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ??
  "https://taller-itla.ia3x.com";

function resolveImageUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return undefined;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))
    return rawUrl;
  return `${API_ORIGIN}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

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

type Tema = {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  vehiculo: string;
  vehiculoFoto: string;
  autor: string;
  totalRespuestas: number;
  ultimaRespuesta?: string | null;
};

const PAGE_LIMIT = 12;

export default function ForoIndexScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"todos" | "mis-temas">("todos");

  // Todos state
  const [todosItems, setTodosItems] = useState<Tema[]>([]);
  const [todosPage, setTodosPage] = useState(1);
  const [todosHasMore, setTodosHasMore] = useState(true);
  const [todosLoading, setTodosLoading] = useState(true);

  // Mis Temas state
  const [misItems, setMisItems] = useState<Tema[]>([]);
  const [misPage, setMisPage] = useState(1);
  const [misHasMore, setMisHasMore] = useState(true);
  const [misLoading, setMisLoading] = useState(true);

  const fetchTodos = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!session?.token) return;
      if (nextPage === 1 && !append) setTodosLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(PAGE_LIMIT),
        });
        const data = await getJson<Tema[]>(
          `${API_ENDPOINTS.foroTemas}?${params.toString()}`,
          { token: session.token },
        );
        const list = Array.isArray(data) ? data : [];
        setTodosItems(append ? (prev) => [...prev, ...list] : list);
        setTodosPage(nextPage);
        setTodosHasMore(list.length === PAGE_LIMIT);
      } catch (e) {
        Alert.alert(
          "Foro",
          e instanceof Error ? e.message : "Error al cargar temas.",
        );
      } finally {
        setTodosLoading(false);
      }
    },
    [session?.token],
  );

  const fetchMis = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!session?.token) return;
      if (nextPage === 1 && !append) setMisLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(PAGE_LIMIT),
        });
        const data = await getJson<Tema[]>(
          `${API_ENDPOINTS.foroMisTemas}?${params.toString()}`,
          { token: session.token },
        );
        const list = Array.isArray(data) ? data : [];
        setMisItems(append ? (prev) => [...prev, ...list] : list);
        setMisPage(nextPage);
        setMisHasMore(list.length === PAGE_LIMIT);
      } catch (e) {
        Alert.alert(
          "Foro",
          e instanceof Error ? e.message : "Error al cargar mis temas.",
        );
      } finally {
        setMisLoading(false);
      }
    },
    [session?.token],
  );

  useFocusEffect(
    useCallback(() => {
      void fetchTodos(1, false);
      void fetchMis(1, false);
    }, [fetchTodos, fetchMis]),
  );

  const renderTema = ({ item }: { item: Tema }) => {
    const fotoUri = resolveImageUrl(item.vehiculoFoto);
    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/foro/detalle",
            params: { id: String(item.id) },
          })
        }
      >
        <View style={styles.cardRow}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.vehiculoThumb} />
          ) : (
            <View style={[styles.vehiculoThumb, styles.thumbFallback]} />
          )}
          <View style={styles.cardContent}>
            <ThemedText
              type="defaultSemiBold"
              numberOfLines={2}
              style={styles.titulo}
            >
              {item.titulo}
            </ThemedText>
            <ThemedText style={styles.vehiculoText}>{item.vehiculo}</ThemedText>
            <ThemedText style={styles.autorText}>
              {item.autor} · {formatDate(item.fecha)}
            </ThemedText>
          </View>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeNumber}>
              {item.totalRespuestas}
            </ThemedText>
            <ThemedText style={styles.badgeLabel}>resp.</ThemedText>
          </View>
        </View>
        {activeTab === "mis-temas" && item.ultimaRespuesta && (
          <ThemedText style={styles.ultimaRespuesta}>
            Última actividad: {formatDate(item.ultimaRespuesta)}
          </ThemedText>
        )}
      </Pressable>
    );
  };

  const isLoading = activeTab === "todos" ? todosLoading : misLoading;
  const items = activeTab === "todos" ? todosItems : misItems;
  const hasMore = activeTab === "todos" ? todosHasMore : misHasMore;
  const currentPage = activeTab === "todos" ? todosPage : misPage;

  return (
    <ThemedView style={styles.flex}>
      {/* Tab toggle */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, activeTab === "todos" && styles.tabActive]}
          onPress={() => setActiveTab("todos")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "todos" && styles.tabTextActive,
            ]}
          >
            Todos los temas
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === "mis-temas" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("mis-temas")}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "mis-temas" && styles.tabTextActive,
            ]}
          >
            Mis Temas
          </ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF7A1A" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={styles.emptyText}>
            {activeTab === "todos"
              ? "No hay temas en el foro aún."
              : "No has creado ningún tema aún."}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTema}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (!hasMore) return;
            if (activeTab === "todos") void fetchTodos(currentPage + 1, true);
            else void fetchMis(currentPage + 1, true);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator color="#FF7A1A" style={styles.footerLoader} />
            ) : null
          }
        />
      )}

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push("/(tabs)/foro/crear")}
      >
        <ThemedText style={styles.fabText}>+</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0D0D0D" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#8A8A8A", fontSize: 15 },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#FF7A1A" },
  tabText: { color: "#8A8A8A", fontWeight: "600", fontSize: 13 },
  tabTextActive: { color: "#0D0D0D" },
  list: { paddingHorizontal: 16, paddingBottom: 110, gap: 10 },
  card: {
    backgroundColor: "#141414",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  vehiculoThumb: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: "#1E3A5F",
  },
  thumbFallback: { backgroundColor: "#1E3A5F" },
  cardContent: { flex: 1, gap: 4 },
  titulo: { color: "#F5F5F5", fontSize: 14, lineHeight: 20 },
  vehiculoText: { color: "#FF7A1A", fontSize: 12 },
  autorText: { color: "#8A8A8A", fontSize: 11 },
  badge: { alignItems: "center", minWidth: 38 },
  badgeNumber: {
    color: "#FF7A1A",
    fontWeight: "700",
    fontSize: 20,
    lineHeight: 24,
  },
  badgeLabel: { color: "#8A8A8A", fontSize: 10 },
  ultimaRespuesta: {
    color: "#8A8A8A",
    fontSize: 11,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1E3A5F",
  },
  footerLoader: { paddingVertical: 16 },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF7A1A",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#FF7A1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabText: {
    color: "#0D0D0D",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
  },
});
