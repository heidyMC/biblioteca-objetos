import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
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

  useEffect(() => {
    checkAdminAndLoad();

    // Suscripción en tiempo real para actualizar automáticamente
    const subscription = supabase
      .channel('admin-returns')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alquileres', filter: 'estado=eq.pendiente_devolucion' },
        () => {
          loadRequests();
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
    setLoading(true);
    try {
      // Consulta corregida usando created_at para ordenar
      // Gracias a tus foreign keys, ahora podemos traer datos de usuarios y objetos
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
              
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>DICTAR CÓDIGO AL USUARIO:</Text>
                <Text style={styles.code}>{item.codigo_devolucion || "---"}</Text>
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
  codeContainer: {
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderStyle: 'dashed'
  },
  codeLabel: { fontSize: 12, color: "#3B82F6", marginBottom: 4, fontWeight: '600' },
  code: { fontSize: 32, fontWeight: "900", color: "#1E40AF", letterSpacing: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'flex-end', gap: 6 },
  footerText: { color: "#64748B", fontSize: 12 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: "#94A3B8", fontSize: 16 }
});