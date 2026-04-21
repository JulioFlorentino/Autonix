import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as WebBrowser from "expo-web-browser";
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

type Video = {
  id: number;
  youtubeId: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  url: string;
  thumbnail: string;
};

/** Web: embed YouTube iframe inline */
function YoutubeEmbed({
  youtubeId,
  title,
}: {
  youtubeId: string;
  title: string;
}) {
  if (Platform.OS !== "web") return null;
  return (
    <View style={styles.embedWrapper}>
      {/* @ts-ignore – iframe is web-only */}
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          width: "100%",
          aspectRatio: "16/9",
          border: "none",
          borderRadius: 12,
          backgroundColor: "#000",
        }}
      />
    </View>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Mantenimiento: "#FF7A1A",
  Motor: "#E74C3C",
  Frenos: "#E74C3C",
  Combustible: "#27AE60",
  Seguridad: "#3A9BD5",
  General: "#9B59B6",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#8A8A8A";
}

export default function VideosScreen() {
  const { session } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null); // youtubeId on web

  useEffect(() => {
    if (!session?.token) return;
    const load = async () => {
      try {
        const data = await getJson<Video[]>(API_ENDPOINTS.videos, {
          token: session.token,
        });
        setVideos(Array.isArray(data) ? data : []);
      } catch (e) {
        Alert.alert(
          "Videos",
          e instanceof Error ? e.message : "Error al cargar videos.",
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [session?.token]);

  const openVideo = async (video: Video) => {
    if (Platform.OS === "web") {
      // Toggle inline embed
      setPlaying((prev) => (prev === video.youtubeId ? null : video.youtubeId));
      return;
    }
    // Native: open YouTube app or browser
    await WebBrowser.openBrowserAsync(video.url, {
      toolbarColor: "#141414",
      controlsColor: "#FF7A1A",
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF7A1A" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.flex}
      contentContainerStyle={[
        styles.list,
        { paddingBottom: Platform.OS === "web" ? 100 : 110 },
      ]}
      data={videos}
      keyExtractor={(v) => String(v.id)}
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Videos Educativos</ThemedText>
          <ThemedText style={styles.headerSub}>
            Aprende sobre mantenimiento y cuidado vehicular
          </ThemedText>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <ThemedText style={styles.emptyText}>
            No hay videos disponibles.
          </ThemedText>
        </View>
      }
      renderItem={({ item, index }) => {
        const isPlaying = playing === item.youtubeId;
        const accentColor = categoryColor(item.categoria);
        const isFeatured = index === 0;

        return (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              isFeatured && styles.cardFeatured,
              pressed && styles.cardPressed,
            ]}
            onPress={() => void openVideo(item)}
          >
            {/* Thumbnail / player */}
            {isPlaying && Platform.OS === "web" ? (
              <YoutubeEmbed youtubeId={item.youtubeId} title={item.titulo} />
            ) : (
              <View
                style={isFeatured ? styles.thumbFeatured : styles.thumbWrapper}
              >
                <Image
                  source={{ uri: item.thumbnail }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                {/* Dark overlay */}
                <View style={styles.thumbOverlay} />
                {/* Play button */}
                <View style={styles.playCircle}>
                  <MaterialIcons
                    name="play-arrow"
                    size={isFeatured ? 40 : 32}
                    color="#FFFFFF"
                  />
                </View>
                {/* Duration badge placeholder */}
                <View style={styles.ytBadge}>
                  <MaterialIcons
                    name="smart-display"
                    size={12}
                    color="#FF0000"
                  />
                  <ThemedText style={styles.ytBadgeText}>YouTube</ThemedText>
                </View>
              </View>
            )}

            {/* Info */}
            <View style={styles.cardBody}>
              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: `${accentColor}22`,
                      borderColor: `${accentColor}55`,
                    },
                  ]}
                >
                  <ThemedText
                    style={[styles.categoryText, { color: accentColor }]}
                  >
                    {item.categoria}
                  </ThemedText>
                </View>
                {isPlaying && (
                  <ThemedText style={styles.playingLabel}>
                    ▶ Reproduciendo
                  </ThemedText>
                )}
              </View>
              <ThemedText
                style={[styles.titulo, isFeatured && styles.tituloFeatured]}
                numberOfLines={2}
              >
                {item.titulo}
              </ThemedText>
              {item.descripcion ? (
                <ThemedText
                  style={styles.descripcion}
                  numberOfLines={isFeatured ? 3 : 2}
                >
                  {item.descripcion}
                </ThemedText>
              ) : null}
              <View style={styles.actionRow}>
                <MaterialIcons
                  name="play-circle-outline"
                  size={16}
                  color="#FF7A1A"
                />
                <ThemedText style={styles.watchText}>
                  {Platform.OS === "web"
                    ? isPlaying
                      ? "Cerrar video"
                      : "Reproducir"
                    : "Ver en YouTube"}
                </ThemedText>
              </View>
            </View>
          </Pressable>
        );
      }}
    />
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
  header: { marginBottom: 4, gap: 4 },
  headerTitle: { color: "#F5F5F5", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "#8A8A8A", fontSize: 13 },

  card: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    overflow: "hidden",
  },
  cardFeatured: { borderColor: "#FF7A1A44" },
  cardPressed: { opacity: 0.82 },

  // Thumbnails
  thumbWrapper: {
    width: "100%",
    height: 180,
    backgroundColor: "#000",
  },
  thumbFeatured: {
    width: "100%",
    height: 220,
    backgroundColor: "#000",
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playCircle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  ytBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ytBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },

  // Embed
  embedWrapper: {
    width: "100%",
    backgroundColor: "#000",
    borderRadius: 0,
    overflow: "hidden",
  },

  // Card body
  cardBody: { padding: 14, gap: 8 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  categoryText: { fontSize: 10, fontWeight: "700" },
  playingLabel: { color: "#FF7A1A", fontSize: 11, fontWeight: "700" },
  titulo: {
    color: "#F5F5F5",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  tituloFeatured: { fontSize: 17, lineHeight: 24 },
  descripcion: { color: "#8A8A8A", fontSize: 12, lineHeight: 17 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  watchText: { color: "#FF7A1A", fontSize: 12, fontWeight: "700" },
});
