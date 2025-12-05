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
  // Estas solo sirven para donde arranca el mapa
  const INITIAL_LAT = -17.392077;
  const INITIAL_LON = -66.149714;

  const [location, setLocation] = useState({
    latitude: INITIAL_LAT,
    longitude: INITIAL_LON,
  });

  // HTML DEL MAPA (Pin fijo en el centro)
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        
        /* Pin Fijo en el Centro (CSS puro) */
        #center-pin {
          position: absolute;
          top: 50%; left: 50%;
          width: 40px; height: 40px;
          margin-top: -40px; /* Ajuste para que la punta esté en el centro */
          margin-left: -20px;
          z-index: 999;
          pointer-events: none; /* Permite arrastrar el mapa a través del pin */
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <img id="center-pin" src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" />
      
      <script>
        var map = L.map('map').setView([${INITIAL_LAT}, ${INITIAL_LON}], 16);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'OpenStreetMap'
        }).addTo(map);

        function sendCenter() {
            var center = map.getCenter();
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    lat: center.lat, 
                    lng: center.lng 
                }));
            }
        }

        // Enviar coordenadas cada vez que el usuario termina de mover el mapa
        map.on('moveend', sendCenter);
        
        // Enviar coordenadas iniciales
        sendCenter();
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.lat && data.lng) {
            setLocation({ latitude: data.lat, longitude: data.lng });
        }
    } catch (e) {
        console.log("Error leyendo coordenadas", e);
    }
  };

  const handleUpdate = () => {
    Alert.alert(
      "Confirmar Cambio",
      "¿Mover TODOS los objetos a esta nueva ubicación?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, mover", onPress: performUpdate }
      ]
    );
  };

  const performUpdate = async () => {
    setLoading(true);
    try {
      // Importante: Esto requiere la política UPDATE que creamos en el Paso 1
      const { error } = await supabase
        .from('objetos')
        .update({
          latitud: location.latitude,
          longitud: location.longitude
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Filtro para afectar a todos

      if (error) throw error;

      Alert.alert("¡Éxito!", "Ubicación actualizada correctamente.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Definir Ubicación</Text>
      </View>

      <WebView
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={{ flex: 1 }}
        onMessage={handleWebViewMessage}
      />

      <View style={styles.footer}>
        <Text style={styles.coords}>
           Lat: {location.latitude.toFixed(5)} | Lon: {location.longitude.toFixed(5)}
        </Text>
        <TouchableOpacity 
            style={styles.btnSave} 
            onPress={handleUpdate}
            disabled={loading}
        >
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>Guardar Ubicación</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    position: 'absolute', top: 50, left: 20, zIndex: 10, 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: 'white', padding: 10, borderRadius: 10, elevation: 5 
  },
  backBtn: { marginRight: 10 },
  title: { fontWeight: 'bold', fontSize: 16 },
  footer: { 
    padding: 20, backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 
  },
  coords: { textAlign: 'center', marginBottom: 10, color: '#666' },
  btnSave: { backgroundColor: '#4F46E5', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});