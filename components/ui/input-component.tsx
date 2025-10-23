import { StyleSheet, Text, View, TextInput, TextStyle } from 'react-native';
import React from 'react';

interface InputComponentProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
  inputColor?: string;
  fontSize?: number;
  style?:TextStyle;
}

const InputComponent: React.FC<InputComponentProps> = ({ label, placeholder, value, onChange, inputColor = '#333', fontSize = 18 }) => {
  return (
    <View style={styles.container}>
      {/* Label para el input */}
      {label && <Text style={[styles.label, { fontSize: fontSize - 2 }]}>{label}</Text>}
      
      {/* Input de texto */}
      <TextInput
        style={[styles.input, { color: inputColor, fontSize: fontSize }]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#888"
      />
    </View>
  );
};

export default InputComponent;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
});
