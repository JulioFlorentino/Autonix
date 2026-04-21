import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/providers/auth-provider";
import { API_ENDPOINTS, getJson, postMultipart } from "@/services/api-client";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ??
  "https://taller-itla.ia3x.com";

function resolveImageUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) {
    return undefined;
  }

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  return `${API_BASE_URL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

type ProfileData = {
  id: number;
  matricula: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  grupo: string;
  fotoUrl?: string;
};

export default function SettingsScreen() {
  const { logout, session, updateSessionUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  const fullName = useMemo(() => {
    if (!profile) {
      return "";
    }

    return `${profile.nombre} ${profile.apellido}`.trim();
  }, [profile]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!session?.token) {
        if (isMounted) {
          setLoadingProfile(false);
        }
        return;
      }

      if (isMounted) {
        setLoadingProfile(true);
      }
      try {
        const data = await getJson<ProfileData>(API_ENDPOINTS.profile, {
          token: session.token,
        });
        if (!isMounted) {
          return;
        }

        setProfile(data);
        setImageFailed(false);
        setImageKey((k) => k + 1);
        await updateSessionUser({
          nombre: data.nombre,
          apellido: data.apellido,
          correo: data.correo,
          fotoUrl: data.fotoUrl,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo cargar el perfil.";
        if (isMounted) {
          Alert.alert("Perfil", message);
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
    // Evita loop infinito: updateSessionUser cambia de referencia cuando cambia la sesion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const uploadPhotoAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!session?.token) {
      Alert.alert("Sesion", "No hay un token de sesion activo.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      const fileName =
        asset.fileName ??
        `perfil-${Date.now()}.${asset.uri.toLowerCase().endsWith(".png") ? "png" : "jpg"}`;

      if (asset.file) {
        formData.append("foto", asset.file, fileName);
      } else {
        formData.append("foto", {
          uri: asset.uri,
          name: fileName,
          type: asset.mimeType ?? "image/jpeg",
        } as any);
      }

      const response = await postMultipart<{ fotoUrl: string }>(
        API_ENDPOINTS.profilePhoto,
        formData,
        { token: session.token },
      );

      const resolvedUrl = resolveImageUrl(response.fotoUrl);
      setProfile((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          fotoUrl: resolvedUrl,
        };
      });
      setImageFailed(false);
      setImageKey((k) => k + 1);
      await updateSessionUser({ fotoUrl: resolvedUrl });
      Alert.alert("Perfil", "Foto de perfil actualizada correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la foto.";
      Alert.alert("Error al subir foto", message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso requerido",
          "Debes permitir acceso a la galeria para cambiar la foto.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      await uploadPhotoAsset(result.assets[0]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo abrir la galeria.";
      Alert.alert("Galeria", message);
    }
  };

  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permiso requerido",
          "Debes permitir acceso a la camara para tomar una foto.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      await uploadPhotoAsset(result.assets[0]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo abrir la camara.";
      Alert.alert("Camara", message);
    }
  };

  const onLogout = () => {
    Alert.alert("Cerrar sesion", "Estas seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText type="title">Ajustes</ThemedText>
        <ThemedText style={styles.subtitle}>
          Gestiona tu sesion y preferencias de la cuenta.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Mi Perfil</ThemedText>
        {loadingProfile ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#FF7A1A" />
            <ThemedText style={styles.subtitle}>Cargando perfil...</ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.profileHeader}>
              {profile?.fotoUrl && !imageFailed ? (
                <Image
                  key={imageKey}
                  source={{ uri: resolveImageUrl(profile.fotoUrl) }}
                  style={styles.avatarImage}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <ThemedText style={styles.avatarFallbackText}>
                    Sin foto
                  </ThemedText>
                </View>
              )}

              <View style={styles.photoActions}>
                <Pressable
                  style={styles.photoButton}
                  onPress={() => void pickFromCamera()}
                  disabled={uploadingPhoto}
                >
                  <ThemedText style={styles.photoButtonText}>Camara</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.photoButton}
                  onPress={() => void pickFromGallery()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <ActivityIndicator color="#FF7A1A" />
                  ) : (
                    <ThemedText style={styles.photoButtonText}>
                      Galeria
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <ThemedText style={styles.label}>Nombre</ThemedText>
              <ThemedText style={styles.value}>
                {fullName || "Sin nombre"}
              </ThemedText>
            </View>

            <View style={styles.fieldBlock}>
              <ThemedText style={styles.label}>Correo</ThemedText>
              <ThemedText style={styles.value}>
                {profile?.correo || "Sin correo"}
              </ThemedText>
            </View>

            <View style={styles.rowFields}>
              <View style={styles.rowFieldItem}>
                <ThemedText style={styles.label}>Rol</ThemedText>
                <ThemedText style={styles.value}>
                  {profile?.rol || "N/A"}
                </ThemedText>
              </View>
              <View style={styles.rowFieldItem}>
                <ThemedText style={styles.label}>Grupo</ThemedText>
                <ThemedText style={styles.value}>
                  {profile?.grupo || "N/A"}
                </ThemedText>
              </View>
            </View>
          </>
        )}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Cuenta</ThemedText>
        <ThemedText style={styles.value}>
          {profile?.correo || session?.user.correo || "Sin correo"}
        </ThemedText>

        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <ThemedText style={styles.logoutText}>Cerrar sesion</ThemedText>
        </Pressable>
      </ThemedView>

      <Pressable
        style={({ pressed }) => [
          styles.aboutButton,
          pressed && styles.aboutButtonPressed,
        ]}
        onPress={() => router.push("/acerca-de")}
      >
        <MaterialIcons name="groups" size={22} color="#FF7A1A" />
        <ThemedText style={styles.aboutButtonText}>Acerca De</ThemedText>
        <MaterialIcons name="chevron-right" size={20} color="#888" />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    gap: 10,
  },
  subtitle: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 11,
    opacity: 0.75,
  },
  photoButton: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF7A1A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#1A1A1A",
  },
  photoActions: {
    gap: 8,
  },
  photoButtonText: {
    color: "#FF7A1A",
    fontWeight: "700",
  },
  fieldBlock: {
    gap: 4,
  },
  rowFields: {
    flexDirection: "row",
    gap: 14,
  },
  rowFieldItem: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: "700",
  },
  value: {
    fontSize: 14,
    opacity: 0.85,
  },
  logoutButton: {
    marginTop: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#E74C3C",
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  aboutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#141414",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  aboutButtonPressed: {
    opacity: 0.7,
  },
  aboutButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#F5F5F5",
  },
});
