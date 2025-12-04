"use client"

import { supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect, useRouter, Link } from "expo-router"
import { useCallback, useState } from "react"
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import ModalEditarPerfil from "@/components/ModalEditarPerfil"

interface Usuario {
  is_admin: any
  id: string
  nombre: string
  tokens_disponibles: number
  correo: string
  foto_url: string
  telefono?: string
  created_at: string
}

const Perfil = () => {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [modalVisible, setModalVisible] = useState(false)

  const cargarUsuario = async () => {
    try {
      const data = await AsyncStorage.getItem("usuario")
      if (data) {
        const usuarioLocal = JSON.parse(data)
        const { data: usuarioDb, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", usuarioLocal.id)
          .single()

        if (error) {
          setUsuario(usuarioLocal)
        } else {
          setUsuario(usuarioDb)
          await AsyncStorage.setItem("usuario", JSON.stringify(usuarioDb))
        }
      } else {
        setUsuario(null)
      }
    } catch (error) {
      console.error("Error cargando usuario:", error)
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      cargarUsuario()
    }, []),
  )

  const handleCerrarSesion = async () => {
    try {
      await AsyncStorage.clear()
      await supabase.auth.signOut()
      setUsuario(null)
      router.replace("/(auth)/login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  const handleEditarPerfil = () => {
    setModalVisible(true)
  }

  const handleHistorialAlquileres = () => router.push("/HistorialAlquileresScreen" as any)
  const handleHistorialCompras = () => router.push("/HistorialComprasScreen" as any)
  const handleRanking = () => router.push("/(tabs)/ranking")
  const irAHome = () => router.push("/(tabs)/HomeMenu/mainScreen")

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha)
    return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  }

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6366F1" /></View>

  if (!usuario) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noUserText}>No hay usuario logueado</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.loginButtonText}>Ir al Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={irAHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={handleEditarPerfil} style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: usuario.foto_url || "https://placehold.co/150x150/png" }} style={styles.avatar} />
          <View style={styles.onlineBadge} />
        </View>
        <Text style={styles.userName}>{usuario.nombre}</Text>
        <View style={styles.tokensCard}>
          <Text style={styles.tokensLabel}>Tokens Disponibles</Text>
          <View style={styles.tokensRow}>
            <Text style={styles.tokensAmount}>💰 {usuario.tokens_disponibles}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Personal</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}><Ionicons name="person-outline" size={20} color="#6366F1" /></View>
            <View style={styles.infoContent}><Text style={styles.infoLabel}>Nombre completo</Text><Text style={styles.infoValue}>{usuario.nombre}</Text></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}><Ionicons name="mail-outline" size={20} color="#6366F1" /></View>
            <View style={styles.infoContent}><Text style={styles.infoLabel}>Correo electrónico</Text><Text style={styles.infoValue}>{usuario.correo}</Text></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}><Ionicons name="call-outline" size={20} color="#6366F1" /></View>
            <View style={styles.infoContent}><Text style={styles.infoLabel}>Teléfono</Text><Text style={styles.infoValue}>{usuario.telefono || "No registrado"}</Text></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}><Ionicons name="calendar-outline" size={20} color="#6366F1" /></View>
            <View style={styles.infoContent}><Text style={styles.infoLabel}>Miembro desde</Text><Text style={styles.infoValue}>{formatearFecha(usuario.created_at)}</Text></View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>

        {/* --- NUEVO: ESCANEAR CÓDIGO (USUARIO) --- */}
        <Link href="/UserEscanerScreen" asChild>
            <TouchableOpacity style={styles.actionCard}>
                <View style={styles.actionIconContainer}>
                    <Ionicons name="qr-code-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Escanear Código</Text>
                    <Text style={styles.actionSubtitle}>Confirmar entrega o devolución</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
        </Link>
        {/* ---------------------------------------- */}

        <TouchableOpacity style={styles.actionCard} onPress={handleHistorialAlquileres}>
          <View style={styles.actionIconContainer}><Ionicons name="time-outline" size={24} color="#6366F1" /></View>
          <View style={styles.actionContent}><Text style={styles.actionTitle}>Historial de Alquileres</Text><Text style={styles.actionSubtitle}>Ver todos tus alquileres</Text></View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>

         <TouchableOpacity style={styles.actionCard} onPress={handleHistorialCompras}>
          <View style={styles.actionIconContainer}><Ionicons name="card-outline" size={24} color="#6366F1" /></View>
          <View style={styles.actionContent}><Text style={styles.actionTitle}>Historial de Compras</Text><Text style={styles.actionSubtitle}>Ver todas tus compras de tokens</Text></View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        {/* ADMIN */}
        {usuario.is_admin && (
          <Link href="/AdminMenuScreen" asChild>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIconContainer}><Ionicons name="grid-outline" size={24} color="#4F46E5" /></View>
              <View style={styles.actionContent}><Text style={styles.actionTitle}>Gestionar Plataforma</Text><Text style={styles.actionSubtitle}>Panel de administración</Text></View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </Link>
        )}

        <TouchableOpacity style={styles.actionCard} onPress={handleRanking}>
          <View style={styles.actionIconContainer}><Ionicons name="trophy-outline" size={24} color="#F59E0B" /></View>
          <View style={styles.actionContent}><Text style={styles.actionTitle}>Ranking de Usuarios</Text><Text style={styles.actionSubtitle}>Ver tu posición</Text></View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleCerrarSesion}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {usuario && <ModalEditarPerfil visible={modalVisible} onClose={() => setModalVisible(false)} usuario={usuario} onUpdate={cargarUsuario} />}
    </ScrollView>
  )
}

export default Perfil

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: { flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" },
  noUserText: { fontSize: 16, color: "#6B7280", marginBottom: 20 },
  loginButton: { backgroundColor: "#6366F1", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12 },
  loginButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: "#FFFFFF" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  editButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  profileSection: { backgroundColor: "#FFFFFF", paddingVertical: 30, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: "#6366F1" },
  onlineBadge: { position: "absolute", bottom: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: "#10B981", borderWidth: 3, borderColor: "#FFFFFF" },
  userName: { fontSize: 24, fontWeight: "700", color: "#1F2937", marginBottom: 20 },
  tokensCard: { backgroundColor: "#EEF2FF", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16, borderWidth: 2, borderColor: "#6366F1" },
  tokensLabel: { fontSize: 12, color: "#6366F1", fontWeight: "600", textAlign: "center", marginBottom: 4 },
  tokensRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  tokensAmount: { fontSize: 28, fontWeight: "700", color: "#6366F1" },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginBottom: 12 },
  infoCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  infoIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  infoValue: { fontSize: 16, color: "#1F2937", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 4 },
  actionCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginRight: 12 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 2 },
  actionSubtitle: { fontSize: 14, color: "#6B7280" },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 24, borderWidth: 2, borderColor: "#FEE2E2" },
  logoutButtonText: { fontSize: 16, fontWeight: "600", color: "#EF4444", marginLeft: 8 },
})