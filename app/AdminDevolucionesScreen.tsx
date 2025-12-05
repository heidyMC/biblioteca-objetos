import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function AdminDevolucionesScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para el QR
  const [qrVisible, setQrVisible] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState("");
  
  // Usamos useRef para acceder al ID seleccionado dentro del callback de suscripción sin reinicializarla
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    checkAdminAndLoad();

    // Suscripción mejorada: Escucha CUALQUIER cambio en la tabla 'alquileres'
    // para detectar cuando un estado cambia de 'pendiente' a 'completado'
    const subscription = supabase
      .channel('admin-returns-global')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'alquileres' },
        (payload: any) => {
          // 1. Recargar la lista siempre que haya un cambio relevante
          loadRequests();

          // 2. Si tenemos el modal abierto con este ID y el estado cambió a completado:
          if (
             selectedIdRef.current === payload.new.id && 
             payload.new.estado === 'completado'
          ) {
             setQrVisible(false);
             selectedIdRef.current = null; // Limpiar referencia
             Alert.alert("¡Devolución Exitosa!", "El cliente ha escaneado el código correctamente.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const checkAdminAndLoad = async () => {
    try {
      const userData = await AsyncStorage.getItem("usuario");
      if (!userData) {
        router.replace("/(tabs)/Perfil/PerfilUsuario");
        return;
      }
      const user = JSON.parse(userData);
      if (!user.is_admin) {
        Alert.alert("Acceso denegado", "Solo administradores.");
        router.back();
        return;
      }
      loadRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const loadRequests = async () => {
    // No ponemos setLoading(true) aquí para evitar parpadeos en actualizaciones automáticas
    try {
      const { data, error } = await supabase
        .from('alquileres')
        .select(`
          id,
          codigo_devolucion,
          created_at,
          usuarios ( nombre, correo ),
          objetos ( nombre )
        `)
        .eq('estado', 'pendiente_devolucion')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error("Error cargando devoluciones:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openQrModal = (item: any) => {
    selectedIdRef.current = item.id; // Guardamos el ID en la referencia
    setSelectedQrCode(item.codigo_devolucion);
    setQrVisible(true);
  };

  const closeQrModal = () => {
    selectedIdRef.current = null;
    setQrVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Devoluciones Pendientes</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} />}
      >
        {requests.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No hay solicitudes de devolución pendientes.</Text>
          </View>
        ) : (
          requests.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.userName}>{item.usuarios?.nombre || "Usuario desconocido"}</Text>
                <Text style={styles.objectName}>Devolviendo: {item.objetos?.nombre || "Objeto"}</Text>
              </View>
              
              <View style={styles.codeSection}>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>CÓDIGO:</Text>
                  <Text style={styles.code}>{item.codigo_devolucion || "---"}</Text>
                </View>

                {/* Botón para generar/ver QR */}
                <TouchableOpacity 
                  style={styles.qrButton}
                  onPress={() => openQrModal(item)}
                >
                  <Ionicons name="qr-code" size={24} color="#fff" />
                  <Text style={styles.qrButtonText}>Mostrar QR</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
                <Text style={styles.footerText}>
                    {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para mostrar el QR al cliente */}
      <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={closeQrModal}>
        <View style={styles.qrModalOverlay}>
            <View style={styles.qrModalContent}>
                <TouchableOpacity style={styles.closeQr} onPress={closeQrModal}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.qrTitle}>Escanea para Devolver</Text>
                
                {selectedQrCode ? (
                    <Image 
                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedQrCode}` }} 
                        style={{ width: 250, height: 250, marginVertical: 20 }} 
                    />
                ) : null}
                
                <Text style={styles.qrCodeDisplay}>{selectedQrCode}</Text>
                <Text style={styles.qrHelper}>Muestra este código al cliente</Text>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: { padding: 8, backgroundColor: "#F1F5F9", borderRadius: 8 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  content: { padding: 20 },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: "#F59E0B",
  },
  cardHeader: { marginBottom: 16 },
  userName: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  objectName: { fontSize: 14, color: "#64748B", marginTop: 2 },
  
  codeSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeContainer: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderStyle: 'dashed'
  },
  codeLabel: { fontSize: 10, color: "#3B82F6", marginBottom: 2, fontWeight: '600' },
  code: { fontSize: 24, fontWeight: "900", color: "#1E40AF", letterSpacing: 2 },
  
  qrButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 2 },

  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'flex-end', gap: 6 },
  footerText: { color: "#64748B", fontSize: 12 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: "#94A3B8", fontSize: 16 },

  // Estilos Modal QR
  qrModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  qrModalContent: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', width: '85%' },
  closeQr: { position: 'absolute', top: 15, right: 15 },
  qrTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  qrCodeDisplay: { fontSize: 32, fontWeight: '900', color: '#1E293B', letterSpacing: 4, marginBottom: 10 },
  qrHelper: { color: '#6B7280', textAlign: 'center' }
});