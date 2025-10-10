import InputComponent from '@/components/ui/input-component';
import TextComponent from '@/components/ui/text-component';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
const productos = [
  {
    id: '1',
    nombre: 'Taladro',
    precio: '$40 por 1 día',
    rating: 4.78,
    imagen: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
  },
  {
    id: '2',
    nombre: 'Taladro',
    precio: '$40 por 1 día',
    rating: 4.78,
    imagen: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
  },
  {
    id: '3',
    nombre: 'Taladro',
    precio: '$40 por 1 día',
    rating: 4.78,
    imagen: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
  },
  {
    id: '4',
    nombre: 'Taladro',
    precio: '$40 por 1 día',
    rating: 4.78,
    imagen: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
  },
];

const MainScreen = () => {
  const [search, setSearch] = useState('');
  const router = useRouter(); // Agrega esta línea

  return (
    <View style={styles.container}>
      {/* Perfil y tokens */}
      <View style={styles.profile}>
        <View style={styles.profileLeft}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
            style={styles.profileImage}
          />
          <TextComponent text="Maria" fontWeight="bold" />
        </View>
        <TextComponent text="💰600 tokens" fontWeight="bold" />
      </View>

      {/* Título */}
      <TextComponent text="Biblioteca de objetos" fontWeight="bold" />

      {/* Buscador */}
      <InputComponent
        value={search}
        onChange={setSearch}
        placeholder="Buscar"
        fontSize={14}
        inputColor="#333"
      />


      {/* Productos */}
      <ScrollView contentContainerStyle={styles.productGrid}>
        {productos.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push(`/detalleProducto?id=${item.id}`)} // Cambia aquí
          >
            <Image source={{ uri: item.imagen }} style={styles.cardImage} />
            <TextComponent text={item.nombre} fontWeight="bold" />
            <TextComponent text={item.precio} />
            <TextComponent text={`★ ${item.rating}`} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  profile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  cardImage: {
    width: '100%',
    height: 100,
    marginBottom: 8,
    borderRadius: 8,
  },
});
