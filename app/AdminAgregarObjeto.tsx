import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase'; 
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminAgregarObjeto() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Guardando...');
  
  // --- ESTADOS DEL FORMULARIO PRINCIPAL ---
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [image, setImage] = useState<string | null>(null); // Portada
  
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

  // --- ESTADOS DE GALERÍA Y CARACTERÍSTICAS ---
  const [imagenesGaleria, setImagenesGaleria] = useState<string[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<{nombre: string, valor: string}[]>([]);
  
  // Modal Características
  const [modalVisible, setModalVisible] = useState(false);
  const [tempCharNombre, setTempCharNombre] = useState('');
  const [tempCharValor, setTempCharValor] = useState('');

  // --- ESTADOS NUEVOS: MODAL CATEGORÍA ---
  const [modalCatVisible, setModalCatVisible] = useState(false);
  const [newCatNombre, setNewCatNombre] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase.from('categorias').select('id, nombre').order('nombre');
      if (error) throw error;
      if (data && data.length > 0) {
        setCategorias(data);
        if (!categoriaSeleccionada) {
            setCategoriaSeleccionada(data[0].id);
        }
      }
    } catch (error) {
      console.log('Error cargando categorías:', error);
    }
  };

  // --- LÓGICA DE NUEVA CATEGORÍA ---
  const handleCreateCategory = async () => {
    if (!newCatNombre.trim()) {
        Alert.alert("Error", "El nombre de la categoría es obligatorio");
        return;
    }
    setCreatingCat(true);
    try {
        const { data, error } = await supabase.from('categorias')
            .insert([{ nombre: newCatNombre.trim(), descripcion: newCatDesc.trim() }])
            .select()
            .single();
        
        if (error) throw error;

        await fetchCategorias(); 
        if (data) setCategoriaSeleccionada(data.id);
        
        setModalCatVisible(false);
        setNewCatNombre('');
        setNewCatDesc('');
        Alert.alert("Éxito", "Categoría creada y seleccionada");
    } catch (error: any) {
        Alert.alert("Error", error.message || "No se pudo crear la categoría");
    } finally {
        setCreatingCat(false);
    }
  };

  // --- LÓGICA DE IMÁGENES ---
  const showCoverOptions = () => {
    Alert.alert("Foto de Portada", "Selecciona una opción:", [
      { text: "Cancelar", style: "cancel" },
      { text: "📷 Cámara", onPress: () => pickImage(true, false) },
      { text: "🖼️ Galería", onPress: () => pickImage(false, false) }
    ]);
  };

  const showGalleryOptions = () => {
    Alert.alert("Galería de Imágenes", "¿Cómo quieres agregar fotos?", [
      { text: "Cancelar", style: "cancel" },
      { text: "📷 Tomar Foto", onPress: () => pickImage(true, true) },
      { text: "🖼️ Abrir Galería", onPress: () => pickImage(false, true) }
    ]);
  };

  const pickImage = async (useCamera: boolean, isForGallery: boolean) => {
    if (useCamera) {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) return Alert.alert("Permiso", "Se necesita acceso a la cámara.");
    } else {
        const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) return Alert.alert("Permiso", "Se necesita acceso a la galería.");
    }

    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: !isForGallery, 
        aspect: [4, 3],
        quality: 0.5,
        allowsMultipleSelection: isForGallery && !useCamera,
        selectionLimit: isForGallery ? 5 : 1,
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

  const removeGalleryImage = (index: number) => {
    const newGallery = [...imagenesGaleria];
    newGallery.splice(index, 1);
    setImagenesGaleria(newGallery);
  };

  // --- LÓGICA DE CARACTERÍSTICAS ---
  const addCharacteristic = () => {
    if (tempCharNombre.trim() && tempCharValor.trim()) {
        setCaracteristicas([...caracteristicas, { nombre: tempCharNombre, valor: tempCharValor }]);
        setTempCharNombre('');
        setTempCharValor('');
        setModalVisible(false);
    } else {
        Alert.alert("Error", "Completa nombre y valor");
    }
  };

  const removeCharacteristic = (index: number) => {
    const newChars = [...caracteristicas];
    newChars.splice(index, 1);
    setCaracteristicas(newChars);
  };

  // --- SUBIDA DE ARCHIVOS ---
  const uploadFileToSupabase = async (uri: string, bucket: string) => {
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage.from(bucket).upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- GUARDADO FINAL (ACTUALIZADO) ---
  const handleSubmit = async () => {
    if (!nombre || !precio || !image || !categoriaSeleccionada) {
      Alert.alert('Faltan datos', 'Completa los campos obligatorios y la foto de portada.');
      return;
    }

    setLoading(true);
    try {
      // 1. Obtener Ubicación Dinámica (la que tienen todos los objetos)
      let latitudToSave = -17.392077; // Default si no hay objetos
      let longitudToSave = -66.149714;

      // Consultamos cualquier objeto existente para copiar su ubicación
      const { data: existingObj } = await supabase
        .from('objetos')
        .select('latitud, longitud')
        .limit(1)
        .single();

      if (existingObj && existingObj.latitud && existingObj.longitud) {
        latitudToSave = existingObj.latitud;
        longitudToSave = existingObj.longitud;
      }

      // 2. Subir Portada
      setStatusMessage('Subiendo portada...');
      const portadaUrl = await uploadFileToSupabase(image, 'objetos');

      // 3. Crear Objeto en DB
      setStatusMessage('Guardando información...');
      const { data: objetoData, error: dbError } = await supabase
        .from('objetos')
        .insert([{
            nombre,
            descripcion,
            precio_tokens_dia: parseInt(precio),
            categoria_id: categoriaSeleccionada,
            imagen_url: portadaUrl,
            disponible: true,
            latitud: latitudToSave,   // <-- USAMOS LA UBICACIÓN DINÁMICA
            longitud: longitudToSave  // <-- USAMOS LA UBICACIÓN DINÁMICA
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      const nuevoObjetoId = objetoData.id;

      // 4. Subir Imágenes de Galería
      if (imagenesGaleria.length > 0) {
        setStatusMessage(`Subiendo ${imagenesGaleria.length} imágenes extra...`);
        for (const uri of imagenesGaleria) {
            const galeriaUrl = await uploadFileToSupabase(uri, 'objetos');
            await supabase.from('imagenes_objeto').insert({
                objeto_id: nuevoObjetoId,
                url: galeriaUrl
            });
        }
      }

      // 5. Guardar Características
      if (caracteristicas.length > 0) {
        setStatusMessage('Guardando características...');
        const charsToInsert = caracteristicas.map(c => ({
            objeto_id: nuevoObjetoId,
            nombre: c.nombre,
            valor: c.valor
        }));
        await supabase.from('caracteristicas_objeto').insert(charsToInsert);
      }

      Alert.alert('¡Éxito!', 'Objeto publicado correctamente en la ubicación de la biblioteca.', [{ text: 'OK', onPress: () => router.back() }]);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Objeto</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.sectionLabel}>Foto de Portada (Solo 1)</Text>
          <TouchableOpacity onPress={showCoverOptions} style={styles.coverContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="camera" size={40} color="#6366F1" />
                <Text style={styles.placeholderText}>Subir Portada</Text>
              </View>
            )}
            {image && <View style={styles.editBadge}><Ionicons name="pencil" size={14} color="#fff" /></View>}
          </TouchableOpacity>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: PlayStation 5" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput style={[styles.input, styles.textArea]} value={descripcion} onChangeText={setDescripcion} placeholder="Detalles..." multiline />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Precio (Tokens) *</Text>
                <TextInput style={styles.input} value={precio} onChangeText={setPrecio} keyboardType="numeric" placeholder="0" />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={styles.label}>Categoría</Text>
                    <TouchableOpacity onPress={() => setModalCatVisible(true)}>
                        <Text style={styles.addCategoryLink}>+ Nueva</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={categoriaSeleccionada} onValueChange={(v) => setCategoriaSeleccionada(v)} style={styles.picker}>
                    {categorias.map((c) => <Picker.Item key={c.id} label={c.nombre} value={c.id} />)}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={styles.divider} />
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.subHeader}>Galería de Imágenes</Text>
                <TouchableOpacity onPress={showGalleryOptions}>
                    <Text style={styles.addLink}>+ Agregar Fotos</Text>
                </TouchableOpacity>
            </View>
            
            {imagenesGaleria.length === 0 ? (
                <Text style={styles.emptyText}>No hay imágenes extra.</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                    {imagenesGaleria.map((uri, index) => (
                        <View key={index} style={styles.galleryItem}>
                            <Image source={{ uri }} style={styles.galleryImg} />
                            <TouchableOpacity onPress={() => removeGalleryImage(index)} style={styles.removeBtn}>
                                <Ionicons name="close" size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            <View style={styles.divider} />
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.subHeader}>Características</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Text style={styles.addLink}>+ Agregar</Text>
                </TouchableOpacity>
            </View>

            {caracteristicas.length === 0 ? (
                <Text style={styles.emptyText}>No hay características añadidas.</Text>
            ) : (
                caracteristicas.map((char, index) => (
                    <View key={index} style={styles.charRow}>
                        <Text style={styles.charText}>
                            <Text style={{fontWeight: 'bold'}}>{char.nombre}: </Text>{char.valor}
                        </Text>
                        <TouchableOpacity onPress={() => removeCharacteristic(index)}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ))
            )}

            <TouchableOpacity style={[styles.saveButton, loading && styles.disabledBtn]} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <ActivityIndicator color="#fff" style={{marginRight: 8}} />
                    <Text style={styles.saveBtnText}>{statusMessage}</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Publicar Objeto</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL 1: NUEVA CARACTERÍSTICA */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nueva Característica</Text>
                <TextInput style={styles.modalInput} placeholder="Nombre (Ej: Marca)" value={tempCharNombre} onChangeText={setTempCharNombre} />
                <TextInput style={styles.modalInput} placeholder="Valor (Ej: Sony)" value={tempCharValor} onChangeText={setTempCharValor} />
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtnCancel}>
                        <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={addCharacteristic} style={styles.modalBtnAdd}>
                        <Text style={styles.modalBtnTextAdd}>Agregar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* MODAL 2: NUEVA CATEGORÍA */}
      <Modal animationType="fade" transparent={true} visible={modalCatVisible} onRequestClose={() => setModalCatVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Crear Categoría</Text>
                <Text style={{color:'#666', marginBottom: 10, fontSize: 13}}>Añade una nueva categoría al sistema.</Text>
                
                <TextInput 
                    style={styles.modalInput} 
                    placeholder="Nombre (Ej: Deportes)" 
                    value={newCatNombre} 
                    onChangeText={setNewCatNombre} 
                />
                <TextInput 
                    style={styles.modalInput} 
                    placeholder="Descripción (Opcional)" 
                    value={newCatDesc} 
                    onChangeText={setNewCatDesc} 
                />
                
                <View style={styles.modalButtons}>
                    <TouchableOpacity onPress={() => setModalCatVisible(false)} style={styles.modalBtnCancel}>
                        <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCreateCategory} style={styles.modalBtnAdd} disabled={creatingCat}>
                        {creatingCat ? <ActivityIndicator color="#fff" size="small"/> : <Text style={styles.modalBtnTextAdd}>Crear</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: '#E5E7EB',
  },
  backButton: { padding: 8, marginLeft: -8 },
  title: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, textAlign: 'center' },
  
  coverContainer: { alignSelf: 'center', marginBottom: 20 },
  coverImage: { width: 160, height: 160, borderRadius: 16, backgroundColor: '#fff' },
  coverPlaceholder: { 
    width: 160, height: 160, borderRadius: 16, backgroundColor: '#EEF2FF', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#C7D2FE', borderStyle: 'dashed' 
  },
  placeholderText: { color: '#6366F1', marginTop: 8, fontSize: 12, fontWeight: '600' },
  editBadge: { 
    position: 'absolute', bottom: -5, right: -5, backgroundColor: '#6366F1', 
    width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' 
  },

  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowOpacity: 0.05, elevation: 2 },
  inputGroup: { marginBottom: 16 },
  label: { marginBottom: 6, fontWeight: '600', color: '#374151', fontSize: 14 },
  addCategoryLink: { color: '#6366F1', fontWeight: 'bold', fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', padding: 12, borderRadius: 10, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },
  pickerContainer: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, height: 50, justifyContent: 'center', overflow: 'hidden' },
  picker: { width: '100%', height: '100%' },

  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 15 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subHeader: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  addLink: { color: '#6366F1', fontWeight: '600', fontSize: 14 },
  emptyText: { color: '#9CA3AF', fontSize: 13, fontStyle: 'italic', marginBottom: 5 },
  
  galleryScroll: { flexDirection: 'row', marginBottom: 5 },
  galleryItem: { marginRight: 10, position: 'relative' },
  galleryImg: { width: 70, height: 70, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },

  charRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, marginBottom: 8 },
  charText: { fontSize: 14, color: '#374151' },

  saveButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  disabledBtn: { backgroundColor: '#A7F3D0' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#1F2937' },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, backgroundColor: '#F9FAFB' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtnCancel: { padding: 12, flex: 1, alignItems: 'center' },
  modalBtnTextCancel: { color: '#6B7280', fontWeight: '600' },
  modalBtnAdd: { backgroundColor: '#6366F1', paddingVertical: 12, borderRadius: 8, flex: 1, alignItems: 'center', marginLeft: 10 },
  modalBtnTextAdd: { color: '#fff', fontWeight: '600' },
});