import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      {/* Inicio: apunta a la pantalla principal del HomeMenu */}
      <Tabs.Screen
        name="HomeMenu/mainScreen"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      {/* Ganar */}
      <Tabs.Screen
        name="ganar"
        options={{
          title: 'Ganar',
          tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />,
        }}
      />

      {/* Perfil (ruta dentro de Perfil/PerfilUsuario) */}
      <Tabs.Screen
        name="Perfil/PerfilUsuario"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />

      {/* Ranking */}
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="HomeMenu/detalleProducto"
        options={{
          href: null, // ❌ Oculta de la barra de pestañas
        }}
      />

      <Tabs.Screen
        name="rental-screen"
        options={{
          href: null, // ❌ Oculta de la barra de pestañas
        }}
      />
    </Tabs>
  );
}