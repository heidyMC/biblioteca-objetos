"use client"

import { supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { EncodingType, readAsStringAsync } from "expo-file-system/legacy"
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

  useEffect(() => {
    if (visible && usuario) {
      setNombre(usuario?.nombre || "")
      setTelefono(usuario?.telefono || "")
      setFotoUri(usuario?.foto_url || null)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setErrors({})
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

    if (newPassword.trim().length > 0 || confirmPassword.trim().length > 0) {
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

  const uploadPhotoToSupabase = async (uri: string, userId: string) => {
    try {
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      })

      const fileName = `${userId}_${Date.now()}.jpg`

      const { data, error } = await supabase.storage.from("fotos_perfil").upload(fileName, decode(base64), {
        contentType: "image/jpeg",
        upsert: true,
      })

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("fotos_perfil").getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("[v0] Error uploading photo:", error)
      throw error
    }
  }

  const decode = (base64: string) => {
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
      if (newPassword.trim().length > 0) {
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

      let fotoUrl = usuario.foto_url
      if (fotoUri && fotoUri !== usuario.foto_url) {
        try {
          fotoUrl = await uploadPhotoToSupabase(fotoUri, usuario.id)
        } catch (uploadErr: any) {
          console.error("[v0] Photo upload failed:", uploadErr)
          Alert.alert("Error", "No se pudo actualizar la foto de perfil. Intenta con otra imagen.")
        }
      }

      const dataToUpdate: any = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      }

      if (fotoUrl && fotoUrl !== usuario.foto_url) {
        dataToUpdate.foto_url = fotoUrl
      }

      const { error: updateDataError } = await supabase.from("usuarios").update(dataToUpdate).eq("id", usuario.id)

      if (updateDataError) throw updateDataError

      Alert.alert("¡Éxito!", "Perfil actualizado correctamente.")
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
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
                          <Ionicons name="person" size={48} color="#D1D5DB" />
                        </View>
                      )}
                      <TouchableOpacity style={styles.photoEditButton} onPress={pickImage} disabled={loading}>
                        <Ionicons name="camera" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.photoHint}>Toca para cambiar foto</Text>
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

                  {/* Seguridad */}
                  <Text style={styles.sectionHeader}>Cambiar Contraseña</Text>
                  <Text style={styles.subHeader}>Llena estos campos solo si deseas cambiar tu contraseña.</Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Contraseña Actual</Text>
                    <TextInput
                      style={[styles.input, errors.currentPassword && styles.inputError]}
                      value={currentPassword}
                      onChangeText={(text) => {
                        setCurrentPassword(text)
                        if (errors.currentPassword) setErrors({ ...errors, currentPassword: "" })
                      }}
                      secureTextEntry
                      placeholder="Ingresa tu contraseña actual"
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
                    />
                    <ErrorText field="currentPassword" />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nueva Contraseña</Text>
                    <TextInput
                      style={[styles.input, errors.newPassword && styles.inputError]}
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text)
                        if (errors.newPassword) setErrors({ ...errors, newPassword: "" })
                      }}
                      secureTextEntry
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
                    />
                    <ErrorText field="newPassword" />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirmar Contraseña</Text>
                    <TextInput
                      style={[styles.input, errors.confirmPassword && styles.inputError]}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text)
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" })
                      }}
                      secureTextEntry
                      placeholder="Repite la nueva contraseña"
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
                    />
                    <ErrorText field="confirmPassword" />
                  </View>

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
      </TouchableWithoutFeedback>
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
    paddingHorizontal: 20,
  },
  modalWrapper: {
    width: "100%",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
    flexDirection: "column",
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
  photoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 8,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
  },
  photoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  photoEditButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6366F1",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  photoHint: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
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
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEE2E2",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    padding: 12,
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
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})
