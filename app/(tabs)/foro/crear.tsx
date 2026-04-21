import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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

type Vehiculo = {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  foto_url?: string;
};

export default function CrearTemaScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session?.token) return;

    const load = async () => {
      try {
        const data = await getJson<Vehiculo[]>(API_ENDPOINTS.vehiculos, {
          token: session.token,
        });
        const list = Array.isArray(data) ? data : [];
        // Only vehicles with a photo (required by the API)
        setVehiculos(list.filter((v) => !!v.foto_url));
      } catch (e) {
        Alert.alert(
          "Vehiculos",
          e instanceof Error ? e.message : "Error al cargar vehiculos.",
        );
      } finally {
        setLoadingVehiculos(false);
      }
    };

    void load();
  }, [session?.token]);

  const submit = async () => {
    if (!selectedId) {
      Alert.alert("Validacion", "Selecciona un vehiculo.");
      return;
    }
    if (!titulo.trim()) {
      Alert.alert("Validacion", "El titulo es requerido.");
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert("Validacion", "La descripcion es requerida.");
      return;
    }
    if (!session?.token) return;

    setSubmitting(true);
    try {
      await postDatax(
        API_ENDPOINTS.foroCrear,
        {
          vehiculo_id: selectedId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
        },
        { token: session.token },
      );
      Alert.alert("Exito", "Tema publicado correctamente.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/foro") },
      ]);
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Error al crear el tema.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Vehicle selector */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Vehiculo asociado
        </ThemedText>
        <ThemedText style={styles.sectionHint}>
          Solo se muestran vehiculos con foto registrada.
        </ThemedText>

        {loadingVehiculos ? (
          <ActivityIndicator color="#FF7A1A" style={styles.loader} />
        ) : vehiculos.length === 0 ? (
          <ThemedView style={styles.emptyCard}>
            <ThemedText style={styles.emptyText}>
              No tienes vehiculos con foto registrados.{"\n"}
              Agrega una foto a un vehiculo para crear un tema.
            </ThemedText>
          </ThemedView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vehiculoList}
          >
            {vehiculos.map((item) => {
              const selected = item.id === selectedId;
              const fotoUri = resolveImageUrl(item.foto_url);
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.vehiculoCard,
                    selected && styles.vehiculoCardSelected,
                  ]}
                  onPress={() => setSelectedId(item.id)}
                >
                  {fotoUri ? (
                    <Image
                      source={{ uri: fotoUri }}
                      style={styles.vehiculoImage}
                    />
                  ) : (
                    <View
                      style={[styles.vehiculoImage, styles.imageFallback]}
                    />
                  )}
                  <ThemedText style={styles.vehiculoLabel} numberOfLines={1}>
                    {item.marca} {item.modelo}
                  </ThemedText>
                  <ThemedText style={styles.vehiculoAnio}>
                    {item.anio}
                  </ThemedText>
                  {selected && <View style={styles.selectedDot} />}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Title */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Titulo
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Ej: Ruido extraño al acelerar"
          placeholderTextColor="#8A8A8A"
          value={titulo}
          onChangeText={setTitulo}
          maxLength={120}
        />

        {/* Description */}
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Descripcion
        </ThemedText>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe el problema o consulta con detalle..."
          placeholderTextColor="#8A8A8A"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.replace("/(tabs)/foro")}
            disabled={submitting}
          >
            <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={() => void submit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#0D0D0D" />
            ) : (
              <ThemedText style={styles.submitText}>Publicar tema</ThemedText>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0D0D0D" },
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  loader: { marginVertical: 20 },
  sectionTitle: { color: "#F5F5F5", marginTop: 4 },
  sectionHint: { color: "#8A8A8A", fontSize: 12, marginTop: -6 },
  emptyCard: {
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  emptyText: { color: "#8A8A8A", textAlign: "center", lineHeight: 22 },
  vehiculoList: { gap: 12, paddingVertical: 4 },
  vehiculoCard: {
    width: 124,
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: "#1E3A5F",
    alignItems: "center",
    gap: 6,
  },
  vehiculoCardSelected: { borderColor: "#FF7A1A" },
  vehiculoImage: {
    width: 104,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#1E3A5F",
  },
  imageFallback: { backgroundColor: "#1E3A5F" },
  vehiculoLabel: {
    color: "#F5F5F5",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  vehiculoAnio: { color: "#8A8A8A", fontSize: 11 },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF7A1A",
  },
  input: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#1E3A5F",
    borderRadius: 10,
    padding: 12,
    color: "#F5F5F5",
    fontSize: 14,
  },
  textarea: { minHeight: 130, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    alignItems: "center",
  },
  cancelText: { color: "#8A8A8A", fontWeight: "600" },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#FF7A1A",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  submitText: { color: "#0D0D0D", fontWeight: "700", fontSize: 15 },
});
