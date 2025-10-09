import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
type TextComponentProps = {
  text: string;
  textColor?: string;
  textSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
};

const TextComponent = ({ text, textColor = '#333', textSize = 20, fontWeight = 'normal' }: TextComponentProps) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: textColor, fontSize: textSize, fontWeight }]}>
        {text}
      </Text>
    </View>
  );
};

export default TextComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontWeight: 'bold',
  },
});
