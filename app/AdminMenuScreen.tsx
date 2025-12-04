import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminMenuScreen() {
  const router = useRouter();

  const menuItems = [
    {
      title: "Gestionar Inventario",
      subtitle: "Ver, Editar y Borrar Objetos",
      icon: "list-circle",
      color: "#10B981", 
      route: "/AdminListaObjetos"
    },
    
    {
      title: "Escáner de Entregas",
      subtitle: "Escanear QR para entregar o recibir",
      icon: "qr-code", // Icono de QR
      color: "#8B5CF6", // Violeta
      route: "/AdminEscanerQRScreen"
    },

    {
      title: "Top Usuarios",
      subtitle: "Ver clientes con más alquileres",
      icon: "podium", 
      color: "#F59E0B", 
      route: "/AdminTopUsuariosScreen"
    },
    {
      title: "Administrar Transacciones",
      subtitle: "Gestionar pagos y movimientos",
      icon: "card",
      color: "#3B82F6",
      route: "/AdminTransaccionesScreen"
    },
    {
      title: "Solicitudes de Alquiler",
      subtitle: "Aprobar o rechazar préstamos",
      icon: "notifications",
      color: "#8B5CF6",
      route: "/AdminSolicitudesScreen"
    },
    {
      title: "Devoluciones",
      subtitle: "Gestionar retornos de objetos",
      icon: "return-up-back",
      color: "#EF4444",
      route: "/AdminDevolucionesScreen"
    },
    // --- NUEVA OPCIÓN ---
    {
      title: "Ubicación de Biblioteca",
      subtitle: "Cambiar ubicación de todos los objetos",
      icon: "map",
      color: "#6366F1", // Color Índigo
      route: "/AdminCambiarUbicacion"
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel de Gestión</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.card}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
        
        {/* Espacio extra al final */}
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 15, marginLeft: 5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#9CA3AF' },
});