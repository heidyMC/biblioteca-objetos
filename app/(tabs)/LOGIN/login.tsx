import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();


const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'exp://127.0.0.1:19000' }, 
    });

    if (error) throw error;

        if (data.url) {
          const res = await WebBrowser.openAuthSessionAsync(data.url);

          if (res.type === 'success') {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            const user = userData.user;
            if (!user) return;

           
            const { data: existing } = await supabase
              .from('usuarios')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (!existing) {
            
              await supabase.from('usuarios').insert([
                {
                  id: user.id,
                  nombre: user.user_metadata.full_name || 'Usuario Google',
                  correo: user.email,
                  foto_url: user.user_metadata.avatar_url,
                  tokens_disponibles: 150,
                },
              ]);
            }

            await AsyncStorage.setItem('usuario', JSON.stringify(user));
            Alert.alert('Bienvenido', `Has iniciado sesión como ${user.email}`);
            router.replace('/(tabs)/HomeMenu/mainScreen');
          }
        }
      } catch (error) {
        console.error('Error al iniciar sesión con Google:', error);
        Alert.alert('Error', 'No se pudo iniciar sesión con Google.');
      }
    };

  const limpiarCache = async () => {
    try {
      await AsyncStorage.clear();
      console.log("🧹 Caché borrado correctamente");
    } catch (error) {
      console.error("Error al limpiar el caché:", error);
    }
  };
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
      await limpiarCache();
      await AsyncStorage.setItem('usuario', JSON.stringify(data));
      Alert.alert("Sesión iniciada", `Bienvenido ${data.nombre || ''}`);
      router.replace('/(tabs)/HomeMenu/mainScreen');

    } catch (err: any) {
      Alert.alert("Error", err.message || 'Error en login');
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
          <Text style={{ fontSize: 18 }}>{showPassword ? '**' : '*'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#DB4437' }]} onPress={signInWithGoogle}>
        <Text style={styles.buttonText}>Iniciar sesión con Google</Text>
      </TouchableOpacity>

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
    alignItems: 'center' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#060606ff', 
    marginBottom: 40 
  },
  label: { 
    color: '#060606ff', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    width: '80%' 
  },
  input: { 
    width: '80%', 
    padding: 12, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 8, 
    borderColor: '#ccc', 
    borderWidth: 1, 
    color: '#333', 
    fontSize: 16 
  },
  passwordContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '80%', 
    marginBottom: 20 
  },
  eyeButton: { 
    marginLeft: 10 
  },
  button: { 
    backgroundColor: '#1E90FF', 
    paddingVertical: 15, 
    borderRadius: 50, 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: '80%', 
    marginTop: 10 
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});