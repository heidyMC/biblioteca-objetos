"use client"

import { supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import * as FileSystem from "expo-file-system"; // Agregado expo-file-system para manejar archivos locales
import * as ImagePicker from "expo-image-picker"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
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
} from "react-native"

interface Props {
  visible: boolean
  onClose: () => void
  usuario: any
  onUpdate: () => void
}

export default function ModalEditarPerfil({ visible, onClose, usuario, onUpdate }: Props) {
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [fotoUri, setFotoUri] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [enablePasswordChange, setEnablePasswordChange] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (visible && usuario) {
      setNombre(usuario?.nombre || "")
      setTelefono(usuario?.telefono || "")
      setFotoUri(usuario?.foto_url || null)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setErrors({})
      setEnablePasswordChange(false)
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    }
  }, [visible, usuario])

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    } else if (nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres"
    }

    if (telefono.trim() && telefono.trim().length < 7) {
      newErrors.telefono = "El teléfono debe tener al menos 7 caracteres"
    }

    if (enablePasswordChange) {
      if (!currentPassword.trim()) {
        newErrors.currentPassword = "Debes ingresar tu contraseña actual para cambiarla"
      }

      if (newPassword.trim().length < 6) {
        newErrors.newPassword = "La nueva contraseña debe tener al menos 6 caracteres"
      }

      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled) {
      setFotoUri(result.assets[0].uri)
    }
  }

  // Esto soluciona el problema con usuarios de Google OAuth y archivos locales
  const uploadPhotoToSupabase = async (uri: string, userId: string): Promise<string> => {
    try {
      // Generar nombre de archivo único
      const fileName = `${userId}_${Date.now()}.jpg`

      // Verificar si es una URI local (de ImagePicker) o una URL remota
      const isLocalFile = uri.startsWith("file://") || uri.startsWith("content://")

      let fileData: Uint8Array

      if (isLocalFile) {
        // Usar FileSystem de Expo para leer archivos locales (más confiable que fetch)
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" })

        // Convertir base64 a Uint8Array
        fileData = decode(base64)
      } else {
        // Para URLs remotas, usar fetch (esto es raro pero por si acaso)
        const response = await fetch(uri)
        const buffer = await response.arrayBuffer()
        fileData = new Uint8Array(buffer)
      }

      // Subir la imagen a Supabase Storage
      const { data, error } = await supabase.storage.from("fotos_perfil").upload(fileName, fileData, {
        contentType: "image/jpeg",
        upsert: true,
      })

      if (error) {
        console.error("Supabase upload error:", error)
        throw error
      }

      // Obtener URL pública de la imagen
      const { data: publicData } = supabase.storage.from("fotos_perfil").getPublicUrl(fileName)

      return publicData.publicUrl
    } catch (error) {
      console.error("Error uploading photo:", error)
      throw error
    }
  }

  // Función helper para decodificar base64 a Uint8Array
  const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  const handleUpdate = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Cambio de contraseña si está habilitado
      if (enablePasswordChange && newPassword.trim().length > 0) {
        const {
          data: { user: authUser },
          error: authUserError,
        } = await supabase.auth.getUser()

        if (authUserError || !authUser || !authUser.email) {
          Alert.alert("Error", "No se pudo verificar tu sesión. Intenta volver a iniciar sesión.")
          setLoading(false)
          return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authUser.email,
          password: currentPassword.trim(),
        })

        if (signInError) {
          setErrors({ currentPassword: "La contraseña actual es incorrecta" })
          setLoading(false)
          return
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword.trim(),
        })

        if (updateError) throw updateError
      }

      // Subida de foto con mejor manejo de errores
      let fotoUrl = usuario.foto_url
      let photoUploadFailed = false

      // Solo intentar subir si hay una nueva foto seleccionada
      if (fotoUri && fotoUri !== usuario.foto_url) {
        try {
          fotoUrl = await uploadPhotoToSupabase(fotoUri, usuario.id)
        } catch (uploadErr: any) {
          console.error("Photo upload failed:", uploadErr)
          photoUploadFailed = true
          // No lanzamos el error, continuamos con la actualización de otros datos
        }
      }

      // Preparar datos para actualizar
      const dataToUpdate: any = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      }

      // Solo actualizar foto_url si la subida fue exitosa
      if (fotoUrl && fotoUrl !== usuario.foto_url && !photoUploadFailed) {
        dataToUpdate.foto_url = fotoUrl
      }

      // Actualizar datos en la base de datos
      const { error: updateDataError } = await supabase.from("usuarios").update(dataToUpdate).eq("id", usuario.id)

      if (updateDataError) throw updateDataError

      // Mostrar mensaje apropiado según el resultado
      if (photoUploadFailed) {
        Alert.alert(
          "Perfil Actualizado",
          "Los datos se actualizaron correctamente, pero no se pudo cambiar la foto de perfil. Verifica los permisos de almacenamiento o intenta con otra imagen.",
        )
      } else {
        Alert.alert("¡Éxito!", "Perfil actualizado correctamente.")
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onUpdate()
      onClose()
    } catch (error: any) {
      Alert.alert("Error al actualizar", error.message || "Ocurrió un error inesperado")
    } finally {
      setLoading(false)
    }
  }

  const ErrorText = ({ field }: { field: string }) => {
    return errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayBackground} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Editar Perfil</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={loading}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Contenido Scrolleable */}
              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={true}
                nestedScrollEnabled={true}
              >
                <View style={styles.photoSection}>
                  <View style={styles.photoContainer}>
                    {fotoUri ? (
                      <Image source={{ uri: fotoUri }} style={styles.profilePhoto} />
                    ) : (
                      <View style={[styles.profilePhoto, styles.photoPlaceholder]}>
                        <Ionicons name="person" size={80} color="#D1D5DB" />
                      </View>
                    )}
                    <TouchableOpacity style={styles.photoEditButton} onPress={pickImage} disabled={loading}>
                      <Ionicons name="camera" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.photoLabel}>Foto de Perfil</Text>
                  <Text style={styles.photoHint}>Toca el botón para cambiar foto</Text>
                </View>

                <View style={styles.divider} />

                {/* Información Personal */}
                <Text style={styles.sectionHeader}>Información Personal</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nombre *</Text>
                  <TextInput
                    style={[styles.input, errors.nombre && styles.inputError]}
                    value={nombre}
                    onChangeText={(text) => {
                      setNombre(text)
                      if (errors.nombre) setErrors({ ...errors, nombre: "" })
                    }}
                    placeholder="Tu nombre completo"
                    placeholderTextColor="#9CA3AF"
                    editable={!loading}
                  />
                  <ErrorText field="nombre" />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Número de Teléfono</Text>
                  <TextInput
                    style={[styles.input, errors.telefono && styles.inputError]}
                    value={telefono}
                    onChangeText={(text) => {
                      setTelefono(text)
                      if (errors.telefono) setErrors({ ...errors, telefono: "" })
                    }}
                    keyboardType="phone-pad"
                    placeholder="Ej. 77777777"
                    placeholderTextColor="#9CA3AF"
                    editable={!loading}
                  />
                  <ErrorText field="telefono" />
                </View>

                <View style={styles.divider} />

                <View style={styles.passwordSectionHeader}>
                  <View style={styles.passwordHeaderText}>
                    <Text style={styles.sectionHeader}>Cambiar Contraseña</Text>
                    <Text style={styles.passwordHint}>Habilita para cambiar tu contraseña.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleButton, enablePasswordChange && styles.toggleButtonActive]}
                    onPress={() => {
                      setEnablePasswordChange(!enablePasswordChange)
                      if (!enablePasswordChange) {
                        setCurrentPassword("")
                        setNewPassword("")
                        setConfirmPassword("")
                        setErrors({})
                      }
                    }}
                    disabled={loading}
                  >
                    <View style={styles.toggleContent}>
                      <Ionicons
                        name={enablePasswordChange ? "toggle" : "toggle-outline"}
                        size={32}
                        color={enablePasswordChange ? "#6366F1" : "#D1D5DB"}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {enablePasswordChange && (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Contraseña Actual</Text>
                      <View style={styles.passwordInputWrapper}>
                        <TextInput
                          style={[styles.input, styles.passwordInput, errors.currentPassword && styles.inputError]}
                          value={currentPassword}
                          onChangeText={(text) => {
                            setCurrentPassword(text)
                            if (errors.currentPassword) setErrors({ ...errors, currentPassword: "" })
                          }}
                          secureTextEntry={!showCurrentPassword}
                          placeholder="Ingresa tu contraseña actual"
                          placeholderTextColor="#9CA3AF"
                          editable={!loading}
                        />
                        <TouchableOpacity
                          onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                          style={styles.eyeButton}
                        >
                          <Ionicons name={showCurrentPassword ? "eye" : "eye-off"} size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      <ErrorText field="currentPassword" />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Nueva Contraseña</Text>
                      <View style={styles.passwordInputWrapper}>
                        <TextInput
                          style={[styles.input, styles.passwordInput, errors.newPassword && styles.inputError]}
                          value={newPassword}
                          onChangeText={(text) => {
                            setNewPassword(text)
                            if (errors.newPassword) setErrors({ ...errors, newPassword: "" })
                          }}
                          secureTextEntry={!showNewPassword}
                          placeholder="Mínimo 6 caracteres"
                          placeholderTextColor="#9CA3AF"
                          editable={!loading}
                        />
                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
                          <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      <ErrorText field="newPassword" />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Confirmar Contraseña</Text>
                      <View style={styles.passwordInputWrapper}>
                        <TextInput
                          style={[styles.input, styles.passwordInput, errors.confirmPassword && styles.inputError]}
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text)
                            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" })
                          }}
                          secureTextEntry={!showConfirmPassword}
                          placeholder="Repite la nueva contraseña"
                          placeholderTextColor="#9CA3AF"
                          editable={!loading}
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeButton}
                        >
                          <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      <ErrorText field="confirmPassword" />
                    </View>
                  </>
                )}

                {/* Botones */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.cancelButton, loading && styles.buttonDisabled]}
                    onPress={onClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleUpdate}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveText}>Guardar Cambios</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  modalWrapper: {
    width: "100%",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 24,
    width: "100%",
    maxHeight: "95%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F293B",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 24,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profilePhoto: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#F3F4F6",
    borderWidth: 3,
    borderColor: "#E5E7EB",
  },
  photoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  photoEditButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#6366F1",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "white",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F293B",
    marginBottom: 4,
  },
  photoHint: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 8,
  },
  passwordSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  passwordHint: {
    fontSize: 13,
    color: "#6B7280",
  },
  toggleButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#EEF2FF",
    borderWidth: 2,
    borderColor: "#6366F1",
  },
  toggleContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  passwordHeaderText: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    padding: 8,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEE2E2",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  overlayBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
