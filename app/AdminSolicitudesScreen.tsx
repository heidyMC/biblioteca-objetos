import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function AdminSolicitudesScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Estados para Validación/Escáner
  const [permission, requestPermission] = useCameraPermissions();
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [scanned, setScanned] = useState(false);

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
      .order('created_at', { ascending: true });

    if (error) console.error(error);
    else setRequests(data || []);
    setLoading(false);
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

  const openVerification = async (item: any) => {
    setSelectedRequest(item);
    setScanned(false);
    setManualCode('');
    setMode('scan');
    setVerifyModalVisible(true);
    
    if (!permission?.granted) {
        await requestPermission();
    }
  };

  const confirmDelivery = async () => {
    if (!selectedRequest) return;
    setVerifyModalVisible(false);
    setProcessingId(selectedRequest.id);

    try {
      const { error } = await supabase
        .from('alquileres')
        .update({ estado: 'activo' })
        .eq('id', selectedRequest.id);

      if (error) throw error;
      Alert.alert("¡Entrega Exitosa!", "El alquiler ahora está activo.");
      loadRequests();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setProcessingId(null);
      setSelectedRequest(null);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || !selectedRequest) return;
    
    if (data === selectedRequest.codigo_entrega) {
        setScanned(true);
        Alert.alert("Código Correcto", "QR verificado exitosamente.", [
            { text: "Confirmar Entrega", onPress: confirmDelivery }
        ]);
    } else {
        setScanned(true);
        Alert.alert("Código Incorrecto", "El QR escaneado no coincide con esta solicitud.", [
            { text: "Intentar de nuevo", onPress: () => setScanned(false) }
        ]);
    }
  };

  const handleManualVerify = () => {
    if (manualCode.toUpperCase() === selectedRequest.codigo_entrega) {
        confirmDelivery();
    } else {
        Alert.alert("Error", "Código incorrecto");
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
                  onPress={() => openVerification(item)}
                  disabled={!!processingId}
                >
                  {processingId === item.id ? 
                    <ActivityIndicator color="white" /> : 
                    <Text style={styles.btnTextApprove}>Validar Entrega</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL DE VALIDACIÓN */}
      <Modal visible={verifyModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Validar Entrega</Text>
                    <TouchableOpacity onPress={() => setVerifyModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity onPress={() => setMode('scan')} style={[styles.tab, mode === 'scan' && styles.activeTab]}>
                        <Ionicons name="qr-code-outline" size={20} color={mode === 'scan' ? '#6366F1' : '#666'} />
                        <Text style={[styles.tabText, mode === 'scan' && styles.activeTabText]}>Escanear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMode('manual')} style={[styles.tab, mode === 'manual' && styles.activeTab]}>
                        <Ionicons name="keypad-outline" size={20} color={mode === 'manual' ? '#6366F1' : '#666'} />
                        <Text style={[styles.tabText, mode === 'manual' && styles.activeTabText]}>Código</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                    {mode === 'scan' ? (
                        <View style={styles.cameraContainer}>
                            {permission?.granted ? (
                                <CameraView
                                    style={StyleSheet.absoluteFillObject}
                                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                    barcodeScannerSettings={{
                                        barcodeTypes: ["qr"],
                                    }}
                                />
                            ) : (
                                <View style={styles.permContainer}>
                                    <Text style={{textAlign:'center', marginBottom:10}}>Necesitamos acceso a la cámara</Text>
                                    <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
                                        <Text style={{color:'white'}}>Dar Permiso</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <View style={styles.scannerOverlay}>
                                <View style={styles.scanFrame} />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.manualContainer}>
                            <Text style={styles.manualLabel}>Ingresa el código del cliente:</Text>
                            <TextInput 
                                style={styles.manualInput}
                                placeholder="ABC123"
                                value={manualCode}
                                onChangeText={setManualCode}
                                autoCapitalize="characters"
                                maxLength={6}
                            />
                            <TouchableOpacity style={styles.manualBtn} onPress={handleManualVerify}>
                                <Text style={styles.manualBtnText}>Validar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
      </Modal>
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
  emptyText: { marginTop: 16, color: "#94A3B8" },
  
  // Modal Estilos
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', height: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  tabs: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 8, borderRadius: 8 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { fontWeight: '600', color: '#666' },
  activeTabText: { color: '#6366F1' },
  modalBody: { flex: 1 },
  cameraContainer: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  scannerOverlay: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#fff', borderRadius: 20 },
  permContainer: { alignItems: 'center', padding: 20 },
  permButton: { backgroundColor: '#6366F1', padding: 10, borderRadius: 8 },
  manualContainer: { padding: 20, alignItems: 'center' },
  manualLabel: { fontSize: 16, marginBottom: 10, color: '#374151' },
  manualInput: { width: '100%', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 24, textAlign: 'center', letterSpacing: 4, marginBottom: 20, fontWeight: 'bold' },
  manualBtn: { backgroundColor: '#10B981', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  manualBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});