import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Usuario {
  id: string;
  nombre: string;
  tokens_disponibles: number;
  correo: string;
  foto_url: string;
  genero?: string;
}

const Perfil = () => {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const obtenerUsuario = async () => {
        try {
          const data = await AsyncStorage.getItem('usuario');
          if (data) {
            setUsuario(JSON.parse(data));
          } else {
            setUsuario(null);
          }
        } catch (error) {
          console.error('Error cargando usuario:', error);
        } finally {
          setLoading(false);
        }
      };

      obtenerUsuario();
    }, [])
  );

  const handleCerrarSesion = async () => {
    try {
      await AsyncStorage.clear(); 
      setUsuario(null);
      router.replace('/(tabs)/LOGIN/HomePage');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const hadlehistorialCompra = async () => {
    console.log("historial de compra");
  };

  const handleRanking = async () => {
    console.log("ranking de usuarios");
  };

  const irAHome = () => {
    router.push('/(tabs)/HomeMenu/mainScreen');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text>No hay usuario logueado</Text>
      </View>
    );
  }

  const bordeColor =
    usuario.genero?.toLowerCase() === 'f' || usuario.genero?.toLowerCase() === 'femenino'
      ? '#8A2BE2'
      : '#1E90FF';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={irAHome} style={styles.homeButton}>
          <Text style={styles.homeButtonText}>{"<"}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mi Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Perfil */}
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: usuario.foto_url || 'https://randomuser.me/api/portraits/men/44.jpg' }}
          style={[styles.profileImage, { borderColor: bordeColor }]}
        />

        {/* Tokens */}
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenText}>💰 {usuario.tokens_disponibles} tokens disponibles</Text>
        </View>

        {/* Nombre */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <Text style={styles.readOnlyText}>{usuario.nombre}</Text>
        </View>

        {/* Correo */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo electrónico</Text>
          <Text style={styles.readOnlyText}>{usuario.correo}</Text>
        </View>

        {/* Género */}
        {usuario.genero && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Género</Text>
            <Text style={styles.readOnlyText}>
              {usuario.genero.charAt(0).toUpperCase() + usuario.genero.slice(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Botones adicionales */}
      <TouchableOpacity style={styles.buttonHistorial} onPress={hadlehistorialCompra}>
        <Text style={styles.textHistorial}>Historial de Alquileres</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonRanking} onPress={handleRanking}>
        <Text style={styles.textRanking}>Ranking de usuarios por Tokens</Text>
      </TouchableOpacity>

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.button} onPress={handleCerrarSesion}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Perfil;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 100,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#050505ff',
    textAlign: 'center',
    flex: 1,
  },
  homeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#0f0f0fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 140,
    width: '100%',
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
  },
  tokenContainer: {
    marginTop: 10,
  },
  tokenText: {
    color: '#100f10ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputContainer: {
    marginTop: 20,
    width: '85%',
  },
  label: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    marginBottom: 6,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#c22424ff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonHistorial: {
    backgroundColor: '#3774b0ff',
    paddingVertical: 12,
    paddingHorizontal: 80,
    marginTop: 20,
  },
  textHistorial: {
    color: '#070707ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRanking: {
    backgroundColor: '#3774b0ff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 20,
  },
  textRanking: {
    color: '#070707ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
