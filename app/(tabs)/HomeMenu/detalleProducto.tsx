import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import TextComponent from '@/components/ui/text-component';
import { View, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

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
}

interface CaracteristicaObjeto {
  id: string;
  objeto_id: string;
  nombre: string;
  valor: string;
  objetos: Producto;
}

const CaracteristicasObjetos = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
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
    const fetchCaracteristicas = async () => {
      if (!productoId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('caracteristicas_objeto')
        .select(`
          id,
          objeto_id,
          nombre,
          valor,
          objetos (
            id,
            nombre,
            descripcion,
            imagen_url
          )
        `)
        .eq('objeto_id', productoId);

      if (error) {
        console.error('Error al obtener características:', error.message);
      } else {
        const datosProcesados =
          data?.map((item: any) => ({
            ...item,
            objetos: Array.isArray(item.objetos) ? item.objetos[0] : item.objetos,
          })) || [];
        setCaracteristicas(datosProcesados);
      }
      setLoading(false);
    };

    fetchCaracteristicas();
  }, [productoId]);

  const caracteristicasAgrupadas = caracteristicas.reduce((acc, item) => {
    const objId = item.objeto_id;
    if (!acc[objId]) {
      acc[objId] = {
        objeto: item.objetos,
        caracteristicas: [],
      };
    }
    acc[objId].caracteristicas.push({ nombre: item.nombre, valor: item.valor });
    return acc;
  }, {} as Record<string, { objeto: Producto; caracteristicas: { nombre: string; valor: string }[] }>);

  return (
    <View style={styles.container}>
      {/* Encabezado */}
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
            <TextComponent text={`💰 ${usuario?.tokens_disponibles ?? 0} tokens`} textSize={13} textColor="#555" />
          </View>
        </View>
      </View>

      <TextComponent text="Características de los Objetos" fontWeight="bold" textSize={22} textColor="#1E293B" />

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {Object.values(caracteristicasAgrupadas).map(({ objeto, caracteristicas }) => (
            <View key={objeto.id}>
              {/* Card con imagen + características */}
              <View style={styles.card}>
                <Image source={{ uri: objeto?.imagen_url || 'https://placehold.co/150x150' }} style={styles.cardImage} />

                <View style={styles.infoContainer}>
                  <TextComponent text={objeto?.nombre || 'Sin nombre'} fontWeight="bold" textSize={16} />
                  {caracteristicas.map((c, index) => (
                    <TextComponent
                      key={index}
                      text={`${c.nombre}: ${c.valor}`}
                      textSize={13}
                      textColor="#333"
                    />
                  ))}
                </View>
              </View>

              {/* Descripción fuera del card */}
              {objeto?.descripcion ? (
                <View style={styles.descripcionContainer}>
                  <TextComponent
                    text={objeto.descripcion}
                    textSize={18}
                    textColor="#1E293B"
                    fontWeight="500"
                  />
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
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
    paddingBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    paddingVertical: 10,
    marginBottom: 15,
    borderRadius: 0,
    shadowColor: 'transparent',
    elevation: 0,
  },
  cardImage: {
    width: 140,
    height: 140,
    resizeMode: 'cover',
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  descripcionContainer: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
});
