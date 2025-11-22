import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function AdminSolicitudesScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alquileres')
      .select(`
        *,
        usuarios ( nombre, correo, foto_url, id, tokens_disponibles ),
        objetos ( id, nombre, imagen_url )
      `)
      .eq('estado', 'pendiente_aprobacion')
      .order('created_at', { ascending: true }); // Los más antiguos primero

    if (error) console.error(error);
    else setRequests(data || []);
    setLoading(false);
  };

  const handleApprove = async (item: any) => {
    setProcessingId(item.id);
    try {
      // Solo cambiar estado a activo (los tokens ya se cobraron al solicitar)
      const { error } = await supabase
        .from('alquileres')
        .update({ estado: 'activo' })
        .eq('id', item.id);

      if (error) throw error;
      Alert.alert("Aprobado", "El alquiler ahora está activo. El usuario puede recoger el objeto.");
      loadRequests();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: any) => {
    setProcessingId(item.id);
    try {
      // 1. Cambiar estado a rechazado
      const { error: rentalError } = await supabase
        .from('alquileres')
        .update({ estado: 'rechazado' })
        .eq('id', item.id);
      if (rentalError) throw rentalError;

      // 2. Liberar el objeto
      await supabase.from('objetos').update({ disponible: true }).eq('id', item.objeto_id);

      // 3. Reembolsar tokens al usuario
      // Necesitamos obtener el saldo actual fresco del usuario por si cambió
      const { data: userFresh } = await supabase.from('usuarios').select('tokens_disponibles').eq('id', item.usuario_id).single();
      const currentTokens = userFresh?.tokens_disponibles || 0;
      
      await supabase
        .from('usuarios')
        .update({ tokens_disponibles: currentTokens + item.tokens_totales })
        .eq('id', item.usuario_id);

      Alert.alert("Rechazado", "Solicitud rechazada y tokens reembolsados.");
      loadRequests();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Solicitudes de Alquiler</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRequests} />}
      >
        {requests.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No hay solicitudes nuevas.</Text>
          </View>
        ) : (
          requests.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.row}>
                <Image source={{ uri: item.objetos?.imagen_url }} style={styles.objImage} />
                <View style={{flex: 1, marginLeft: 12}}>
                  <Text style={styles.objName}>{item.objetos?.nombre}</Text>
                  <Text style={styles.userName}>👤 {item.usuarios?.nombre}</Text>
                  <Text style={styles.details}>📅 {item.dias_alquiler} días • 💰 {item.tokens_totales} tokens</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnReject]} 
                  onPress={() => handleReject(item)}
                  disabled={!!processingId}
                >
                  <Text style={styles.btnTextReject}>Rechazar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.btn, styles.btnApprove]} 
                  onPress={() => handleApprove(item)}
                  disabled={!!processingId}
                >
                  {processingId === item.id ? 
                    <ActivityIndicator color="white" /> : 
                    <Text style={styles.btnTextApprove}>Aprobar</Text>
                  }
                </TouchableOpacity>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#E2E8F0" },
  backButton: { padding: 8, backgroundColor: "#F1F5F9", borderRadius: 8 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  content: { padding: 20 },
  card: { backgroundColor: "white", padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  objImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  objName: { fontSize: 16, fontWeight: "bold", color: "#1E293B" },
  userName: { fontSize: 14, color: "#64748B", marginTop: 2 },
  details: { fontSize: 13, color: "#6366F1", marginTop: 4, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnReject: { backgroundColor: "#FEE2E2" },
  btnApprove: { backgroundColor: "#10B981" },
  btnTextReject: { color: "#DC2626", fontWeight: "bold" },
  btnTextApprove: { color: "white", fontWeight: "bold" },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: "#94A3B8" }
});