"use client";

import TextComponent from "@/components/ui/text-component";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Usuario { id: string; nombre?: string; foto_url?: string; tokens_disponibles?: number; }
interface Producto { 
  id: string; 
  nombre: string; 
  descripcion?: string; 
  precio_tokens_dia: number; 
  imagen_url?: string; 
  categorias?: { nombre?: string }; 
  disponible: boolean;
}

export default function Confirmar() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const paramProducto = (params as any).producto as string | undefined;
  const paramId = (params as any).id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [dias, setDias] = useState<number>(1);
  const [fechaInicio, setFechaInicio] = useState<Date>(() => new Date());
  const [fechaFin, setFechaFin] = useState<Date>(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; });
  const [modalVisible, setModalVisible] = useState(false);
  const [showPicker, setShowPicker] = useState<{ start: boolean; end: boolean }>({ start: false, end: false });
  const [confirmando, setConfirmando] = useState(false);
  const [existingAlquilerId, setExistingAlquilerId] = useState<string | null>(null);
  
  // cálculo tokens
  const precioPorDia = producto?.precio_tokens_dia ?? 0;
  const total = precioPorDia * dias;
  const tokensUsuario = usuario?.tokens_disponibles ?? 0;
  const necesita = Math.max(0, total - tokensUsuario);
  const puedeAlquilar = tokensUsuario >= total;

  const toLocalDateOnly = (d: Date | string) => {
    const x = typeof d === "string" ? new Date(d) : new Date(d);
    return new Date(x.getFullYear(), x.getMonth(), x.getDate());
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const u = await AsyncStorage.getItem("usuario");
        if (u) setUsuario(JSON.parse(u));
      } catch (e) {
        console.warn("Error leyendo usuario:", e);
      }

      if (paramProducto) {
        try {
          const parsed: Producto = JSON.parse(paramProducto);
          setProducto(parsed);
          setLoading(false);
          await checkExistingAlquiler(parsed.id);
          return;
        } catch (e) {
          console.warn("No se pudo parsear param.producto", e);
        }
      }

      if (paramId) {
        const { data, error } = await supabase
          .from("objetos")
          .select("*, categorias ( nombre )")
          .eq("id", paramId)
          .single();
        if (error) {
          console.error("Error fetch producto:", error);
        } else {
          setProducto(data as Producto);
          await checkExistingAlquiler((data as Producto).id);
        }
      } else {
        console.warn("Confirmar: no se recibió id ni producto en params");
      }

      setLoading(false);
    };

    load();
  }, [paramProducto, paramId]); 

  const checkExistingAlquiler = async (objId: string) => {
    if (!usuario) {
      const u = await AsyncStorage.getItem("usuario");
      if (!u) return;
      setUsuario(JSON.parse(u));
    }
    const currentUser = usuario ? usuario : (await AsyncStorage.getItem("usuario")) ? JSON.parse(await AsyncStorage.getItem("usuario") || "{}") : null;
    if (!currentUser) return;

    const { data, error } = await supabase
      .from("alquileres")
      .select("*")
      .eq("usuario_id", currentUser.id)
      .eq("objeto_id", objId)
      .in("estado", ["activo", "extendido"])
      .limit(1)
      .single();

    if (!error && data) {
      setExistingAlquilerId(data.id);
      const inicio = toLocalDateOnly(new Date(data.fecha_inicio));
      const fin = toLocalDateOnly(new Date(data.fecha_fin));
      setFechaInicio(inicio);
      setFechaFin(fin);
      const diasCalc = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 3600 * 24)));
      setDias(diasCalc);
    }
  };

  const formatDate = (d: Date) => {
    const dt = toLocalDateOnly(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const recalcDiasFromDates = (inicio: Date, fin: Date) => {
    const s = toLocalDateOnly(inicio).getTime();
    const e = toLocalDateOnly(fin).getTime();
    const diff = Math.ceil((e - s) / (1000 * 3600 * 24));
    return Math.max(1, diff);
  };

  const openDateModal = () => setModalVisible(true);
  const cancelDateModal = () => {
    setModalVisible(false);
  };

  const saveDateModal = async () => {
    const newDias = recalcDiasFromDates(fechaInicio, fechaFin);
    setDias(newDias);

    if (existingAlquilerId) {
      Alert.alert("Fecha ajustada", "Confirma la extensión para aplicar los cambios.");
    }
    setModalVisible(false);
  };

  const handleIncrement = () => {
    const nd = Math.min(30, dias + 1);
    setDias(nd);
    const f = new Date(fechaInicio);
    f.setDate(f.getDate() + nd);
    setFechaFin(f);
  };
  const handleDecrement = () => {
    const nd = Math.max(1, dias - 1);
    setDias(nd);
    const f = new Date(fechaInicio);
    f.setDate(f.getDate() + nd);
    setFechaFin(f);
  };

  // --- FUNCIÓN PARA GENERAR CÓDIGO ---
  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleConfirmar = async () => {
    if (!usuario) return Alert.alert("Inicia sesión", "Debes iniciar sesión para confirmar el alquiler.");
    if (!producto) return Alert.alert("Error", "Producto no encontrado.");
    
    if (!existingAlquilerId && !producto.disponible) {
        return Alert.alert("No disponible", "Este objeto ya no está disponible para alquilar.");
    }

    const inicioDate = toLocalDateOnly(fechaInicio);
    const finDate = toLocalDateOnly(fechaFin);
    const inicioStr = formatDate(inicioDate);
    const finStr = formatDate(finDate);

    const hoy = toLocalDateOnly(new Date());

    if (!existingAlquilerId && inicioDate.getTime() < hoy.getTime()) {
      return Alert.alert("Fecha inválida", "La fecha de inicio no puede ser anterior a hoy.");
    }
    if (finDate.getTime() < inicioDate.getTime()) {
      return Alert.alert("Fecha inválida", "La fecha de fin debe ser la misma o posterior a la fecha de inicio.");
    }

    const diasCalc = Math.max(1, Math.ceil((finDate.getTime() - inicioDate.getTime()) / (1000 * 3600 * 24)));
    const precioPorDia = producto?.precio_tokens_dia ?? 0;
    const nuevoTotal = precioPorDia * diasCalc;
    const tokensUsuario = usuario?.tokens_disponibles ?? 0;

    try {
      setConfirmando(true);

      if (!existingAlquilerId) {
          const { data: prodActual, error: prodErr } = await supabase
            .from("objetos")
            .select("id, disponible")
            .eq("id", producto.id)
            .single();

          if (prodErr) {
            console.error("Error verificando producto:", prodErr);
            setConfirmando(false);
            return Alert.alert("Error", "No se pudo verificar la disponibilidad. Intenta nuevamente.");
          }
          if (!prodActual.disponible) {
            setConfirmando(false);
            return Alert.alert("No disponible", "Este objeto ya fue alquilado por otro usuario.");
          }
      }

      if (existingAlquilerId) {
        // === EXTENSIÓN DE ALQUILER ===
        const { data: existing, error: e1 } = await supabase
          .from("alquileres")
          .select("id, tokens_totales")
          .eq("id", existingAlquilerId)
          .single();

        if (e1) throw e1;

        const oldTotal = existing?.tokens_totales ?? 0;
        const delta = nuevoTotal - oldTotal; 

        if (delta > 0 && tokensUsuario < delta) {
          setConfirmando(false);
          return Alert.alert("Tokens insuficientes", `Te faltan ${delta} tokens para ampliar el alquiler.`);
        }

        const { error: updErr } = await supabase
          .from("alquileres")
          .update({
            fecha_fin: finStr,
            dias_alquiler: diasCalc,
            tokens_totales: nuevoTotal,
            estado: 'extendido'
          })
          .eq("id", existingAlquilerId);

        if (updErr) throw updErr;

        if (delta > 0) {
          const nuevoSaldo = tokensUsuario - delta;
          const { error: userUpdErr } = await supabase
            .from("usuarios")
            .update({ tokens_disponibles: nuevoSaldo })
            .eq("id", usuario.id);

          if (userUpdErr) throw userUpdErr;

          const usuarioActualizado = { ...usuario, tokens_disponibles: nuevoSaldo };
          setUsuario(usuarioActualizado);
          await AsyncStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        }
        
        Alert.alert("¡Listo!", "Alquiler extendido correctamente.");

      } else {
        // === NUEVO ALQUILER (SOLICITUD PENDIENTE) ===
        
        // Generar código de entrega
        const deliveryCode = generateCode();

        const payload = {
          usuario_id: usuario.id,
          objeto_id: producto.id,
          fecha_inicio: inicioStr,
          fecha_fin: finStr,
          dias_alquiler: diasCalc,
          tokens_totales: nuevoTotal,
          estado: "pendiente_aprobacion",
          codigo_entrega: deliveryCode, // <-- CÓDIGO GENERADO AQUÍ
          created_at: new Date().toISOString(),
        };

        if (tokensUsuario < nuevoTotal) {
          setConfirmando(false);
          return Alert.alert("Tokens insuficientes", `Te faltan ${nuevoTotal - tokensUsuario} tokens.`);
        }

        // 1. Insertar alquiler pendiente
        const { error: insErr } = await supabase.from("alquileres").insert([payload]);
        if (insErr) throw insErr;

        // 2. Marcar objeto como NO disponible (Reservado)
        const { error: updateError } = await supabase
          .from("objetos")
          .update({ disponible: false })
          .eq("id", producto.id);

        if (updateError) {
          console.warn("Alquiler insertado, pero error reservando objeto:", updateError);
        } else {
          setProducto((p) => (p && p.id === producto.id ? { ...p, disponible: false } : p));
        }

        // 3. Descontar tokens al usuario
        const nuevoSaldo = tokensUsuario - nuevoTotal;
        const { error: userUpdErr } = await supabase
          .from("usuarios")
          .update({ tokens_disponibles: nuevoSaldo })
          .eq("id", usuario.id);
        
        if (userUpdErr) throw userUpdErr;

        const usuarioActualizado = { ...usuario, tokens_disponibles: nuevoSaldo };
        setUsuario(usuarioActualizado);
        await AsyncStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        
        Alert.alert(
            "Solicitud Enviada", 
            "Tu solicitud ha sido enviada. Muestra el código QR o el texto al administrador para recoger tu objeto."
        );
      }

      router.back();
    } catch (err: any) {
      console.error("Error al confirmar:", err);
      Alert.alert("Error", err.message || "No se pudo confirmar. Reintenta.");
    } finally {
      setConfirmando(false);
    }
  };

  if (loading) return (<View style={[styles.container, styles.center]}><ActivityIndicator size="large" /></View>);
  if (!producto) return (<View style={[styles.container, styles.center]}><TextComponent text="No se encontró el producto." textColor="red" textSize={16} /></View>);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 36 }}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <TextComponent text="←" textSize={28} fontWeight="bold" />
          </TouchableOpacity>
          <TextComponent text={existingAlquilerId ? "Extender Alquiler" : "Solicitar Alquiler"} fontWeight="bold" textSize={20} style={{ flex: 1, textAlign: "center", marginRight: 25 }} />
        </View>

        <View style={styles.productCard}>
          <View style={styles.row}>
            <Image source={{ uri: producto.imagen_url || "https://placehold.co/100x100" }} style={styles.img} />
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <TextComponent text={producto.nombre} fontWeight="bold" textSize={18} />
              {producto.categorias?.nombre && <TextComponent text={producto.categorias.nombre} textSize={13} textColor="#6B7280" />}
              <TextComponent text={`💰 ${producto.precio_tokens_dia} tokens/día`} textSize={14} style={{ marginTop: 6 }} />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.rowCentered, { alignItems: "center" }]}>
            <TextComponent text={`🗓️ Días de alquiler: ${dias}`} fontWeight="bold" textSize={16} />
            <TouchableOpacity style={styles.changeDateBtn} onPress={openDateModal}>
              <TextComponent text="Cambiar fecha" textSize={13} />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12 }}>
            <View style={styles.durationBox}>
              <TouchableOpacity style={styles.circleBtn} onPress={handleDecrement}><Text style={styles.circleBtnText}>−</Text></TouchableOpacity>
              <View style={{ alignItems: "center" }}><Text style={styles.daysNumber}>{dias}</Text><Text style={styles.daysLabel}>días</Text></View>
              <TouchableOpacity style={styles.circleBtn} onPress={handleIncrement}><Text style={styles.circleBtnText}>+</Text></TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 6, marginTop: 10 }}>
              <Slider minimumValue={1} maximumValue={30} step={1} value={dias} onValueChange={(v) => setDias(Math.round(v))} thumbTintColor="#8B5CF6" minimumTrackTintColor="#7C3AED" maximumTrackTintColor="#93C5FD" />
              <View style={styles.rangeRow}><TextComponent text="1 día" textSize={12} textColor="#6B7280" /><TextComponent text="30 días" textSize={12} textColor="#6B7280" /></View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <TextComponent text="Resumen de Pago" fontWeight="bold" textSize={18} />
          <View style={styles.summaryRow}><TextComponent text="Precio por día" textSize={14} textColor="#6B7280" /><TextComponent text={`⛏️ ${precioPorDia}`} textSize={14} fontWeight="bold" /></View>
          <View style={styles.summaryRow}><TextComponent text="Días seleccionados" textSize={14} textColor="#6B7280" /><TextComponent text={`${dias}`} textSize={14} fontWeight="bold" /></View>
          <View style={[styles.summaryRow, { marginTop: 10 }]}><TextComponent text="Total" fontWeight="bold" textSize={16} /><View style={styles.totalBadge}><Text style={{ fontWeight: "700" }}>{total}</Text></View></View>

          <View style={{ marginTop: 14 }}>
            <TextComponent text="Tus tokens disponibles" textSize={13} textColor="#6B7280" />
            <TextComponent text={`${tokensUsuario}`} textSize={14} fontWeight="bold" textColor={tokensUsuario < total ? "#DC2626" : "#059669"} />
          </View>

          {!puedeAlquilar && (<View style={styles.warning}><TextComponent text={`❗ Necesitas ${necesita} tokens más.`} textSize={13} textColor="#991B1B" /></View>)}
        </View>

        <View style={{ paddingHorizontal: 6, marginTop: 18 }}>
          <TouchableOpacity onPress={handleConfirmar} disabled={!puedeAlquilar || confirmando} activeOpacity={0.9}>
            <LinearGradient colors={["#8B5CF6", "#60A5FA"]} start={[0, 0]} end={[1, 0]} style={[styles.confirmButton, (!puedeAlquilar || confirmando) && { opacity: 0.5 }]}>
              {confirmando ? <ActivityIndicator color="#fff" /> : <TextComponent text={existingAlquilerId ? "Extender Alquiler" : "Solicitar Alquiler"} fontWeight="bold" textSize={16} textColor="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal para cambiar fechas */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TextComponent text="Cambiar fecha" fontWeight="bold" textSize={18} />
            <TextComponent text={`Hora de entrega: 8:00 a.m. - 5:00 p.m.`} textSize={13} textColor="#6B7280" style={{ marginTop: 8 }} />

            <View style={{ marginTop: 12 }}>
              <TextComponent text="Fecha inicio" textSize={14} fontWeight="bold" />
              {Platform.OS === "android" ? (
                <>
                  <TouchableOpacity onPress={() => setShowPicker(s => ({ ...s, start: true }))} style={styles.dateRow}>
                    <Text>{formatDate(fechaInicio)}</Text>
                  </TouchableOpacity>
                  {showPicker.start && (
                    <DateTimePicker value={fechaInicio} mode="date" display="default"
                      onChange={(e, d) => { setShowPicker(s => ({ ...s, start: false })); if (d) setFechaInicio(d); }} />
                  )}
                </>
              ) : (
                <DateTimePicker value={fechaInicio} mode="date" display="spinner"
                  onChange={(e, d) => { if (d) setFechaInicio(d); }} style={{ width: "100%" }} />
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <TextComponent text="Fecha fin" textSize={14} fontWeight="bold" />
              {Platform.OS === "android" ? (
                <>
                  <TouchableOpacity onPress={() => setShowPicker(s => ({ ...s, end: true }))} style={styles.dateRow}>
                    <Text>{formatDate(fechaFin)}</Text>
                  </TouchableOpacity>
                  {showPicker.end && (
                    <DateTimePicker value={fechaFin} mode="date" display="default"
                      onChange={(e, d) => { setShowPicker(s => ({ ...s, end: false })); if (d) setFechaFin(d); }} />
                  )}
                </>
              ) : (
                <DateTimePicker value={fechaFin} mode="date" display="spinner"
                  onChange={(e, d) => { if (d) setFechaFin(d); }} style={{ width: "100%" }} />
              )}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 16 }}>
              <TouchableOpacity onPress={cancelDateModal} style={{ marginRight: 8 }}>
                <TextComponent text="Cancelar" />
              </TouchableOpacity>
              <TouchableOpacity onPress={saveDateModal} style={styles.saveBtn}>
                <TextComponent text="Guardar" textColor="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7FB", paddingHorizontal: 16, paddingTop: 18 },
  center: { justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginTop: 12, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3, borderWidth: 1, borderColor: "#F1F5F9" },
  productCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: "row", alignItems: "center" },
  rowCentered: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  img: { width: 68, height: 68, borderRadius: 10 },
  changeDateBtn: { marginLeft: 12, backgroundColor: "#EFF6FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  durationBox: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 18, paddingHorizontal: 28, marginHorizontal: 2, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  circleBtnText: { fontSize: 24, color: "#5B21B6", fontWeight: "700" },
  daysNumber: { fontSize: 28, fontWeight: "700", color: "#4C1D95" },
  daysLabel: { fontSize: 12, color: "#6B7280" },
  rangeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, alignItems: "center" },
  totalBadge: { backgroundColor: "#F59E0B", paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20 },
  headerBar: { flexDirection: "row", alignItems: "center", paddingVertical: 10, marginBottom: 10 },
  warning: { marginTop: 12, backgroundColor: "#FEE2E2", padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#FECACA" },
  confirmButton: { paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  obtainButton: { paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "90%", backgroundColor: "#fff", borderRadius: 12, padding: 16, elevation: 6 },
  dateRow: { padding: 12, backgroundColor: "#F3F4F6", borderRadius: 8, marginTop: 8 },
  saveBtn: { backgroundColor: "#2563EB", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
});