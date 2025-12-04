import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminTopUsuariosScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopUsers();
  }, []);

  const fetchTopUsers = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener todos los alquileres (solo necesitamos el ID del usuario)
      const { data: rentals, error: rentalError } = await supabase
        .from('alquileres')
        .select('usuario_id');

      if (rentalError) throw rentalError;

      if (!rentals || rentals.length === 0) {
        setUsers([]);
        return;
      }

      // 2. Contar cuántos alquileres tiene cada usuario
      const counts: Record<string, number> = {};
      rentals.forEach((r) => {
        if (r.usuario_id) {
          counts[r.usuario_id] = (counts[r.usuario_id] || 0) + 1;
        }
      });

      // 3. Ordenar de mayor a menor y tomar los Top 10
      const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 10);

      if (sortedIds.length === 0) {
        setUsers([]);
        return;
      }

      // 4. Obtener la información personal de esos usuarios (Nombre, Foto, etc.)
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre, correo, foto_url')
        .in('id', sortedIds);

      if (userError) throw userError;

      // 5. Combinar la información y armar la lista final
      const combinedData = sortedIds.map(id => {
        const user = userData?.find(u => u.id === id);
        return user ? { ...user, rentalsCount: counts[id] } : null;
      }).filter(Boolean); // Eliminar nulos si hubo algún error

      setUsers(combinedData);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <View style={styles.card}>
      {/* Medalla o Número de Posición */}
      <View style={styles.rankContainer}>
        {index === 0 ? <Ionicons name="trophy" size={24} color="#FFD700" /> : // Oro
         index === 1 ? <Ionicons name="trophy" size={24} color="#C0C0C0" /> : // Plata
         index === 2 ? <Ionicons name="trophy" size={24} color="#CD7F32" /> : // Bronce
         <Text style={styles.rankText}>#{index + 1}</Text>}
      </View>
      
      <Image 
        source={{ uri: item.foto_url || 'https://placehold.co/100x100/png' }} 
        style={styles.avatar} 
      />
      
      <View style={styles.info}>
        <Text style={styles.name}>{item.nombre}</Text>
        <Text style={styles.email}>{item.correo}</Text>
      </View>
      
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{item.rentalsCount}</Text>
        <Text style={styles.countLabel}>Rentas</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Mejores Clientes</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Aún no hay alquileres registrados.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#E5E7EB',
  },
  backButton: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  list: { padding: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15,
    borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, elevation: 2
  },
  rankContainer: { width: 40, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#6B7280' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginHorizontal: 10, backgroundColor: '#EEF2FF' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  email: { fontSize: 12, color: '#9CA3AF' },
  countBadge: { alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
  countText: { fontSize: 16, fontWeight: 'bold', color: '#6366F1' },
  countLabel: { fontSize: 10, color: '#6366F1' },
  empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' }
});