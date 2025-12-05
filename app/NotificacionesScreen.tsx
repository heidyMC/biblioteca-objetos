import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function NotificacionesScreen() {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndNotifications();
  }, []);

  const loadUserAndNotifications = async () => {
    try {
      const userData = await AsyncStorage.getItem("usuario");
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id);
        fetchNotifications(user.id);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchNotifications = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("*")
        .eq("usuario_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotificaciones(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Actualización optimista
    setNotificaciones(prev => prev.map(n => n.id === notificationId ? { ...n, leido: true } : n));
    
    // BD
    await supabase
      .from("notificaciones")
      .update({ leido: true })
      .eq("id", notificationId);
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    await supabase
      .from("notificaciones")
      .update({ leido: true })
      .eq("usuario_id", userId)
      .eq("leido", false);
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "success": return { name: "checkmark-circle", color: "#10B981" };
      case "error": return { name: "close-circle", color: "#EF4444" };
      default: return { name: "information-circle", color: "#3B82F6" };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const icon = getIcon(item.tipo);
    return (
      <TouchableOpacity 
        style={[styles.card, !item.leido && styles.unreadCard]} 
        onPress={() => !item.leido && markAsRead(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon.name as any} size={28} color={icon.color} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.leido && styles.unreadTitle]}>{item.titulo}</Text>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.message}>{item.mensaje}</Text>
        </View>
        {!item.leido && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        
        {/* Botón para marcar todo como leído */}
        <TouchableOpacity onPress={markAllAsRead}>
          <Ionicons name="checkmark-done-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); if(userId) fetchNotifications(userId); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No tienes notificaciones nuevas</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#E5E7EB"
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937" },
  list: { padding: 16 },
  card: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 16,
    marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  unreadCard: { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD", borderWidth: 1 },
  iconContainer: { marginRight: 12, justifyContent: "flex-start", paddingTop: 2 },
  contentContainer: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  title: { fontSize: 15, fontWeight: "600", color: "#1F2937", flex: 1, marginRight: 8 },
  unreadTitle: { fontWeight: "800", color: "#000" },
  date: { fontSize: 11, color: "#9CA3AF" },
  message: { fontSize: 13, color: "#4B5563", lineHeight: 18 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444", position: "absolute", top: 16, right: 16 },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#9CA3AF", marginTop: 10, fontSize: 16 }
});