import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, Modal, ScrollView 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminSoporteScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [])
  );

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticket_soporte')
        .select(`
          *,
          usuarios ( nombre, correo, foto_url )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ticket_soporte')
        .update({ estado: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Actualizar lista local
      setTickets(prev => prev.map(t => t.id === id ? { ...t, estado: newStatus } : t));
      
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket({ ...selectedTicket, estado: newStatus });
      }
      
      Alert.alert("Actualizado", `El ticket ahora está: ${newStatus.replace('_', ' ')}`);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente': return '#EF4444'; // Rojo
      case 'en_proceso': return '#F59E0B'; // Naranja
      case 'resuelto': return '#10B981'; // Verde
      default: return '#6B7280';
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => { setSelectedTicket(item); setModalVisible(true); }}
    >
      <View style={[styles.statusStrip, { backgroundColor: getStatusColor(item.estado) }]} />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.asunto}>{item.asunto}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
            {item.estado.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        
        <Text style={styles.userText}>👤 {item.usuarios?.nombre || "Usuario desconocido"}</Text>
        <Text style={styles.descText} numberOfLines={2}>{item.descripcion}</Text>
        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Soporte Técnico</Text>
        <View style={{width: 40}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay tickets de soporte.</Text>}
        />
      )}

      {/* Modal de Detalle */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalle del Ticket</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            </View>
            
            {selectedTicket && (
                <ScrollView style={{maxHeight: 400}}>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Usuario:</Text>
                        <Text style={styles.value}>{selectedTicket.usuarios?.nombre}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Correo:</Text>
                        <Text style={styles.value}>{selectedTicket.usuarios?.correo}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Asunto:</Text>
                        <Text style={styles.value}>{selectedTicket.asunto}</Text>
                    </View>
                    
                    <Text style={[styles.label, {marginTop: 10}]}>Descripción:</Text>
                    <View style={styles.descBox}>
                        <Text style={styles.descFull}>{selectedTicket.descripcion}</Text>
                    </View>

                    <Text style={[styles.label, {marginTop: 15}]}>Cambiar Estado:</Text>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity 
                            style={[styles.actionBtn, {backgroundColor: '#F59E0B'}]}
                            onPress={() => updateStatus(selectedTicket.id, 'en_proceso')}
                        >
                            <Text style={styles.btnText}>En Proceso</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.actionBtn, {backgroundColor: '#10B981'}]}
                            onPress={() => updateStatus(selectedTicket.id, 'resuelto')}
                        >
                            <Text style={styles.btnText}>Resolver</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#E5E7EB'
  },
  backButton: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  list: { padding: 20 },
  empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
  
  card: { 
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, 
    overflow: 'hidden', alignItems: 'center', paddingRight: 15, elevation: 2 
  },
  statusStrip: { width: 6, height: '100%' },
  cardContent: { flex: 1, padding: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  asunto: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  userText: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  descText: { fontSize: 13, color: '#6B7280' },
  dateText: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  label: { fontWeight: 'bold', width: 80, color: '#374151' },
  value: { flex: 1, color: '#1F2937' },
  descBox: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginTop: 5, borderWidth: 1, borderColor: '#E5E7EB' },
  descFull: { color: '#374151' },
  
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});