import { StyleSheet, Text, View, Image } from "react-native";
import React, { useState} from "react";
import TextComponent from "@/components/ui/text-component";
import InputComponent from "@/components/ui/input-component"; 
import { Button } from "@react-navigation/elements";
import ButtonComponent from "@/components/ui/button-component";



const HomePage = () => {
  const [inputValue, setInputValue] = useState<string>("");

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/login-images.png")}
        style={{ width: 200, height: 200, alignSelf: "center", marginTop: 50 }}
      />
      <TextComponent text="Biblioteca de objetos" textColor="#FFFFFF" fontWeight="bold"/>
      <View style={styles.buttonContainer}> 
      <ButtonComponent label="Iniciar sesion" />
      <ButtonComponent label="Registrarse" />
      </View>
      
    </View>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 50,
  }
});