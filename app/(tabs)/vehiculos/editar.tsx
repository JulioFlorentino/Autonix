import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { API_ENDPOINTS, postDatax, postMultipart } from "@/services/api-client";

const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ??
  "https://taller-itla.ia3x.com";

function resolveImageUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return undefined;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))
    return rawUrl;
  return `${API_ORIGIN}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

export default function EditarVehiculoScreen() {
  const params = useLocalSearchParams<{
    id: string;
    placa: string;
    chasis: string;
    marca: string;
    modelo: string;
    anio: string;
    cantidadRuedas: string;
    fotoUrl: string;
  }>();

  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;
  const textColor = Colors[colorScheme ?? "light"].text;
  const iconColor = Colors[colorScheme ?? "light"].icon;

  const [placa, setPlaca] = useState(params.placa ?? "");
  const [chasis, setChasis] = useState(params.chasis ?? "");
  const [marca, setMarca] = useState(params.marca ?? "");
  const [modelo, setModelo] = useState(params.modelo ?? "");
  const [anio, setAnio] = useState(params.anio ?? "");
  const [cantidadRuedas, setCantidadRuedas] = useState(
    params.cantidadRuedas ?? "",
  );

  const [newPhoto, setNewPhoto] = useState<ImagePicker.ImagePickerAsset | null>(
    null,
  );
  const [savingData, setSavingData] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const currentFotoUri = newPhoto
    ? newPhoto.uri
    : resolveImageUrl(params.fotoUrl);

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
        setNewPhoto(result.assets[0]);
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "No se pudo abrir la camara.";
      Alert.alert("Foto", msg);
    }
  };

  const savePhoto = async () => {
    if (!newPhoto) {
      Alert.alert("Foto", "Selecciona una nueva foto primero.");
      return;
    }
    if (!session?.token) {
      Alert.alert("Sesion", "No hay sesion activa.");
      return;
    }

    setSavingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("datax", JSON.stringify({ id: Number(params.id) }));
      const fileName =
        newPhoto.fileName ??
        `vehiculo-${Date.now()}.${newPhoto.uri.toLowerCase().endsWith(".png") ? "png" : "jpg"}`;
      if (newPhoto.file) {
        formData.append("foto", newPhoto.file, fileName);
      } else {
        formData.append("foto", {
          uri: newPhoto.uri,
          name: fileName,
          type: newPhoto.mimeType ?? "image/jpeg",
        } as any);
      }
      await postMultipart(API_ENDPOINTS.vehiculosFoto, formData, {
        token: session.token,
      });
      Alert.alert("Foto", "Foto actualizada correctamente.");
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Error al subir la foto.";
      Alert.alert("Error", msg);
    } finally {
      setSavingPhoto(false);
    }
  };

  const validate = (): string | null => {
    if (!placa.trim()) return "La placa es requerida.";
    if (!chasis.trim()) return "El chasis es requerido.";
    if (!marca.trim()) return "La marca es requerida.";
    if (!modelo.trim()) return "El modelo es requerido.";
    const anioNum = Number(anio);
    if (!anio.trim() || isNaN(anioNum) || anioNum < 1900 || anioNum > 2100)
      return "Ingresa un año valido.";
    const ruedas = Number(cantidadRuedas);
    if (!cantidadRuedas.trim() || isNaN(ruedas) || ruedas < 2)
      return "La cantidad de ruedas debe ser 2 o mas.";
    return null;
  };

  const saveData = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert("Validacion", validationError);
      return;
    }
    if (!session?.token) {
      Alert.alert("Sesion", "No hay sesion activa.");
      return;
    }

    setSavingData(true);
    try {
      await postDatax(
        API_ENDPOINTS.vehiculosEditar,
        {
          id: Number(params.id),
          placa: placa.trim().toUpperCase(),
          chasis: chasis.trim().toUpperCase(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          anio: Number(anio),
          cantidadRuedas: Number(cantidadRuedas),
        },
        { token: session.token },
      );
      Alert.alert("Exito", "Vehiculo actualizado correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Error al actualizar vehiculo.";
      Alert.alert("Error", msg);
    } finally {
      setSavingData(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Foto del vehiculo</ThemedText>

        {currentFotoUri ? (
          <Image source={{ uri: currentFotoUri }} style={styles.previewImage} />
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
            disabled={savingPhoto}
          >
            <ThemedText style={[styles.photoButtonText, { color: tint }]}>
              Camara
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.photoButton, { borderColor: tint }]}
            onPress={() => void pickPhoto("gallery")}
            disabled={savingPhoto}
          >
            <ThemedText style={[styles.photoButtonText, { color: tint }]}>
              Galeria
            </ThemedText>
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.secondaryButton,
            { borderColor: tint },
            !newPhoto && styles.disabledButton,
          ]}
          onPress={() => void savePhoto()}
          disabled={savingPhoto || !newPhoto}
        >
          {savingPhoto ? (
            <ActivityIndicator color={tint} />
          ) : (
            <ThemedText style={[styles.secondaryButtonText, { color: tint }]}>
              Guardar nueva foto
            </ThemedText>
          )}
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Datos del vehiculo</ThemedText>

        <ThemedText style={styles.label}>Placa *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. ABC-1234"
          placeholderTextColor={iconColor}
          value={placa}
          onChangeText={setPlaca}
          autoCapitalize="characters"
        />

        <ThemedText style={styles.label}>Chasis *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Numero de chasis"
          placeholderTextColor={iconColor}
          value={chasis}
          onChangeText={setChasis}
          autoCapitalize="characters"
        />

        <ThemedText style={styles.label}>Marca *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. Toyota"
          placeholderTextColor={iconColor}
          value={marca}
          onChangeText={setMarca}
        />

        <ThemedText style={styles.label}>Modelo *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. Corolla"
          placeholderTextColor={iconColor}
          value={modelo}
          onChangeText={setModelo}
        />

        <ThemedText style={styles.label}>Año *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. 2020"
          placeholderTextColor={iconColor}
          value={anio}
          onChangeText={setAnio}
          keyboardType="numeric"
          maxLength={4}
        />

        <ThemedText style={styles.label}>Cantidad de ruedas *</ThemedText>
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Ej. 4"
          placeholderTextColor={iconColor}
          value={cantidadRuedas}
          onChangeText={setCantidadRuedas}
          keyboardType="numeric"
          maxLength={2}
        />
      </ThemedView>

      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: tint },
          savingData && styles.submitDisabled,
        ]}
        onPress={() => void saveData()}
        disabled={savingData}
      >
        {savingData ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.submitText}>Guardar cambios</ThemedText>
        )}
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
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.4,
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
});
