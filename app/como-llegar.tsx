import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, Alert, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location'; 
import { supabase } from '../lib/supabase';

export default function ComoLlegarScreen() {
  const router = useRouter();
  
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [libraryLocation, setLibraryLocation] = useState({ lat: -17.392077, lng: -66.149714 }); 
  const [routeCoords, setRouteCoords] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Obtener la URI del logo local para el marcador
  const iconAsset = Image.resolveAssetSource(require('../assets/images/icon.png'));
  const iconUri = iconAsset.uri;

  useEffect(() => {
    async function initData() {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
            Alert.alert("Ubicación desactivada", "Activa el GPS para calcular la ruta.", [{ text: "OK", onPress: () => setLoading(false) }]);
            return;
        }

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermissionDenied(true);
          setLoading(false);
          return;
        }

        // Obtener ubicación actual
        let location = null;
        try {
             location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        } catch (e) {
             console.warn("Error obteniendo posición exacta, usando última conocida");
             location = await Location.getLastKnownPositionAsync({});
        }

        if (!location) {
             Alert.alert("Error", "No se pudo obtener tu ubicación.");
             setLoading(false);
             return;
        }
        
        setUserLocation(location);

        // Obtener ubicación de la biblioteca
        let libLat = -17.392077;
        let libLng = -66.149714;

        const { data: objData } = await supabase
          .from('objetos')
          .select('latitud, longitud')
          .not('latitud', 'is', null)
          .limit(1)
          .single();
        
        if (objData && objData.latitud) {
            libLat = objData.latitud;
            libLng = objData.longitud;
            setLibraryLocation({ lat: libLat, lng: libLng });
        }

        // Calcular ruta con OSRM
        try {
            const start = `${location.coords.longitude},${location.coords.latitude}`;
            const end = `${libLng},${libLat}`;
            
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
            );
            const json = await response.json();

            if (json.routes && json.routes.length > 0) {
                const coordinates = json.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
                setRouteCoords(coordinates);
            } else {
                setRouteCoords([[location.coords.latitude, location.coords.longitude], [libLat, libLng]]);
            }
        } catch (routeError) {
            console.error("Error calculando ruta:", routeError);
            setRouteCoords([[location.coords.latitude, location.coords.longitude], [libLat, libLng]]);
        }

      } catch (error) {
        console.error("Error init:", error);
        Alert.alert("Error", "No se pudo cargar el mapa.");
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  const generateHtml = () => {
    if (!userLocation) return '';

    const userLat = userLocation.coords.latitude;
    const userLng = userLocation.coords.longitude;
    const libLat = libraryLocation.lat;
    const libLng = libraryLocation.lng;
    
    const routeArrayString = JSON.stringify(routeCoords);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; }
          
          /* Pines personalizados */
          .custom-pin {
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 6px rgba(0,0,0,0.4);
            background-color: white;
            overflow: hidden;
          }
          .user-pin {
            background-color: #EF4444;
            font-size: 24px;
          }
          .user-pulse {
            border: 3px solid rgba(255, 255, 255, 0.8);
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map');

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          var libraryIcon = L.divIcon({
            className: '', 
            html: '<div class="custom-pin" style="width: 50px; height: 50px; background-image: url(\\'' + '${iconUri}' + '\\'); background-size: cover; background-position: center;"></div>',
            iconSize: [50, 50],
            iconAnchor: [25, 25], 
            popupAnchor: [0, -25]
          });

          var userIcon = L.divIcon({
            className: '',
            html: '<div class="custom-pin user-pin user-pulse" style="width: 40px; height: 40px;">👤</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -25]
          });

          L.marker([${libLat}, ${libLng}], {icon: libraryIcon}).addTo(map)
            .bindPopup("<b>PrestaFácil</b><br>Biblioteca de Objetos").openPopup();

          L.marker([${userLat}, ${userLng}], {icon: userIcon}).addTo(map)
            .bindPopup("📍 Tú");

          // Dibujar ruta
          var routeLatlngs = ${routeArrayString};

          if (routeLatlngs.length > 0) {
              var polyline = L.polyline(routeLatlngs, {
                color: '#4F46E5', 
                weight: 6,        
                opacity: 0.8,
                lineJoin: 'round'
              }).addTo(map);

              map.fitBounds(polyline.getBounds(), {padding: [80, 80]});
          } else {
              map.setView([${userLat}, ${userLng}], 14);
          }
        </script>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {/* router.back() es la función clave aquí.
          Automáticamente regresa a la pantalla anterior en el historial de navegación.
        */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Ruta a la Biblioteca</Text>
        <View style={{width: 40}} />
      </View>
      
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Calculando ruta óptima...</Text>
          </View>
        ) : permissionDenied ? (
          <View style={styles.centerContainer}>
            <Ionicons name="location-outline" size={50} color="#EF4444" />
            <Text style={styles.errorText}>Se requiere permiso de ubicación.</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
               <Text style={{color: '#fff', fontWeight: 'bold'}}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : !userLocation ? (
           <View style={styles.centerContainer}>
            <Ionicons name="sad-outline" size={50} color="#9CA3AF" />
            <Text style={styles.errorText}>Ubicación no disponible.</Text>
            <TouchableOpacity onPress={() => router.back()} style={[styles.retryBtn, {marginTop:10}]}>
               <Text style={{color: '#fff', fontWeight: 'bold'}}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: generateHtml() }}
            style={styles.map}
          />
        )}
      </View>
      
      <View style={styles.infoFooter}>
         <View style={styles.infoRow}>
            <Ionicons name="navigate-circle" size={28} color="#6366F1" />
            <View style={{marginLeft: 10}}>
                <Text style={styles.infoTitle}>Ruta Calculada</Text>
                <Text style={styles.infoText}>Sigue la línea azul por las calles.</Text>
            </View>
         </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB', zIndex: 10
  },
  backButton: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  mapContainer: { flex: 1, backgroundColor: '#E5E5E5' },
  map: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#6366F1', fontWeight: '500' },
  errorText: { marginTop: 10, color: '#64748B', textAlign: 'center', marginBottom: 5 },
  retryBtn: { backgroundColor: '#6366F1', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  infoFooter: {
    padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20,
    shadowColor: "#000", shadowOffset: {width: 0, height: -3}, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  infoText: { fontSize: 14, color: '#64748B' },
});