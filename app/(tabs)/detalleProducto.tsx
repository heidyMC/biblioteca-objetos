import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';



const productos = [
  {
    id: '1',
    nombre: 'Taladro',
    marca: 'Bowoshen',
    fuente: 'batería',
    velocidad: '1.4E+3 RPM',
    voltaje: '21 Voltios',
    amperaje: '21 Amperios',
    precio: '$40 por día',
    rating: 4.78,
    imagen: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
    descripcion:
      'Taladro inalámbrico rojo de 21 V máximo, juego de taladro eléctrico con par de 45 NM, kit de herramientas con batería de iones de litio de 1500',
    ubicacion: { lat: -12.0464, lng: -77.0428 },
    resena: {
      usuario: 'Nathan Smith',
      fecha: '16 de junio de 2025',
      comentario:
        'Es fácil de usar, segura. La comunidad es muy activa y todo funciona bastante bien.',
      rating: 5,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
  },
];

export default function DetalleProducto() {
  const { id } = useLocalSearchParams();
  const producto = productos.find((p) => p.id === id) || productos[0]; // fallback

  return (
    <View style={styles.container}>
      {/* Perfil y tokens */}
      <View style={styles.profile}>
        <View style={styles.profileLeft}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
            style={styles.profileImage}
          />
          <Text style={styles.boldText}>Maria</Text>
        </View>
        <Text style={styles.boldText}>💰600 tokens</Text>
      </View>

      {/* Detalles */}
      <Text style={styles.sectionTitle}>Detalles</Text>

      <View style={styles.row}>
        <Image source={{ uri: producto.imagen }} style={styles.productImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.boldText}>{producto.nombre}</Text>
          <Text>Marca: {producto.marca}</Text>
          <Text>Fuente de alimentación: {producto.fuente}</Text>
          <Text>Velocidad máxima de rotación: {producto.velocidad}</Text>
          <Text>Voltaje: {producto.voltaje}</Text>
          <Text>Amperaje: {producto.amperaje}</Text>
        </View>
      </View>

      <Text style={styles.boldText}>
        {producto.precio} ★{producto.rating}
      </Text>
      <Text>{producto.descripcion}</Text>

      {/* Ubicación con react-native-maps */}
      <Text style={styles.sectionTitle}>Ubicación</Text>
      <MapView
        style={styles.mapView}
        initialRegion={{
          latitude: producto.ubicacion.lat,
          longitude: producto.ubicacion.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude: producto.ubicacion.lat,
            longitude: producto.ubicacion.lng,
          }}
          title={producto.nombre}
          description={`Ubicación del producto: ${producto.marca}`}
        />
      </MapView>

      {/* Reseñas */}
      <Text style={styles.sectionTitle}>Reseñas</Text>
      <View style={styles.reviewCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: producto.resena.avatar }} style={styles.reviewAvatar} />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.boldText}>{producto.resena.usuario}</Text>
            <Text>★{producto.resena.rating}</Text>
            <Text style={{ fontSize: 12, color: '#555' }}>{producto.resena.fecha}</Text>
          </View>
        </View>
        <Text>{producto.resena.comentario}</Text>
      </View>

      {/* Botón */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          router.push('/rental screen'); // Redirige a rentalScreen
        }}
      >
        <Text style={styles.buttonText}>Alquilar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
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
  boldText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  mapView: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  button: {
    alignSelf: 'center',
    backgroundColor: '#007bff',
    width: 200,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
