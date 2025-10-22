import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const LogoImg = require('../../../assets/images/login-images.png');

export default function InicioScreen() {
  const router = useRouter();
  const { height } = Dimensions.get('window'); // para ajustar tamaños según pantalla

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={LogoImg} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Biblioteca de Objetos</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#1E90FF' }]}
          onPress={() => router.push('/(tabs)/LOGIN/login')}
        >
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#1E90FF' }]}
          onPress={() => router.push('/(tabs)/LOGIN/register')}
        >
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // ocupa toda la pantalla
    justifyContent: 'space-between', // separa logo de botones
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 250,
    height: 250,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '80%',
    marginBottom: 40,
  },
  button: {
    paddingVertical: 40,
    borderRadius: 50,
    alignItems: 'center',
    marginVertical: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
});
