import AdminNotificationListener from '@/components/AdminNotificationListener';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <AdminNotificationListener /> 
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="HomeMenu/mainScreen"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        {/* NUEVA PESTAÑA DE PEDIDOS */}
        <Tabs.Screen
          name="pedidos"
          options={{
            title: 'Mis Pedidos',
            tabBarIcon: ({ color, size }) => <Ionicons name="basket" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ganar"
          options={{
            title: 'Ganar',
            tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="ranking"
          options={{
            title: 'Ranking',
            tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="Perfil/PerfilUsuario"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
        {/* Rutas ocultas */}
        <Tabs.Screen name="HomeMenu/detalleProducto" options={{ href: null }} />
        <Tabs.Screen name="rental-screen" options={{ href: null }} />
      </Tabs>
    </>
  );
}