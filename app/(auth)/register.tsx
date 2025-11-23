"use client"

import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
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

export default function RegisterScreen() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0) // 0-4: vacío, débil, normal, fuerte, perfecta

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const router = useRouter()

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(emailValue)
  }

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 6) return false
    return /\d/.test(pwd) // Verifica que tenga al menos un número
  }

  const calculatePasswordStrength = (pwd: string): number => {
    if (pwd.length === 0) return 0
    if (pwd.length < 6) return 1 // Mínimo pero débil

    let strength = 1 // Comienza en 1 (mínimo)

    // +1 si tiene letras mayúsculas
    if (/[A-Z]/.test(pwd)) strength++

    // +1 si tiene números
    if (/\d/.test(pwd)) strength++

    // +1 si tiene caracteres especiales
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) strength++

    return Math.min(strength, 4) // Máximo 4
  }

  const getStrengthLabel = (strength: number): string => {
    switch (strength) {
      case 0:
        return ""
      case 1:
        return "Débil"
      case 2:
        return "Normal"
      case 3:
        return "Fuerte"
      case 4:
        return "Perfecta"
      default:
        return ""
    }
  }

  const getStrengthColor = (strength: number): string => {
    switch (strength) {
      case 0:
        return "#E5E5E5"
      case 1:
        return "#EF4444" // Rojo - débil
      case 2:
        return "#F59E0B" // Amarillo - normal
      case 3:
        return "#3B82F6" // Azul - fuerte
      case 4:
        return "#10B981" // Verde - perfecta
      default:
        return "#E5E5E5"
    }
  }

  const handleNameChange = (text: string) => {
    if (text.length <= 60) {
      setName(text)
      if (text.trim().length === 0) {
        setErrors((prev) => ({ ...prev, name: "El nombre es requerido" }))
      } else if (text.trim().length < 2) {
        setErrors((prev) => ({ ...prev, name: "El nombre debe tener al menos 2 caracteres" }))
      } else {
        setErrors((prev) => ({ ...prev, name: "" }))
      }
    }
  }

  const handleEmailChange = (text: string) => {
    setEmail(text)
    if (text.trim().length === 0) {
      setErrors((prev) => ({ ...prev, email: "El email es requerido" }))
    } else if (!validateEmail(text)) {
      setErrors((prev) => ({ ...prev, email: "Ingresa un email válido" }))
    } else {
      setErrors((prev) => ({ ...prev, email: "" }))
    }
  }

  const handlePhoneChange = (text: string) => {
    setPhone(text)
    if (text.trim().length === 0) {
      setErrors((prev) => ({ ...prev, phone: "El teléfono es requerido" }))
    } else if (!/^\d{7,}$/.test(text)) {
      setErrors((prev) => ({ ...prev, phone: "Teléfono debe tener al menos 7 dígitos" }))
    } else {
      setErrors((prev) => ({ ...prev, phone: "" }))
    }
  }

  const handlePasswordChange = (text: string) => {
    setPassword(text)
    const strength = calculatePasswordStrength(text)
    setPasswordStrength(strength)

    if (text.length === 0) {
      setErrors((prev) => ({ ...prev, password: "La contraseña es requerida" }))
    } else if (text.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Mínimo 6 caracteres" }))
    } else {
      setErrors((prev) => ({ ...prev, password: "" }))
    }

    if (confirmPassword && text !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Las contraseñas no coinciden" }))
    } else if (confirmPassword && text === confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }))
    }
  }

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text)
    if (text.length === 0) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Debe confirmar la contraseña" }))
    } else if (text !== password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Las contraseñas no coinciden" }))
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }))
    }
  }

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos obligatorios.")
      return
    }

    if (Object.values(errors).some((err) => err !== "")) {
      Alert.alert("Errores en el formulario", "Por favor corrige los errores antes de continuar.")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.")
      return
    }

    setIsLoading(true)

    try {
      const { data: existingUser } = await supabase.from("usuarios").select("id").eq("correo", email).single()

      if (existingUser) {
        Alert.alert("Error", "Este correo electrónico ya está registrado.")
        setIsLoading(false)
        return
      }

      let referrerId = null
      if (referralCode.trim()) {
        const { data: referrerData } = await supabase
          .from("usuarios")
          .select("id, tokens_disponibles")
          .eq("referal_code", referralCode.trim().toUpperCase())
          .single()

        if (!referrerData) {
          Alert.alert(
            "Código de referido inválido",
            "El código de referido no existe. Puedes dejarlo vacío si no tienes uno.",
          )
          setIsLoading(false)
          return
        }
        referrerId = referrerData.id
      }

      const { data: newUser, error: insertError } = await supabase
        .from("usuarios")
        .insert([
          {
            nombre: name,
            telefono: phone,
            correo: email,
            contrasenia: password,
            tokens_disponibles: 150,
          },
        ])
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      if (referrerId) {
        const { error: referralError } = await supabase.from("referidos").insert([
          {
            id_referente: referrerId,
            id_referido: newUser.id,
          },
        ])

        if (referralError) {
          console.error("Error creando relación de referido:", referralError)
        }

        const { data: referrerCurrent } = await supabase
          .from("usuarios")
          .select("tokens_disponibles")
          .eq("id", referrerId)
          .single()

        if (referrerCurrent) {
          await supabase
            .from("usuarios")
            .update({
              tokens_disponibles: referrerCurrent.tokens_disponibles + 25,
            })
            .eq("id", referrerId)
        }

        await supabase
          .from("usuarios")
          .update({
            tokens_disponibles: 160,
          })
          .eq("id", newUser.id)
      }

      Alert.alert(
        "¡Cuenta creada!",
        referrerId
          ? "Tu cuenta ha sido creada correctamente. Has recibido 160 tokens de bienvenida (150 + 10 extra por código de referido)."
          : "Tu cuenta ha sido creada correctamente. Has recibido 150 tokens de bienvenida.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(tabs)/HomeMenu/mainScreen")
            },
          },
        ],
      )

      setName("")
      setEmail("")
      setPhone("")
      setPassword("")
      setConfirmPassword("")
      setReferralCode("")
      setErrors({ name: "", email: "", phone: "", password: "", confirmPassword: "" })
    } catch (error: any) {
      Alert.alert("Error al registrar", error.message || "Ocurrió un error inesperado. Por favor intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "exp://localhost:19000",
        },
      })

      if (error) throw error

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
            <Text style={styles.cardTitle}>Crear Cuenta</Text>
            <Text style={styles.cardDescription}>Regístrate para comenzar a alquilar</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Nombre completo *</Text>
                  <Text style={styles.charCount}>{name.length}/60</Text>
                </View>
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  placeholder="Tu nombre"
                  value={name}
                  onChangeText={handleNameChange}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo electrónico *</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="tu@email.com"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono *</Text>
                <TextInput
                  style={[styles.input, errors.phone ? styles.inputError : null]}
                  placeholder="Ej. 77777777"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  editable={!isLoading}
                />
                {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña *</Text>
                <View style={[styles.passwordContainer, errors.password ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye" : "eye-off"} size={20} color="#737373" />
                  </TouchableOpacity>
                </View>

                {password.length > 0 && (
                  <>
                    <View style={styles.strengthBarContainer}>
                      <View
                        style={[
                          styles.strengthBar,
                          {
                            width: `${(passwordStrength / 4) * 100}%`,
                            backgroundColor: getStrengthColor(passwordStrength),
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.strengthLabelContainer}>
                      <Text style={[styles.strengthLabel, { color: getStrengthColor(passwordStrength) }]}>
                        {getStrengthLabel(passwordStrength)}
                      </Text>
                      <Text style={styles.strengthHint}>
                        {passwordStrength < 4
                          ? "Añade mayúsculas, números y caracteres especiales"
                          : "Contraseña segura"}
                      </Text>
                    </View>
                  </>
                )}

                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar contraseña *</Text>
                <View style={[styles.passwordContainer, errors.confirmPassword ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#737373" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.referralLabelContainer}>
                  <Text style={styles.label}>Código de referido</Text>
                  <Text style={styles.optionalText}>(Opcional)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Código de 6 dígitos (ej: ABC123)"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                  editable={!isLoading}
                  maxLength={6}
                />
                <Text style={styles.referralDescription}>
                  Si usas un código de referido, recibirás 10 tokens adicionales
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>{isLoading ? "Creando cuenta..." : "Crear Cuenta"}</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

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

          <View style={styles.footer}>
            <Ionicons name="gift" size={20} color="#F59E0B" />
            <Text style={styles.footerText}>
              Recibe <Text style={styles.footerTextBold}>150 tokens gratis</Text> al registrarte
              {referralCode && " + 10 tokens adicionales por código de referido"}
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
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 14, fontWeight: "500", color: "#0A0A0A" },
  charCount: { fontSize: 12, color: "#A3A3A3" },
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
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    fontWeight: "500",
  },
  passwordContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#0A0A0A",
  },
  eyeIcon: {
    padding: 8,
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
  footerText: { fontSize: 14, color: "#737373", textAlign: "center" },
  footerTextBold: { fontWeight: "700", color: "#F59E0B" },
  referralLabelContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  optionalText: { fontSize: 12, color: "#737373", fontStyle: "italic" },
  referralDescription: { fontSize: 12, color: "#737373", fontStyle: "italic" },
  strengthBarContainer: {
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 8,
  },
  strengthBar: {
    height: "100%",
    borderRadius: 3,
  },
  strengthLabelContainer: {
    gap: 4,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  strengthHint: {
    fontSize: 12,
    color: "#737373",
    fontStyle: "italic",
  },
})
