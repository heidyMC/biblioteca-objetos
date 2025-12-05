import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { supabase } from "../lib/supabase";

const ASUNTOS = [
  { id: "danado", label: "📦 Producto Dañado", icon: "construct" },
  { id: "pago", label: "💳 Problema de Pago", icon: "card" },
  { id: "cuenta", label: "👤 Mi Cuenta", icon: "person" },
  { id: "otro", label: "📝 Otro", icon: "chatbubble" },
];

export default function SoporteScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("usuario").then((data) => {
      if (data) setUserId(JSON.parse(data).id);
    });
  }, []);

  const enviarTicket = async () => {
    if (!asunto) {
      Alert.alert("Falta información", "Por favor selecciona un asunto.");
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert("Falta información", "Por favor describe tu problema.");
      return;
    }
    if (!userId) {
      Alert.alert("Error", "No se pudo identificar al usuario.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("ticket_soporte").insert({
        usuario_id: userId,
        asunto: asunto,
        descripcion: descripcion,
      });

      if (error) throw error;

      Alert.alert(
        "Ticket Enviado",
        "Hemos recibido tu reporte. Un administrador te contactará pronto.",
        [{ text: "Entendido", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo enviar el ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centro de Soporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>¿En qué podemos ayudarte?</Text>
          <Text style={styles.subLabel}>Selecciona el motivo de tu reporte:</Text>

          <View style={styles.grid}>
            {ASUNTOS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.optionCard,
                  asunto === item.label && styles.optionSelected,
                ]}
                onPress={() => setAsunto(item.label)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={28}
                  color={asunto === item.label ? "#6366F1" : "#64748B"}
                />
                <Text
                  style={[
                    styles.optionText,
                    asunto === item.label && styles.optionTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Cuéntanos más detalles</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe el problema aquí..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            value={descripcion}
            onChangeText={setDescripcion}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={enviarTicket}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.submitText}>Enviar Reporte</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              Tu reporte será revisado por nuestro equipo de administración. Te contactaremos si necesitamos más información.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 8, marginTop: 10 },
  subLabel: { fontSize: 14, color: "#64748B", marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  optionCard: {
    width: "48%",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  optionSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#EEF2FF",
  },
  optionText: { fontSize: 13, fontWeight: "600", color: "#64748B", textAlign: "center" },
  optionTextSelected: { color: "#6366F1" },
  textArea: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
    color: "#1E293B",
  },
  submitButton: {
    backgroundColor: "#6366F1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
    alignItems: "center",
  },
  infoText: { flex: 1, fontSize: 13, color: "#4338CA", lineHeight: 18 },
});