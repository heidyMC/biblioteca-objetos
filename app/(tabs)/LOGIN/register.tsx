import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';

const RegisterView = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const handleRegister = () => {
    alert("Cuenta creada con éxito!");
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
    marginTop: 100, // 🔹 Solo baja el contenido, no la pantalla
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#060606', // ✅ corregido (antes era '# ')
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
