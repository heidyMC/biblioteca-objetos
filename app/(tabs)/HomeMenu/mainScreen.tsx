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
      const { data, error } = await supabase
        .from('objetos')
        .select('*');

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
      {/* Perfil y tokens */}
      <View style={styles.profile}>
        <View style={styles.profileLeft}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/44.jpg' }}
            style={styles.profileImage}
          />
          <TextComponent text="María" fontWeight="bold" textSize={16} />
        </View>
        <TextComponent text="💰 600 tokens" fontWeight="bold" textSize={15} />
      </View>

      {/* Título */}
      <TextComponent text="Biblioteca de objetos" fontWeight="bold" textSize={22} />

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <InputComponent
          value={search}
          onChange={setSearch}
          placeholder="Buscar"
          fontSize={14}
          inputColor="#333"
        />
      </View>

      {/* Productos */}
      {loading ? (
        <ActivityIndicator size="large" color="#1E90FF" />
      ) : (
        <ScrollView contentContainerStyle={styles.productGrid}>
          {productos
            .filter((item) =>
              item.nombre.toLowerCase().includes(search.toLowerCase())
            )
            .map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => router.push(`./detalleProducto?id=${item.id}`)}
              >
                <Image source={{ uri: item.imagen_url }} style={styles.cardImage} />
                <TextComponent text={item.nombre} fontWeight="bold" textSize={16} />
                <TextComponent text={`💰 ${item.precio_tokens_dia} tokens/día`} textSize={14} />
                <TextComponent text={`⭐ ${item.calificacion_promedio}`} textSize={13} />
                <TextComponent
                  text={item.disponible ? 'Disponible' : 'No disponible'}
                  textSize={12}
                  fontWeight="bold"
                  textColor={item.disponible ? 'green' : ' red'}
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
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  profile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 10,
  },
  searchContainer: {
    marginBottom: 20,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
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
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
});
