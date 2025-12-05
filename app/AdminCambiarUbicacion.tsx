import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminCambiarUbicacion() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Coordenadas iniciales (Cochabamba)
  const INITIAL_LAT = -17.392077;
  const INITIAL_LON = -66.149714;

  // Estado para la ubicación seleccionada
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: INITIAL_LAT,
    longitude: INITIAL_LON,
  });

  // --- HTML DEL MAPA LEAFLET ---
  // Incluye lógica para mover el pin y enviar datos a React Native
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .instruction-box {
            position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
            background: rgba(255,255,255,0.8); padding: 5px 10px; border-radius: 5px;
            font-family: sans-serif; font-size: 12px; z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // 1. Inicializar Mapa
        var map = L.map('map').setView([${INITIAL_LAT}, ${INITIAL_LON}], 15);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'OpenStreetMap'
        }).addTo(map);

        // 2. Crear Icono Personalizado (Opcional, para que se vea mejor)
        var blueIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // 3. Agregar Marcador Arrastrable
        var marker = L.marker([${INITIAL_LAT}, ${INITIAL_LON}], {
            draggable: true,
            icon: blueIcon
        }).addTo(map);

        marker.bindPopup("<b>Ubicación Central</b><br>Arrástrame para cambiar.").openPopup();

        // 4. Función para enviar coordenadas a React Native
        function sendLocation(lat, lng) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: lat, longitude: lng }));
            }
        }

        // 5. Evento: Al terminar de arrastrar
        marker.on('dragend', function(e) {
            var position = marker.getLatLng();
            sendLocation(position.lat, position.lng);
            map.panTo(position); // Centrar mapa en el nuevo punto
        });

        // 6. Evento: Al hacer click en el mapa (Mover marcador ahí también)
        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            sendLocation(e.latlng.lat, e.latlng.lng);
            map.panTo(e.latlng);
        });

      </script>
    </body>
    </html>
  `;

  // --- MANEJO DE MENSAJES DEL WEBVIEW ---
  const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.latitude && data.longitude) {
            setSelectedLocation({
                latitude: data.latitude,
                longitude: data.longitude
            });
        }
    } catch (e) {
        console.error("Error parseando coordenadas del mapa", e);
    }
  };

  // --- LÓGICA DE GUARDADO (IGUAL QUE ANTES) ---
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
      // 1. Verificar ID de admin o similar si tienes RLS estricto, 
      // pero aquí asumimos que el usuario ya está autenticado como admin.
      
      const { error } = await supabase
        .from('objetos')
        .update({
          latitud: selectedLocation.latitude,
          longitud: selectedLocation.longitude
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Truco para afectar a todas las filas

      if (error) throw error;

      Alert.alert(
        "¡Ubicación Actualizada!",
        `Todos los objetos ahora están en:\nLat: ${selectedLocation.latitude.toFixed(5)}\nLon: ${selectedLocation.longitude.toFixed(5)}`,
        [{ text: "OK", onPress: () => router.back() }]
      );

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar: " + error.message);
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
          <Text style={styles.headerSubtitle}>Arrastra el marcador o toca el mapa</Text>
        </View>
      </View>

      {/* MAPA LEAFLET */}
      <View style={styles.mapContainer}>
        <WebView
            originWhitelist={['*']}
            source={{ html: leafletHtml }}
            style={{ flex: 1 }}
            onMessage={handleWebViewMessage} // Recibe las coordenadas del JS
            javaScriptEnabled={true}
            domStorageEnabled={true}
        />
      </View>

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
              <Ionicons name="save-outline" size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.saveButtonText}>Guardar Nueva Ubicación</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { flex: 1, backgroundColor: '#f0f0f0' }, // Contenedor para el WebView
  
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