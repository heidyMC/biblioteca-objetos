import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Clipboard, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

interface AdminGenerarQRModalProps {
  visible: boolean;
  onClose: () => void;
  data: {
    id: string; // ID del alquiler
    accion: 'entrega' | 'devolucion'; // Qué estamos haciendo
    usuario: string; // Nombre del usuario
    objeto: string; // Nombre del objeto
  } | null;
}

export default function AdminGenerarQRModal({ visible, onClose, data }: AdminGenerarQRModalProps) {
  if (!data) return null;

  // El string que irá en el QR (JSON para que sea fácil de leer)
  const qrValue = JSON.stringify({
    id: data.id,
    accion: data.accion
  });

  const copiarCodigo = () => {
    Clipboard.setString(data.id);
    Alert.alert("Copiado", "Código copiado al portapapeles");
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            {data.accion === 'entrega' ? 'Entregar Objeto' : 'Recibir Devolución'}
          </Text>
          <Text style={styles.subtitle}>Pide al usuario que escanee este código</Text>

          <View style={styles.qrContainer}>
            <QRCode value={qrValue} size={200} />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Cliente:</Text>
            <Text style={styles.infoValue}>{data.usuario}</Text>
            <Text style={styles.infoLabel}>Objeto:</Text>
            <Text style={styles.infoValue}>{data.objeto}</Text>
          </View>

          <View style={styles.manualCodeContainer}>
            <Text style={styles.manualLabel}>¿Problemas con la cámara?</Text>
            <Text style={styles.manualSub}>Usa este código manual:</Text>
            <TouchableOpacity style={styles.codeBox} onPress={copiarCodigo}>
              <Text style={styles.codeText}>{data.id}</Text>
              <Ionicons name="copy-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.buttonClose} onPress={onClose}>
            <Text style={styles.textStyle}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { margin: 20, backgroundColor: "white", borderRadius: 20, padding: 35, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  qrContainer: { padding: 20, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
  infoContainer: { width: '100%', marginBottom: 20, backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10 },
  infoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  infoValue: { fontSize: 16, color: '#1F2937', fontWeight: 'bold', marginBottom: 5 },
  manualCodeContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  manualLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  manualSub: { fontSize: 12, color: '#6B7280', marginBottom: 5 },
  codeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#C7D2FE' },
  codeText: { fontSize: 12, fontFamily: 'monospace', color: '#4F46E5', marginRight: 10 },
  buttonClose: { backgroundColor: "#EF4444", borderRadius: 10, padding: 10, elevation: 2, width: '100%' },
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" }
});