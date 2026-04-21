import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/providers/auth-provider";
import { API_ENDPOINTS, getJson, postDatax } from "@/services/api-client";

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
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return str;
  }
}

type Respuesta = {
  id: number;
  contenido: string;
  fecha: string;
  autor: string;
};

type TemaDetalle = {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  vehiculo: string;
  vehiculoFoto: string;
  autor: string;
  respuestas: Respuesta[];
  totalRespuestas: number;
};

export default function DetalleForoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  const [tema, setTema] = useState<TemaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Respuesta>>(null);

  const load = useCallback(async () => {
    if (!id || !session?.token) return;
    try {
      const data = await getJson<TemaDetalle>(
        `${API_ENDPOINTS.foroDetalle}?id=${id}`,
        { token: session.token },
      );
      setTema(data);
    } catch (e) {
      Alert.alert(
        "Foro",
        e instanceof Error ? e.message : "Error al cargar el tema.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, session?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const sendReply = async () => {
    if (!respuesta.trim()) {
      Alert.alert("Validacion", "Escribe tu respuesta antes de enviar.");
      return;
    }
    if (!session?.token || !id) return;

    setSending(true);
    try {
      await postDatax(
        API_ENDPOINTS.foroResponder,
        { tema_id: Number(id), contenido: respuesta.trim() },
        { token: session.token },
      );
      setRespuesta("");
      await load();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Error al enviar respuesta.",
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF7A1A" />
      </View>
    );
  }

  if (!tema) {
    return (
      <View style={styles.centered}>
        <ThemedText style={styles.errorText}>
          No se pudo cargar el tema.
        </ThemedText>
      </View>
    );
  }

  const fotoUri = resolveImageUrl(tema.vehiculoFoto);

  const ListHeader = (
    <View>
      {fotoUri && !imageFailed ? (
        <Image
          source={{ uri: fotoUri }}
          style={styles.heroImage}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={styles.heroFallback} />
      )}

      <View style={styles.temaCard}>
        <ThemedText style={styles.vehiculoLabel}>{tema.vehiculo}</ThemedText>
        <ThemedText style={styles.titulo}>{tema.titulo}</ThemedText>
        <ThemedText style={styles.metaText}>
          {tema.autor} · {formatDate(tema.fecha)}
        </ThemedText>
        <View style={styles.divider} />
        <ThemedText style={styles.descripcion}>{tema.descripcion}</ThemedText>
      </View>

      <ThemedText style={styles.repliesHeader}>
        {tema.totalRespuestas}{" "}
        {tema.totalRespuestas === 1 ? "respuesta" : "respuestas"}
      </ThemedText>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={listRef}
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        data={tema.respuestas}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <ThemedText style={styles.noRepliesText}>
            Sé el primero en responder.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <View style={styles.respuestaCard}>
            <View style={styles.respuestaHeader}>
              <ThemedText style={styles.respuestaAutor}>
                {item.autor}
              </ThemedText>
              <ThemedText style={styles.respuestaFecha}>
                {formatDate(item.fecha)}
              </ThemedText>
            </View>
            <ThemedText style={styles.respuestaContenido}>
              {item.contenido}
            </ThemedText>
          </View>
        )}
      />

      {/* Reply bar */}
      <View style={styles.replyBar}>
        <TextInput
          style={styles.replyInput}
          placeholder="Escribe tu respuesta..."
          placeholderTextColor="#8A8A8A"
          value={respuesta}
          onChangeText={setRespuesta}
          multiline
          maxLength={1000}
        />
        <Pressable
          style={[styles.sendButton, sending && styles.sendDisabled]}
          onPress={() => void sendReply()}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#0D0D0D" size="small" />
          ) : (
            <ThemedText style={styles.sendText}>Enviar</ThemedText>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0D0D0D" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#8A8A8A" },
  heroImage: { width: "100%", height: 200 },
  heroFallback: { width: "100%", height: 100, backgroundColor: "#1E3A5F" },
  temaCard: {
    backgroundColor: "#141414",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    gap: 6,
  },
  vehiculoLabel: {
    color: "#FF7A1A",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  titulo: {
    color: "#F5F5F5",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
  },
  metaText: { color: "#8A8A8A", fontSize: 12 },
  divider: { height: 1, backgroundColor: "#1E3A5F", marginVertical: 4 },
  descripcion: { color: "#F5F5F5", fontSize: 14, lineHeight: 22 },
  repliesHeader: {
    color: "#8A8A8A",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 4,
  },
  listContent: { paddingBottom: 20 },
  noRepliesText: {
    color: "#8A8A8A",
    textAlign: "center",
    marginTop: 28,
    fontSize: 14,
  },
  respuestaCard: {
    backgroundColor: "#141414",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    gap: 8,
  },
  respuestaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  respuestaAutor: { color: "#FF7A1A", fontWeight: "600", fontSize: 13 },
  respuestaFecha: { color: "#8A8A8A", fontSize: 11 },
  respuestaContenido: { color: "#F5F5F5", fontSize: 14, lineHeight: 20 },
  replyBar: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    paddingBottom: 14,
    marginBottom: Platform.OS === "web" ? 80 : 88,
    backgroundColor: "#141414",
    borderTopWidth: 1,
    borderTopColor: "#1E3A5F",
    alignItems: "flex-end",
  },
  replyInput: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#1E3A5F",
    borderRadius: 10,
    padding: 10,
    color: "#F5F5F5",
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#FF7A1A",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 78,
  },
  sendDisabled: { opacity: 0.6 },
  sendText: { color: "#0D0D0D", fontWeight: "700", fontSize: 14 },
});
