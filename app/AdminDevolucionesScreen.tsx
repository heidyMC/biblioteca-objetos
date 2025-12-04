import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AdminGenerarQRModal from '@/components/AdminGenerarQRModal';

export default function AdminDevolucionesScreen() {
  const router = useRouter();
  const [alquileres, setAlquileres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el Modal QR
  const [modalVisible, setModalVisible] = useState(false);
  const [qrData, setQrData] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAlquileres();
    }, [])
  );

  const fetchAlquileres = async () => {
    try {
      setLoading(true);
      // Traemos tanto los activos (para devolver) como los pendientes de devolución
      const { data, error } = await supabase
        .from('alquileres')
        .select(`
          *,
          usuarios (nombre, correo, foto_url),
          objetos (nombre, imagen_url)
        `)
        .in('estado', ['activo', 'pendiente_devolucion'])
        .order('fecha_fin', { ascending: true });

      if (error) throw error;
      setAlquileres(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalQR = (item: any) => {
    setQrData({
        id: item.id,
        accion: 'devolucion', // Estamos en pantalla de devoluciones
        usuario: item.usuarios?.nombre || 'Usuario',
        objeto: item.objetos?.nombre || 'Objeto'
    });
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image source={{ uri: item.objetos?.imagen_url }} style={styles.objImage} />
        <View style={styles.info}>
            <Text style={styles.objName}>{item.objetos?.nombre}</Text>
            <Text style={styles.userName}>👤 {item.usuarios?.nombre}</Text>
            <Text style={styles.date}>Vence: {new Date(item.fecha_fin).toLocaleDateString()}</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.estado.toUpperCase()}</Text>
        </View>
        
        <TouchableOpacity style={styles.qrButton} onPress={() => abrirModalQR(item)}>
            <Ionicons name="qr-code" size={18} color="#fff" />
            <Text style={styles.qrText}>Generar QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Gestionar Devoluciones</Text>
        <View style={{width: 30}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={alquileres}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay devoluciones pendientes.</Text>}
        />
      )}

      {/* MODAL GENERADOR DE QR */}
      <AdminGenerarQRModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        data={qrData} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  list: { padding: 20 },
  empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 },
  row: { flexDirection: 'row', marginBottom: 10 },
  objImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#eee' },
  info: { marginLeft: 12, flex: 1, justifyContent: 'center' },
  objName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  userName: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  date: { fontSize: 12, color: '#EF4444', marginTop: 2, fontWeight: '600' },

  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  statusBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#6366F1', fontSize: 10, fontWeight: 'bold' },
  
  qrButton: { flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center' },
  qrText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 5 }
});