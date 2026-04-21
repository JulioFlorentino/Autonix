import { MaterialIcons } from "@expo/vector-icons";
import { Image, ImageSource } from "expo-image";
import * as Linking from "expo-linking";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

type Integrante = {
  nombre: string;
  matricula: string;
  telefono: string;
  telegram: string;
  correo: string;
  foto: ImageSource;
};

const INTEGRANTES: Integrante[] = [
  {
    nombre: "Luis Felipe López",
    matricula: "2021-1901",
    telefono: "8296231922",
    telegram: "8296231922",
    correo: "iselite.28@gmail.com",
    foto: require("@/assets/images/Luis Felipe López.jpeg"),
  },
  {
    nombre: "Julio Florentino",
    matricula: "2023-1406",
    telefono: "8097764559",
    telegram: "8097764559",
    correo: "julioflorentino91@gmail.com",
    foto: require("@/assets/images/JulioFlorentino.jpeg"),
  },
];

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) {
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return raw;
}

function ContactRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.contactRow} onPress={onPress}>
      <MaterialIcons name={icon} size={20} color="#FF7A1A" />
      <ThemedText style={styles.contactLabel}>{label}</ThemedText>
      <MaterialIcons name="open-in-new" size={14} color="#888" />
    </TouchableOpacity>
  );
}

export default function AcercaDeScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Equipo de Desarrollo</ThemedText>
        <ThemedText style={styles.headerSub}>
          Conoce a las personas que construyeron Autonix
        </ThemedText>
      </View>

      {INTEGRANTES.map((p) => (
        <View key={p.matricula} style={styles.card}>
          {/* Photo */}
          <View style={styles.photoWrapper}>
            <Image source={p.foto} style={styles.photo} contentFit="cover" />
            <View style={styles.photoBadge}>
              <MaterialIcons name="verified" size={16} color="#FF7A1A" />
            </View>
          </View>

          {/* Name + Matricula */}
          <ThemedText style={styles.name}>{p.nombre}</ThemedText>
          <View style={styles.matriculaRow}>
            <MaterialIcons name="school" size={14} color="#FF7A1A" />
            <ThemedText style={styles.matricula}>{p.matricula}</ThemedText>
          </View>

          <View style={styles.divider} />

          {/* Contact actions */}
          <ContactRow
            icon="phone"
            label={formatPhone(p.telefono)}
            onPress={() => Linking.openURL(`tel:${p.telefono}`)}
          />
          <ContactRow
            icon="telegram"
            label={`@${p.telegram}`}
            onPress={() => Linking.openURL(`https://t.me/${p.telegram}`)}
          />
          <ContactRow
            icon="email"
            label={p.correo}
            onPress={() => Linking.openURL(`mailto:${p.correo}`)}
          />
        </View>
      ))}

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require("@/assets/logo.png")}
          style={styles.footerLogo}
          contentFit="contain"
        />
        <ThemedText style={styles.footerText}>
          Autonix — ITLA · {new Date().getFullYear()}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 20,
  },

  /* Header */
  header: {
    alignItems: "center",
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F5F5F5",
    letterSpacing: 0.3,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },

  /* Card */
  card: {
    backgroundColor: "#141414",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E3A5F",
    shadowColor: "#FF7A1A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  /* Photo */
  photoWrapper: {
    position: "relative",
    marginBottom: 14,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#FF7A1A",
  },
  photoBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#141414",
    borderRadius: 12,
    padding: 2,
  },

  /* Name */
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5F5F5",
    textAlign: "center",
  },
  matriculaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  matricula: {
    fontSize: 13,
    color: "#FF7A1A",
    fontWeight: "600",
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#1E3A5F",
    marginVertical: 16,
  },

  /* Contact rows */
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0D0D0D",
    borderRadius: 10,
    marginBottom: 8,
  },
  contactLabel: {
    flex: 1,
    fontSize: 14,
    color: "#E0E0E0",
  },

  /* Footer */
  footer: {
    alignItems: "center",
    paddingTop: 8,
    gap: 8,
  },
  footerLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    opacity: 0.6,
  },
  footerText: {
    fontSize: 12,
    color: "#555",
  },
});
