import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminUsuariosScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // 1. Obtener todos los usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre', { ascending: true });

      if (usersError) throw usersError;

      // 2. Obtener alquileres retrasados (Fecha fin < HOY y no devueltos)
      const today = new Date().toISOString().split('T')[0];
      
      const { data: lateRentals, error: rentalsError } = await supabase
        .from('alquileres')
        .select('usuario_id')
        .lt('fecha_fin', today)
        .in('estado', ['activo', 'extendido', 'pendiente_devolucion']);

      if (rentalsError) throw rentalsError;

      // 3. Contar retrasos por usuario
      const lateCounts: Record<string, number> = {};
      lateRentals?.forEach((item: any) => {
        lateCounts[item.usuario_id] = (lateCounts[item.usuario_id] || 0) + 1;
      });

      // 4. Combinar datos y ORDENAR
      const usersWithStats = usersData.map(u => ({
        ...u,
        late_count: lateCounts[u.id] || 0
      }));

      // ---> AQUÍ ESTÁ EL CAMBIO: Ordenar por mayor cantidad de retrasos primero
      usersWithStats.sort((a, b) => b.late_count - a.late_count);

      setUsers(usersWithStats);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockUser = async (id: string, currentStatus: boolean, nombre: string) => {
    const action = currentStatus ? "Desbloquear" : "Suspender";
    
    Alert.alert(
      `Confirmar acción`,
      `¿Estás seguro de que quieres ${action.toLowerCase()} a ${nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, cambiar estado", 
          style: currentStatus ? "default" : "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('usuarios')
                .update({ is_blocked: !currentStatus })
                .eq('id', id);
              
              if (error) throw error;
              
              // Actualizar lista localmente
              setUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked: !currentStatus } : u));
              Alert.alert("Éxito", `Usuario ${currentStatus ? 'desbloqueado' : 'suspendido'} correctamente.`);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(u => 
    u.nombre.toLowerCase().includes(search.toLowerCase()) || 
    u.correo.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, item.is_blocked && styles.blockedCard]}>
      <Image 
        source={{ uri: item.foto_url || 'https://placehold.co/100x100/png' }} 
        style={styles.avatar} 
      />
      
      <View style={styles.info}>
        <Text style={styles.name}>{item.nombre}</Text>
        <Text style={styles.email}>{item.correo}</Text>
        
        <View style={styles.badgesRow}>
            {/* BADGE DE RETRASOS (Solo si tiene) */}
            {item.late_count > 0 && (
                <View style={styles.lateBadge}>
                    <Ionicons name="warning" size={12} color="#B91C1C" />
                    <Text style={styles.lateText}>
                        {item.late_count} {item.late_count === 1 ? 'Retraso' : 'Retrasos'}
                    </Text>
                </View>
            )}

            {/* BADGE DE SUSPENDIDO */}
            {item.is_blocked && (
                <View style={styles.blockedBadge}>
                    <Text style={styles.blockedText}>SUSPENDIDO</Text>
                </View>
            )}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.actionBtn, item.is_blocked ? styles.unblockBtn : styles.blockBtn]}
        onPress={() => toggleBlockUser(item.id, item.is_blocked, item.nombre)}
      >
        <Ionicons 
            name={item.is_blocked ? "lock-open" : "lock-closed"} 
            size={20} 
            color="#fff" 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Gestión de Usuarios</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={{marginRight: 10}} />
        <TextInput 
            placeholder="Buscar por nombre o correo..." 
            style={styles.searchInput} 
            value={search}
            onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No se encontraron usuarios.</Text>}
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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    margin: 20, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB'
  },
  searchInput: { flex: 1, fontSize: 16 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },
  
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15,
    borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, elevation: 2
  },
  blockedCard: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEF2FF' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  email: { fontSize: 12, color: '#6B7280' },
  
  badgesRow: { flexDirection: 'row', marginTop: 6, gap: 8 },

  lateBadge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', 
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, 
    borderWidth: 1, borderColor: '#FECACA' 
  },
  lateText: { color: '#B91C1C', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },

  blockedBadge: { 
    backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6
  },
  blockedText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  actionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  blockBtn: { backgroundColor: '#EF4444' },
  unblockBtn: { backgroundColor: '#10B981' },
});