import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Vibration, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function UserEscanerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.msg}>Necesitamos acceso a tu cámara para confirmar la entrega.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPermiso}><Text style={styles.btnText}>Permitir</Text></TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    Vibration.vibrate();
    try {
      // Intentamos leer el JSON del QR
      const parsedData = JSON.parse(data);
      procesarTransaccion(parsedData.id, parsedData.accion);
    } catch (e) {
      // Si falla, asumimos que es solo el ID (código manual)
      // Por defecto asumimos 'entrega' si no se especifica, o preguntamos.
      // Para simplificar, usaremos el ID directo.
      procesarTransaccion(data, 'auto'); 
    }
  };

  const handleManual = () => {
    if(manualCode.length > 5) procesarTransaccion(manualCode.trim(), 'auto');
    else Alert.alert("Error", "Código inválido");
  };

  const procesarTransaccion = async (id: string, accion: string) => {
    setLoading(true);
    try {
      // 1. Obtener el alquiler para verificar estado
      const { data: alquiler, error: fetchError } = await supabase
        .from('alquileres')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !alquiler) throw new Error("Alquiler no encontrado");

      // 2. Determinar la acción correcta si viene 'auto'
      let nuevoEstado = '';
      let mensajeExito = '';

      // Lógica de estados
      if (accion === 'entrega' || (accion === 'auto' && alquiler.estado === 'pendiente_aprobacion')) {
         nuevoEstado = 'activo';
         mensajeExito = "¡Has recibido el objeto! Disfrútalo.";
      } else if (accion === 'devolucion' || (accion === 'auto' && alquiler.estado === 'activo')) {
         nuevoEstado = 'completado'; // O 'pendiente_revision' si prefieres
         mensajeExito = "¡Objeto devuelto correctamente! Gracias.";
      } else {
         throw new Error(`El estado actual (${alquiler.estado}) no permite esta acción.`);
      }

      // 3. Actualizar
      const { error: updateError } = await supabase
        .from('alquileres')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (updateError) throw updateError;

      Alert.alert("¡Listo!", mensajeExito, [{ text: "Volver", onPress: () => router.back() }]);

    } catch (error: any) {
      Alert.alert("Error", error.message);
      setScanned(false); // Permitir escanear de nuevo
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}><Ionicons name="close-circle" size={40} color="#fff" /></TouchableOpacity>
            <Text style={styles.title}>Escanea el código del Admin</Text>
        </View>
        <View style={styles.centerMarker} />
        
        <View style={styles.footer}>
            <Text style={styles.label}>¿Código manual?</Text>
            <View style={styles.inputRow}>
                <TextInput style={styles.input} placeholder="Ingresa el ID del alquiler" value={manualCode} onChangeText={setManualCode} />
                <TouchableOpacity onPress={handleManual} style={styles.goBtn} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff"/> : <Ionicons name="arrow-forward" size={24} color="#fff" />}
                </TouchableOpacity>
            </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  msg: { color: '#fff', textAlign: 'center', marginTop: 100 },
  btnPermiso: { backgroundColor: '#6366F1', padding: 10, borderRadius: 5, alignSelf: 'center', marginTop: 20 },
  btnText: { color: '#fff' },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  header: { alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  centerMarker: { width: 250, height: 250, borderWidth: 2, borderColor: '#fff', alignSelf: 'center', borderRadius: 20 },
  footer: { backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  label: { fontWeight: 'bold', marginBottom: 10, color: '#333' },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#f9f9f9' },
  goBtn: { backgroundColor: '#6366F1', padding: 12, borderRadius: 8, justifyContent: 'center' }
});