import { useLocalSearchParams, useNavigation } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/providers/auth-provider";
import { API_ENDPOINTS, getJson } from "@/services/api-client";

type NoticiaDetalle = {
  id: number;
  titulo: string;
  resumen: string;
  contenido: string;
  imagenUrl: string;
  fecha: string;
  fuente: string;
  link: string;
};

function formatDate(str: string): string {
  try {
    return new Date(str).toLocaleDateString("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return str;
  }
}

/** Strip HTML tags and decode common entities */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Web-only: renders HTML inside an iframe sandboxed via srcdoc */
function HtmlFrame({ html, title }: { html: string; title: string }) {
  if (Platform.OS !== "web") return null;

  const styled = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 15px;
            line-height: 1.7;
            color: #F5F5F5;
            background: #0D0D0D;
            padding: 0 4px 32px;
          }
          img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
          h1,h2,h3 { color: #FF7A1A; margin: 18px 0 8px; }
          a { color: #FF7A1A; }
          p { margin: 10px 0; }
          blockquote { border-left: 3px solid #FF7A1A; padding-left: 12px; color: #aaa; margin: 12px 0; }
        </style>
        <title>${title.replace(/</g, "&lt;")}</title>
      </head>
      <body>${html}</body>
    </html>
  `;

  // React Native Web renders <iframe> via the native DOM element
  return (
    <View style={styles.iframeWrapper}>
      {/* @ts-ignore – iframe only exists on web */}
      <iframe
        srcDoc={styled}
        style={{
          width: "100%",
          flex: 1,
          border: "none",
          minHeight: 600,
          backgroundColor: "#0D0D0D",
        }}
        sandbox="allow-same-origin"
        title={title}
      />
    </View>
  );
}

export default function NoticiaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const navigation = useNavigation();

  const [noticia, setNoticia] = useState<NoticiaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!id || !session?.token) return;
    const load = async () => {
      try {
        const data = await getJson<NoticiaDetalle>(
          `${API_ENDPOINTS.noticiasDetalle}?id=${id}`,
          { token: session.token },
        );
        setNoticia(data);
        if (data?.titulo) {
          navigation.setOptions({ title: data.titulo.slice(0, 40) });
        }
      } catch (e) {
        Alert.alert(
          "Noticia",
          e instanceof Error ? e.message : "Error al cargar la noticia.",
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, session?.token, navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF7A1A" />
      </View>
    );
  }

  if (!noticia) {
    return (
      <View style={styles.centered}>
        <ThemedText style={styles.errorText}>
          No se pudo cargar la noticia.
        </ThemedText>
      </View>
    );
  }

  const openExternal = async () => {
    if (!noticia.link) return;
    await WebBrowser.openBrowserAsync(noticia.link, {
      toolbarColor: "#141414",
      controlsColor: "#FF7A1A",
    });
  };

  return (
    <View style={styles.flex}>
      {Platform.OS === "web" ? (
        // ── Web: full HTML iframe ──
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.webContainer}
        >
          {noticia.imagenUrl && !imageFailed && (
            <Image
              source={{ uri: noticia.imagenUrl }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          )}
          <View style={styles.webMeta}>
            <View style={styles.fuenteBadge}>
              <ThemedText style={styles.fuenteText}>
                {noticia.fuente}
              </ThemedText>
            </View>
            <ThemedText style={styles.fecha}>
              {formatDate(noticia.fecha)}
            </ThemedText>
          </View>
          <ThemedText style={styles.titulo}>{noticia.titulo}</ThemedText>
          <HtmlFrame html={noticia.contenido} title={noticia.titulo} />
          <OpenButton onPress={() => void openExternal()} />
        </ScrollView>
      ) : (
        // ── Native: stripped text ──
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.nativeContainer}
        >
          {noticia.imagenUrl && !imageFailed && (
            <Image
              source={{ uri: noticia.imagenUrl }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          )}
          <View style={styles.metaRow}>
            <View style={styles.fuenteBadge}>
              <ThemedText style={styles.fuenteText}>
                {noticia.fuente}
              </ThemedText>
            </View>
            <ThemedText style={styles.fecha}>
              {formatDate(noticia.fecha)}
            </ThemedText>
          </View>
          <ThemedText style={styles.titulo}>{noticia.titulo}</ThemedText>
          {noticia.resumen ? (
            <ThemedText style={styles.resumen}>{noticia.resumen}</ThemedText>
          ) : null}
          <View style={styles.divider} />
          <ThemedText style={styles.contenido}>
            {stripHtml(noticia.contenido)}
          </ThemedText>
          <OpenButton onPress={() => void openExternal()} />
        </ScrollView>
      )}
    </View>
  );
}

function OpenButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.externalButton} onPress={onPress}>
      <ThemedText style={styles.externalButtonText}>
        Ver articulo completo en {"\u2197"}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0D0D0D" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#8A8A8A" },

  // Web
  webContainer: { paddingBottom: 40 },
  iframeWrapper: { minHeight: 500, marginHorizontal: 16 },
  webMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },

  // Native
  nativeContainer: { paddingBottom: 40 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },

  // Shared
  heroImage: { width: "100%", height: 230 },
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
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  resumen: {
    color: "#8A8A8A",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 16,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#1E3A5F",
    marginHorizontal: 16,
    marginVertical: 16,
  },
  contenido: {
    color: "#E0E0E0",
    fontSize: 15,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  externalButton: {
    marginHorizontal: 16,
    marginTop: 28,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF7A1A",
    paddingVertical: 14,
    alignItems: "center",
  },
  externalButtonText: {
    color: "#FF7A1A",
    fontWeight: "700",
    fontSize: 14,
  },
});
