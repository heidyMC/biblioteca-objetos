import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';



const Perfil = () => {
  const navigation = useNavigation();

  const handleCerrarSesion = () => {
   
    console.log('Cerrar sesión');
   
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
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
    top: 150,
    marginLeft: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 60,
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
    backgroundColor: '#EEE6FF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  tokenText: {
    color: '#8A2BE2',
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
