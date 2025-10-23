import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { supabase } from '../../../lib/supabase';

const RegisterView = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>(''); // campo teléfono
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) {
        alert("Error al crear usuario");
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .insert([
          {
            id: userId,
            nombre: name,
            tokens_disponibles: 150, 
            telefono: phone,
            correo: email,        
            contrasenia: password,  
          },
        ]);

      if (error) throw error;

      alert("Cuenta creada con éxito!");
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Registrarse</Text>

        {/* Nombre */}
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa nombre"
          value={name}
          onChangeText={setName}
        />

        {/* Correo electrónico */}
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa correo"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* Teléfono */}
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa tu número"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* Contraseña */}
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresa contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Confirmar contraseña */}
        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirma contraseña"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Botón Crear cuenta */}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Crear cuenta</Text>
        </TouchableOpacity>

        {/* Texto de iniciar sesión */}
        <TouchableOpacity>
          <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RegisterView;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#060606',
    marginBottom: 30,
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
  loginText: {
    color: '#1E90FF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
  },
});
