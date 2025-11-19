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

// Componente Skeleton para loading
const SkeletonLoader = () => (
  <SafeAreaView style={styles.container} edges={["top"]}>
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <View style={[styles.skeleton, { width: 24, height: 24, borderRadius: 12 }]} />
        </TouchableOpacity>
        <View style={styles.headerTexts}>
          <View style={[styles.skeleton, { width: 200, height: 28, borderRadius: 8 }]} />
          <View style={[styles.skeleton, { width: 180, height: 16, borderRadius: 6, marginTop: 4 }]} />
        </View>
      </View>

      {/* Tarjeta de compartir Skeleton */}
      <View style={styles.shareCard}>
        <View style={styles.shareHeader}>
          <View style={[styles.skeleton, { width: 32, height: 32, borderRadius: 16 }]} />
          <View style={styles.shareTexts}>
            <View style={[styles.skeleton, { width: '80%', height: 20, borderRadius: 6 }]} />
            <View style={[styles.skeleton, { width: '95%', height: 16, borderRadius: 4, marginTop: 8 }]} />
          </View>
        </View>

        <View style={styles.referralLinkBox}>
          <View style={[styles.skeleton, { width: 150, height: 16, borderRadius: 6 }]} />
          <View style={[styles.skeleton, { width: 120, height: 28, borderRadius: 8, marginTop: 8 }]} />
        </View>

        <View style={[styles.skeleton, { height: 48, borderRadius: 12 }]} />
      </View>

      {/* Lista de referidos Skeleton */}
      <View style={styles.referralsSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.skeleton, { width: 20, height: 20, borderRadius: 10 }]} />
          <View style={[styles.skeleton, { width: 120, height: 20, borderRadius: 6 }]} />
        </View>

        <View style={[styles.skeleton, { height: 48, borderRadius: 12 }]} />

        {/* Skeleton items */}
        {[1, 2, 3].map((item) => (
          <View key={item} style={styles.referralItem}>
            <View style={[styles.skeleton, { width: 48, height: 48, borderRadius: 24 }]} />
            <View style={styles.referralInfo}>
              <View style={[styles.skeleton, { width: '70%', height: 18, borderRadius: 6 }]} />
              <View style={[styles.skeleton, { width: '50%', height: 14, borderRadius: 4, marginTop: 6 }]} />
            </View>
            <View style={[styles.skeleton, { width: 80, height: 32, borderRadius: 12 }]} />
          </View>
        ))}
      </View>
    </ScrollView>
  </SafeAreaView>
);

export default function ReferidosScreen() {
  const [user, setUser] = useState<any>(null);
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const router = useRouter();

  // Cargar usuario actual y generar código de referido si no existe
  useEffect(() => {
    loadUserAndReferrals();
  }, []);

  const loadUserAndReferrals = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("usuario");
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);

        // Si el usuario no tiene código de referido, generamos uno
        if (!user.referal_code) {
          await generateReferralCode(user);
        } else {
          // Cargar la lista de referidos
          await loadReferidos(user.id);
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
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error } = await supabase
        .from("usuarios")
        .update({ referal_code: code })
        .eq("id", user.id);

      if (error) throw error;

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
      const { data: referidosData, error } = await supabase
        .from("referidos")
        .select("id_referido")
        .eq("id_referente", userId);

      if (error) throw error;

      if (!referidosData || referidosData.length === 0) {
        setReferidos([]);
        return;
      }

      // Obtener los IDs de los usuarios referidos
      const referidosIds = referidosData.map((ref) => ref.id_referido);

      // Consultar la información de los usuarios referidos
      const { data: usuariosData, error: usuariosError } = await supabase
        .from("usuarios")
        .select("id, nombre, created_at")
        .in("id", referidosIds);

      if (usuariosError) throw usuariosError;

      const referidos: Referido[] = usuariosData.map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre,
        fecha_registro: new Date(usuario.created_at).toLocaleDateString("es-ES"),
        tokens_ganados: 25,
      }));

      setReferidos(referidos);
    } catch (error) {
      console.error("Error cargando referidos:", error);
      setReferidos([]);
    }
  };

  const handleShare = async () => {
    if (!user?.referal_code) {
      Alert.alert("Error", "No se pudo generar el enlace de referido");
      return;
    }

    try {
      await Share.share({
        message: `¡Únete a la Biblioteca de Objetos! Usa mi código de referido: ${user.referal_code} y obtén tokens gratis.`,
      });
    } catch (error) {
      console.error("Error al compartir:", error);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const filteredReferidos = referidos.filter((ref) =>
    ref.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasSearchResults = filteredReferidos.length > 0;
  const hasReferidos = referidos.length > 0;

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#0A0A0A" />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Invitar Amigos</Text>
              <Text style={styles.subtitle}>Gana tokens por cada amigo que invites</Text>
            </View>
          </View>

          {/* Tarjeta de compartir */}
          <View style={styles.shareCard}>
            <View style={styles.shareHeader}>
              <Ionicons name="people" size={32} color="#6366F1" />
              <View style={styles.shareTexts}>
                <Text style={styles.shareTitle}>Comparte con amigos</Text>
                <Text style={styles.shareDescription}>
                  Por cada amigo que se registre con tu código, recibirás 25 tokens.
                </Text>
              </View>
            </View>

            <View style={styles.referralLinkBox}>
              <Text style={styles.referralLinkLabel}>Tu código de referido:</Text>
              {generatingCode ? (
                <ActivityIndicator size="small" color="#6366F1" style={styles.codeGenerating} />
              ) : (
                <Text style={styles.referralCode}>{user?.referal_code}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Compartir Enlace</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de referidos */}
          <View style={styles.referralsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Tus Referidos</Text>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar referidos..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#737373" />
                </TouchableOpacity>
              )}
            </View>

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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  subtitle: {
    fontSize: 14,
    color: "#737373",
  },
  shareCard: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shareHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  shareTexts: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0A0A0A",
    marginBottom: 4,
  },
  shareDescription: {
    fontSize: 14,
    color: "#737373",
    lineHeight: 20,
  },
  referralLinkBox: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  referralLinkLabel: {
    fontSize: 14,
    color: "#737373",
    marginBottom: 4,
  },
  codeGenerating: {
    marginTop: 4,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6366F1",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  referralsSection: {
    backgroundColor: "#FFFFFF",
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  searchContainer: {
    position: "relative",
    marginBottom: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#0A0A0A",
    paddingRight: 48, // Espacio para el botón de limpiar
  },
  clearButton: {
    position: "absolute",
    right: 12,
    top: 14,
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#737373",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
  },
  clearSearchButton: {
    marginTop: 16,
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  clearSearchButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
  },
  referralsList: {
    gap: 12,
  },
  referralItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  referralAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A0A0A",
  },
  referralDate: {
    fontSize: 14,
    color: "#737373",
  },
  referralReward: {
    backgroundColor: "#D1FAE5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  referralRewardText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  skeleton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
});