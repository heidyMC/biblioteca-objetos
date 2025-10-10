import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Perfil = () => {
  const navigation = useNavigation();

  const handleCerrarSesion = () => {
    console.log('Cerrar sesión');
  };

  const irAHome = () => {
    console.log("bienvenido a home")
  };

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
          source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
          style={styles.profileImage}
        />

        {/* Tokens */}
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenText}>💰 600 tokens disponibles</Text>
        </View>

        {/* Nombre */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nombre</Text>
          <Text style={styles.readOnlyText}>Maria Lopez</Text>
        </View>

        {/* Correo */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Correo electrónico</Text>
          <Text style={styles.readOnlyText}>maria.lopez@example.com</Text>
        </View>
      </View>

      {/* Botón Cerrar sesión */}
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
    borderColor: '#8A2BE2',
  },
  tokenContainer: {
  marginTop: 10, // solo espacio encima
  paddingVertical: 0,
  paddingHorizontal: 0,
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
});

