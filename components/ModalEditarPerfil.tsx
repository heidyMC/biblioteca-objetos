import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

interface Props {
  visible: boolean;
  onClose: () => void;
  usuario: any;
  onUpdate: () => void;
}

export default function ModalEditarPerfil({ visible, onClose, usuario, onUpdate }: Props) {
  const [telefono, setTelefono] = useState(usuario?.telefono || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // 1. Cambio de contraseña
      if (newPassword.trim().length > 0) {
        if (currentPassword.trim().length === 0) {
          Alert.alert("Seguridad", "Para cambiar tu contraseña, debes ingresar tu contraseña actual.");
          setLoading(false);
          return;
        }

        if (newPassword.length < 6) {
          Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres.");
          setLoading(false);
          return;
        }

        const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();
        
        if (authUserError || !authUser || !authUser.email) {
          Alert.alert("Error", "No se pudo verificar tu sesión. Intenta volver a iniciar sesión.");
          setLoading(false);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authUser.email, 
          password: currentPassword.trim(),
        });

        if (signInError) {
          Alert.alert("Contraseña Incorrecta", "La contraseña actual que ingresaste no es válida.");
          setLoading(false);
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword.trim()
        });

        if (updateError) throw updateError;
      }

      // 2. Actualizar teléfono
      if (telefono !== usuario.telefono) {
        const { error: errorData } = await supabase
          .from("usuarios")
          .update({ telefono: telefono })
          .eq("id", usuario.id);

        if (errorData) throw errorData;
      }

      Alert.alert("¡Éxito!", "Perfil actualizado correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      onUpdate(); 
      onClose();  
    } catch (error: any) {
      Alert.alert("Error al actualizar", error.message || "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      {/* Detectar toque fuera para cerrar el teclado o el modal */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          
          {/* KeyboardAvoidingView para manejar el teclado */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            {/* Evitar que el toque dentro del modal cierre el modal */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalWrapper}>
                <View style={styles.modalContainer}>
                  
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={styles.title}>Editar Perfil</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  {/* Contenido Scrolleable */}
                  <ScrollView 
                    contentContainerStyle={styles.content} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    
                    <Text style={styles.sectionHeader}>Información de Contacto</Text>
                    
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Número de Teléfono</Text>
                      <TextInput
                        style={styles.input}
                        value={telefono}
                        onChangeText={setTelefono}
                        keyboardType="phone-pad"
                        placeholder="Ej. 77777777"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionHeader}>Seguridad</Text>
                    <Text style={styles.subHeader}>Llena estos campos solo si deseas cambiar tu contraseña.</Text>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Contraseña Actual</Text>
                      <TextInput
                        style={styles.input}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry
                        placeholder="Ingresa tu contraseña actual"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Nueva Contraseña</Text>
                      <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        placeholder="Ingresa la nueva contraseña"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <TouchableOpacity 
                      style={styles.saveButton} 
                      onPress={handleUpdate}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.saveText}>Guardar Cambios</Text>
                      )}
                    </TouchableOpacity>

                  </ScrollView>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalWrapper: {
    width: "100%",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxHeight: "90%", // Permite que el modal crezca pero no ocupe todo si no es necesario
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F293B",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
    fontStyle: "italic",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 20,
  },
  saveButton: {
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10, // Espacio extra abajo para scrolling
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});