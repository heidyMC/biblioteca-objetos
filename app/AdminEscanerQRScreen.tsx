import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function AdminEscanerQRScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para el modal de confirmación
  const [modalVisible, setModalVisible] = useState(false);
  const [alquilerData, setAlquilerData] = useState<any>(null);

  if (!permission) {
    // Permisos aún cargando
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
            <Text style={styles.btnText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    Vibration.vibrate(); // Feedback táctil
    procesarCodigo(data);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim().length > 0) {
        setScanned(true);
        procesarCodigo(manualCode.trim());
    } else {
        Alert.alert("Error", "Escribe un código válido");
    }
  };

  const procesarCodigo = async (codigo: string) => {
    setLoading(true);
    try {
        // Buscamos el alquiler por ID (asumiendo que el QR es el ID del alquiler)
        // También traemos datos del usuario y del objeto para mostrar info útil
        const { data, error } = await supabase
            .from('alquileres')
            .select(`
                *,
                usuarios (nombre, correo),
                objetos (nombre, imagen_url)
            `)
            .eq('id', codigo) // O usa 'codigo_devolucion' si prefieres usar ese campo
            .single();

        if (error || !data) {
            Alert.alert("No encontrado", "No se encontró ningún alquiler con ese código.", [
                { text: "OK", onPress: () => setScanned(false) }
            ]);
            return;
        }

        setAlquilerData(data);
        setModalVisible(true);

    } catch (err) {
        console.log(err);
        Alert.alert("Error", "Ocurrió un error al procesar el código.", [
            { text: "OK", onPress: () => setScanned(false) }
        ]);
    } finally {
        setLoading(false);
    }
  };

  const actualizarEstado = async (nuevoEstado: string) => {
    try {
        const { error } = await supabase
            .from('alquileres')
            .update({ estado: nuevoEstado })
            .eq('id', alquilerData.id);

        if (error) throw error;

        Alert.alert("Éxito", `El alquiler ha sido marcado como: ${nuevoEstado.toUpperCase()}`);
        setModalVisible(false);
        setManualCode('');
        
        // Volver a escanear después de un momento
        setTimeout(() => setScanned(false), 1000);

    } catch (error: any) {
        Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Escanear QR</Text>
            <View style={{width: 40}} />
        </View>

        {/* CÁMARA */}
        <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
                barcodeTypes: ["qr"],
            }}
        />

        {/* OVERLAY DE ESCANEO */}
        <View style={styles.overlay}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.middleContainer}>
                <View style={styles.unfocusedContainer}></View>
                <View style={styles.focusedContainer}>
                    {!scanned && <View style={styles.laser} />}
                </View>
                <View style={styles.unfocusedContainer}></View>
            </View>
            <View style={styles.unfocusedContainer}></View>
        </View>

        {/* SECCIÓN MANUAL INFERIOR */}
        <View style={styles.bottomPanel}>
            <Text style={styles.label}>¿No funciona el código QR?</Text>
            <View style={styles.inputRow}>
                <TextInput 
                    style={styles.input}
                    placeholder="Ingresa el código manual"
                    value={manualCode}
                    onChangeText={setManualCode}
                    placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.btnManual} onPress={handleManualSubmit}>
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>

        {/* MODAL DE ACCIÓN */}
        <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalBg}>
                <View style={styles.modalCard}>
                    {alquilerData && (
                        <>
                            <Text style={styles.modalTitle}>Gestión de Alquiler</Text>
                            
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Cliente:</Text>
                                <Text style={styles.infoVal}>{alquilerData.usuarios?.nombre}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Objeto:</Text>
                                <Text style={styles.infoVal}>{alquilerData.objetos?.nombre}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Estado Actual:</Text>
                                <Text style={[styles.infoVal, {fontWeight:'bold', color: '#6366F1'}]}>
                                    {alquilerData.estado.toUpperCase()}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.actionLabel}>Selecciona una acción:</Text>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, {backgroundColor: '#10B981'}]}
                                    onPress={() => actualizarEstado('activo')}
                                >
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.actionText}>Entregar (Activar)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.actionBtn, {backgroundColor: '#3B82F6', marginTop: 10}]}
                                    onPress={() => actualizarEstado('completado')}
                                >
                                    <Ionicons name="archive" size={20} color="#fff" />
                                    <Text style={styles.actionText}>Recibir (Devolución)</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity 
                                style={styles.closeBtn} 
                                onPress={() => { setModalVisible(false); setScanned(false); }}
                            >
                                <Text style={styles.closeText}>Cancelar</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>

        {loading && (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{color: '#fff', marginTop: 10}}>Procesando...</Text>
            </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  backButton: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  message: { textAlign: 'center', paddingBottom: 10, color: '#fff', marginTop: 100 },
  btnPermiso: { backgroundColor: '#6366F1', padding: 15, borderRadius: 10, alignSelf: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },

  // Overlay Cámara
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  middleContainer: { flexDirection: 'row', flex: 1.5 },
  focusedContainer: { flex: 10, borderColor: '#fff', borderWidth: 2, borderRadius: 20, backgroundColor: 'transparent', justifyContent: 'center' },
  laser: { width: '100%', height: 2, backgroundColor: '#ef4444', opacity: 0.7 },

  // Panel Inferior
  bottomPanel: {
    position: 'absolute', bottom: 40, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5
  },
  label: { marginBottom: 10, color: '#374151', fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { 
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, 
    padding: 12, marginRight: 10, fontSize: 16, color: '#1F2937' 
  },
  btnManual: {
    backgroundColor: '#6366F1', width: 50, height: 50, 
    borderRadius: 12, justifyContent: 'center', alignItems: 'center'
  },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1F2937' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { color: '#6B7280', fontSize: 14 },
  infoVal: { color: '#1F2937', fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 15 },
  actionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10, color: '#374151' },
  actionButtons: { marginBottom: 15 },
  actionBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    padding: 15, borderRadius: 12, gap: 10 
  },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { alignSelf: 'center', padding: 10 },
  closeText: { color: '#EF4444', fontWeight: '600' },

  loader: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 20 
  }
});