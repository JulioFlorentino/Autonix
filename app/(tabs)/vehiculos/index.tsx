import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
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

export type Vehiculo = {
  id: number;
  placa: string;
  chasis: string;
  marca: string;
  modelo: string;
  anio: number;
  cantidad_ruedas: number;
  foto_url?: string;
};

type VehiculoListResponse = Vehiculo[];

const PAGE_LIMIT = 10;

export default function VehiculosScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;

  const [items, setItems] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVehiculos = useCallback(
    async (
      nextPage: number,
      marcaQ: string,
      modeloQ: string,
      append: boolean,
    ) => {
      if (!session?.token) return;

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PAGE_LIMIT),
      });
      if (marcaQ.trim()) params.set("marca", marcaQ.trim());
      if (modeloQ.trim()) params.set("modelo", modeloQ.trim());

      const endpoint = `${API_ENDPOINTS.vehiculos}?${params.toString()}`;

      try {
        const data = await getJson<VehiculoListResponse>(endpoint, {
          token: session.token,
        });
        const newItems = Array.isArray(data) ? data : [];
        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setHasMore(newItems.length === PAGE_LIMIT);
        setPage(nextPage);
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Error al cargar vehiculos.";
        Alert.alert("Vehiculos", msg);
      }
    },
    [session?.token],
  );

  const reload = useCallback(
    (marcaQ: string, modeloQ: string) => {
      setLoading(true);
      setItems([]);
      fetchVehiculos(1, marcaQ, modeloQ, false).finally(() =>
        setLoading(false),
      );
    },
    [fetchVehiculos],
  );

  useFocusEffect(
    useCallback(() => {
      reload(marca, modelo);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload]),
  );

  const onSearchChange = (field: "marca" | "modelo", value: string) => {
    if (field === "marca") setMarca(value);
    else setModelo(value);

    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const m = field === "marca" ? value : marca;
      const mo = field === "modelo" ? value : modelo;
      reload(m, mo);
    }, 500);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    fetchVehiculos(page + 1, marca, modelo, true).finally(() =>
      setLoadingMore(false),
    );
  };

  const renderItem = ({ item }: { item: Vehiculo }) => {
    const uri = resolveImageUrl(item.foto_url);
    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/vehiculos/detalle",
            params: { id: String(item.id) },
          })
        }
      >
        {uri ? (
          <Image source={{ uri }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailFallback} />
        )}
        <View style={styles.cardInfo}>
          <ThemedText type="defaultSemiBold">
            {item.marca} {item.modelo}
          </ThemedText>
          <ThemedText style={styles.secondary}>
            {item.placa} · {item.anio}
          </ThemedText>
          <ThemedText style={styles.secondary}>
            {item.cantidad_ruedas} ruedas
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
          placeholder="Buscar por marca"
          placeholderTextColor={Colors[colorScheme ?? "light"].icon}
          value={marca}
          onChangeText={(v) => onSearchChange("marca", v)}
        />
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? "light"].text }]}
          placeholder="Buscar por modelo"
          placeholderTextColor={Colors[colorScheme ?? "light"].icon}
          value={modelo}
          onChangeText={(v) => onSearchChange("modelo", v)}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.center} size="large" color={tint} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={
            items.length === 0 ? styles.emptyContainer : styles.listContent
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              No se encontraron vehiculos.
            </ThemedText>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={tint} style={styles.footerLoader} />
            ) : null
          }
        />
      )}

      <Pressable
        style={[styles.fab, { backgroundColor: tint }]}
        onPress={() => router.push("/(tabs)/vehiculos/registrar")}
      >
        <ThemedText style={styles.fabText}>+ Registrar</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#1A1A1A",
  },
  center: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 80,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  thumbnailFallback: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#1E3A5F",
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  secondary: {
    opacity: 0.7,
    fontSize: 13,
  },
  footerLoader: {
    marginVertical: 12,
  },
  fab: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 96 : 108,
    right: 20,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
