import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/providers/auth-provider";

const SLIDES = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80",
    quote: "Tu vehiculo merece el mejor cuidado.",
    sub: "Registra cada mantenimiento y mantén tu auto en optimas condiciones.",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80",
    quote: "Conducir seguro empieza con un auto en buen estado.",
    sub: "Revisa periodicamente neumaticos, frenos y fluidos.",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=900&q=80",
    quote: "Cada kilometro cuenta.",
    sub: "Lleva un control preciso de tu combustible y gastos.",
  },
  {
    id: "4",
    image:
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=900&q=80",
    quote: "Comparte, aprende y mejora.",
    sub: "Unete al foro y conecta con otros conductores.",
  },
];

type QuickModule = {
  label: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  color: string;
};

const QUICK_MODULES: QuickModule[] = [
  {
    label: "Mis Vehiculos",
    description: "Gestiona tu flota",
    icon: "directions-car",
    route: "/(tabs)/vehiculos",
    color: "#FF7A1A",
  },
  {
    label: "Foro",
    description: "Comunidad automotriz",
    icon: "forum",
    route: "/(tabs)/foro",
    color: "#3A9BD5",
  },
  {
    label: "Noticias",
    description: "Ultimas novedades",
    icon: "article",
    route: "/(tabs)/explore",
    color: "#27AE60",
  },
  {
    label: "Videos",
    description: "Aprende y mejora",
    icon: "smart-display",
    route: "/(tabs)/videos",
    color: "#E74C3C",
  },
  {
    label: "Ajustes",
    description: "Tu perfil y cuenta",
    icon: "settings",
    route: "/(tabs)/settings",
    color: "#9B59B6",
  },
  {
    label: "Catálogo",
    description: "Vehículos disponibles",
    icon: "storefront",
    route: "/(tabs)/catalogo",
    color: "#16A085",
  },
];

const SLIDE_INTERVAL = 4000;

export default function HomeScreen() {
  const { logout, session } = useAuth();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const sliderRef = useRef<ScrollView>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [sliderWidth, setSliderWidth] = useState(windowWidth);
  const isScrollingRef = useRef(false);

  const fullName = useMemo(() => {
    if (!session?.user) return "";
    return `${session.user.nombre} ${session.user.apellido}`.trim();
  }, [session?.user]);

  // Auto-scroll
  useEffect(() => {
    const timer = setInterval(() => {
      if (isScrollingRef.current) return;
      const next = (slideIndex + 1) % SLIDES.length;
      sliderRef.current?.scrollTo({ x: next * sliderWidth, animated: true });
      setSlideIndex(next);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [slideIndex, sliderWidth]);

  const sliderHeight = Math.min(sliderWidth * 0.65, 280);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: Platform.OS === "web" ? 100 : 110 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Slider ── */}
      <View
        style={[styles.sliderWrapper, { height: sliderHeight }]}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={sliderRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            isScrollingRef.current = true;
          }}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / sliderWidth);
            setSlideIndex(idx);
            isScrollingRef.current = false;
          }}
          style={styles.flex}
        >
          {SLIDES.map((slide) => (
            <View
              key={slide.id}
              style={{ width: sliderWidth, height: sliderHeight }}
            >
              <Image
                source={{ uri: slide.image }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              {/* Dark gradient overlay (top clear → bottom dark) */}
              <View style={styles.slideOverlayTop} />
              <View style={styles.slideOverlayBottom} />
              <View style={styles.slideTextContainer}>
                <ThemedText style={styles.slideQuote}>{slide.quote}</ThemedText>
                <ThemedText style={styles.slideSub}>{slide.sub}</ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <Pressable
              key={s.id}
              style={[styles.dot, i === slideIndex && styles.dotActive]}
              onPress={() => {
                sliderRef.current?.scrollTo({
                  x: i * sliderWidth,
                  animated: true,
                });
                setSlideIndex(i);
              }}
            />
          ))}
        </View>

        {/* Autonix badge */}
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>AUTONIX</ThemedText>
        </View>
      </View>

      {/* ── Greeting ── */}
      <View style={styles.greetingRow}>
        <View>
          <ThemedText style={styles.greetingHello}>Hola,</ThemedText>
          <ThemedText style={styles.greetingName}>{fullName}</ThemedText>
        </View>
        <View style={styles.greetingPill}>
          <MaterialIcons name="star" size={14} color="#FF7A1A" />
          <ThemedText style={styles.greetingPillText}>Conductor Pro</ThemedText>
        </View>
      </View>

      {/* ── Quick Access ── */}
      <ThemedText style={styles.sectionLabel}>Acceso rapido</ThemedText>
      <View style={styles.quickGrid}>
        {[
          [0, 1],
          [2, 3],
          [4, 5],
        ].map((pair, ri) => (
          <View key={ri} style={styles.quickRow}>
            {pair.map((idx) => {
              const mod = QUICK_MODULES[idx];
              return (
                <Pressable
                  key={mod.label}
                  style={({ pressed }) => [
                    styles.quickCard,
                    pressed && styles.quickCardPressed,
                  ]}
                  onPress={() => router.push(mod.route as any)}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${mod.color}22` },
                    ]}
                  >
                    <MaterialIcons
                      name={mod.icon}
                      size={28}
                      color={mod.color}
                    />
                  </View>
                  <ThemedText style={styles.quickLabel}>{mod.label}</ThemedText>
                  <ThemedText style={styles.quickDesc}>
                    {mod.description}
                  </ThemedText>
                  <MaterialIcons
                    name="chevron-right"
                    size={16}
                    color="#1E3A5F"
                    style={styles.quickArrow}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* ── Tip card ── */}
      <View style={styles.tipCard}>
        <MaterialIcons name="tips-and-updates" size={22} color="#FF7A1A" />
        <View style={styles.tipText}>
          <ThemedText style={styles.tipTitle}>Consejo del dia</ThemedText>
          <ThemedText style={styles.tipBody}>
            Revisa la presion de tus neumaticos cada mes. Una presion correcta
            mejora el consumo de combustible hasta un 3%.
          </ThemedText>
        </View>
      </View>

      {/* ── Logout ── */}
      <Pressable style={styles.logoutButton} onPress={logout}>
        <MaterialIcons name="logout" size={18} color="#FFFFFF" />
        <ThemedText style={styles.logoutText}>Cerrar sesion</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    backgroundColor: "#0D0D0D",
    gap: 16,
  },

  // Slider
  sliderWrapper: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#141414",
  },
  slideOverlayTop: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    height: "45%",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  slideOverlayBottom: {
    ...StyleSheet.absoluteFillObject,
    top: "45%",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  slideTextContainer: {
    position: "absolute",
    bottom: 44,
    left: 20,
    right: 20,
    gap: 6,
  },
  slideQuote: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  slideSub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 18,
  },
  dotsRow: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    width: 20,
    backgroundColor: "#FF7A1A",
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 16,
    backgroundColor: "#FF7A1A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#0D0D0D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  // Greeting
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: -4,
  },
  greetingHello: { color: "#8A8A8A", fontSize: 13 },
  greetingName: { color: "#F5F5F5", fontSize: 22, fontWeight: "800" },
  greetingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#1E3A5F",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  greetingPillText: { color: "#FF7A1A", fontSize: 12, fontWeight: "600" },

  // Section label
  sectionLabel: {
    color: "#8A8A8A",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: -8,
  },

  // Quick grid
  quickGrid: {
    paddingHorizontal: 16,
    gap: 10,
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E3A5F",
    padding: 16,
    gap: 8,
  },
  quickCardPressed: { opacity: 0.75 },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { color: "#F5F5F5", fontWeight: "700", fontSize: 14 },
  quickDesc: { color: "#8A8A8A", fontSize: 11 },
  quickArrow: { alignSelf: "flex-end" },

  // Tip card
  tipCard: {
    marginHorizontal: 16,
    backgroundColor: "#141414",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FF7A1A44",
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  tipText: { flex: 1, gap: 4 },
  tipTitle: { color: "#FF7A1A", fontWeight: "700", fontSize: 13 },
  tipBody: { color: "#8A8A8A", fontSize: 12, lineHeight: 18 },

  // Logout
  logoutButton: {
    marginHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#E74C3C",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
