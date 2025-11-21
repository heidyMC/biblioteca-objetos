import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { styles } from "./HistorialComprasScreen.styles";

interface Transaction {
  id: string;
  package_id: string;
  tokens_amount: number;
  amount_paid: number;
  transaction_id?: string;
  receipt_image_url?: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  nombre: string;
  correo: string;
}

const SkeletonLoader = () => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3].map((item) => (
      <View key={item} style={styles.skeletonCard}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonTextLarge} />
          <View style={styles.skeletonBadge} />
        </View>
        <View style={styles.skeletonTextMedium} />
        <View style={styles.skeletonFooter}>
          <View style={styles.skeletonTextSmall} />
          <View style={styles.skeletonTextSmall} />
        </View>
      </View>
    ))}
  </View>
);

export default function HistorialComprasScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem("usuario");
      if (!userData) {
        Alert.alert("Error", "Usuario no autenticado");
        router.replace("/(tabs)/Perfil/PerfilUsuario");
        return;
      }

      const user = JSON.parse(userData);
      setUser(user);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error loading transactions:", error);
      Alert.alert("Error", "No se pudieron cargar las transacciones");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransactions();
  }, [loadTransactions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado";
      case "pending":
        return "Pendiente";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
    return formatDate(dateString);
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.tokens_amount.toString().includes(searchQuery) ||
    transaction.amount_paid.toString().includes(searchQuery) ||
    getStatusText(transaction.status).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/Perfil/PerfilUsuario")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Compras</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por ID, tokens, monto, estado..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {loading ? (
          <SkeletonLoader />
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name={searchQuery ? "search-outline" : "receipt-outline"} 
              size={64} 
              color="#9CA3AF" 
            />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? "No se encontraron transacciones" : "No hay transacciones"}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? "Intenta con otros términos de búsqueda"
                : "Aún no has realizado ninguna compra de tokens"
              }
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionCard}
              onPress={() => setSelectedTransaction(transaction)}
            >
              <View style={styles.transactionHeader}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTokens}>
                    {transaction.tokens_amount} tokens
                  </Text>
                  <Text style={styles.transactionPrice}>
                    Bs {transaction.amount_paid}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(transaction.status) + "20" },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: getStatusColor(transaction.status) }]}
                  >
                    {getStatusText(transaction.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.transactionFooter}>
                <Text style={styles.transactionDate}>
                  {formatTimeAgo(transaction.created_at)}
                </Text>
                <Text style={styles.transactionId}>
                  ID: {transaction.id.slice(0, 8)}...
                </Text>
              </View>

              {transaction.transaction_id && (
                <View style={styles.transactionIdRow}>
                  <Text style={styles.transactionIdLabel}>ID Transacción:</Text>
                  <Text style={styles.transactionIdValue}>{transaction.transaction_id}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal de Detalles - CORREGIDO: Ahora aparece desde abajo */}
      <Modal
        visible={!!selectedTransaction}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Transacción</Text>
              <TouchableOpacity
                onPress={() => setSelectedTransaction(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Tokens</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.tokens_amount} tokens
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Monto Pagado</Text>
                  <Text style={styles.detailValue}>Bs {selectedTransaction.amount_paid}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Estado</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(selectedTransaction.status) + "20",
                        alignSelf: "flex-start",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(selectedTransaction.status) },
                      ]}
                    >
                      {getStatusText(selectedTransaction.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Fecha de Creación</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedTransaction.created_at)}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Última Actualización</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedTransaction.updated_at)}
                  </Text>
                </View>

                {selectedTransaction.transaction_id && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>ID de Transacción Bancaria</Text>
                    <Text style={styles.detailValue}>
                      {selectedTransaction.transaction_id}
                    </Text>
                  </View>
                )}

                {selectedTransaction.receipt_image_url && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Comprobante</Text>
                    <TouchableOpacity
                      onPress={() => setPreviewImage(selectedTransaction.receipt_image_url!)}
                      style={styles.receiptImage}
                    >
                      <Image
                        source={{ uri: selectedTransaction.receipt_image_url }}
                        style={styles.receiptImagePreview}
                      />
                      <Text style={styles.receiptImageText}>Ver comprobante</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para previsualización de imagen */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.closePreviewButton}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}

          <TouchableOpacity
            style={styles.closePreviewTextButton}
            onPress={() => setPreviewImage(null)}
          >
            <Text style={styles.closePreviewText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}