import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/providers/auth-provider";
import { API_ENDPOINTS, getJson } from "@/services/api-client";

const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ??
  "https://taller-itla.ia3x.com";

function resolveImageUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return undefined;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))
    return rawUrl;
  return `${API_ORIGIN}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
  });
}

type ResumenFinanciero = {
  totalMantenimientos: number;
  totalCombustible: number;
  totalGastos: number;
  totalIngresos: number;
  balance: number;
};

type VehiculoDetalle = {
  id: number;
  placa: string;
  chasis: string;
  marca: string;
  modelo: string;
  anio: number;
  cantidadRuedas: number;
  fotoUrl?: string;
  resumen: ResumenFinanciero;
};

type ResumenRow = {
  label: string;
  value: number;
  isBalance?: boolean;
};

export default function DetalleVehiculoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;

  const [vehiculo, setVehiculo] = useState<VehiculoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!id || !session?.token) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const data = await getJson<VehiculoDetalle>(
          `${API_ENDPOINTS.vehiculosDetalle}?id=${id}`,
          { token: session.token },
        );
        if (isMounted) setVehiculo(data);
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Error al cargar el vehiculo.";
        if (isMounted) Alert.alert("Detalle", msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [id, session?.token]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  if (!vehiculo) {
    return (
      <View style={styles.centered}>
        <ThemedText>No se pudo cargar el vehiculo.</ThemedText>
      </View>
    );
  }

  const fotoUri = resolveImageUrl(vehiculo.fotoUrl);

  const resumenRows: ResumenRow[] = [
    { label: "Mantenimientos", value: vehiculo.resumen.totalMantenimientos },
    { label: "Combustible", value: vehiculo.resumen.totalCombustible },
    { label: "Gastos", value: vehiculo.resumen.totalGastos },
    { label: "Ingresos", value: vehiculo.resumen.totalIngresos },
    { label: "Balance", value: vehiculo.resumen.balance, isBalance: true },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {fotoUri && !imageFailed ? (
        <Image
          source={{ uri: fotoUri }}
          style={styles.heroImage}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={styles.heroFallback}>
          <ThemedText style={styles.heroFallbackText}>Sin foto</ThemedText>
        </View>
      )}

      <ThemedView style={styles.card}>
        <ThemedText type="title">
          {vehiculo.marca} {vehiculo.modelo}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {vehiculo.anio} · {vehiculo.cantidadRuedas} ruedas
        </ThemedText>

        <View style={styles.divider} />

        <Row label="Placa" value={vehiculo.placa} />
        <Row label="Chasis" value={vehiculo.chasis} />
        <Row label="Marca" value={vehiculo.marca} />
        <Row label="Modelo" value={vehiculo.modelo} />
        <Row label="Año" value={String(vehiculo.anio)} />
        <Row label="Ruedas" value={String(vehiculo.cantidadRuedas)} />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Resumen financiero</ThemedText>
        <View style={styles.divider} />
        {resumenRows.map((row) => (
          <View key={row.label} style={styles.resumenRow}>
            <ThemedText
              style={[
                styles.resumenLabel,
                row.isBalance && styles.balanceLabel,
              ]}
            >
              {row.label}
            </ThemedText>
            <ThemedText
              style={[
                styles.resumenValue,
                row.isBalance && styles.balanceLabel,
                row.isBalance && row.value < 0 && styles.negative,
              ]}
            >
              {formatCurrency(row.value)}
            </ThemedText>
          </View>
        ))}
      </ThemedView>

      <Pressable
        style={[styles.editButton, { backgroundColor: tint }]}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/vehiculos/editar",
            params: {
              id: String(vehiculo.id),
              placa: vehiculo.placa,
              chasis: vehiculo.chasis,
              marca: vehiculo.marca,
              modelo: vehiculo.modelo,
              anio: String(vehiculo.anio),
              cantidadRuedas: String(vehiculo.cantidadRuedas),
              fotoUrl: vehiculo.fotoUrl ?? "",
            },
          })
        }
      >
        <ThemedText style={styles.editButtonText}>Editar vehiculo</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <ThemedText style={styles.dataLabel}>{label}</ThemedText>
      <ThemedText style={styles.dataValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  heroFallback: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
  },
  heroFallbackText: {
    opacity: 0.5,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#1E3A5F",
  },
  subtitle: {
    opacity: 0.65,
    fontSize: 14,
    marginTop: -4,
  },
  divider: {
    height: 1,
    backgroundColor: "#1E3A5F",
    marginVertical: 4,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dataLabel: {
    opacity: 0.7,
    fontSize: 14,
  },
  dataValue: {
    fontWeight: "600",
    fontSize: 14,
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  resumenLabel: {
    fontSize: 14,
  },
  resumenValue: {
    fontWeight: "600",
    fontSize: 14,
  },
  balanceLabel: {
    fontWeight: "700",
    fontSize: 15,
  },
  negative: {
    color: "#E74C3C",
  },
  editButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
