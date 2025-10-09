import { Modal, StyleSheet, Text, View } from 'react-native'
import React from 'react'

type ModalComponentProps = {
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    dismissOnTouchOutside?: boolean;
    backdropOpacity?: number;
    accessibilityLabel?: string;
}

const ModalComponent = ({ isVisible, onClose, children, dismissOnTouchOutside, backdropOpacity, accessibilityLabel }: ModalComponentProps) => {
  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      transparent
      animationType="slide"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: `rgba(0, 0, 0, ${backdropOpacity || 0.5})` }]}>
          {children}
        </View>
      </View>
    </Modal>
  )
}

export default ModalComponent

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
})