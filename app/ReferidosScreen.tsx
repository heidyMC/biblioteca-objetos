import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

type Referido = {
  id: string;
  nombre: string;
  fecha_registro: string;
  tokens_ganados: number;
};

export default function ReferidosScreen() {
  const [user, setUser] = useState<any>(null);
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserAndReferrals();
  }, []);

  const loadUserAndReferrals = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("usuario");

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Si el usuario NO tiene código → generarlo
        if (!parsedUser.referal_code) {
          await generateReferralCode(parsedUser);
        }
      }
    } catch (error) {
      console.error("Error cargando usuario y referidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async (user: any) => {
    setGeneratingCode(true);
    try {
      // Código de 6 caracteres en mayúsculas
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error } = await supabase
        .from("usuarios")
        .update({ referal_code: code })
        .eq("id", user.id);

      if (error) throw error;

      // Actualizar localmente
      const updatedUser = { ...user, referal_code: code };
      setUser(updatedUser);
      await AsyncStorage.setItem("usuario", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error generando código de referido:", error);
      Alert.alert("Error", "No se pudo generar el código de referido");
    } finally {
      setGeneratingCode(false);
    }
  };


// Los estilos se quedan completos porque se usan desde el SkeletonLoader
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#737373",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    padding: 16,
  },
  headerTexts: {
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
 
  referralItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  referralInfo: {
    flex: 1,
  },
  skeleton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
});
