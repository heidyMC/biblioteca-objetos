import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
import TextComponent from '@/components/ui/text-component';
import { useRouter, useFocusEffect } from 'expo-router';


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
  precio_tokens_dia: number;
  calificacion_promedio: number;
  disponible: boolean;
  imagen_url: string;
}

const MainScreen = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const cargarUsuario = async () => {
        try {
          const userData = await AsyncStorage.getItem('usuario');
          if (userData) setUsuario(JSON.parse(userData));
          else setUsuario(null);
        } catch (error) {
          console.error('Error cargando usuario:', error);
        }
      };

      cargarUsuario();
    }, [])
  );

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('objetos').select('*');
      if (error) console.error(error.message);
      else setProductos(data || []);
      setLoading(false);
    };

    fetchProductos();
  }, []);

  return (
    <View style={styles.container}>
      {/* CABECERA */}
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
          {/* BUSCADOR */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar objeto..."
                value={search}
                onChangeText={setSearch}
              />
            </View>
        
      </View>
   
      {/*Titulo */}
      <TextComponent
        text="Biblioteca de objetos"
        fontWeight="bold"
        textSize={22}
        textColor="#1E293B"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.productGrid}>
          {productos
            .filter((item) => item.nombre.toLowerCase().includes(search.toLowerCase()))
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => router.push(`./detalleProducto?id=${item.id}`)}
              >
                <Image source={{ uri: item.imagen_url }} style={styles.cardImage} />
                <TextComponent text={item.nombre} fontWeight="bold" textSize={16} />
                <TextComponent text={`$ ${item.precio_tokens_dia} tokens/día`} textSize={14} />
                <TextComponent text={`★ ${item.calificacion_promedio}`} textSize={13} textColor="black" />
                <TextComponent
                  text={item.disponible ? 'Disponible' : 'No disponible'}
                  textSize={12}
                  fontWeight="bold"
                  textColor={item.disponible ? 'green' : 'red'}
                />
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}
    </View>
  );
};

export default MainScreen;

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
    marginBottom: 20,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    height: 60,
    width: '65%',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 5,
  },
  searchInput: {
    height: 40,
    fontSize: 16,
    color: '#333',
    paddingTop:6,
    paddingBottom: 2, 
    includeFontPadding: false, 
    textAlignVertical: 'center',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  card: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 90,
    resizeMode: 'cover',
    borderRadius: 10,
    marginBottom: 10,
  },
});

