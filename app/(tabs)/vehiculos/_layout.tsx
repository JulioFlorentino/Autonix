import { Stack } from "expo-router";

export default function VehiculosLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Mis Vehiculos" }} />
      <Stack.Screen
        name="registrar"
        options={{ title: "Registrar Vehiculo" }}
      />
      <Stack.Screen
        name="detalle"
        options={{ title: "Detalle del Vehiculo" }}
      />
      <Stack.Screen name="editar" options={{ title: "Editar Vehiculo" }} />
    </Stack>
  );
}
