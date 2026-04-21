import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/providers/auth-provider";
import { API_ENDPOINTS, getJson } from "@/services/api-client";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ??
  "https://taller-itla.ia3x.com";

function resolveImg(raw?: string) {
  if (!raw) return undefined;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${API_BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

function formatPrice(price: number | string | undefined): string {
  if (price == null || price === "") return "N/D";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return String(price);
  return num.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  });
}

type VehicleSummary = {
  id: number;
  marca: string;
  modelo: string;
  anio: number | string;
  precio?: number | string;
  descripcionCorta?: string;
  descripcion?: string;
  imagenUrl?: string;
  imagen?: string;
  foto_url?: string;
};

type Filters = {
  marca: string;
  modelo: string;
  anio: string;
  precioMin: string;
  precioMax: string;
};

const EMPTY_FILTERS: Filters = {
  marca: "",
  modelo: "",
  anio: "",
  precioMin: "",
  precioMax: "",
};

function buildEndpoint(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.marca.trim()) params.set("marca", filters.marca.trim());
  if (filters.modelo.trim()) params.set("modelo", filters.modelo.trim());
  if (filters.anio.trim()) params.set("anio", filters.anio.trim());
  if (filters.precioMin.trim())
    params.set("precioMin", filters.precioMin.trim());
  if (filters.precioMax.trim())
    params.set("precioMax", filters.precioMax.trim());
  const qs = params.toString();
  return qs ? `${API_ENDPOINTS.catalogo}?${qs}` : API_ENDPOINTS.catalogo;
}

export default function CatalogoScreen() {
  const { session } = useAuth();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [items, setItems] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(
    async (f: Filters) => {
      if (!session?.token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getJson<VehicleSummary[]>(buildEndpoint(f), {
          token: session.token,
        });
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Error al cargar el catálogo.",
        );
      } finally {
        setLoading(false);
      }
    },
    [session?.token],
  );

  useFocusEffect(
    useCallback(() => {
      void load(applied);
    }, [load, applied]),
  );

  const handleSearch = () => {
    setApplied(filters);
    void load(filters);
  };

  const handleClear = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    void load(EMPTY_FILTERS);
  };

  const hasFilters = Object.values(applied).some((v) => v !== "");

  function VehicleCard({ item }: { item: VehicleSummary }) {
    const imgUri = resolveImg(item.imagenUrl ?? item.imagen ?? item.foto_url);
    const [imgFailed, setImgFailed] = useState(false);
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/catalogo/detalle",
            params: { id: String(item.id) },
          })
        }
      >
        <View style={styles.cardImageWrapper}>
          {imgUri && !imgFailed ? (
            <Image
              source={{ uri: imgUri }}
              style={styles.cardImage}
              contentFit="cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <View style={styles.cardImageFallback}>
              <MaterialIcons name="directions-car" size={40} color="#1E3A5F" />
            </View>
          )}
          <View style={styles.priceBadge}>
            <ThemedText style={styles.priceText}>
              {formatPrice(item.precio)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.cardBody}>
          <ThemedText style={styles.cardTitle} numberOfLines={1}>
            {item.marca} {item.modelo}
          </ThemedText>
          <ThemedText style={styles.cardYear}>Año {item.anio}</ThemedText>
          {(item.descripcionCorta ?? item.descripcion) ? (
            <ThemedText style={styles.cardDesc} numberOfLines={2}>
              {item.descripcionCorta ?? item.descripcion}
            </ThemedText>
          ) : null}
          <View style={styles.cardFooter}>
            <ThemedText style={styles.verMas}>Ver detalles</ThemedText>
            <MaterialIcons name="chevron-right" size={16} color="#FF7A1A" />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.root}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por marca o modelo..."
          placeholderTextColor="#666"
          value={filters.marca}
          onChangeText={(v) =>
            setFilters((f) => ({ ...f, marca: v, modelo: "" }))
          }
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Pressable onPress={() => setShowFilters((s) => !s)}>
          <MaterialIcons
            name="tune"
            size={20}
            color={showFilters ? "#FF7A1A" : "#888"}
          />
        </Pressable>
      </View>

      {/* Expanded filters */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterRow}>
            <View style={styles.filterField}>
              <ThemedText style={styles.filterLabel}>Año</ThemedText>
              <TextInput
                style={styles.filterInput}
                placeholder="2020"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={filters.anio}
                onChangeText={(v) => setFilters((f) => ({ ...f, anio: v }))}
              />
            </View>
            <View style={styles.filterField}>
              <ThemedText style={styles.filterLabel}>Precio mín.</ThemedText>
              <TextInput
                style={styles.filterInput}
                placeholder="0"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={filters.precioMin}
                onChangeText={(v) =>
                  setFilters((f) => ({ ...f, precioMin: v }))
                }
              />
            </View>
            <View style={styles.filterField}>
              <ThemedText style={styles.filterLabel}>Precio máx.</ThemedText>
              <TextInput
                style={styles.filterInput}
                placeholder="∞"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={filters.precioMax}
                onChangeText={(v) =>
                  setFilters((f) => ({ ...f, precioMax: v }))
                }
              />
            </View>
          </View>
          <View style={styles.filterActions}>
            {hasFilters && (
              <Pressable style={styles.clearBtn} onPress={handleClear}>
                <ThemedText style={styles.clearBtnText}>Limpiar</ThemedText>
              </Pressable>
            )}
            <Pressable style={styles.searchBtn} onPress={handleSearch}>
              <MaterialIcons name="search" size={16} color="#fff" />
              <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      {/* Active filters chips */}
      {hasFilters && !showFilters && (
        <View style={styles.chipsRow}>
          {Object.entries(applied)
            .filter(([, v]) => v !== "")
            .map(([k, v]) => (
              <View key={k} style={styles.chip}>
                <ThemedText style={styles.chipText}>
                  {k}: {v}
                </ThemedText>
              </View>
            ))}
          <Pressable onPress={handleClear}>
            <MaterialIcons name="close" size={16} color="#FF7A1A" />
          </Pressable>
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF7A1A" />
          <ThemedText style={styles.loadingText}>
            Cargando catálogo...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={40} color="#E74C3C" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryBtn} onPress={() => void load(applied)}>
            <ThemedText style={styles.retryText}>Reintentar</ThemedText>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="storefront" size={48} color="#1E3A5F" />
          <ThemedText style={styles.emptyText}>
            {hasFilters
              ? "No se encontraron vehículos con esos filtros."
              : "El catálogo no tiene vehículos disponibles por el momento."}
          </ThemedText>
          {hasFilters && (
            <Pressable style={styles.retryBtn} onPress={handleClear}>
              <ThemedText style={styles.retryText}>Ver todos</ThemedText>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          renderItem={({ item }) => <VehicleCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },

  /* Search */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#141414",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "web" ? 10 : 12,
  },
  searchInput: {
    flex: 1,
    color: "#F5F5F5",
    fontSize: 14,
    outlineStyle: "none",
  } as any,

  /* Filters panel */
  filtersPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#141414",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    padding: 14,
    gap: 12,
  },
  filterRow: { flexDirection: "row", gap: 10 },
  filterField: { flex: 1, gap: 4 },
  filterLabel: { fontSize: 11, color: "#888", fontWeight: "600" },
  filterInput: {
    backgroundColor: "#0D0D0D",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    color: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    outlineStyle: "none",
  } as any,
  filterActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF7A1A",
  },
  clearBtnText: { color: "#FF7A1A", fontWeight: "700", fontSize: 13 },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FF7A1A",
  },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  /* Chips */
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: "#1E3A5F",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontSize: 11, color: "#F5F5F5" },

  /* List */
  list: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "web" ? 100 : 120,
    paddingTop: 4,
  },

  /* Card */
  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    overflow: "hidden",
  },
  cardPressed: { opacity: 0.8 },
  cardImageWrapper: { position: "relative" },
  cardImage: { width: "100%", height: 200 },
  cardImageFallback: {
    width: "100%",
    height: 200,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },
  priceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF7A1AEE",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  priceText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  cardBody: { padding: 14, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#F5F5F5" },
  cardYear: { fontSize: 12, color: "#FF7A1A", fontWeight: "600" },
  cardDesc: { fontSize: 13, color: "#AAA", lineHeight: 18, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  verMas: { fontSize: 13, color: "#FF7A1A", fontWeight: "600", flex: 1 },

  /* States */
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  loadingText: { color: "#888", fontSize: 14 },
  errorText: { color: "#E74C3C", fontSize: 14, textAlign: "center" },
  emptyText: { color: "#888", fontSize: 14, textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FF7A1A",
  },
  retryText: { color: "#fff", fontWeight: "700" },
});
