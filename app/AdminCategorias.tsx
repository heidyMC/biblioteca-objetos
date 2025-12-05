import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminCategorias() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado del Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null); // Si es null, estamos creando
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
      if (error) throw error;
      setCategorias(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (categoria: any = null) => {
    if (categoria) {
      setEditingCat(categoria);
      setNombre(categoria.nombre);
      setDescripcion(categoria.descripcion || '');
    } else {
      setEditingCat(null);
      setNombre('');
      setDescripcion('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    
    setSaving(true);
    try {
      if (editingCat) {
        // Editar existente
        const { error } = await supabase
          .from('categorias')
          .update({ nombre, descripcion })
          .eq('id', editingCat.id);
        if (error) throw error;
        Alert.alert("Éxito", "Categoría actualizada");
      } else {
        // Crear nueva
        const { error } = await supabase
          .from('categorias')
          .insert([{ nombre, descripcion }]);
        if (error) throw error;
        Alert.alert("Éxito", "Categoría creada");
      }
      
      fetchCategorias();
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar Categoría",
      "¿Estás seguro? Si eliminas esta categoría, los objetos asociados podrían quedar sin categoría o causar error si no se actualizan antes.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase.from('categorias').delete().eq('id', id);
              if (error) throw error;
              Alert.alert("Eliminado", "La categoría ha sido eliminada.");
              fetchCategorias();
            } catch (error: any) {
              Alert.alert("No se pudo eliminar", "Es probable que existan objetos vinculados a esta categoría. Elimina o mueve los objetos primero.");
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="pricetag" size={20} color="#6366F1" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.nombre}</Text>
        {item.descripcion ? <Text style={styles.desc} numberOfLines={1}>{item.descripcion}</Text> : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleOpenModal(item)} style={[styles.btn, styles.editBtn]}>
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.btn, styles.deleteBtn]}>
          <Ionicons name="trash" size={16} color="#fff" />
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
        <Text style={styles.title}>Gestionar Categorías</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButtonHeader}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay categorías registradas.</Text>}
        />
      )}

      {/* Modal Agregar/Editar */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCat ? 'Editar Categoría' : 'Nueva Categoría'}</Text>
            
            <Text style={styles.label}>Nombre *</Text>
            <TextInput 
              style={styles.input} 
              value={nombre} 
              onChangeText={setNombre} 
              placeholder="Ej: Electrónica"
            />
            
            <Text style={styles.label}>Descripción</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={descripcion} 
              onChangeText={setDescripcion} 
              placeholder="Breve descripción..."
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtnCancel}>
                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.modalBtnSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnTextSave}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB'
  },
  backButton: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  addButtonHeader: { 
    backgroundColor: '#6366F1', borderRadius: 12, width: 40, height: 40, 
    justifyContent: 'center', alignItems: 'center', shadowColor: "#6366F1", 
    shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 3 
  },
  
  list: { padding: 20 },
  card: { 
    backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, 
    shadowRadius: 4, elevation: 2
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  desc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  editBtn: { backgroundColor: '#F59E0B' },
  deleteBtn: { backgroundColor: '#EF4444' },
  empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.25, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1F2937' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#F9FAFB' },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  modalBtnCancel: { paddingVertical: 12, paddingHorizontal: 16 },
  modalBtnTextCancel: { color: '#6B7280', fontWeight: 'bold', fontSize: 16 },
  modalBtnSave: { backgroundColor: '#6366F1', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, minWidth: 100, alignItems: 'center' },
  modalBtnTextSave: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});