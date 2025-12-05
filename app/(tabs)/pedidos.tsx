import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

type Alquiler = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_alquiler: number;
  tokens_totales: number;
  estado: "activo" | "completado" | "extendido" | "pendiente_devolucion" | "pendiente_aprobacion" | "rechazado";
  codigo_devolucion?: string;
  codigo_entrega?: string;
  created_at: string;
  objetos: {
    id: string;
    nombre: string;
    imagen_url: string;
  };
};

export default function MisPedidosScreen() {
  const [alquileres, setAlquileres] = useState<Alquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Estado para almacenar el ID del usuario actual para la suscripción Realtime
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estado para el código de devolución
  const [inputCode, setInputCode] = useState<{[key: string]: string}>({});

  // Estados para el QR de entrega
  const [qrVisible, setQrVisible] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadAlquileres();
    }, [])
  );

  // --- SUSCRIPCIÓN REALTIME ---
  useEffect(() => {
    if (!currentUserId) return;

    // Escuchar cambios (UPDATE) en la tabla alquileres para este usuario
    const channel = supabase
      .channel('pedidos-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alquileres',
          filter: `usuario_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("🔄 Cambio detectado en alquileres, recargando...");
          loadAlquileres(false); // Recargar datos sin mostrar spinner de carga completa
          
          // Si el estado cambió a activo, cerramos el QR automáticamente
          if (payload.new.estado === 'activo') {
             setQrVisible(false);
             Alert.alert("¡Entrega Confirmada!", "Tu alquiler ha comenzado.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const loadAlquileres = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("usuario");
      if (!userData) return;
      const user = JSON.parse(userData);
      setCurrentUserId(user.id); // Guardamos el ID para el useEffect

      const { data, error } = await supabase
        .from("alquileres")
        .select(`
          *,
          objetos (
            id,
            nombre,
            imagen_url
          )
        `)
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlquileres(data || []);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // 1. Solicitar devolución (Generar código y cambiar estado)
  const handleRequestReturn = async (alquilerId: string) => {
    setProcessingId(alquilerId);
    try {
      const newCode = generateCode();
      
      const { error } = await supabase
        .from('alquileres')
        .update({ 
          estado: 'pendiente_devolucion',
          codigo_devolucion: newCode
        })
        .eq('id', alquilerId);

      if (error) throw error;

      Alert.alert(
        "Solicitud Enviada", 
        "Acércate al administrador y pídele que te dicte el código de confirmación."
      );
      
      loadAlquileres();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 2. Confirmar devolución (Validar código ingresado)
  const handleConfirmReturn = async (alquiler: Alquiler) => {
    const code = inputCode[alquiler.id];
    
    if (!code || code.length !== 6) {
      Alert.alert("Código inválido", "Ingresa el código de 6 caracteres.");
      return;
    }

    if (code.toUpperCase() !== alquiler.codigo_devolucion) {
      Alert.alert("Error", "El código ingresado es incorrecto.");
      return;
    }

    setProcessingId(alquiler.id);
    try {
      // Finalizar alquiler
      const { error: rentalError } = await supabase
        .from('alquileres')
        .update({ estado: 'completado' })
        .eq('id', alquiler.id);

      if (rentalError) throw rentalError;

      // Liberar objeto
      await supabase
        .from('objetos')
        .update({ disponible: true })
        .eq('id', alquiler.objetos.id);

      // Recompensa por tiempo (opcional, simplificado aquí)
      const fechaFin = new Date(alquiler.fecha_fin);
      const hoy = new Date();
      fechaFin.setHours(0,0,0,0);
      hoy.setHours(0,0,0,0);

      if (hoy <= fechaFin) {
        const userData = await AsyncStorage.getItem("usuario");
        if (userData) {
            const user = JSON.parse(userData);
            const { data: userFresh } = await supabase.from('usuarios').select('tokens_disponibles').eq('id', user.id).single();
            
            if (userFresh) {
                await supabase
                .from('usuarios')
                .update({ tokens_disponibles: userFresh.tokens_disponibles + 10 })
                .eq('id', user.id);
                
                Alert.alert("¡Devolución Exitosa!", "Has ganado +10 tokens por devolver a tiempo.");
            }
        }
      } else {
        Alert.alert("Devolución Completada", "Objeto devuelto correctamente.");
      }

      // Limpiar input y recargar
      setInputCode(prev => {
          const newState = {...prev};
          delete newState[alquiler.id];
          return newState;
      });
      loadAlquileres();

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo": return "#3B82F6";
      case "completado": return "#10B981";
      case "pendiente_devolucion": return "#F59E0B";
      case "pendiente_aprobacion": return "#A855F7";
      case "rechazado": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case "activo": return "En uso";
      case "completado": return "Devuelto";
      case "pendiente_devolucion": return "Devolución en proceso";
      case "pendiente_aprobacion": return "Solicitado";
      case "rechazado": return "Rechazado";
      default: return estado;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
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
            <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No tienes pedidos activos o pasados.</Text>
          </View>
        ) : (
          alquileres.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
                    {getStatusText(item.estado)}
                  </Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>

              <View style={styles.cardBody}>
                <Image 
                  source={{ uri: item.objetos?.imagen_url || "https://placehold.co/100x100" }} 
                  style={styles.image} 
                />
                <View style={styles.infoContainer}>
                  <Text style={styles.objName}>{item.objetos?.nombre || "Objeto desconocido"}</Text>
                  <Text style={styles.tokensText}>Total: {item.tokens_totales} tokens</Text>
                  <Text style={styles.durationText}>{item.dias_alquiler} días de alquiler</Text>
                </View>
              </View>

              {/* ACCIONES SEGÚN ESTADO */}
              <View style={styles.cardFooter}>
                
                {/* ESTADO ACTIVO: Botón para devolver */}
                {item.estado === 'activo' && (
                  <TouchableOpacity 
                    style={styles.returnButton}
                    onPress={() => handleRequestReturn(item.id)}
                    disabled={!!processingId}
                  >
                    {processingId === item.id ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <>
                            <Ionicons name="return-down-back" size={18} color="#FFF" />
                            <Text style={styles.returnButtonText}>Devolver Objeto</Text>
                        </>
                    )}
                  </TouchableOpacity>
                )}

                {/* ESTADO PENDIENTE DEVOLUCIÓN: Input para código */}
                {item.estado === 'pendiente_devolucion' && (
                  <View style={styles.returnProcessContainer}>
                    <Text style={styles.instructionText}>
                      Dicta tu nombre al admin e ingresa el código que te dé:
                    </Text>
                    <View style={styles.codeRow}>
                      <TextInput 
                        style={styles.codeInput}
                        placeholder="CÓDIGO"
                        maxLength={6}
                        autoCapitalize="characters"
                        value={inputCode[item.id] || ''}
                        onChangeText={(text) => setInputCode({...inputCode, [item.id]: text})}
                      />
                      <TouchableOpacity 
                        style={styles.confirmButton}
                        onPress={() => handleConfirmReturn(item)}
                        disabled={!!processingId}
                      >
                         {processingId === item.id ? (
                            <ActivityIndicator color="#FFF" size="small" />
                         ) : (
                            <Text style={styles.confirmButtonText}>Confirmar</Text>
                         )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ESTADO PENDIENTE APROBACIÓN: MOSTRAR CÓDIGO/QR PARA RECOGER */}
                {item.estado === 'pendiente_aprobacion' && (
                    <View style={styles.pendingContainer}>
                        <Text style={styles.infoText}>Solicitud enviada. Muestra este código para recoger:</Text>
                        
                        <View style={styles.pickupCodeRow}>
                            <View style={styles.codeBadge}>
                                <Text style={styles.codeBadgeText}>{item.codigo_entrega || "..."}</Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.qrButton}
                                onPress={() => {
                                    setSelectedQrCode(item.codigo_entrega || "");
                                    setQrVisible(true);
                                }}
                            >
                                <Ionicons name="qr-code" size={20} color="#fff" />
                                <Text style={styles.qrButtonText}>Ver QR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                
                {item.estado === 'completado' && (
                    <View style={styles.completedContainer}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.completedText}>Devolución exitosa</Text>
                    </View>
                )}

              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para mostrar el QR */}
      <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={() => setQrVisible(false)}>
        <View style={styles.qrModalOverlay}>
            <View style={styles.qrModalContent}>
                <TouchableOpacity style={styles.closeQr} onPress={() => setQrVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.qrTitle}>Código de Entrega</Text>
                <Text style={styles.qrCodeText}>{selectedQrCode}</Text>
                {selectedQrCode ? (
                    <Image 
                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${selectedQrCode}` }} 
                        style={{ width: 250, height: 250 }} 
                    />
                ) : null}
                <Text style={styles.qrHelper}>Muestra este código al administrador</Text>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1E293B" },
  content: { padding: 16 },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "700" },
  dateText: { fontSize: 12, color: "#94A3B8" },
  cardBody: { flexDirection: "row", marginBottom: 16 },
  image: { width: 70, height: 70, borderRadius: 10, backgroundColor: "#F1F5F9" },
  infoContainer: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  objName: { fontSize: 16, fontWeight: "bold", color: "#1E293B", marginBottom: 4 },
  tokensText: { fontSize: 14, color: "#6366F1", fontWeight: "600" },
  durationText: { fontSize: 12, color: "#64748B", marginTop: 2 },
  cardFooter: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 12 },
  returnButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  returnButtonText: { color: "white", fontWeight: "bold", fontSize: 14 },
  returnProcessContainer: { gap: 8 },
  instructionText: { fontSize: 12, color: "#64748B", fontStyle: 'italic' },
  codeRow: { flexDirection: 'row', gap: 10 },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: 'bold',
    backgroundColor: "#F8FAFC",
  },
  confirmButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: { color: "white", fontWeight: "bold" },
  infoText: { fontSize: 13, color: "#64748B", textAlign: 'center', fontStyle: 'italic' },
  completedContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  completedText: { color: "#10B981", fontWeight: "600", fontSize: 13 },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { marginTop: 12, color: "#94A3B8", fontSize: 16 },
  
  // Nuevos estilos para QR y Entrega
  pendingContainer: { alignItems: 'center', marginTop: 10, gap: 8 },
  pickupCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  codeBadge: { backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  codeBadgeText: { fontSize: 18, fontWeight: 'bold', color: '#374151', letterSpacing: 2 },
  qrButton: { flexDirection: 'row', backgroundColor: '#6366F1', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', gap: 6 },
  qrButtonText: { color: '#fff', fontWeight: '600' },
  qrModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  qrModalContent: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', width: '85%' },
  closeQr: { position: 'absolute', top: 15, right: 15 },
  qrTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#1F2937' },
  qrCodeText: { fontSize: 24, fontWeight: '900', color: '#6366F1', letterSpacing: 4, marginBottom: 20 },
  qrHelper: { marginTop: 20, color: '#6B7280', textAlign: 'center' }
});