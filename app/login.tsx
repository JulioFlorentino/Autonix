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

export default function LoginScreen() {
  const { login, forgotPassword, session, isLoading } = useAuth();

  const [matricula, setMatricula] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recovering, setRecovering] = useState(false);

  if (!isLoading && session) {
    return <Redirect href="/(tabs)" />;
  }

  const onLogin = async () => {
    if (!matricula.trim() || !contrasena.trim()) {
      Alert.alert("Datos incompletos", "Ingresa tu matricula y contrasena.");
      return;
    }

    setSubmitting(true);

    try {
      await login(matricula.trim(), contrasena);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar sesion.";
      Alert.alert("Error de acceso", message);
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    if (!matricula.trim()) {
      Alert.alert(
        "Matricula requerida",
        "Ingresa tu matricula para generar una contrasena temporal.",
      );
      return;
    }

    setRecovering(true);

    try {
      const message = await forgotPassword(matricula.trim());
      Alert.alert("Recuperacion completada", message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo recuperar la contrasena temporal.";
      Alert.alert("Error de recuperacion", message);
    } finally {
      setRecovering(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ThemedView style={styles.card}>
        <ThemedText type="title">Iniciar sesion</ThemedText>
        <ThemedText style={styles.subtitle}>
          Accede con tu matricula y contrasena
        </ThemedText>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Matricula</ThemedText>
          <TextInput
            value={matricula}
            onChangeText={setMatricula}
            autoCapitalize="none"
            style={styles.input}
            placeholder="Ej: 20240096"
            placeholderTextColor="#8A94A6"
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Contrasena</ThemedText>
          <TextInput
            value={contrasena}
            onChangeText={setContrasena}
            autoCapitalize="none"
            secureTextEntry
            style={styles.input}
            placeholder="Ingresa tu contrasena"
            placeholderTextColor="#8A94A6"
          />
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            submitting && styles.primaryButtonDisabled,
          ]}
          onPress={onLogin}
          disabled={submitting || recovering}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Entrar</ThemedText>
          )}
        </Pressable>

        <Pressable
          style={[styles.linkButton, recovering && styles.linkButtonDisabled]}
          onPress={onForgotPassword}
          disabled={submitting || recovering}
        >
          {recovering ? (
            <ActivityIndicator color="#1A2C79" />
          ) : (
            <ThemedText style={styles.linkButtonText}>
              Olvide mi contrasena
            </ThemedText>
          )}
        </Pressable>

        <Link href="/register" asChild>
          <Pressable style={styles.registerLink}>
            <ThemedText style={styles.registerLinkText}>
              No tengo cuenta
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
    backgroundColor: "#F1F5FC",
  },
  card: {
    gap: 14,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DCE5F4",
    backgroundColor: "#FFFFFF",
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
    borderColor: "#C9D7ED",
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 14,
    color: "#0F172A",
  },
  primaryButton: {
    marginTop: 4,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#1F3B9D",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  linkButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BBC9E5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF0FF",
  },
  linkButtonDisabled: {
    opacity: 0.7,
  },
  linkButtonText: {
    color: "#1A2C79",
    fontWeight: "700",
  },
  registerLink: {
    alignItems: "center",
    paddingVertical: 10,
  },
  registerLinkText: {
    color: "#1A2C79",
    fontWeight: "700",
  },
});
