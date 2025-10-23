import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

const LoginView = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa correo y contraseña");
      return;
    }

    try {
      // Consulta a la tabla usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', email)
        .eq('contrasenia', password)
        .single(); // Esperamos un solo usuario

      if (error || !data) {
        Alert.alert("Error", "Credenciales inválidas");
        return;
      }

      // Login exitoso
      Alert.alert("¡Éxito!", `Bienvenido ${data.nombre}`);

      // Aquí podrías redirigir al usuario a la pantalla principal, ejemplo:
      // router.push('/HomePage');

    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio de Sesión</Text>

      {/* Correo electrónico */}
      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresa tu correo"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Contraseña */}
      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresa tu contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Botón de login */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#060606ff',
    marginBottom: 40,
  },
  label: {
    color: '#060606ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    width: '80%',
  },
  input: {
    width: '80%',
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    color: '#333',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
