"use client"

import TextComponent from "@/components/ui/text-component"
import { supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text
} from "react-native"

interface Usuario {
  id: string
  nombre: string
  correo: string
  foto_url: string
  tokens_disponibles: number
}

interface Categoria {
  id: string
  nombre: string
}

interface Producto {
  id: string
  nombre: string
  precio_tokens_dia: number
  calificacion_promedio: number
  disponible: boolean
  imagen_url: string
  categorias?: {
    nombre: string
  }
}

const MainScreen = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("todas")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  
  // ESTADO PARA EL BADGE DE NOTIFICACIONES
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter()

  const heroMessages = [
    "Accede a miles de objetos usando tokens. Ahorra dinero y espacio.",
    "Biblioteca de objetos: ahorra dinero con nosotros y ayuda al planeta.",
    "Alquila sin compromiso a largo plazo. Flexibilidad total.",
    "Gana tokens con reseñas y devoluciones a tiempo.",
  ]

  useFocusEffect(
    useCallback(() => {
      const cargarUsuario = async () => {
        try {
          const userData = await AsyncStorage.getItem("usuario")
          if (userData) {
            const user = JSON.parse(userData);
            setUsuario(user);
            fetchUnreadNotifications(user.id);
          }
          else setUsuario(null)
        } catch (error) {
          console.error("Error cargando usuario:", error)
        }
      }
      cargarUsuario()
    }, []),
  )

  // CARGA DE PRODUCTOS
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true)
        const { data: productosData, error: errorProductos } = await supabase.from("objetos").select(`*, categorias ( nombre )`)
        if (!errorProductos) setProductos(productosData || [])
        
        const { data: categoriasData, error: errorCategorias } = await supabase.from("categorias").select("id, nombre")
        if (!errorCategorias) setCategorias(categoriasData || [])
        
        setLoading(false)
      }
      fetchData()
    }, []),
  )

  // LÓGICA DEL BADGE DE NOTIFICACIONES (Realtime)
  useEffect(() => {
    if (!usuario?.id) return;

    // 1. Carga inicial del conteo
    fetchUnreadNotifications(usuario.id);

    // 2. Suscripción a cambios
    const channel = supabase
      .channel('main-notifications-badge')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT (nueva) y UPDATE (leída)
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${usuario.id}`,
        },
        () => {
          // Si algo cambia, volvemos a contar
          fetchUnreadNotifications(usuario.id);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [usuario?.id]);

  const fetchUnreadNotifications = async (userId: string) => {
    const { count, error } = await supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .eq('leido', false);
    
    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % heroMessages.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [heroMessages.length])

  const productosFiltrados = productos.filter((item) => {
    const matchSearch = item.nombre.toLowerCase().includes(search.toLowerCase())
    const matchCategoria = categoriaSeleccionada === "todas" || item.categorias?.nombre === categoriaSeleccionada
    return matchSearch && matchCategoria
  })

  const getCategoriaDisplay = () => {
    if (categoriaSeleccionada === "todas") return "📦 Todas las categorías"
    return categoriaSeleccionada
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerFixed}>
        <Image source={require("@/assets/images/prestafacil-icon.jpg")} style={styles.logo} resizeMode="contain" />
        <View style={styles.profileContainer}>
          
          {/* BOTÓN DE NOTIFICACIONES CON BADGE */}
          <TouchableOpacity 
            style={styles.notifButton}
            onPress={() => router.push('/NotificacionesScreen' as any)}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {/* ----------------------------------- */}

          <View style={styles.tokensBadge}>
            <TextComponent
              text={`💰 ${usuario?.tokens_disponibles ?? 0}`}
              textSize={12}
              fontWeight="bold"
              textColor="#fff"
            />
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(tabs)/Perfil/PerfilUsuario" as unknown as any)}
          >
            <Image
              source={{
                uri: usuario?.foto_url || "https://placehold.co/100x100?text=Sin+Foto",
              }}
              style={styles.profileImageHeader}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar objetos..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.heroSection}>
        <TextComponent text="Alquila lo que necesites" fontWeight="bold" textSize={28} textColor="#1E293B" />
        <TextComponent text={heroMessages[messageIndex]} textSize={16} textColor="#64748B" style={{ marginTop: 8 }} />
      </View>

      <View style={styles.categoriesSection}>
        <TextComponent
          text="Categorías"
          fontWeight="bold"
          textSize={18}
          textColor="#1E293B"
          style={{ marginBottom: 12 }}
        />
        <TouchableOpacity style={styles.categoryDropdown} onPress={() => setShowCategoryDropdown(true)}>
          <TextComponent text={getCategoriaDisplay()} textSize={16} textColor="#1E293B" />
          <Ionicons name="chevron-down" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCategoryDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryDropdown(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryDropdown(false)}>
          <View style={styles.dropdownMenu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.dropdownItem, categoriaSeleccionada === "todas" && styles.dropdownItemActive]}
                onPress={() => {
                  setCategoriaSeleccionada("todas")
                  setShowCategoryDropdown(false)
                }}
              >
                <TextComponent
                  text="📦 Todas las categorías"
                  textSize={16}
                  textColor={categoriaSeleccionada === "todas" ? "#6366F1" : "#1E293B"}
                  fontWeight={categoriaSeleccionada === "todas" ? "bold" : "normal"}
                />
                {categoriaSeleccionada === "todas" && <Ionicons name="checkmark" size={20} color="#6366F1" />}
              </TouchableOpacity>
              {categorias.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.dropdownItem, categoriaSeleccionada === cat.nombre && styles.dropdownItemActive]}
                  onPress={() => {
                    setCategoriaSeleccionada(cat.nombre)
                    setShowCategoryDropdown(false)
                  }}
                >
                  <TextComponent
                    text={cat.nombre}
                    textSize={16}
                    textColor={categoriaSeleccionada === cat.nombre ? "#6366F1" : "#1E293B"}
                    fontWeight={categoriaSeleccionada === cat.nombre ? "bold" : "normal"}
                  />
                  {categoriaSeleccionada === cat.nombre && <Ionicons name="checkmark" size={20} color="#6366F1" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.productsSection}>
        <TextComponent
          text="Objetos Disponibles"
          fontWeight="bold"
          textSize={20}
          textColor="#1E293B"
          style={{ marginBottom: 15 }}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.productGrid}>
            {productosFiltrados.map((item) => (
              <View key={item.id} style={styles.productCard}>
                <Image source={{ uri: item.imagen_url }} style={styles.productImage} />

                {item.categorias && (
                  <View style={styles.categoryBadge}>
                    <TextComponent text={item.categorias.nombre} textSize={10} fontWeight="bold" textColor="#6366F1" />
                  </View>
                )}

                <View style={styles.productInfo}>
                  <TextComponent
                    text={item.nombre}
                    fontWeight="bold"
                    textSize={16}
                    textColor="#1E293B"
                    style={{ marginBottom: 4 }}
                  />

                  <TextComponent
                    text={`💰 ${item.precio_tokens_dia} tokens/día`}
                    textSize={14}
                    fontWeight="bold"
                    textColor="#10B981"
                    style={{ marginBottom: 6 }}
                  />

                  <View style={styles.ratingRow}>
                    <TextComponent
                      text={`⭐ ${item.calificacion_promedio.toFixed(1)}`}
                      textSize={13}
                      textColor="#F59E0B"
                    />
                    <View style={[styles.statusBadge, { backgroundColor: item.disponible ? "#D1FAE5" : "#FEE2E2" }]}>
                      <TextComponent
                        text={item.disponible ? "Disponible" : "No disponible"}
                        textSize={11}
                        fontWeight="bold"
                        textColor={item.disponible ? "#059669" : "#DC2626"}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => router.push(`./detalleProducto?id=${item.id}`)}
                  >
                    <TextComponent text="Ver detalles" fontWeight="bold" textSize={14} textColor="#fff" />
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.howItWorksSection}>
        <TextComponent
          text="¿Cómo funciona?"
          fontWeight="bold"
          textSize={24}
          textColor="#1E293B"
          style={{ marginBottom: 20, textAlign: "center" }}
        />

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <TextComponent text="1" fontWeight="bold" textSize={20} textColor="#fff" />
          </View>
          <View style={styles.stepContent}>
            <TextComponent text="Elige un objeto" fontWeight="bold" textSize={16} textColor="#1E293B" />
            <TextComponent
              text="Explora nuestro catálogo y encuentra lo que necesitas"
              textSize={14}
              textColor="#64748B"
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <TextComponent text="2" fontWeight="bold" textSize={20} textColor="#fff" />
          </View>
          <View style={styles.stepContent}>
            <TextComponent text="Paga con tokens" fontWeight="bold" textSize={16} textColor="#1E293B" />
            <TextComponent
              text="Usa tus tokens para alquilar por días"
              textSize={14}
              textColor="#64748B"
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <TextComponent text="3" fontWeight="bold" textSize={20} textColor="#fff" />
          </View>
          <View style={styles.stepContent}>
            <TextComponent text="Disfruta y devuelve" fontWeight="bold" textSize={16} textColor="#1E293B" />
            <TextComponent
              text="Usa el objeto y devuélvelo a tiempo para ganar más tokens"
              textSize={14}
              textColor="#64748B"
              style={{ marginTop: 4 }}
            />
          </View>
        </View>
      </View>

      <View style={styles.benefitsSection}>
        <TextComponent
          text="¿Por qué usar tokens?"
          fontWeight="bold"
          textSize={24}
          textColor="#1E293B"
          style={{ marginBottom: 20, textAlign: "center" }}
        />

        <View style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <TextComponent text="💰" textSize={32} />
          </View>
          <TextComponent text="Ahorra dinero" fontWeight="bold" textSize={16} textColor="#1E293B" />
          <TextComponent
            text="Alquila en lugar de comprar. Gana tokens gratis con reseñas y devoluciones a tiempo."
            textSize={14}
            textColor="#64748B"
            style={{ marginTop: 6, textAlign: "center" }}
          />
        </View>

        <View style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <TextComponent text="🌍" textSize={32} />
          </View>
          <TextComponent text="Cuida el planeta" fontWeight="bold" textSize={16} textColor="#1E293B" />
          <TextComponent
            text="Reduce el consumo y la producción. Comparte recursos con tu comunidad."
            textSize={14}
            textColor="#64748B"
            style={{ marginTop: 6, textAlign: "center" }}
          />
        </View>

        <View style={styles.benefitCard}>
          <View style={styles.benefitIcon}>
            <TextComponent text="⚡" textSize={32} />
          </View>
          <TextComponent text="Acceso instantáneo" fontWeight="bold" textSize={16} textColor="#1E293B" />
          <TextComponent
            text="Miles de objetos disponibles cuando los necesites. Sin compromisos a largo plazo."
            textSize={14}
            textColor="#64748B"
            style={{ marginTop: 6, textAlign: "center" }}
          />
        </View>
      </View>

      <View style={styles.ctaSection}>
        <TextComponent
          text="¿Listo para empezar?"
          fontWeight="bold"
          textSize={24}
          textColor="#fff"
          style={{ marginBottom: 12, textAlign: "center" }}
        />
        <TextComponent
          text="Únete a nuestra comunidad y comienza a alquilar hoy mismo"
          textSize={16}
          textColor="#E0E7FF"
          style={{ marginBottom: 20, textAlign: "center" }}
        />
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push("/(tabs)/ganar")}>
          <TextComponent text="Obtener más tokens" fontWeight="bold" textSize={16} textColor="#6366F1" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

export default MainScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerFixed: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logo: {
    width: 80,
    height: 80,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  // ESTILOS DEL BOTÓN DE NOTIFICACIÓN
  notifButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginRight: 5,
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff'
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  // -----------------------------
  profileButton: {},
  profileImageHeader: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: "#6366F1",
  },
  tokensBadge: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  categoryDropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxHeight: 400,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: "#EEF2FF",
  },
  productsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  productInfo: {
    padding: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  detailsButton: {
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  howItWorksSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: "#fff",
    marginBottom: 30,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  stepContent: {
    flex: 1,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    backgroundColor: "#F8FAFC",
  },
  benefitCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  benefitIcon: {
    marginBottom: 12,
  },
  ctaSection: {
    backgroundColor: "#6366F1",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
  },
  ctaButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
  },
})