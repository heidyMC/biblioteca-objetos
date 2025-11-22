import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface RentalsReturnModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export default function RentalsReturnModal({ visible, onClose, userId, onSuccess }: RentalsReturnModalProps) {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Estado para el input del código
  const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");

  useEffect(() => {
    if (visible && userId) {
      fetchActiveRentals();
      setSelectedRentalId(null);
      setInputCode("");
    }
  }, [visible, userId]);

  const fetchActiveRentals = async () => {
    setLoading(true);
    try {
      // Consultamos alquileres activos o pendientes
      const { data, error } = await supabase
        .from('alquileres')
        .select(`
          id,
          fecha_fin,
          estado,
          codigo_devolucion,
          objetos (
            id,
            nombre
          )
        `)
        .eq('usuario_id', userId)
        .in('estado', ['activo', 'pendiente_devolucion']); 

      if (error) throw error;
      setRentals(data || []);
    } catch (error) {
      console.error('Error al cargar alquileres:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generar código de 6 caracteres
  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleRequestReturn = async (alquilerId: string) => {
    setProcessing(true);
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
        "Por favor, acércate al administrador y pídele que te dicte el código de devolución."
      );
      
      fetchActiveRentals(); // Recargar para ver el cambio de estado
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyAndReturn = async (alquiler: any) => {
    if (!inputCode || inputCode.length !== 6) {
      Alert.alert("Código inválido", "Ingresa el código de 6 caracteres.");
      return;
    }

    // Verificar código (ignorando mayúsculas/minúsculas)
    if (inputCode.toUpperCase() !== alquiler.codigo_devolucion) {
      Alert.alert("Error", "El código ingresado es incorrecto.");
      return;
    }

    setProcessing(true);
    try {
      // 1. Finalizar alquiler en BD
      const { error: rentalError } = await supabase
        .from('alquileres')
        .update({ estado: 'completado' })
        .eq('id', alquiler.id);

      if (rentalError) throw rentalError;

      // 2. Liberar objeto (ponerlo disponible)
      const { error: objError } = await supabase
        .from('objetos')
        .update({ disponible: true })
        .eq('id', alquiler.objetos.id);
      
      if (objError) throw objError;

      // 3. Lógica de recompensa (Tokens)
      // Calculamos si está a tiempo comparando fechas
      const fechaFin = new Date(alquiler.fecha_fin);
      const hoy = new Date();
      // Resetear horas para comparar solo fechas
      fechaFin.setHours(0,0,0,0);
      hoy.setHours(0,0,0,0);

      const isLate = hoy > fechaFin;
      
      if (!isLate) {
        // Traer tokens actuales
        const { data: userData } = await supabase
          .from('usuarios')
          .select('tokens_disponibles')
          .eq('id', userId)
          .single();

        if (userData) {
            const reward = 10;
            await supabase
            .from('usuarios')
            .update({ tokens_disponibles: (userData.tokens_disponibles || 0) + reward })
            .eq('id', userId);
            
            Alert.alert("¡Excelente!", `Devolución a tiempo. +${reward} tokens ganados.`);
        }
      } else {
        Alert.alert("Devolución Completada", "Objeto devuelto correctamente (con retraso).");
      }

      onSuccess(); // Actualizar pantalla padre
      onClose();   // Cerrar modal

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessing(false);
    }
  };

  const renderItem = (item: any) => {
    const isPendingCode = item.estado === 'pendiente_devolucion';
    const isSelected = selectedRentalId === item.id;

    return (
      <View key={item.id} style={[styles.card, isPendingCode && styles.cardPending]}>
        <View style={styles.cardInfo}>
          <Text style={styles.objName}>{item.objetos?.nombre || "Objeto"}</Text>
          <Text style={styles.statusText}>
            {isPendingCode ? "Esperando código del admin..." : "En alquiler"}
          </Text>
        </View>
        
        {!isPendingCode ? (
           <TouchableOpacity
             style={styles.actionButton}
             onPress={() => handleRequestReturn(item.id)}
             disabled={processing}
           >
             <Text style={styles.actionButtonText}>Devolver</Text>
           </TouchableOpacity>
        ) : (
           <View style={styles.codeContainer}>
             {isSelected ? (
               <View style={{alignItems: 'flex-end'}}>
                 <TextInput 
                    style={styles.codeInput}
                    placeholder="CÓDIGO"
                    placeholderTextColor="#999"
                    maxLength={6}
                    autoCapitalize="characters"
                    value={inputCode}
                    onChangeText={setInputCode}
                 />
                 <TouchableOpacity 
                    style={[styles.verifyButton, processing && {opacity: 0.5}]}
                    onPress={() => handleVerifyAndReturn(item)}
                    disabled={processing}
                 >
                    <Text style={styles.verifyButtonText}>Confirmar</Text>
                 </TouchableOpacity>
               </View>
             ) : (
               <TouchableOpacity 
                  style={styles.enterCodeButton}
                  onPress={() => {
                      setSelectedRentalId(item.id);
                      setInputCode(""); // Limpiar input al abrir
                  }}
               >
                  <Text style={styles.enterCodeText}>Ingresar Código</Text>
               </TouchableOpacity>
             )}
           </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Devolver Objetos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 20 }} />
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              {rentals.length === 0 ? (
                <View style={{alignItems:'center', marginTop: 40}}>
                    <Text style={{fontSize: 40}}>📦</Text>
                    <Text style={styles.emptyText}>No tienes objetos pendientes.</Text>
                </View>
              ) : (
                rentals.map(item => renderItem(item))
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '90%', height: '65%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  closeButton: { padding: 5 },
  content: { paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 10, color: '#9CA3AF', fontSize: 16 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardPending: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  cardInfo: { flex: 1, marginRight: 12 },
  objName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusText: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  actionButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#6366F1' },
  actionButtonText: { color: 'white', fontWeight: '700', fontSize: 12 },
  codeContainer: { alignItems: 'flex-end' },
  enterCodeButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F59E0B', borderRadius: 8 },
  enterCodeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  codeInput: { borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: 'white', borderRadius: 6, padding: 8, width: 100, textAlign: 'center', marginBottom: 6, letterSpacing: 2, fontSize: 16, fontWeight: 'bold' },
  verifyButton: { backgroundColor: '#10B981', padding: 8, borderRadius: 6, width: 100, alignItems: 'center' },
  verifyButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});