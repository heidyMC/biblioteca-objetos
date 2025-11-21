import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

// Tipos basados en tu BD y nuevos estados
type Alquiler = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_alquiler: number;
  tokens_totales: number;
  estado: "activo" | "completado" | "extendido" | "pendiente_devolucion" | "pendiente_aprobacion" | "rechazado";
  codigo_devolucion?: string;
  created_at: string;
  objetos: {
    nombre: string;
    imagen_url: string;
  };
};

export default function HistorialAlquileresScreen() {
  const router = useRouter();
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlquileres();
  }, []);

  const loadAlquileres = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("usuario");
      if (!userData) {
        router.replace("/(tabs)/Perfil/PerfilUsuario");
        return;
      }
      const user = JSON.parse(userData);

      // Consulta a la tabla alquileres uniendo con objetos
      const { data, error } = await supabase
        .from("alquileres")
        .select(`
          *,
          objetos (
            nombre,
            imagen_url
          )
        `)
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlquileres(data || []);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo": return "#3B82F6"; // Azul
      case "completado": return "#10B981"; // Verde
      case "pendiente_devolucion": return "#F59E0B"; // Naranja
      case "extendido": return "#8B5CF6"; // Morado
      case "pendiente_aprobacion": return "#A855F7"; // Violeta/Morado
      case "rechazado": return "#EF4444"; // Rojo
      default: return "#6B7280"; // Gris
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case "activo": return "En curso";
      case "completado": return "Devuelto";
      case "pendiente_devolucion": return "Devolución Pendiente";
      case "extendido": return "Extendido";
      case "pendiente_aprobacion": return "Esperando Aprobación";
      case "rechazado": return "Rechazado";
      default: return estado;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { day: 'numeric', month: 'short' });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Alquileres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAlquileres(); }} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
        ) : alquileres.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No tienes historial de alquileres.</Text>
          </View>
        ) : (
          alquileres.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Image 
                  source={{ uri: item.objetos?.imagen_url || "https://placehold.co/100x100" }} 
                  style={styles.image} 
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.objName}>{item.objetos?.nombre || "Objeto desconocido"}</Text>
                  
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.dateText}>
                      {formatDate(item.fecha_inicio)} - {formatDate(item.fecha_fin)}
                    </Text>
                  </View>

                  <View style={styles.tokensRow}>
                    <Text style={{fontSize:12}}>💰</Text>
                    <Text style={styles.tokensText}>{item.tokens_totales} tokens</Text>
                  </View>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
                    {getStatusText(item.estado)}
                  </Text>
                </View>
              </View>
              
              {/* Mostrar código solo si está pendiente de devolución */}
              {item.estado === 'pendiente_devolucion' && item.codigo_devolucion && (
                <View style={styles.footerPending}>
                  <Text style={styles.footerText}>Código activo: </Text>
                  <Text style={styles.footerCode}>{item.codigo_devolucion}</Text>
                </View>
              )}

              {/* Mensaje si está en espera de aprobación */}
              {item.estado === 'pendiente_aprobacion' && (
                <View style={styles.footerInfo}>
                  <Ionicons name="time-outline" size={14} color="#A855F7" />
                  <Text style={{ fontSize: 12, color: "#A855F7", marginLeft: 4 }}>
                    El admin está revisando tu solicitud.
                  </Text>
                </View>
              )}
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
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: { padding: 8, backgroundColor: "#F1F5F9", borderRadius: 8 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  content: { padding: 16 },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  image: { width: 60, height: 60, borderRadius: 12, backgroundColor: "#F1F5F9" },
  cardInfo: { flex: 1, marginLeft: 12 },
  objName: { fontSize: 16, fontWeight: "bold", color: "#1E293B", marginBottom: 4 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  dateText: { fontSize: 12, color: "#64748B" },
  tokensRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  tokensText: { fontSize: 12, fontWeight: "700", color: "#1E293B" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: 'center' },
  footerPending: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },
  footerInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: { fontSize: 12, color: "#64748B" },
  footerCode: { fontSize: 14, fontWeight: "900", color: "#F59E0B", letterSpacing: 1 },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { marginTop: 12, color: "#94A3B8", fontSize: 16 },
});