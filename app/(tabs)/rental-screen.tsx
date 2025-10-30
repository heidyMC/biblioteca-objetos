import ButtonComponent from '@/components/ui/button-component';
import TextComponent from '@/components/ui/text-component';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

const ConfirmPayScreen = () => {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
      {/* Perfil y tokens */}
      <View style={styles.profile}>
        <View style={styles.profileLeft}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
            style={styles.profileImage}
          />
          <TextComponent text="Maria" fontWeight="bold" />
        </View>
        <TextComponent text="💰600 tokens" fontWeight="bold" />
      </View>

      {/* Título */}
      <TextComponent text="Confirma y paga" fontWeight="bold" />

      {/* Producto */}
      <View style={styles.product}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/64/64113.png' }}
          style={styles.productImage}
        />
        <TextComponent text="Taladro" fontWeight="bold" />
        <TextComponent text="4.78 (23)" />
      </View>

      {/* Resumen de alquiler */}
      <View style={styles.summaryCard}>
        {/* Fechas */}
        <View style={styles.row}>
          <TextComponent text="Fechas" fontWeight="bold" />
          <View style={styles.rowValueContainer}>
            <TextComponent text="26 - 26 de sept de 2025" />
            <TextComponent text="8:00 a.m. - 5:00 p.m." />
          </View>
          <ButtonComponent label="Cambiar" />
        </View>

        {/* Precio */}
        <View style={styles.row}>
          <TextComponent text="Información del precio" fontWeight="bold" />
          <TextComponent text="40 tokens por día" />
        </View>

        {/* Total tokens */}
        <View style={styles.row}>
          <TextComponent text="Total Tokens" fontWeight="bold" />
          <TextComponent text="40 tokens" />
        </View>

        {/* Lugar */}
        <View style={styles.row}>
          <TextComponent text="Lugar" fontWeight="bold" />
          <TextComponent text="Av Aroma & Ayacucho" />
        </View>
      </View>

      {/* Botón Alquilar */}
      <View style={styles.rentButton}>
        <ButtonComponent label="Alquilar" />
      </View>
    </ScrollView>
  );
};

export default ConfirmPayScreen;

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#000000ff',
    flexGrow: 1,
  },
  profile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  product: {
    alignItems: 'center',
    marginBottom: 20,
  },
  productImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
  },
  productName: {
    fontSize: 18,
    marginBottom: 5,
  },
  productRating: {
    fontSize: 14,
    color: Colors.light.text,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5, // para Android
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  rowLabel: {
    width: '40%',
    marginBottom: 5,
  },
  rowValueContainer: {
    width: '50%',
  },
  rentButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
});
