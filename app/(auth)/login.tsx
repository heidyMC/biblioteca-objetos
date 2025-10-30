"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import React, { useState } from "react"
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
import { supabase } from "../../lib/supabase"

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  // 🧹 Limpia la caché de usuario
  const limpiarCache = async () => {
    try {
      await AsyncStorage.clear()
      console.log("🧹 Caché borrado correctamente")
    } catch (error) {
      console.error("Error al limpiar el caché:", error)
    }
  }

  // 🔐 Inicio de sesión con correo y contraseña
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa correo y contraseña")
      return
    }

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("correo", email)
        .eq("contrasenia", password)
        .single()

      if (error || !data) {
        Alert.alert("Error", "Credenciales inválidas")
        return
      }

      await limpiarCache()
      await AsyncStorage.setItem("usuario", JSON.stringify(data))
      Alert.alert("Sesión iniciada", `Bienvenido ${data.nombre || ""}`)
      router.replace("/(tabs)/HomeMenu/mainScreen")
    } catch (err: any) {
      Alert.alert("Error", err.message || "Error en login")
    } finally {
      setIsLoading(false)
    }
  }

  // 🔑 Inicio de sesión con Google
  const signInWithGoogle = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: "exp://127.0.0.1:19000" },
      })

      if (error) throw error

      if (data.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url)

        if (res.type === "success") {
          const { data: userData, error: userError } = await supabase.auth.getUser()
          if (userError) throw userError

          const user = userData.user
          if (!user) return

          const { data: existing } = await supabase
            .from("usuarios")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

          if (!existing) {
            await supabase.from("usuarios").insert([
              {
                id: user.id,
                nombre: user.user_metadata.full_name || "Usuario Google",
                correo: user.email,
                foto_url: user.user_metadata.avatar_url,
                tokens_disponibles: 150,
              },
            ])
          }

          await AsyncStorage.setItem("usuario", JSON.stringify(user))
          Alert.alert("Bienvenido", `Has iniciado sesión como ${user.email}`)
          router.replace("/(tabs)/HomeMenu/mainScreen")
        }
      }
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error)
      Alert.alert("Error", "No se pudo iniciar sesión con Google.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="cube" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Biblioteca de Objetos</Text>
            <Text style={styles.subtitle}>Alquila con tokens</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>
            <Text style={styles.cardDescription}>Ingresa tus credenciales para acceder</Text>

            <View style={styles.form}>
              {/* Correo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu correo"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                />
              </View>

              {/* Contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#737373"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botón principal */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Text>
              </TouchableOpacity>

              {/* Divisor */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Botón Google */}
              <TouchableOpacity
                style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                onPress={signInWithGoogle}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkContainer} onPress={() => router.push("/register")}>
                <Text style={styles.linkText}>
                  ¿No tienes una cuenta? <Text style={styles.linkTextBold}>Regístrate aquí</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Ionicons name="gift" size={20} color="#F59E0B" />
            <Text style={styles.footerText}>
              Nuevos usuarios reciben <Text style={styles.footerTextBold}>100 tokens gratis</Text>
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
  passwordContainer: { flexDirection: "row", alignItems: "center" },
  eyeButton: { paddingHorizontal: 8 },
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
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
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
