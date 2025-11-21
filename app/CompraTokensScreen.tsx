import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { styles } from "./CompraTokensScreen.styles";

// Usar require para el QR
const qrImage = require("../assets/images/qr-pago.png");

const { width: screenWidth } = Dimensions.get("window");

type User = {
  id: string;
  nombre: string;
  tokens_disponibles: number;
  correo: string;
  telefono?: string;
  foto_url?: string;
  referal_code?: string;
};

export default function CompraTokensScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [transactionId, setTransactionId] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const packageData = {
    id: params.packageId as string,
    tokens: parseInt(params.tokens as string),
    price: parseFloat(params.price as string),
    bonus: parseInt(params.bonus as string) || 0,
  };

  const totalTokens = packageData.tokens + packageData.bonus;

  const scrollToStep = (step: number) => {
    setCurrentStep(step);
    scrollViewRef.current?.scrollTo({
      x: (step - 1) * screenWidth,
      animated: true,
    });
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso necesario",
          "Necesitas permitir el acceso a la galería para subir imágenes."
        );
        return;
      }

      // Sin recorte ni dimensiones fijas
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        setReceiptImage(result.assets[0].uri);
        setUploadingImage(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!transactionId.trim() && !receiptImage) {
      Alert.alert(
        "Datos requeridos",
        "Por favor ingresa al menos el ID de transacción o sube una imagen del comprobante."
      );
      return false;
    }
    return true;
  };

  const uploadImageToSupabase = async (uri: string): Promise<string | null> => {
    try {
      // Usar FormData para subir la imagen
      const formData = new FormData();
      const fileName = `receipts/${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.jpg`;

      // @ts-ignore - React Native FormData format
      formData.append("file", {
        uri: uri,
        type: "image/jpeg",
        name: fileName,
      });

      const { data, error } = await supabase.storage
        .from("receipts")
        .upload(fileName, formData, {
          contentType: "image/jpeg",
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSubmitTransaction = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Cargar usuario desde AsyncStorage (como en tu código)
      const userData = await AsyncStorage.getItem("usuario");
      if (!userData) {
        Alert.alert(
          "Error",
          "Usuario no autenticado. Por favor inicia sesión nuevamente."
        );
        setIsSubmitting(false);
        return;
      }

      const user = JSON.parse(userData);
      setUser(user);

      let receiptUrl = null;

      if (receiptImage) {
        receiptUrl = await uploadImageToSupabase(receiptImage);
        if (!receiptUrl) {
          Alert.alert("Error", "No se pudo subir la imagen del comprobante.");
          return;
        }
      }

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        package_id: packageData.id,
        tokens_amount: totalTokens,
        amount_paid: packageData.price,
        transaction_id: transactionId.trim() || null,
        receipt_image_url: receiptUrl,
        status: "pending",
      });

      if (error) throw error;

      Alert.alert(
        "✅ Transacción Registrada",
        "Tu transacción ha sido registrada exitosamente. Será verificada por nuestro equipo.",
        [
          {
            text: "Aceptar",
            onPress: () => router.replace("/(tabs)/ganar"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error submitting transaction:", error);
      Alert.alert(
        "Error",
        error.message ||
          "No se pudo registrar la transacción. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showImagePreview = (imageUri: string) => {
    setPreviewImage(imageUri);
  };

  const removeImage = () => {
    setReceiptImage(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/ganar")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comprar Tokens</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Progress Steps - Ahora son clickeables */}
      <View style={styles.progressContainer}>
        <TouchableOpacity
          style={styles.progressStep}
          onPress={() => scrollToStep(1)}
        >
          <View
            style={[
              styles.stepIndicator,
              currentStep >= 1 && styles.stepActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= 1 && styles.stepNumberActive,
              ]}
            >
              1
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              currentStep >= 1 && styles.stepLabelActive,
            ]}
          >
            Pagar
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.progressLine,
            currentStep >= 2 && styles.progressLineActive,
          ]}
        />

        <TouchableOpacity
          style={styles.progressStep}
          onPress={() => scrollToStep(2)}
        >
          <View
            style={[
              styles.stepIndicator,
              currentStep >= 2 && styles.stepActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= 2 && styles.stepNumberActive,
              ]}
            >
              2
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              currentStep >= 2 && styles.stepLabelActive,
            ]}
          >
            Confirmar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Step 1: QR Payment */}
        <View style={styles.stepContainer}>
          <ScrollView
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageTitle}>Paquete Seleccionado</Text>
                <Text style={styles.tokensAmount}>
                  {packageData.tokens} tokens
                </Text>
                {packageData.bonus > 0 && (
                  <Text style={styles.bonusText}>
                    + {packageData.bonus} tokens bonus
                  </Text>
                )}
                <Text style={styles.totalTokens}>
                  Total: {totalTokens} tokens
                </Text>
                <Text style={styles.price}>Bs {packageData.price}</Text>
              </View>

              <View style={styles.qrContainer}>
                <View style={styles.qrPlaceholder}>
                  <Image
                    source={qrImage}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrText}>QR de Pago</Text>
                  <Text style={styles.qrInstructions}>
                    Escanea este código QR con tu app de banco móvil para
                    realizar el pago
                  </Text>
                  <Text style={styles.qrAccountInfo}>
                    Cuenta: Banco Unión • 123-456-7890
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => scrollToStep(2)}
              >
                <Text style={styles.primaryButtonText}>Ya hice el pago</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Step 2: Transaction Details */}
        <View style={styles.stepContainer}>
          <ScrollView
            contentContainerStyle={styles.stepScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View>
              <Text style={styles.sectionTitle}>Confirmar Transacción</Text>
              <Text style={styles.sectionSubtitle}>
                Proporciona al menos uno de los siguientes datos para verificar
                tu pago
              </Text>

              {/* Transaction ID Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  ID de Transacción (Opcional)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={transactionId}
                  onChangeText={setTransactionId}
                  placeholder="Ingresa el ID de tu transacción bancaria"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                />
              </View>

              {/* Receipt Upload */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Comprobante de Pago (Opcional)
                </Text>
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    receiptImage && styles.uploadButtonSuccess,
                  ]}
                  onPress={pickImage}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color="#6366F1" />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          receiptImage ? "checkmark-circle" : "cloud-upload"
                        }
                        size={24}
                        color={receiptImage ? "#10B981" : "#6366F1"}
                      />
                      <Text style={styles.uploadButtonText}>
                        {receiptImage
                          ? "Imagen Subida"
                          : "Subir Captura de Pantalla"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {receiptImage && (
                  <View style={styles.imagePreviewContainer}>
                    <TouchableOpacity
                      onPress={() => showImagePreview(receiptImage)}
                      style={styles.imagePreview}
                    >
                      <Image
                        source={{ uri: receiptImage }}
                        style={styles.previewImage}
                      />
                    </TouchableOpacity>

                    {/* Botón eliminar separado */}
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={removeImage}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => scrollToStep(1)}
              >
                <Ionicons name="arrow-back" size={20} color="#6366F1" />
                <Text style={styles.secondaryButtonText}>Volver</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleSubmitTransaction}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      Confirmar Transacción
                    </Text>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Modal para previsualización de imagen */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closePreviewButton}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}

          <TouchableOpacity
            style={styles.closePreviewTextButton}
            onPress={() => setPreviewImage(null)}
          >
            <Text style={styles.closePreviewText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
