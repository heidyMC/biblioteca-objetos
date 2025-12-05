import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminListaObjetos() {
  const router = useRouter();
  const [objetos, setObjetos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Cargar objetos cada vez que entramos a la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchObjetos();
    }, [])
  );

  const fetchObjetos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('objetos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setObjetos(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, nombre: string) => {
    Alert.alert(
      "Confirmar Eliminación",
      `¿Estás seguro de que quieres eliminar "${nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: () => deleteObject(id) 
        }
      ]
    );
  };

  const deleteObject = async (id: string) => {
    try {
      // 1. Eliminar relaciones primero
      await supabase.from('imagenes_objeto').delete().eq('objeto_id', id);
      await supabase.from('caracteristicas_objeto').delete().eq('objeto_id', id);
      
      // 2. Eliminar el objeto principal
      const { error } = await supabase.from('objetos').delete().eq('id', id);
      
      if (error) throw error;

      Alert.alert("Eliminado", "El objeto ha sido eliminado correctamente.");
      fetchObjetos(); 

    } catch (error: any) {
      Alert.alert("Error", "No se pudo eliminar: " + error.message);
    }
  };

  const filteredObjetos = objetos.filter(obj => 
    obj.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imagen_url || 'https://via.placeholder.com/100' }} style={styles.image} />
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.nombre}</Text>
        <Text style={styles.price}>{item.precio_tokens_dia} Tokens</Text>
        <Text style={[styles.status, { color: item.disponible ? '#10B981' : '#EF4444' }]}>
            {item.disponible ? 'Disponible' : 'No Disponible'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
            style={[styles.actionBtn, styles.editBtn]} 
            onPress={() => router.push({ pathname: '/AdminEditarObjeto', params: { id: item.id } })}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={[styles.actionBtn, styles.deleteBtn]} 
            onPress={() => handleDelete(item.id, item.nombre)}
        >
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Inventario</Text>
        
        <View style={{flexDirection: 'row', gap: 15}}>
            {/* BOTÓN PARA GESTIONAR CATEGORÍAS */}
            <TouchableOpacity onPress={() => router.push('/AdminCategorias')}>
                <Ionicons name="pricetags" size={28} color="#6366F1" />
            </TouchableOpacity>

            {/* Botón rápido para agregar objeto */}
            <TouchableOpacity onPress={() => router.push('/AdminAgregarObjeto')}>
                <Ionicons name="add-circle" size={32} color="#4F46E5" />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={{marginRight: 10}} />
        <TextInput 
            placeholder="Buscar objeto..." 
            style={styles.searchInput} 
            value={search}
            onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={filteredObjetos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron objetos.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff' 
  },
  backButton: { padding: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    margin: 20, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB'
  },
  searchInput: { flex: 1, fontSize: 16 },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    padding: 12, alignItems: 'center', shadowColor: "#000", shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  image: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#eee' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '600', color: '#6366F1' },
  status: { fontSize: 12, marginTop: 2 },
  
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  editBtn: { backgroundColor: '#F59E0B' },
  deleteBtn: { backgroundColor: '#EF4444' },
});