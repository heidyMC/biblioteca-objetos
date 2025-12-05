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
  Switch,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  Keyboard
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
  categoria_id: string
  categorias?: {
    nombre: string
  }
}

const MainScreen = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [messageIndex, setMessageIndex] = useState(0)
  
  // --- ESTADOS PARA FILTROS Y BÚSQUEDA ---
  const [search, setSearch] = useState("")
  const [modalFiltersVisible, setModalFiltersVisible] = useState(false);
  
  // Filtros activos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null); // ID de categoría
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Badge de notificaciones
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter()

  const heroMessages = [
    "Accede a miles de objetos usando tokens.",
    "Biblioteca de objetos: ahorra dinero y ayuda al planeta.",
    "Alquila sin compromiso. Flexibilidad total.",
    "Gana tokens con reseñas y devoluciones a tiempo.",
  ]

  // Cargar Usuario y Notificaciones
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

  // Cargar Categorías (solo una vez)
  useEffect(() => {
    const fetchCategorias = async () => {
      const { data } = await supabase.from("categorias").select("id, nombre").order('nombre');
      if (data) setCategorias(data);
    };
    fetchCategorias();
    // Cargar productos iniciales
    fetchProductos();
  }, []);

  // --- FUNCIÓN DE BÚSQUEDA AVANZADA (SERVER-SIDE) ---
  const fetchProductos = async () => {
    setLoading(true);
    try {
      // Construir la query dinámica
      let query = supabase
        .from("objetos")
        .select(`*, categorias ( nombre )`)
        .order('created_at', { ascending: false });

      // 1. Filtro por Nombre (Buscador)
      if (search.trim()) {
        query = query.ilike('nombre', `%${search.trim()}%`);
      }

      // 2. Filtro por Categoría
      if (categoriaSeleccionada) {
        query = query.eq('categoria_id', categoriaSeleccionada);
      }

      // 3. Filtro por Precio Mínimo
      if (minPrice) {
        query = query.gte('precio_tokens_dia', parseInt(minPrice));
      }

      // 4. Filtro por Precio Máximo
      if (maxPrice) {
        query = query.lte('precio_tokens_dia', parseInt(maxPrice));
      }

      // 5. Filtro de Disponibilidad
      if (onlyAvailable) {
        query = query.eq('disponible', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProductos(data || []);
      
      // Calcular filtros activos para mostrar badge
      let count = 0;
      if (categoriaSeleccionada) count++;
      if (minPrice) count++;
      if (maxPrice) count++;
      if (onlyAvailable) count++;
      setActiveFiltersCount(count);

    } catch (error: any) {
      console.error("Error buscando productos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Notificaciones (Realtime)
  useEffect(() => {
    if (!usuario?.id) return;
    
    // Carga inicial
    fetchUnreadNotifications(usuario.id);

    // Suscripción
    const channel = supabase
      .channel('main-notifications-badge')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${usuario.id}`,
        },
        () => fetchUnreadNotifications(usuario!.id)
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
    
    if (!error) setUnreadCount(count || 0);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % heroMessages.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [heroMessages.length])

  // Helpers para filtros
  const applyFilters = () => {
    setModalFiltersVisible(false);
    fetchProductos();
  };

  const clearFilters = () => {
    setCategoriaSeleccionada(null);
    setMinPrice("");
    setMaxPrice("");
    setOnlyAvailable(false);
    setSearch(""); 
    // Actualizamos con un pequeño delay para que la UI responda
    setTimeout(() => {
        fetchProductos(); // Esto recargará todos los productos sin filtros
        setActiveFiltersCount(0);
    }, 100);
  };

  return (
    <View style={{flex: 1}}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerFixed}>
        <Image source={require("@/assets/images/prestafacil-icon.jpg")} style={styles.logo} resizeMode="contain" />
        <View style={styles.profileContainer}>
          
          {/* Botón Notificaciones con Badge */}
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

      {/* BARRA DE BÚSQUEDA Y FILTROS MEJORADA */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar objetos..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchProductos} // Buscar al presionar Enter del teclado
            returnKeyType="search"
          />
          {search.length > 0 && (
             <TouchableOpacity onPress={() => { setSearch(""); setTimeout(fetchProductos, 100); }}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
             </TouchableOpacity>
          )}
        </View>

        {/* Botón de Filtros */}
        <TouchableOpacity 
            style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]} 
            onPress={() => setModalFiltersVisible(true)}
        >
            <Ionicons name="options" size={24} color={activeFiltersCount > 0 ? "#fff" : "#333"} />
            {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
            )}
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <TextComponent text="Alquila lo que necesites" fontWeight="bold" textSize={28} textColor="#1E293B" />
        <TextComponent text={heroMessages[messageIndex]} textSize={16} textColor="#64748B" style={{ marginTop: 8 }} />
      </View>

      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
            <TextComponent
            text="Objetos Disponibles"
            fontWeight="bold"
            textSize={20}
            textColor="#1E293B"
            />
            {activeFiltersCount > 0 && (
                <TouchableOpacity onPress={() => { clearFilters(); }}>
                    <Text style={{color: '#6366F1', fontSize: 12}}>Borrar filtros</Text>
                </TouchableOpacity>
            )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />
        ) : productos.length === 0 ? (
           <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No se encontraron objetos con estos filtros.</Text>
           </View>
        ) : (
          <View style={styles.productGrid}>
            {productos.map((item) => (
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
                      text={`⭐ ${item.calificacion_promedio ? item.calificacion_promedio.toFixed(1) : 'N/A'}`}
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
        <TextComponent text="¿Cómo funciona?" fontWeight="bold" textSize={24} textColor="#1E293B" style={{ marginBottom: 20, textAlign: "center" }} />
        <View style={styles.stepCard}>
            <View style={styles.stepNumber}><TextComponent text="1" fontWeight="bold" textSize={20} textColor="#fff" /></View>
            <View style={styles.stepContent}><TextComponent text="Elige un objeto" fontWeight="bold" textSize={16} textColor="#1E293B" /><TextComponent text="Explora nuestro catálogo." textSize={14} textColor="#64748B" style={{ marginTop: 4 }} /></View>
        </View>
        <View style={styles.stepCard}>
            <View style={styles.stepNumber}><TextComponent text="2" fontWeight="bold" textSize={20} textColor="#fff" /></View>
            <View style={styles.stepContent}><TextComponent text="Paga con tokens" fontWeight="bold" textSize={16} textColor="#1E293B" /><TextComponent text="Usa tus tokens para alquilar." textSize={14} textColor="#64748B" style={{ marginTop: 4 }} /></View>
        </View>
         <View style={styles.stepCard}>
            <View style={styles.stepNumber}><TextComponent text="3" fontWeight="bold" textSize={20} textColor="#fff" /></View>
            <View style={styles.stepContent}><TextComponent text="Disfruta y devuelve" fontWeight="bold" textSize={16} textColor="#1E293B" /><TextComponent text="Devuélvelo a tiempo y gana reputación." textSize={14} textColor="#64748B" style={{ marginTop: 4 }} /></View>
        </View>
      </View>

      <View style={styles.benefitsSection}>
        <TextComponent text="¿Por qué usar tokens?" fontWeight="bold" textSize={24} textColor="#1E293B" style={{ marginBottom: 20, textAlign: "center" }} />
        <View style={styles.benefitCard}><View style={styles.benefitIcon}><TextComponent text="💰" textSize={32} /></View><TextComponent text="Ahorra dinero" fontWeight="bold" textSize={16} textColor="#1E293B" /><TextComponent text="Alquila en lugar de comprar." textSize={14} textColor="#64748B" style={{ marginTop: 6, textAlign: "center" }} /></View>
        <View style={styles.benefitCard}><View style={styles.benefitIcon}><TextComponent text="🌍" textSize={32} /></View><TextComponent text="Cuida el planeta" fontWeight="bold" textSize={16} textColor="#1E293B" /><TextComponent text="Reduce el consumo y la producción." textSize={14} textColor="#64748B" style={{ marginTop: 6, textAlign: "center" }} /></View>
        <View style={styles.benefitCard}><View style={styles.benefitIcon}><TextComponent text="⚡" textSize={32} /></View><TextComponent text="Acceso instantáneo" fontWeight="bold" textSize={16} textColor="#1E293B" /><TextComponent text="Miles de objetos disponibles." textSize={14} textColor="#64748B" style={{ marginTop: 6, textAlign: "center" }} /></View>
      </View>

      <View style={styles.ctaSection}>
        <TextComponent text="¿Listo para empezar?" fontWeight="bold" textSize={24} textColor="#fff" style={{ marginBottom: 12, textAlign: "center" }} />
        <TextComponent text="Únete a nuestra comunidad y comienza a alquilar hoy mismo" textSize={16} textColor="#E0E7FF" style={{ marginBottom: 20, textAlign: "center" }} />
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push("/(tabs)/ganar")}><TextComponent text="Obtener más tokens" fontWeight="bold" textSize={16} textColor="#6366F1" /></TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>

    {/* MODAL DE FILTROS AVANZADOS */}
    <Modal
        visible={modalFiltersVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalFiltersVisible(false)}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.filterModalContent}>
                <View style={styles.filterHeader}>
                    <Text style={styles.filterTitle}>Filtros Avanzados</Text>
                    <TouchableOpacity onPress={() => setModalFiltersVisible(false)}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={{maxHeight: 400}}>
                    {/* Categoría */}
                    <Text style={styles.filterLabel}>Categoría</Text>
                    <View style={styles.categoriesGrid}>
                        <TouchableOpacity 
                            style={[styles.catChip, !categoriaSeleccionada && styles.catChipActive]}
                            onPress={() => setCategoriaSeleccionada(null)}
                        >
                            <Text style={[styles.catChipText, !categoriaSeleccionada && styles.catChipTextActive]}>Todas</Text>
                        </TouchableOpacity>
                        {categorias.map(cat => (
                            <TouchableOpacity 
                                key={cat.id}
                                style={[styles.catChip, categoriaSeleccionada === cat.id && styles.catChipActive]}
                                onPress={() => setCategoriaSeleccionada(cat.id)}
                            >
                                <Text style={[styles.catChipText, categoriaSeleccionada === cat.id && styles.catChipTextActive]}>
                                    {cat.nombre}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Precio */}
                    <Text style={[styles.filterLabel, {marginTop: 20}]}>Rango de Precio (Tokens)</Text>
                    <View style={styles.priceRow}>
                        <View style={styles.priceInputContainer}>
                            <Text style={styles.pricePrefix}>Min</Text>
                            <TextInput 
                                style={styles.priceInput} 
                                placeholder="0" 
                                keyboardType="numeric"
                                value={minPrice}
                                onChangeText={setMinPrice}
                            />
                        </View>
                        <Text style={{marginHorizontal: 10, color: '#999'}}>-</Text>
                        <View style={styles.priceInputContainer}>
                            <Text style={styles.pricePrefix}>Max</Text>
                            <TextInput 
                                style={styles.priceInput} 
                                placeholder="Sin límite" 
                                keyboardType="numeric"
                                value={maxPrice}
                                onChangeText={setMaxPrice}
                            />
                        </View>
                    </View>

                    {/* Disponibilidad */}
                    <View style={styles.switchRow}>
                        <Text style={styles.filterLabel}>Solo disponibles</Text>
                        <Switch 
                            value={onlyAvailable} 
                            onValueChange={setOnlyAvailable}
                            trackColor={{ false: "#767577", true: "#818cf8" }}
                            thumbColor={onlyAvailable ? "#6366F1" : "#f4f3f4"}
                        />
                    </View>
                </ScrollView>

                <View style={styles.filterActions}>
                    <TouchableOpacity style={styles.clearFilterBtn} onPress={clearFilters}>
                        <Text style={styles.clearFilterText}>Limpiar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.applyFilterBtn} onPress={applyFilters}>
                        <Text style={styles.applyFilterText}>Aplicar Filtros</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
    </View>
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
    paddingBottom: 15,
    backgroundColor: "#fff",
  },
  logo: { width: 80, height: 80 },
  profileContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  notifButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12, marginRight: 5, position: 'relative' },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: '#fff' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  profileButton: {},
  profileImageHeader: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, borderColor: "#6366F1" },
  tokensBadge: { backgroundColor: "#6366F1", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2, borderColor: "#fff" },
  
  // BÚSQUEDA Y FILTROS
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#1E293B" },
  filterButton: {
    backgroundColor: '#fff', borderRadius: 12, width: 50, justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  filterButtonActive: { backgroundColor: '#6366F1' },
  filterBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F8FAFC' },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  heroSection: { paddingHorizontal: 20, paddingVertical: 20 },
  productsSection: { paddingHorizontal: 20, marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  productCard: { width: "48%", backgroundColor: "#fff", borderRadius: 16, marginBottom: 15, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, overflow: "hidden" },
  productImage: { width: "100%", height: 120, resizeMode: "cover" },
  categoryBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "#EEF2FF", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  productInfo: { padding: 12 },
  ratingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  detailsButton: { backgroundColor: "#6366F1", borderRadius: 8, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  howItWorksSection: { paddingHorizontal: 20, paddingVertical: 40, backgroundColor: "#fff", marginBottom: 30 },
  stepCard: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20, backgroundColor: "#F8FAFC", borderRadius: 12, padding: 15 },
  stepNumber: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center", marginRight: 15 },
  stepContent: { flex: 1 },
  benefitsSection: { paddingHorizontal: 20, paddingVertical: 40, backgroundColor: "#F8FAFC" },
  benefitCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 15, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  benefitIcon: { marginBottom: 12 },
  ctaSection: { backgroundColor: "#6366F1", marginHorizontal: 20, borderRadius: 20, padding: 30, alignItems: "center" },
  ctaButton: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 30 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10 },

  // MODAL FILTROS
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
  filterModalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  filterTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  filterLabel: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 10 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  catChipActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  catChipText: { color: '#64748B', fontSize: 14 },
  catChipTextActive: { color: '#6366F1', fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12 },
  pricePrefix: { color: '#9CA3AF', marginRight: 5 },
  priceInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
  filterActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  clearFilterBtn: { flex: 1, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12 },
  clearFilterText: { color: '#64748B', fontWeight: '600' },
  applyFilterBtn: { flex: 2, padding: 15, alignItems: 'center', backgroundColor: '#6366F1', borderRadius: 12 },
  applyFilterText: { color: '#fff', fontWeight: 'bold' }
});