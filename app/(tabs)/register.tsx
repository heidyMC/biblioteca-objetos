import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'

const RegisterView = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const handleRegister = () => {
    alert("Cuenta creada con éxito!");
  };

  return (
    <View style={styles.container}>
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
  )
}

export default RegisterView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    width: '80%',
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
    backgroundColor: '#1E90FF',
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
  loginText: {
    color: '#1E90FF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
  },
})