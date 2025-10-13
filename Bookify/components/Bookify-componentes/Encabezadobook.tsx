import { ThemedText } from '@/components/themed-text';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const Encabezadobook = () => {
  return (
    <View style={styles.header}>
      <ThemedText style={styles.appName}>Bookify</ThemedText>
      <MaterialCommunityIcons name="book-open-variant" size={32} color="white" />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default Encabezadobook;