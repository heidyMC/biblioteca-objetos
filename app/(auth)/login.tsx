"use client"

import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { makeRedirectUri } from "expo-auth-session"
import * as QueryParams from "expo-auth-session/build/QueryParams"
import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import React, { useState } from "react"
import {
  Alert,
  Image,
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

  const limpiarCache = async () => {
    try {
      await AsyncStorage.clear()
      console.log("🧹 Caché borrado correctamente")
    } catch (error) {
      console.error("Error al limpiar el caché:", error)
    }
  }

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

      // --- VERIFICACIÓN DE BLOQUEO ---
      if (data.is_blocked) {
        Alert.alert(
          "Cuenta Suspendida",
          "Tu cuenta ha sido suspendida por el administrador. Serás redirigido en breve."
        );
        
        // Cerramos sesión por seguridad
        await supabase.auth.signOut();

        // Esperamos 4 segundos y recargamos el login
        setTimeout(() => {
            router.replace("/(auth)/login");
        }, 4000);
        
        return; 
      }
      // -------------------------------

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

  const signInWithGoogle = async () => {
    setIsLoading(true)
    try {
      const redirectTo = makeRedirectUri({
        scheme: "prestafacil",
        path: "google-auth",
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

        if (res.type === "success") {
          const { url } = res
          const { params } = QueryParams.getQueryParams(url)
          const { access_token, refresh_token } = params

          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              })

            if (sessionError) throw sessionError

            const user = sessionData.user
            if (!user) throw new Error("No se pudo obtener el usuario")

            const { data: existing } = await supabase
              .from("usuarios")
              .select("*")
              .eq("correo", user.email)
              .maybeSingle()

            // --- VERIFICACIÓN BLOQUEO GOOGLE ---
            if (existing && existing.is_blocked) {
                Alert.alert(
                  "Cuenta Suspendida", 
                  "Tu cuenta ha sido suspendida por el administrador."
                );

                await supabase.auth.signOut();

                setTimeout(() => {
                    router.replace("/(auth)/login");
                }, 4000);

                return;
            }
            // -----------------------------------

            let usuarioFinal = existing

            if (!existing) {
              const { data: newUser, error: insertError } = await supabase
                .from("usuarios")
                .insert([
                  {
                    nombre: user.user_metadata.full_name || "Usuario Google",
                    correo: user.email,
                    foto_url: user.user_metadata.avatar_url,
                    tokens_disponibles: 150,
                  },
                ])
                .select()
                .single()

              if (insertError) throw insertError
              usuarioFinal = newUser
            }

            await limpiarCache()
            await AsyncStorage.setItem("usuario", JSON.stringify(usuarioFinal))

            Alert.alert("Bienvenido", `Has iniciado sesión como ${usuarioFinal.nombre}`)
            router.replace("/(tabs)/HomeMenu/mainScreen")
          }
        }
      }
    } catch (error: any) {
      console.error("Error al iniciar sesión con Google:", error)
      if (error.message !== "User cancelled the auth session") {
        Alert.alert("Error", "No se pudo iniciar sesión con Google.")
      }
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/images/prestafacil-icon.jpg")}
                style={{ width: "100%", height: "100%", borderRadius: 20 }}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>PrestaFacil</Text>
            <Text style={styles.subtitle}>Alquila con tokens</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>
            <Text style={styles.cardDescription}>Ingresa tus credenciales para acceder</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu correo"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>

                <View style={styles.inputPasswordWrapper}>
                  <TextInput
                    style={styles.inputPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeInside}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={22}
                      color="#737373"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                onPress={signInWithGoogle}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => router.push("/register")}
              >
                <Text style={styles.linkText}>
                  ¿No tienes una cuenta? <Text style={styles.linkTextBold}>Regístrate aquí</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Ionicons name="gift" size={20} color="#F59E0B" />
            <Text style={styles.footerText}>
              Nuevos usuarios reciben{" "}
              <Text style={styles.footerTextBold}>150 tokens gratis</Text>
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
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  label: { fontSize: 14, fontWeight: "600", color: "#0A0A0A" },
  input: {
    height: 45,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  inputPasswordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputPassword: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  eyeInside: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    justifyContent: "center",
  },
  dividerLine: {
    width: "20%",
    height: 1,
    backgroundColor: "#D1D5DB",
  },
  dividerText: {
    marginHorizontal: 8,
    fontSize: 14,
    color: "#737373",
  },
  googleButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 12,
    borderRadius: 10,
  },
  googleButtonText: { fontSize: 16, color: "#0A0A0A", fontWeight: "600" },
  linkContainer: { marginTop: 12 },
  linkText: { textAlign: "center", color: "#737373" },
  linkTextBold: { fontWeight: "700", color: "#2563EB" },
  footer: {
    marginTop: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  footerText: { color: "#737373", fontSize: 14 },
  footerTextBold: { fontWeight: "700", color: "#F59E0B" },
})