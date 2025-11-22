"use client";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos obligatorios.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Contraseña débil", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from("usuarios")
        .select("id")
        .eq("correo", email)
        .single();

      if (existingUser) {
        Alert.alert("Error", "Este correo electrónico ya está registrado.");
        setIsLoading(false);
        return;
      }

      let referrerId = null;
      if (referralCode.trim()) {
        const { data: referrerData } = await supabase
          .from("usuarios")
          .select("id, tokens_disponibles")
          .eq("referal_code", referralCode.trim().toUpperCase())
          .single();

        if (!referrerData) {
          Alert.alert("Código de referido inválido", "El código de referido no existe. Puedes dejarlo vacío si no tienes uno.");
          setIsLoading(false);
          return;
        }
        referrerId = referrerData.id;
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
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (referrerId) {
        const { error: referralError } = await supabase
          .from("referidos")
          .insert([
            {
              id_referente: referrerId,
              id_referido: newUser.id,
            },
          ]);

        if (referralError) {
          console.error("Error creando relación de referido:", referralError);
        }

        const { data: referrerCurrent } = await supabase
          .from("usuarios")
          .select("tokens_disponibles")
          .eq("id", referrerId)
          .single();

        if (referrerCurrent) {
          await supabase
            .from("usuarios")
            .update({
              tokens_disponibles: referrerCurrent.tokens_disponibles + 25,
            })
            .eq("id", referrerId);
        }

        await supabase
          .from("usuarios")
          .update({
            tokens_disponibles: 160,
          })
          .eq("id", newUser.id);
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
              router.replace("/(tabs)/HomeMenu/mainScreen");
            },
          },
        ]
      );

      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
      setReferralCode("");
    } catch (error: any) {
      Alert.alert("Error al registrar", error.message || "Ocurrió un error inesperado. Por favor intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "exp://localhost:19000",
        },
      });

      if (error) throw error;

      Alert.alert("¡Bienvenido!", "Has iniciado sesión con Google correctamente.");
      router.replace("/(tabs)/HomeMenu/mainScreen");
    } catch (error: any) {
      Alert.alert("Error con Google", error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
              {/* Se actualizó la imagen y el estilo */}
              <Image 
                source={require("../../assets/images/prestafacil-icon.jpg")}
                style={{ width: '100%', height: '100%', borderRadius: 20 }}
                resizeMode="cover"
              />
            </View>
            {/* Se actualizó el nombre de la app */}
            <Text style={styles.title}>PrestaFacil</Text>
            <Text style={styles.subtitle}>Alquila con tokens</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crear Cuenta</Text>
            <Text style={styles.cardDescription}>Regístrate para comenzar a alquilar</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre completo *</Text>
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
                <Text style={styles.label}>Correo electrónico *</Text>
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
                <Text style={styles.label}>Teléfono *</Text>
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
                <Text style={styles.label}>Contraseña *</Text>
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
                <Text style={styles.label}>Confirmar contraseña *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
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
                <Text style={styles.referralDescription}>Si usas un código de referido, recibirás 10 tokens adicionales</Text>
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

              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => router.push("/(auth)/login")}
              >
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
  );
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
    // Se actualizó el fondo a blanco
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
});