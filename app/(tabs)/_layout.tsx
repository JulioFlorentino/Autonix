import { Redirect, Tabs } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/providers/auth-provider";

const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ??
  "https://taller-itla.ia3x.com";

function resolveImageUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) {
    return undefined;
  }

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  return `${API_ORIGIN}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

function HeaderAvatar({ fotoUrl }: { fotoUrl?: string }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveImageUrl(fotoUrl);

  return (
    <View style={styles.avatarContainer}>
      {resolved && !failed ? (
        <Image
          source={{ uri: resolved }}
          style={styles.avatarImage}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.avatarFallback} />
      )}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors[colorScheme ?? "light"].tint}
        />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF7A1A",
        tabBarInactiveTintColor: "#8A8A8A",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "web" ? 16 : 24,
          left: 24,
          right: 24,
          height: 72,
          borderRadius: 36,
          backgroundColor: "#141414",
          borderTopWidth: 1,
          borderTopColor: "#1E3A5F",
          borderLeftWidth: 1,
          borderLeftColor: "#1E3A5F",
          borderRightWidth: 1,
          borderRightColor: "#1E3A5F",
          borderBottomWidth: 1,
          borderBottomColor: "#1E3A5F",
          elevation: 12,
          shadowColor: "#FF7A1A",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          paddingBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Menu",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehiculos"
        options={{
          title: "Vehiculos",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="car.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="foro"
        options={{
          title: "Foro",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={24}
              name="bubble.left.and.bubble.right.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Noticias",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: "Videos",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="play.rectangle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="gearshape.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen name="catalogo" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E3A5F",
  },
});
