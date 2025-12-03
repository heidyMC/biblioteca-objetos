import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, StyleSheet, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase'; 
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminEditarObjeto() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Recibimos el ID del objeto a editar
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Cargando datos...');

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [image, setImage] = useState<string | null>(null); // Portada
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  // Estados extra
  const [imagenesGaleria, setImagenesGaleria] = useState<string[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<{id?: string, nombre: string, valor: string}[]>([]);
  
  // Modal características
  const [modalVisible, setModalVisible] = useState(false);
  const [tempCharNombre, setTempCharNombre] = useState('');
  const [tempCharValor, setTempCharValor] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      // 1. Cargar Categorías
      const { data: cats } = await supabase.from('categorias').select('id, nombre').order('nombre');
      if (cats) setCategorias(cats);

      if (!id) return; // Si no hay ID, algo anda mal

      // 2. Cargar Datos del Objeto
      const { data: objeto, error } = await supabase.from('objetos').select('*').eq('id', id).single();
      if (error) throw error;

      setNombre(objeto.nombre);
      setDescripcion(objeto.descripcion || '');
      setPrecio(objeto.precio_tokens_dia.toString());
      setImage(objeto.imagen_url);
      setCategoriaSeleccionada(objeto.categoria_id);

      // 3. Cargar Galería
      const { data: galeria } = await supabase.from('imagenes_objeto').select('url').eq('objeto_id', id);
      if (galeria) setImagenesGaleria(galeria.map(img => img.url));

      // 4. Cargar Características
      const { data: chars } = await supabase.from('caracteristicas_objeto').select('*').eq('objeto_id', id);
      if (chars) setCaracteristicas(chars);

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los datos del objeto');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // --- MISMAS FUNCIONES DE IMAGEN QUE EN AGREGAR ---
  const pickImage = async (useCamera: boolean, isForGallery: boolean) => {
    if (useCamera) {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) return Alert.alert("Permiso", "Se necesita cámara.");
    } else {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) return Alert.alert("Permiso", "Se necesita galería.");
    }

    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !isForGallery,
        aspect: [4, 3],
        quality: 0.5,
        allowsMultipleSelection: isForGallery && !useCamera,
    };

    const result = useCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
        if (isForGallery) {
            const newUris = result.assets.map(asset => asset.uri);
            setImagenesGaleria([...imagenesGaleria, ...newUris]);
        } else {
            setImage(result.assets[0].uri);
        }
    }
  };

  // Helper para mostrar opciones
  const showOptions = (isGallery: boolean) => {
    Alert.alert(isGallery ? "Galería" : "Portada", "Selecciona origen:", [
        { text: "Cancelar", style: "cancel" },
        { text: "Cámara", onPress: () => pickImage(true, isGallery) },
        { text: "Galería", onPress: () => pickImage(false, isGallery) }
    ]);
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...imagenesGaleria];
    newGallery.splice(index, 1);
    setImagenesGaleria(newGallery);
  };

  const addCharacteristic = () => {
    if (tempCharNombre && tempCharValor) {
        setCaracteristicas([...caracteristicas, { nombre: tempCharNombre, valor: tempCharValor }]);
        setTempCharNombre(''); setTempCharValor(''); setModalVisible(false);
    }
  };

  const removeCharacteristic = (index: number) => {
    const newChars = [...caracteristicas];
    newChars.splice(index, 1);
    setCaracteristicas(newChars);
  };

  // --- LÓGICA DE GUARDADO (UPDATE) ---
  const uploadFile = async (uri: string) => {
    if (uri.startsWith('http')) return uri; // Si ya es URL remota, no subir
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const { error } = await supabase.storage.from('objetos').upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
    if (error) throw error;
    const { data } = supabase.storage.from('objetos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      // 1. Actualizar Portada (si cambió)
      setStatusMessage('Actualizando portada...');
      const portadaUrl = await uploadFile(image!);

      // 2. Actualizar Objeto
      setStatusMessage('Guardando cambios...');
      const { error: updateError } = await supabase.from('objetos').update({
        nombre,
        descripcion,
        precio_tokens_dia: parseInt(precio),
        categoria_id: categoriaSeleccionada,
        imagen_url: portadaUrl
      }).eq('id', id);

      if (updateError) throw updateError;

      // 3. Actualizar Galería
      // Estrategia simple: Borrar anteriores e insertar las actuales
      // (Nota: Esto no borra los archivos del Storage para ahorrar complejidad, solo las referencias en BD)
      setStatusMessage('Actualizando galería...');
      await supabase.from('imagenes_objeto').delete().eq('objeto_id', id);
      
      for (const uri of imagenesGaleria) {
          const url = await uploadFile(uri);
          await supabase.from('imagenes_objeto').insert({ objeto_id: id, url });
      }

      // 4. Actualizar Características
      setStatusMessage('Actualizando características...');
      await supabase.from('caracteristicas_objeto').delete().eq('objeto_id', id);
      
      const charsToInsert = caracteristicas.map(c => ({
          objeto_id: id, nombre: c.nombre, valor: c.valor
      }));
      if (charsToInsert.length > 0) await supabase.from('caracteristicas_objeto').insert(charsToInsert);

      Alert.alert('Éxito', 'Objeto actualizado correctamente', [{ text: 'OK', onPress: () => router.back() }]);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Objeto</Text>
        <View style={{width: 40}} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Portada */}
          <TouchableOpacity onPress={() => showOptions(false)} style={styles.coverContainer}>
            <Image source={{ uri: image || undefined }} style={styles.coverImage} />
            <View style={styles.editBadge}><Ionicons name="pencil" size={14} color="#fff" /></View>
          </TouchableOpacity>

          {/* Formulario */}
          <View style={styles.card}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
            
            <Text style={styles.label}>Descripción</Text>
            <TextInput style={[styles.input, styles.textArea]} value={descripcion} onChangeText={setDescripcion} multiline />

            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                    <Text style={styles.label}>Precio</Text>
                    <TextInput style={styles.input} value={precio} onChangeText={setPrecio} keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.label}>Categoría</Text>
                    <View style={styles.pickerBox}>
                        <Picker selectedValue={categoriaSeleccionada} onValueChange={setCategoriaSeleccionada} style={{width: '100%'}}>
                            {categorias.map(c => <Picker.Item key={c.id} label={c.nombre} value={c.id} />)}
                        </Picker>
                    </View>
                </View>
            </View>

            {/* Galería */}
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
                <Text style={styles.subTitle}>Galería</Text>
                <TouchableOpacity onPress={() => showOptions(true)}><Text style={styles.link}>+ Editar Fotos</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 10}}>
                {imagenesGaleria.map((uri, idx) => (
                    <View key={idx} style={{marginRight: 10}}>
                        <Image source={{ uri }} style={styles.thumb} />
                        <TouchableOpacity onPress={() => removeGalleryImage(idx)} style={styles.delBadge}>
                            <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>

            {/* Características */}
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
                <Text style={styles.subTitle}>Características</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}><Text style={styles.link}>+ Agregar</Text></TouchableOpacity>
            </View>
            {caracteristicas.map((c, idx) => (
                <View key={idx} style={styles.charRow}>
                    <Text style={{flex: 1}}><Text style={{fontWeight: 'bold'}}>{c.nombre}: </Text>{c.valor}</Text>
                    <TouchableOpacity onPress={() => removeCharacteristic(idx)}>
                        <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            ))}

            <TouchableOpacity style={[styles.btn, saving && {opacity: 0.7}]} onPress={handleUpdate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar Cambios</Text>}
            </TouchableOpacity>
          </View>
          <View style={{height: 40}} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal igual que antes... */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
            <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Nueva Característica</Text>
                <TextInput placeholder="Nombre" style={styles.input} value={tempCharNombre} onChangeText={setTempCharNombre} />
                <TextInput placeholder="Valor" style={styles.input} value={tempCharValor} onChangeText={setTempCharValor} />
                <View style={styles.rowBetween}>
                    <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{color: 'red', padding: 10}}>Cancelar</Text></TouchableOpacity>
                    <TouchableOpacity onPress={addCharacteristic}><Text style={{color: 'blue', padding: 10, fontWeight: 'bold'}}>Agregar</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 5 },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  coverContainer: { alignSelf: 'center', marginBottom: 20 },
  coverImage: { width: 150, height: 150, borderRadius: 12, backgroundColor: '#ddd' },
  editBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#6366F1', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  label: { fontWeight: '600', marginBottom: 5, color: '#374151' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 8, marginBottom: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  pickerBox: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden', height: 50, justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  subTitle: { fontSize: 16, fontWeight: 'bold' },
  link: { color: '#6366F1', fontWeight: 'bold' },
  thumb: { width: 60, height: 60, borderRadius: 8 },
  delBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  charRow: { flexDirection: 'row', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 5, alignItems: 'center' },
  btn: { backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', width: '80%', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }
});