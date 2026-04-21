import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/providers/auth-provider";
import { API_ENDPOINTS, postMultipart } from "@/services/api-client";

type FormState = {
  placa: string;
  chasis: string;
  marca: string;
  modelo: string;
  anio: string;
  cantidadRuedas: string;
};

const INITIAL_FORM: FormState = {
  placa: "",
  chasis: "",
  marca: "",
  modelo: "",
  anio: "",
  cantidadRuedas: "",
};

export default function RegistrarVehiculoScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;
  const textColor = Colors[colorScheme ?? "light"].text;
  const iconColor = Colors[colorScheme ?? "light"].icon;

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickPhoto = async (source: "camera" | "gallery") => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Permiso requerido",
            "Debes permitir acceso a la camara.",
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.85,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            "Permiso requerido",
            "Debes permitir acceso a la galeria.",
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.85,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "No se pudo abrir la camara.";
      Alert.alert("Foto", msg);
    }
  };

  const validate = (): string | null => {
    if (!form.placa.trim()) return "La placa es requerida.";
    if (!form.chasis.trim()) return "El chasis es requerido.";
    if (!form.marca.trim()) return "La marca es requerida.";
    if (!form.modelo.trim()) return "El modelo es requerido.";
    const anio = Number(form.anio);
    if (!form.anio.trim() || isNaN(anio) || anio < 1900 || anio > 2100)
      return "Ingresa un año valido.";
    const ruedas = Number(form.cantidadRuedas);
    if (!form.cantidadRuedas.trim() || isNaN(ruedas) || ruedas < 2)
      return "La cantidad de ruedas debe ser 2 o mas.";
    return null;
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert("Validacion", validationError);
      return;
    }

    if (!session?.token) {
      Alert.alert("Sesion", "No hay sesion activa.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        placa: form.placa.trim().toUpperCase(),
        chasis: form.chasis.trim().toUpperCase(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        anio: Number(form.anio),
        cantidadRuedas: Number(form.cantidadRuedas),
      };

      const formData = new FormData();
      formData.append("datax", JSON.stringify(payload));
      if (photo) {
        const fileName =
          photo.fileName ??
          `vehiculo-${Date.now()}.${photo.uri.toLowerCase().endsWith(".png") ? "png" : "jpg"}`;
        if (photo.file) {
          formData.append("foto", photo.file, fileName);
        } else {
          formData.append("foto", {
            uri: photo.uri,
            name: fileName,
            type: photo.mimeType ?? "image/jpeg",
          } as any);
        }
      }
      await postMultipart(API_ENDPOINTS.vehiculos, formData, {
        token: session.token,
      });

      Alert.alert("Exito", "Vehiculo registrado correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Error al registrar vehiculo.";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Foto del vehiculo</ThemedText>

        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <ThemedText style={styles.photoPlaceholderText}>
              Sin foto
            </ThemedText>
          </View>
        )}

        <View style={styles.photoRow}>
          <Pressable
            style={[styles.photoButton, { borderColor: tint }]}
            onPress={() => void pickPhoto("camera")}
          >
            <ThemedText style={[styles.photoButtonText, { color: tint }]}>
              Camara
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.photoButton, { borderColor: tint }]}
            onPress={() => void pickPhoto("gallery")}
          >
            <ThemedText style={[styles.photoButtonText, { color: tint }]}>
              Galeria
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Datos del vehiculo</ThemedText>

        <ThemedText style={styles.label}>Placa *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. ABC-1234"
          placeholderTextColor={iconColor}
          value={form.placa}
          onChangeText={(v) => setField("placa", v)}
          autoCapitalize="characters"
        />

        <ThemedText style={styles.label}>Chasis *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Numero de chasis"
          placeholderTextColor={iconColor}
          value={form.chasis}
          onChangeText={(v) => setField("chasis", v)}
          autoCapitalize="characters"
        />

        <ThemedText style={styles.label}>Marca *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. Toyota"
          placeholderTextColor={iconColor}
          value={form.marca}
          onChangeText={(v) => setField("marca", v)}
        />

        <ThemedText style={styles.label}>Modelo *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. Corolla"
          placeholderTextColor={iconColor}
          value={form.modelo}
          onChangeText={(v) => setField("modelo", v)}
        />

        <ThemedText style={styles.label}>Año *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. 2020"
          placeholderTextColor={iconColor}
          value={form.anio}
          onChangeText={(v) => setField("anio", v)}
          keyboardType="numeric"
          maxLength={4}
        />

        <ThemedText style={styles.label}>Cantidad de ruedas *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. 4"
          placeholderTextColor={iconColor}
          value={form.cantidadRuedas}
          onChangeText={(v) => setField("cantidadRuedas", v)}
          keyboardType="numeric"
          maxLength={2}
        />
      </ThemedView>

      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: tint },
          submitting && styles.submitDisabled,
        ]}
        onPress={() => void submit()}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.submitText}>Registrar Vehiculo</ThemedText>
        )}
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.replace("/(tabs)/vehiculos")}
        disabled={submitting}
      >
        <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  photoPlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    opacity: 0.6,
  },
  photoRow: {
    flexDirection: "row",
    gap: 10,
  },
  photoButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  photoButtonText: {
    fontWeight: "600",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.8,
    marginBottom: -4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#1E3A5F",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#1A1A1A",
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  cancelText: {
    fontWeight: "600",
    fontSize: 15,
    opacity: 0.6,
  },
});
