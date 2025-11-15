import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThemedText } from './themed-text';
import { Ionicons } from '@expo/vector-icons';

// Tu interfaz de AuthContext (y de otros hooks)
export interface AlertButton {
  text: string;
  onPress: () => void;
  style?: 'cancel' | 'default' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onClose: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onClose,
  iconName = 'warning-outline', // Icono por defecto (amarillo)
  iconColor = '#FFD700', 
}) => {
  // Determinar el ícono basado en el título o estilo
  const getIcon = () => {
    const titleLower = title.toLowerCase();
    
    // --- Lógica de Iconos ---
    if (titleLower.includes('error')) {
      return { name: 'close-circle-outline' as keyof typeof Ionicons.glyphMap, color: '#ff4444' };
    }
    if (titleLower.includes('éxito') || titleLower.includes('listo')) {
      return { name: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap, color: '#00C851' };
    }
    
    // ======================================================
    // CORRECCIÓN: Añadido para detectar alertas de fotos
    // ======================================================
    if (titleLower.includes('foto') || titleLower.includes('imagen')) {
      return { name: 'image-outline' as keyof typeof Ionicons.glyphMap, color: '#d500ff' }; // Icono de imagen morado
    }
    // ======================================================

    if (titleLower.includes('confirmar') || titleLower.includes('seguro') || titleLower.includes('sesión')) {
      return { name: 'help-circle-outline' as keyof typeof Ionicons.glyphMap, color: '#d500ff' }; // Icono de pregunta morado
    }
    
    // Si no coincide nada, usa el default (amarillo)
    return { name: iconName, color: iconColor };
  };

  const { name: finalIconName, color: finalIconColor } = getIcon();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons
            name={finalIconName}
            size={48}
            color={finalIconColor}
            style={styles.icon}
          />
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const buttonStyle: ViewStyle[] = [styles.buttonBase];
              const textStyle: TextStyle[] = [styles.buttonTextBase];

              if (button.style === 'destructive') {
                buttonStyle.push(styles.buttonDestructive);
                textStyle.push(styles.buttonTextDestructive);
              } else if (button.style === 'cancel') {
                buttonStyle.push(styles.buttonCancel);
                textStyle.push(styles.buttonTextCancel);
              } else {
                buttonStyle.push(styles.buttonDefault);
                textStyle.push(styles.buttonTextDefault);
              }
              
              // Hacer los botones de cancelar más pequeños si hay más de 2 botones
              if (button.style === 'cancel' && buttons.length > 2) {
                 buttonStyle.push(styles.buttonCancelSmall);
                 textStyle.push(styles.buttonTextCancelSmall);
              }

              return (
                <TouchableOpacity
                  key={index}
                  style={buttonStyle}
                  onPress={button.onPress}
                  activeOpacity={0.7}>
                  <Text style={textStyle}>{button.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E', // Color de tarjeta de perfil
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'column', // Botones uno encima del otro
  },
  buttonBase: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonTextBase: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Botón por defecto (Morado)
  buttonDefault: {
    backgroundColor: '#d500ff',
  },
  buttonTextDefault: {
    color: '#FFFFFF',
  },
  // Botón destructivo (Rojo)
  buttonDestructive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#ff4444',
  },
  buttonTextDestructive: {
    color: '#ff4444',
  },
  // Botón de cancelar (Gris)
  buttonCancel: {
    backgroundColor: 'transparent',
  },
  buttonTextCancel: {
    color: '#999',
  },
  // Estilo más pequeño para cancelar cuando hay 3 opciones
  buttonCancelSmall: {
    paddingVertical: 10,
    marginTop: 4,
  },
  buttonTextCancelSmall: {
    color: '#888',
    fontSize: 14,
  }
});

export default CustomAlert;