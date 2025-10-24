import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa correo y contraseña");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', email)
        .eq('contrasenia', password)
        .single();

      if (error || !data) {
        Alert.alert("Error", "Credenciales inválidas");
        return;
      }

      // 🔥 Guardar el usuario en AsyncStorage
      await AsyncStorage.setItem('usuario', JSON.stringify(data));

      Alert.alert("¡Éxito!", `Bienvenido ${data.nombre}`, [
        {
          text: "OK",
          onPress: () => router.push('/(tabs)/HomeMenu/mainScreen'),
        },
      ]);

    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio de Sesión</Text>

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresa tu correo"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Contraseña</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Ingresa tu contraseña"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
          <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginView;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#060606ff', marginBottom: 40 },
  label: { color: '#060606ff', fontSize: 16, fontWeight: 'bold', marginBottom: 8, width: '80%' },
  input: { width: '80%', padding: 12, backgroundColor: '#FFFFFF', borderRadius: 8, borderColor: '#ccc', borderWidth: 1, color: '#333', fontSize: 16 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', width: '80%', marginBottom: 20 },
  eyeButton: { marginLeft: 10 },
  button: { backgroundColor: '#1E90FF', paddingVertical: 15, borderRadius: 50, alignItems: 'center', justifyContent: 'center', width: '80%', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});
