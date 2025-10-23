import InputComponent from '@/components/ui/input-component';
import TextComponent from '@/components/ui/text-component';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

interface Producto {
  id: string;
  nombre: string;
  precio_tokens_dia: number;
  calificacion_promedio: number;
  disponible: boolean;
  imagen_url: string;
}

const MainScreen = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('objetos').select('*');

      if (error) {
        console.error('Error fetching products:', error.message);
      } else {
        setProductos(data || []);
      }
      setLoading(false);
    };

    fetchProductos();
  }, []);

  return (
    <View style={styles.container}>
      {/* Encabezado: perfil + buscador */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/44.jpg' }}
            style={styles.profileImage}
          />
          <View>
            <TextComponent text="María" fontWeight="bold" textSize={16} />
            <TextComponent text="💰 600 tokens" textSize={13} textColor="#555" />
          </View>
        </View>

        <View style={styles.searchContainer}>
          <InputComponent
            value={search}
            onChange={setSearch}
            placeholder="Buscar objeto..."
            fontSize={14}
            inputColor="#333"
          />
        </View>
      </View>

      {/* Título */}
      <TextComponent
        text="Biblioteca de objetos"
        fontWeight="bold"
        textSize={22}
        textColor="#1E293B"
      />

      {/* Lista de productos */}
      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.productGrid}>
          {productos
            .filter((item) =>
              item.nombre.toLowerCase().includes(search.toLowerCase())
            )
            .map((item) => (
              <TouchableOpacity key={item.id} style={styles.card}>
                <Image source={{ uri: item.imagen_url }} style={styles.cardImage} />
                <TextComponent
                  text={item.nombre}
                  fontWeight="bold"
                  textSize={16}
                  style={{ marginBottom: 4 }}
                />
                <TextComponent
                  text={`$ ${item.precio_tokens_dia} tokens/día`}
                  textSize={14}
                  style={{ marginBottom: 4 }}
                />
                <TextComponent
                  text={`★ ${item.calificacion_promedio}`}
                  textSize={13}
                  textColor="black"
                  style={{ marginBottom: 4 }}
                />
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
    marginBottom: 30,
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
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    height: 90, // más compacto verticalmente
    resizeMode: 'cover',
    borderRadius: 10, // bordes redondeados
    marginBottom: 10,
  },
});
