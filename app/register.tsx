import { Link, Redirect } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/providers/auth-provider";

export default function RegisterScreen() {
  const { register, activate, session, isLoading } = useAuth();

  const [matricula, setMatricula] = useState("");
  const [tokenTemporal, setTokenTemporal] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  if (!isLoading && session) {
    return <Redirect href="/(tabs)" />;
  }

  const onRegister = async () => {
    if (!matricula.trim()) {
      Alert.alert("Matricula requerida", "Ingresa tu matricula del ITLA.");
      return;
    }

    setIsRegistering(true);

    try {
      const tempToken = await register(matricula.trim());
      setTokenTemporal(tempToken);
      Alert.alert(
        "Registro iniciado",
        "Se recibio el token temporal. Ahora establece tu contrasena para activar la cuenta.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo iniciar el registro.";
      Alert.alert("Error de registro", message);
    } finally {
      setIsRegistering(false);
    }
  };

  const onActivate = async () => {
    if (!tokenTemporal.trim()) {
      Alert.alert(
        "Token requerido",
        "Debes ingresar un token temporal valido.",
      );
      return;
    }

    if (contrasena.length < 6) {
      Alert.alert(
        "Contrasena invalida",
        "La contrasena debe tener al menos 6 caracteres.",
      );
      return;
    }

    if (!matricula.trim()) {
      Alert.alert("Matricula requerida", "Ingresa tu matricula del ITLA.");
      return;
    }

    setIsActivating(true);

    try {
      await activate(tokenTemporal.trim(), contrasena, matricula.trim());
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo activar la cuenta.";
      Alert.alert("Error de activacion", message);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ThemedView style={styles.card}>
        <ThemedText type="title">Crear cuenta</ThemedText>
        <ThemedText style={styles.subtitle}>
          Registra tu matricula ITLA y activa tu cuenta con una contrasena.
        </ThemedText>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Matricula ITLA</ThemedText>
          <TextInput
            value={matricula}
            onChangeText={setMatricula}
            autoCapitalize="none"
            style={styles.input}
            placeholder="Ej: 20240096"
            placeholderTextColor="#8A94A6"
          />
        </View>

        <Pressable
          style={[
            styles.secondaryButton,
            isRegistering && styles.buttonDisabled,
          ]}
          onPress={onRegister}
          disabled={isRegistering || isActivating}
        >
          {isRegistering ? (
            <ActivityIndicator color="#FF7A1A" />
          ) : (
            <ThemedText style={styles.secondaryButtonText}>
              Solicitar token temporal
            </ThemedText>
          )}
        </Pressable>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Token temporal</ThemedText>
          <TextInput
            value={tokenTemporal}
            onChangeText={setTokenTemporal}
            autoCapitalize="none"
            style={styles.input}
            placeholder="Token recibido en /auth/registro"
            placeholderTextColor="#8A94A6"
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Contrasena (min. 6)</ThemedText>
          <TextInput
            value={contrasena}
            onChangeText={setContrasena}
            autoCapitalize="none"
            secureTextEntry
            style={styles.input}
            placeholder="Define tu nueva contrasena"
            placeholderTextColor="#8A94A6"
          />
        </View>

        <Pressable
          style={[styles.primaryButton, isActivating && styles.buttonDisabled]}
          onPress={onActivate}
          disabled={isRegistering || isActivating}
        >
          {isActivating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>
              Activar cuenta
            </ThemedText>
          )}
        </Pressable>

        <Link href="/login" asChild>
          <Pressable style={styles.loginLink}>
            <ThemedText style={styles.loginLinkText}>
              Ya tengo cuenta
            </ThemedText>
          </Pressable>
        </Link>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#0D0D0D",
  },
  card: {
    gap: 14,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    backgroundColor: "#141414",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 14,
    color: "#F5F5F5",
  },
  primaryButton: {
    marginTop: 4,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#FF7A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F2030",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#FF7A1A",
    fontWeight: "700",
  },
  loginLink: {
    alignItems: "center",
    paddingVertical: 10,
  },
  loginLinkText: {
    color: "#FF7A1A",
    fontWeight: "700",
  },
});
