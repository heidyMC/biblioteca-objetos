import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/theme';
import { IconSymbol } from './ui/icon-symbol';

// Agregamos userId y onSuccess a las propiedades (props)
interface RentalsReturnModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;     // <--- IMPORTANTE: Recibir el ID del usuario
  onSuccess: () => void; // <--- Para actualizar los tokens en la pantalla principal
}

export default function RentalsReturnModal({ visible, onClose, userId, onSuccess }: RentalsReturnModalProps) {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (visible && userId) { // Solo carga si hay usuario
      fetchActiveRentals();
    }
  }, [visible, userId]);

  const fetchActiveRentals = async () => {
    setLoading(true);
    try {
      // YA NO usamos supabase.auth.getUser(). Usamos el userId que nos pasaron.
      
      const { data, error } = await supabase
        .from('alquileres')
        .select(`
          id,
          fecha_fin,
          tokens_totales,
          estado,
          objetos (
            id,
            nombre,
            imagen_url
          )
        `)
        .eq('usuario_id', userId) // <--- Usamos el prop userId
        .eq('estado', 'activo');

      if (error) throw error;
      setRentals(data || []);
    } catch (error) {
      console.error('Error al cargar alquileres:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeStatus = (fechaFinStr: string) => {
    if (!fechaFinStr) return { status: 'unknown', text: 'Fecha desc.' };
    
    const [year, month, day] = fechaFinStr.split('-').map(Number);
    const endDate = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      return { status: 'ontime', text: diffDays === 0 ? 'Vence hoy' : `${diffDays} días restantes` };
    } else {
      return { status: 'late', text: `Vencido hace ${Math.abs(diffDays)} días` };
    }
  };

  const handleReturnObject = async (alquilerId: string, objetoId: string, isLate: boolean) => {
    setProcessing(true);
    try {
      // 1. Finalizar alquiler
      const { error: rentalError } = await supabase
        .from('alquileres')
        .update({ estado: 'completado' })
        .eq('id', alquilerId);

      if (rentalError) throw rentalError;

      // 2. Liberar objeto
      const { error: objError } = await supabase
        .from('objetos')
        .update({ disponible: true })
        .eq('id', objetoId);
      
      if (objError) throw objError;

      // 3. Recompensa (si es a tiempo)
      if (!isLate) {
        const { data: profileData } = await supabase
          .from('usuarios')
          .select('tokens_disponibles')
          .eq('id', userId)
          .single();

        const currentTokens = profileData?.tokens_disponibles || 0;
        const reward = 10;

        await supabase
          .from('usuarios')
          .update({ tokens_disponibles: currentTokens + reward })
          .eq('id', userId);
          
        Alert.alert("¡Excelente!", `Devolución a tiempo confirmada. +${reward} tokens agregados.`);
        onSuccess(); // Actualizamos la pantalla de atrás
      } else {
        Alert.alert("Devolución registrada", "El objeto se devolvió con retraso. No se otorgaron tokens.");
      }

      fetchActiveRentals(); // Recargar la lista para que desaparezca el objeto

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setProcessing(false);
    }
  };

  const onTimeRentals = rentals.filter(r => getTimeStatus(r.fecha_fin).status === 'ontime');
  const lateRentals = rentals.filter(r => getTimeStatus(r.fecha_fin).status === 'late');

  const renderItem = (item: any, statusInfo: any) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.objName}>{item.objetos?.nombre || "Objeto"}</Text>
        <Text style={[styles.timeText, { color: statusInfo.status === 'ontime' ? '#4CAF50' : '#F44336' }]}>
          {statusInfo.text}
        </Text>
      </View>
      
      <TouchableOpacity
        style={[
            styles.actionButton, 
            { backgroundColor: statusInfo.status === 'ontime' ? '#10B981' : '#F59E0B' }
        ]}
        onPress={() => handleReturnObject(item.id, item.objetos.id, statusInfo.status === 'late')}
        disabled={processing}
      >
        <Text style={styles.actionButtonText}>
            {processing ? "..." : "Devolver"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Devolver Objetos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={{fontSize: 24, color: '#999'}}>✕</Text> 
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 20 }} />
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              
              {onTimeRentals.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>✅ A Tiempo (+10 Tokens)</Text>
                  {onTimeRentals.map(item => renderItem(item, getTimeStatus(item.fecha_fin)))}
                </View>
              )}

              {lateRentals.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>⚠️ Vencidos (Sin premio)</Text>
                  {lateRentals.map(item => renderItem(item, getTimeStatus(item.fecha_fin)))}
                </View>
              )}

              {rentals.length === 0 && (
                <View style={{alignItems:'center', marginTop: 40}}>
                    <Text style={{fontSize: 40}}>📦</Text>
                    <Text style={styles.emptyText}>No tienes alquileres activos para devolver.</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    height: '75%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  objName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 16,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  }
});