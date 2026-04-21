import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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

type Especificacion = { etiqueta: string; valor: string };

type VehicleDetail = {
  id: number;
  marca: string;
  modelo: string;
  anio: number | string;
  precio?: number | string;
  descripcion?: string;
  imagenUrl?: string;
  imagen?: string;
  foto_url?: string;
  imagenes?: string[];
  fotos?: string[];
  especificaciones?:
    | Record<string, string>
    | Array<{ etiqueta: string; valor: string }>;
  specs?: Record<string, string>;
  link?: string;
  url?: string;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

function SpecRow({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.specRow}>
      <ThemedText style={styles.specLabel}>{label}</ThemedText>
      <ThemedText style={styles.specValue}>{valor}</ThemedText>
    </View>
  );
}

export default function CatalogoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const navigation = useNavigation();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryRef = useRef<ScrollView>(null);
  const [galleryWidth, setGalleryWidth] = useState(SCREEN_WIDTH);

  useEffect(() => {
    if (!id || !session?.token) return;
    setLoading(true);
    setError(null);
    getJson<VehicleDetail>(`${API_ENDPOINTS.catalogoDetalle}?id=${id}`, {
      token: session.token,
    })
      .then((data) => {
        setVehicle(data);
        navigation.setOptions({
          title: `${data.marca} ${data.modelo}`,
        });
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Error al cargar el vehículo.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id, session?.token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF7A1A" />
        <ThemedText style={styles.loadingText}>Cargando vehículo...</ThemedText>
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
        <ThemedText style={styles.errorText}>
          {error ?? "Vehículo no encontrado."}
        </ThemedText>
      </View>
    );
  }

  // Normalise images
  const rawImages: string[] = [
    ...(vehicle.imagenes ?? []),
    ...(vehicle.fotos ?? []),
  ];
  if (vehicle.imagenUrl) rawImages.unshift(vehicle.imagenUrl);
  else if (vehicle.imagen) rawImages.unshift(vehicle.imagen);
  else if (vehicle.foto_url) rawImages.unshift(vehicle.foto_url);

  const images = [...new Set(rawImages)]
    .map(resolveImg)
    .filter(Boolean) as string[];

  // Normalise specs — API returns object or array
  const specRows: Especificacion[] = [];
  if (vehicle.especificaciones) {
    if (Array.isArray(vehicle.especificaciones)) {
      specRows.push(...vehicle.especificaciones);
    } else {
      Object.entries(vehicle.especificaciones).forEach(([k, v]) =>
        specRows.push({ etiqueta: k, valor: String(v) }),
      );
    }
  } else if (vehicle.specs) {
    Object.entries(vehicle.specs).forEach(([k, v]) =>
      specRows.push({ etiqueta: k, valor: v }),
    );
  }

  const externalLink = vehicle.link ?? vehicle.url;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Platform.OS === "web" ? 100 : 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Gallery ── */}
      {images.length > 0 ? (
        <View
          style={styles.galleryWrapper}
          onLayout={(e) => setGalleryWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView
            ref={galleryRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / galleryWidth,
              );
              setGalleryIndex(idx);
            }}
          >
            {images.map((uri, i) => (
              <Image
                key={`${uri}-${i}`}
                source={{ uri }}
                style={[styles.galleryImage, { width: galleryWidth }]}
                contentFit="cover"
              />
            ))}
          </ScrollView>

          {/* Dots */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <Pressable
                  key={i}
                  style={[styles.dot, i === galleryIndex && styles.dotActive]}
                  onPress={() => {
                    galleryRef.current?.scrollTo({
                      x: i * galleryWidth,
                      animated: true,
                    });
                    setGalleryIndex(i);
                  }}
                />
              ))}
            </View>
          )}

          {/* Counter badge */}
          <View style={styles.counterBadge}>
            <ThemedText style={styles.counterText}>
              {galleryIndex + 1}/{images.length}
            </ThemedText>
          </View>
        </View>
      ) : (
        <View style={styles.noImage}>
          <MaterialIcons name="directions-car" size={56} color="#1E3A5F" />
        </View>
      )}

      {/* ── Header info ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.title}>
            {vehicle.marca} {vehicle.modelo}
          </ThemedText>
          <View style={styles.yearRow}>
            <MaterialIcons name="calendar-today" size={14} color="#FF7A1A" />
            <ThemedText style={styles.year}>Año {vehicle.anio}</ThemedText>
          </View>
        </View>
        <View style={styles.priceBadge}>
          <ThemedText style={styles.priceLabel}>Precio</ThemedText>
          <ThemedText style={styles.priceValue}>
            {formatPrice(vehicle.precio)}
          </ThemedText>
        </View>
      </View>

      {/* ── Description ── */}
      {vehicle.descripcion ? (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Descripción</ThemedText>
          <ThemedText style={styles.description}>
            {vehicle.descripcion}
          </ThemedText>
        </View>
      ) : null}

      {/* ── Specifications ── */}
      {specRows.length > 0 ? (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Especificaciones técnicas
          </ThemedText>
          <View style={styles.specsTable}>
            {specRows.map((row, i) => (
              <SpecRow key={i} label={row.etiqueta} valor={row.valor} />
            ))}
          </View>
        </View>
      ) : null}

      {/* ── External link ── */}
      {externalLink ? (
        <Pressable
          style={styles.externalBtn}
          onPress={() => void WebBrowser.openBrowserAsync(externalLink)}
        >
          <MaterialIcons name="open-in-new" size={18} color="#fff" />
          <ThemedText style={styles.externalBtnText}>
            Ver en sitio oficial
          </ThemedText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D0D0D" },
  content: { gap: 0 },

  /* Gallery */
  galleryWrapper: { position: "relative", height: 280 },
  galleryImage: { height: 280 },
  noImage: {
    height: 200,
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
  },
  dotsRow: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: { backgroundColor: "#FF7A1A", width: 18 },
  counterBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  counterText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 12,
    gap: 12,
  },
  headerLeft: { flex: 1, gap: 4 },
  title: { fontSize: 22, fontWeight: "700", color: "#F5F5F5" },
  yearRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  year: { fontSize: 13, color: "#FF7A1A", fontWeight: "600" },
  priceBadge: {
    backgroundColor: "#FF7A1A22",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FF7A1A55",
    padding: 12,
    alignItems: "center",
    minWidth: 90,
  },
  priceLabel: {
    fontSize: 10,
    color: "#FF7A1A",
    fontWeight: "600",
    opacity: 0.8,
  },
  priceValue: { fontSize: 16, color: "#FF7A1A", fontWeight: "800" },

  /* Sections */
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5F5F5",
    borderLeftWidth: 3,
    borderLeftColor: "#FF7A1A",
    paddingLeft: 10,
  },
  description: { fontSize: 14, color: "#CCC", lineHeight: 22 },

  /* Specs */
  specsTable: {
    backgroundColor: "#141414",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    overflow: "hidden",
  },
  specRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E3A5F",
    gap: 12,
  },
  specLabel: {
    flex: 1,
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
  },
  specValue: {
    flex: 1.5,
    fontSize: 13,
    color: "#F5F5F5",
    textAlign: "right",
  },

  /* External btn */
  externalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1E3A5F",
  },
  externalBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  /* States */
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
    backgroundColor: "#0D0D0D",
  },
  loadingText: { color: "#888", fontSize: 14 },
  errorText: { color: "#E74C3C", fontSize: 14, textAlign: "center" },
});
