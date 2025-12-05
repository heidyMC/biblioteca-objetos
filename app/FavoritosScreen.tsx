import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

export default function FavoritosScreen() {
  const router = useRouter();
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("usuario");
      if (!userData) return;
      const user = JSON.parse(userData);

      const { data, error } = await supabase
        .from("favoritos")
        .select(`
          id,
          objeto_id,
          objetos (
            id,
            nombre,
            imagen_url,
            precio_tokens_dia,
            calificacion_promedio,
            disponible
          )
        `)
        .eq("usuario_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavoritos(data || []);
    } catch (error) {
      console.error("Error cargando favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favId: string) => {
    // Actualización optimista
    setFavoritos((prev) => prev.filter((item) => item.id !== favId));
    
    await supabase.from("favoritos").delete().eq("id", favId);
  };

  const renderItem = ({ item }: { item: any }) => {
    const obj = item.objetos;
    if (!obj) return null; // Por si se borró el objeto

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push({ pathname: '/(tabs)/HomeMenu/detalleProducto', params: { id: obj.id } })}
      >
        <Image source={{ uri: obj.imagen_url }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{obj.nombre}</Text>
          <Text style={styles.price}>💰 {obj.precio_tokens_dia} / día</Text>
          <View style={styles.row}>
             <Text style={styles.rating}>⭐ {obj.calificacion_promedio || 0}</Text>
             <Text style={[styles.status, { color: obj.disponible ? '#10B981' : '#EF4444' }]}>
                {obj.disponible ? 'Disponible' : 'Agotado'}
             </Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={() => removeFavorite(item.id)} style={styles.deleteBtn}>
            <Ionicons name="heart-dislike" size={24} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Favoritos</Text>
        <View style={{width: 40}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
                <Ionicons name="heart-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>No tienes favoritos aún.</Text>
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
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#E5E7EB"
  },
  backButton: { padding: 5 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1F293B" },
  list: { padding: 20 },
  card: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, padding: 12,
    marginBottom: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 6, elevation: 2
  },
  image: { width: 70, height: 70, borderRadius: 12, backgroundColor: "#F3F4F6" },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "700", color: "#1F293B", marginBottom: 4 },
  price: { fontSize: 14, fontWeight: "600", color: "#6366F1" },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rating: { fontSize: 12, color: "#F59E0B" },
  status: { fontSize: 12, fontWeight: "600" },
  deleteBtn: { padding: 10 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#9CA3AF', fontSize: 16 }
});