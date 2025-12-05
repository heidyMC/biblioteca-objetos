import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

const screenWidth = Dimensions.get("window").width;

// 1. Actualizamos los tipos de filtro para incluir '1h' y '24h'
type FilterType = '1h' | '24h' | '7d' | '30d' | 'all';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado del filtro
  const [filter, setFilter] = useState<FilterType>('all');

  // Estados para las métricas
  const [totalGanancias, setTotalGanancias] = useState(0);
  const [topObjetos, setTopObjetos] = useState<{ name: string; count: number }[]>([]);
  const [objetosInactivos, setObjetosInactivos] = useState<string[]>([]);
  const [distribucionEstado, setDistribucionEstado] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoad();
  }, [filter]); // Se recarga cuando cambia el filtro

  const checkAdminAndLoad = async () => {
    try {
      const userData = await AsyncStorage.getItem("usuario");
      if (!userData) return router.replace("/(tabs)/Perfil/PerfilUsuario");
      const user = JSON.parse(userData);
      if (!user.is_admin) {
        return router.back();
      }
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      // Construir la consulta base
      let query = supabase
        .from("alquileres")
        .select("tokens_totales, objeto_id, estado, created_at, objetos(nombre)");

      // 2. Lógica de filtrado por fecha actualizada
      if (filter !== 'all') {
        const date = new Date();
        
        switch (filter) {
            case '1h':
                date.setHours(date.getHours() - 1); // Restar 1 hora
                break;
            case '24h':
                date.setHours(date.getHours() - 24); // Restar 24 horas (1 día)
                break;
            case '7d':
                date.setDate(date.getDate() - 7);
                break;
            case '30d':
                date.setDate(date.getDate() - 30);
                break;
        }
        
        query = query.gte('created_at', date.toISOString());
      }

      const { data: alquileres, error: errAlquileres } = await query;

      if (errAlquileres) throw errAlquileres;

      const { data: todosObjetos, error: errObjetos } = await supabase
        .from("objetos")
        .select("id, nombre");

      if (errObjetos) throw errObjetos;

      // --- CÁLCULOS ---

      // A) Ganancias Totales
      const ganancias = alquileres
        ?.filter((a) => a.estado !== "rechazado" && a.estado !== "cancelado")
        .reduce((sum, item) => sum + (item.tokens_totales || 0), 0);
      setTotalGanancias(ganancias || 0);

      // B) Objetos Más Rentados (Lista Visual)
      const conteoObjetos: Record<string, number> = {};
      alquileres?.forEach((a) => {
        // @ts-ignore
        const nombre = a.objetos?.nombre || "Desconocido";
        conteoObjetos[nombre] = (conteoObjetos[nombre] || 0) + 1;
      });

      const sortedObjetos = Object.entries(conteoObjetos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setTopObjetos(sortedObjetos);

      // C) Objetos Inactivos en este periodo
      const idsAlquiladosEnPeriodo = new Set(alquileres?.map((a) => a.objeto_id));
      const inactivos = todosObjetos
        ?.filter((obj) => !idsAlquiladosEnPeriodo.has(obj.id))
        .map((obj) => obj.nombre);
      setObjetosInactivos(inactivos || []);

      // D) Distribución de Estados
      const conteoEstados: Record<string, number> = {};
      alquileres?.forEach((a) => {
        conteoEstados[a.estado] = (conteoEstados[a.estado] || 0) + 1;
      });
      
      const coloresEstados: Record<string, string> = {
        activo: "#3B82F6",
        completado: "#10B981",
        pendiente_aprobacion: "#A855F7",
        pendiente_devolucion: "#F59E0B",
        rechazado: "#EF4444",
        extendido: "#6366F1"
      };

      const dataPie = Object.entries(conteoEstados).map(([estado, count]) => ({
        name: estado.replace('_', ' ').replace('pendiente', 'pend.'),
        population: count,
        color: coloresEstados[estado] || "#9CA3AF",
        legendFontColor: "#374151",
        legendFontSize: 11,
      }));
      setDistribucionEstado(dataPie);

    } catch (error) {
      console.error("Error calculando estadísticas:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const ProgressBarItem = ({ name, count, max }: { name: string, count: number, max: number }) => {
    const percentage = max > 0 ? (count / max) * 100 : 0;
    return (
      <View style={styles.progressItem}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressName} numberOfLines={1}>{name}</Text>
          <Text style={styles.progressCount}>{count} rentas</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  const getFilterLabel = () => {
      switch(filter) {
          case '1h': return 'Última Hora';
          case '24h': return 'Últimas 24h';
          case '7d': return 'Últimos 7 días';
          case '30d': return 'Últimos 30 días';
          default: return 'Histórico Completo';
      }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Estadísticas Globales</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 3. NUEVO CONTENEDOR DE FILTROS CON SCROLL HORIZONTAL */}
      <View>
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterScrollContent}
            style={styles.filterScroll}
        >
            <TouchableOpacity 
                style={[styles.filterBtn, filter === '1h' && styles.filterBtnActive]} 
                onPress={() => setFilter('1h')}
            >
                <Text style={[styles.filterText, filter === '1h' && styles.filterTextActive]}>1h</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.filterBtn, filter === '24h' && styles.filterBtnActive]} 
                onPress={() => setFilter('24h')}
            >
                <Text style={[styles.filterText, filter === '24h' && styles.filterTextActive]}>24h</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.filterBtn, filter === '7d' && styles.filterBtnActive]} 
                onPress={() => setFilter('7d')}
            >
                <Text style={[styles.filterText, filter === '7d' && styles.filterTextActive]}>7 Días</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.filterBtn, filter === '30d' && styles.filterBtnActive]} 
                onPress={() => setFilter('30d')}
            >
                <Text style={[styles.filterText, filter === '30d' && styles.filterTextActive]}>30 Días</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]} 
                onPress={() => setFilter('all')}
            >
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Todo</Text>
            </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* CARD DE GANANCIAS */}
            <View style={styles.cardGanancias}>
              <View>
                <Text style={styles.gananciasLabel}>Tokens Consumidos</Text>
                <Text style={styles.gananciasValue}>{totalGanancias} <Text style={{fontSize:20}}>💰</Text></Text>
                <Text style={styles.gananciasSub}>{getFilterLabel()}</Text>
              </View>
              <View style={styles.iconCircle}>
                <Ionicons name="stats-chart" size={32} color="#fff" />
              </View>
            </View>

            {/* TOP OBJETOS */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>🔥 Top Objetos Más Rentados</Text>
              <Text style={styles.subtitle}>Ranking de popularidad ({getFilterLabel()})</Text>
              
              {topObjetos.length > 0 ? (
                <View style={styles.progressList}>
                  {topObjetos.map((item, index) => (
                    <ProgressBarItem 
                        key={index} 
                        name={item.name} 
                        count={item.count} 
                        max={topObjetos[0].count}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay alquileres en este periodo.</Text>
              )}
            </View>

            {/* GRÁFICO DE TORTA */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>📊 Estado de Alquileres</Text>
              {distribucionEstado.length > 0 ? (
                 <PieChart
                  data={distribucionEstado}
                  width={screenWidth - 60}
                  height={200}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"0"}
                  center={[10, 0]}
                  absolute
                />
              ) : (
                <Text style={styles.emptyText}>No hay datos.</Text>
              )}
            </View>

            {/* OBJETOS INACTIVOS */}
            <View style={[styles.chartCard, { marginBottom: 40 }]}>
              <Text style={[styles.chartTitle, { color: '#EF4444' }]}>⚠️ Sin Movimiento</Text>
              <Text style={styles.subtitle}>Objetos no alquilados en: {getFilterLabel()}</Text>
              
              {objetosInactivos.length > 0 ? (
                <View style={styles.inactiveList}>
                  {objetosInactivos.slice(0, 10).map((nombre, index) => (
                    <View key={index} style={styles.inactiveItem}>
                      <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                      <Text style={styles.inactiveText}>{nombre}</Text>
                    </View>
                  ))}
                  {objetosInactivos.length > 10 && (
                      <Text style={{color: '#999', fontSize: 12, marginTop: 5}}>
                          ... y {objetosInactivos.length - 10} más
                      </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.goodNewsText}>¡Todo el inventario se ha movido!</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: { padding: 8, backgroundColor: "#F1F5F9", borderRadius: 8 },
  title: { fontSize: 18, fontWeight: "bold", color: "#1E293B" },
  
  // Estilos de Filtros (Scroll Horizontal)
  filterScroll: { maxHeight: 60, backgroundColor: '#fff' },
  filterScrollContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 50,
    alignItems: 'center'
  },
  filterBtnActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1'
  },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#fff' },

  content: { padding: 20 },
  
  cardGanancias: {
    backgroundColor: "#6366F1",
    borderRadius: 20,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gananciasLabel: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  gananciasValue: { color: "white", fontSize: 36, fontWeight: "bold" },
  gananciasSub: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },

  chartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: "700", color: "#1F293B", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#64748B", marginBottom: 16 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginVertical: 20, fontStyle: 'italic' },

  progressList: { gap: 12 },
  progressItem: { marginBottom: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressName: { fontSize: 14, fontWeight: '600', color: '#334155', maxWidth: '70%' },
  progressCount: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 4 },

  inactiveList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inactiveItem: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', 
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2' 
  },
  inactiveText: { fontSize: 12, color: "#991B1B", marginLeft: 4, fontWeight: '600' },
  goodNewsText: { color: "#059669", fontSize: 13, fontStyle: 'italic', marginTop: 5 }
});