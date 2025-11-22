import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Se actualizó la ruta a la nueva imagen
const LogoImg = require('../../assets/images/prestafacil-icon.jpg');

export default function InicioScreen() {
  const router = useRouter();
  const { height } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={LogoImg} style={styles.logo} resizeMode="contain" />
        {/* Se actualizó el nombre de la app */}
        <Text style={styles.title}>PrestaFacil</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#1E90FF' }]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#1E90FF' }]}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.buttonText}>Registrarse</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
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