"use client"

import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from "../../lib/supabase"; // Ajusta la ruta según tu estructura

export default function RegisterScreen() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // ✅ Registro con email y contraseña
  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos.")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.")
      return
    }

    if (password.length < 6) {
      Alert.alert("Contraseña débil", "Debe tener al menos 6 caracteres.")
      return
    }

    setIsLoading(true)

    try {
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) {
        Alert.alert("Error", "No se pudo obtener el ID del usuario.")
        return
      }

      // Insertar datos adicionales en la tabla usuarios
      const { error: insertError } = await supabase.from("usuarios").insert([
        {
          id: userId,
          nombre: name,
          telefono: phone,
          correo: email,
          contrasenia: password,
          tokens_disponibles: 150,
        },
      ])

      if (insertError) throw insertError

      Alert.alert(
        "¡Cuenta creada!",
        "Tu cuenta ha sido creada correctamente. Has recibido 150 tokens de bienvenida.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/HomeMenu/mainScreen") }]
      )

      // Limpiar campos
      setName("")
      setEmail("")
      setPhone("")
      setPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      Alert.alert("Error al registrar", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Registro/Iniciar sesión con Google
  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "exp://localhost:19000", // ⚠️ Cambia esto al URI de redirección real de tu app Expo
        },
      })

      if (error) throw error

      // Supabase abrirá el flujo de Google y manejará el login automáticamente
      // Luego de login exitoso, puedes redirigir
      Alert.alert("¡Bienvenido!", "Has iniciado sesión con Google correctamente.")
      router.replace("/(tabs)/HomeMenu/mainScreen")
    } catch (error: any) {
      Alert.alert("Error con Google", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="cube" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Biblioteca de Objetos</Text>
            <Text style={styles.subtitle}>Alquila con tokens</Text>
          </View>

          {/* Card principal */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crear Cuenta</Text>
            <Text style={styles.cardDescription}>Regístrate para comenzar a alquilar</Text>

            {/* Formulario */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 77777777"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              {/* Botón principal */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>{isLoading ? "Creando cuenta..." : "Crear Cuenta"}</Text>
              </TouchableOpacity>

              {/* Separador */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Botón Google */}
              <TouchableOpacity
                style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                onPress={handleGoogleRegister}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkContainer} onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.linkText}>
                  ¿Ya tienes una cuenta? <Text style={styles.linkTextBold}>Inicia sesión aquí</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="gift" size={20} color="#F59E0B" />
            <Text style={styles.footerText}>
              Recibe <Text style={styles.footerTextBold}>150 tokens gratis</Text> al registrarte
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 16 },
  header: { alignItems: "center", marginBottom: 32 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "700", color: "#0A0A0A", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#737373" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: { fontSize: 24, fontWeight: "700", color: "#0A0A0A", marginBottom: 8 },
  cardDescription: { fontSize: 14, color: "#737373", marginBottom: 24 },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "500", color: "#0A0A0A" },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#0A0A0A",
  },
  button: {
    height: 48,
    backgroundColor: "#6366F1",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E5E5" },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: "#737373" },
  googleButton: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  googleButtonText: { fontSize: 16, fontWeight: "600", color: "#0A0A0A" },
  linkContainer: { alignItems: "center", marginTop: 8 },
  linkText: { fontSize: 14, color: "#737373" },
  linkTextBold: { fontWeight: "600", color: "#6366F1" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
  },
  footerText: { fontSize: 14, color: "#737373" },
  footerTextBold: { fontWeight: "700", color: "#F59E0B" },
})
