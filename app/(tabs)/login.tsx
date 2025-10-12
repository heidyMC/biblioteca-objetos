import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const RegisterView = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleRegister = () => {
    alert("Inicio de sesión exitoso!");
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

      {/* Texto de ¿Olvidaste tu contraseña? */}
      <TouchableOpacity>
        <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      {/* Botón de Registro */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
    </View>
  )
}

export default RegisterView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //backgroundColor: '#333', // Fondo oscuro
    padding: 20,
    justifyContent: 'center', // Centrado verticalmente
    alignItems: 'center', // Centrado horizontalmente
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#060606ff',
    marginBottom: 30,
  },
  label: {
    color: '#060606ff', // Color para los textos de los campos
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    width: '80%', // Ajusta el ancho de los textos de los labels
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderColor: '#ccc',
    borderWidth: 1,
    color: '#333',
  },
  button: {
    backgroundColor: '#1E90FF', // Fondo azul para el botón de registro
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '80%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    color: '#1E90FF', // Color azul para el texto "Olvidaste tu contraseña"
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20, // Un poco de espacio debajo del texto
  },
})
