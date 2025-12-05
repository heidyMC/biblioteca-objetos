import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminCambiarUbicacion() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Coordenadas iniciales (Cochabamba por defecto o la que prefieras)
  const [region, setRegion] = useState({
    latitude: -17.392077,
    longitude: -66.149714,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Estado para la ubicación seleccionada (inicia igual que la región)
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: -17.392077,
    longitude: -66.149714,
  });

  const handleUpdateLocations = () => {
    Alert.alert(
      "¿Cambiar ubicación de TODO?",
      "Esto actualizará la latitud y longitud de TODOS los objetos en la base de datos a esta nueva ubicación. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, actualizar todo", onPress: performUpdate, style: 'destructive' }
      ]
    );
  };

  const performUpdate = async () => {
    setLoading(true);
    try {
      // Actualizamos TODOS los objetos donde el ID no sea nulo (es decir, todos)
      // Usamos un filtro "dummy" (id no igual a '0') para que Supabase permita el update masivo
      // si tienes RLS activado, asegúrate de ser admin.
      const { error, count } = await supabase
        .from('objetos')
        .update({
          latitud: selectedLocation.latitude,
          longitud: selectedLocation.longitude
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Truco para seleccionar todos

      if (error) throw error;

      Alert.alert(
        "¡Ubicación Actualizada!",
        `Se han movido los objetos a la nueva ubicación central.`,
        [{ text: "OK", onPress: () => router.back() }]
      );

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar la ubicación: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header flotante */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Definir Ubicación Central</Text>
          <Text style={styles.headerSubtitle}>Mueve el pin a la nueva ubicación</Text>
        </View>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE} // Usa Google Maps si está configurado, si no quita esta línea
        initialRegion={region}
        onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
        onRegionChangeComplete={setRegion} // Opcional: para que el mapa no se resetee
      >
        <Marker
          coordinate={selectedLocation}
          draggable
          onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
          title="Nueva Ubicación Central"
          description="Todos los objetos se moverán aquí"
          pinColor="#4F46E5" // Color índigo/azul
        />
      </MapView>

      {/* Panel inferior de acción */}
      <View style={styles.footer}>
        <View style={styles.coordsContainer}>
          <Text style={styles.coordLabel}>Lat: {selectedLocation.latitude.toFixed(6)}</Text>
          <Text style={styles.coordLabel}>Lon: {selectedLocation.longitude.toFixed(6)}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]} 
          onPress={handleUpdateLocations}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="location" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.saveButtonText}>Establecer Ubicación</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: '100%', height: '100%' },
  
  headerContainer: {
    position: 'absolute', top: 50, left: 20, right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16, padding: 15,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: "#000", shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
    zIndex: 10
  },
  backButton: { padding: 5, marginRight: 10 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  headerSubtitle: { fontSize: 12, color: '#6B7280' },

  footer: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    shadowColor: "#000", shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6
  },
  coordsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  coordLabel: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
  
  saveButton: {
    backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center'
  },
  disabledButton: { backgroundColor: '#A5B4FC' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});