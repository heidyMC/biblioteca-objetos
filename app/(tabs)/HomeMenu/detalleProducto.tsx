import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TextComponent from '@/components/ui/text-component';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps'; 

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  foto_url: string;
  tokens_disponibles: number;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio_tokens_dia: number;
  calificacion_promedio: number;
  disponible: boolean;
  imagen_url: string;
  latitud?: number; 
  longitud?: number;
}

interface CaracteristicaObjeto {
  id: string;
  objeto_id: string;
  nombre: string;
  valor: string;
}

const CaracteristicasObjetos = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [objeto, setObjeto] = useState<Producto | null>(null);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicaObjeto[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const productoId = searchParams.id;

  useEffect(() => {
    const cargarUsuario = async () => {
      const userData = await AsyncStorage.getItem('usuario');
      if (userData) setUsuario(JSON.parse(userData));
    };
    cargarUsuario();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!productoId) return;
      setLoading(true);

      const { data: objetoData, error: errorObjeto } = await supabase
        .from('objetos')
        .select('*')
        .eq('id', productoId)
        .single();

      if (errorObjeto) {
        console.error('Error al obtener objeto:', errorObjeto.message);
        setLoading(false);
        return;
      }

      const { data: caracteristicasData, error: errorCaract } = await supabase
        .from('caracteristicas_objeto')
        .select('*')
        .eq('objeto_id', productoId);

      if (errorCaract) {
        console.error('Error al obtener características:', errorCaract.message);
      }

      setObjeto(objetoData);
      setCaracteristicas(caracteristicasData || []);
      setLoading(false);
    };

    fetchData();
  }, [productoId]);

  return (
    <View style={styles.container}>
      {/* Encabezado con usuario */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/Perfil/PerfilUsuario')}>
            <Image
              source={{
                uri: usuario?.foto_url || 'https://placehold.co/100x100?text=Sin+Foto',
              }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <View>
            <TextComponent text={usuario?.nombre || 'Cargando...'} fontWeight="bold" textSize={16} />
            <TextComponent
              text={`💰 ${usuario?.tokens_disponibles ?? 0} tokens`}
              textSize={13}
              textColor="#120f0fff"
            />
          </View>
        </View>
      </View>

      <TextComponent text="Características del Objeto" fontWeight="bold" textSize={22} textColor="#1E293B" />

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 40 }} />
      ) : objeto ? (
        <ScrollView contentContainerStyle={styles.list}>
          {/* Imagen y características lado a lado */}
          <View style={styles.rowContainer}>
            <Image
              source={{ uri: objeto.imagen_url || 'https://placehold.co/150x150' }}
              style={styles.objetoImage}
            />

            <View style={styles.infoContainer}>
              <TextComponent text={objeto.nombre} fontWeight="bold" textSize={18} />
              {caracteristicas.map((c, index) => (
                <TextComponent
                  key={index}
                  text={`${c.nombre}: ${c.valor}`}
                  textSize={14}
                  textColor="#333"
                />
              ))}
            </View>
          </View>

          {/* Precio, descripción y reseñas */}
          <TextComponent
            text={`$ ${objeto.precio_tokens_dia} tokens/día`}
            textSize={16}
            fontWeight="bold"
            textColor="#000000ff"
            style={{ marginTop: 15 }}
          />

          {objeto.descripcion ? (
            <TextComponent
              text={objeto.descripcion}
              textSize={17}
              textColor="#1E293B"
              fontWeight="500"
              style={{ marginTop: 8 }}
            />
          ) : null}

          {/* 🌍 Mapa de ubicación */}
          {objeto.latitud && objeto.longitud ? (
            <View style={styles.mapContainer}>
              <TextComponent
                text="📍 Ubicación del Producto"
                fontWeight="bold"
                textSize={18}
                textColor="#1E293B"
                style={{ marginBottom: 10 }}
              />
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: objeto.latitud,
                  longitude: objeto.longitud,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: objeto.latitud,
                    longitude: objeto.longitud,
                  }}
                  title={objeto.nombre}
                  description="Ubicación aproximada del objeto"
                />
              </MapView>
            </View>
          ) : (
            <TextComponent
              text="🌐 Este objeto no tiene ubicación registrada."
              textColor="#6B7280"
              textSize={14}
              style={{ marginTop: 10 }}
            />
          )}
        </ScrollView>
      ) : (
        <TextComponent text="No se encontró el objeto." textColor="red" textSize={16} />
      )}
       <TextComponent
            text="★ Reseñas"
            fontWeight="bold"
            textSize={18}
            textColor="#1E293B"
            style={{ marginTop: 15 }}
          />
    </View>
    
  );
};

export default CaracteristicasObjetos;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 50,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  list: {
    paddingBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  objetoImage: {
    width: 140,
    height: 140,
    resizeMode: 'cover',
    borderRadius: 8,
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  mapContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  map: {
    width: '100%',
    height: 200,
  },
});
