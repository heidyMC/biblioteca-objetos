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
    const loadReferidos = async (userId: string) => {
    try {
      // Obtener IDs de la tabla referidos
      const { data: referidosData, error } = await supabase
        .from("referidos")
        .select("id_referido")
        .eq("id_referente", userId);

      if (error) throw error;

      if (!referidosData || referidosData.length === 0) {
        setReferidos([]);
        return;
      }

      const referidosIds = referidosData.map((ref) => ref.id_referido);

      // Obtener usuarios referidos
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, nombre, created_at")
        .in("id", referidosIds);

      if (usuariosError) throw usuariosError;

      const referidos: Referido[] = usuariosData.map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        fecha_registro: new Date(usuario.created_at).toLocaleDateString("es-ES"),
        tokens_ganados: 25, // Valor fijo por referido
      }));

      setReferidos(referidos);
    } catch (error) {
      console.error("Error cargando referidos:", error);
      setReferidos([]);
    }
  };



// Los estilos se quedan completos porque se usan desde el SkeletonLoader
{!hasReferidos ? (
  <View style={styles.emptyState}>
    <Ionicons name="people-outline" size={64} color="#D4D4D4" />
    <Text style={styles.emptyStateText}>Aún no tienes referidos</Text>
    <Text style={styles.emptyStateSubtext}>
      Comparte tu enlace para empezar a ganar tokens.
    </Text>
  </View>
) : !hasSearchResults ? (
  <View style={styles.emptyState}>
    <Ionicons name="search-outline" size={64} color="#D4D4D4" />
    <Text style={styles.emptyStateText}>No se encontraron referidos</Text>

    <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
      <Text style={styles.clearSearchButtonText}>Limpiar búsqueda</Text>
    </TouchableOpacity>
  </View>
) : (
  <View style={styles.referralsList}>
    {filteredReferidos.map((ref) => (
      <View key={ref.id} style={styles.referralItem}>
        <View style={styles.referralAvatar}>
          <Ionicons name="person" size={24} color="#6366F1" />
        </View>
        <View style={styles.referralInfo}>
          <Text style={styles.referralName}>{ref.nombre}</Text>
          <Text style={styles.referralDate}>
            Registrado el {ref.fecha_registro}
          </Text>
        </View>
        <View style={styles.referralReward}>
          <Text style={styles.referralRewardText}>+25 tokens</Text>
        </View>
      </View>
    ))}
  </View>
)}
