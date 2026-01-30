import React from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

interface ProfileCardProps {
  profilePictureUri: string;
  userName: string;
  userEmail: string;
  isUploading: boolean;
  onImagePress: () => void;
  ratingData: {
    promedio: number;
    total_calificaciones: number;
  } | null;
  loadingRating: boolean;
}

export default function ProfileCard({
  profilePictureUri,
  userName,
  userEmail,
  isUploading,
  onImagePress,
  ratingData,
  loadingRating,
}: ProfileCardProps) {
  return (
    <View style={styles.profileCard}>
      <TouchableOpacity onPress={onImagePress} disabled={isUploading}>
        <Image source={{ uri: profilePictureUri }} style={styles.avatar} />
        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      <ThemedText style={styles.userName}>{userName}</ThemedText>
      <ThemedText style={styles.userEmail}>{userEmail}</ThemedText>

      {loadingRating ? (
        <ActivityIndicator size="small" color="#FFD700" style={{ marginTop: 8 }} />
      ) : ratingData && ratingData.total_calificaciones > 0 ? (
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= Math.round(ratingData.promedio) ? "star" : "star-outline"}
              size={18}
              color="#FFD700"
            />
          ))}
          <Text style={styles.ratingText}>
            {ratingData.promedio.toFixed(1)} ({ratingData.total_calificaciones})
          </Text>
        </View>
      ) : (
        <ThemedText style={styles.noRatingText}>Sin calificaciones aún</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 55,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  userEmail: { color: '#ccc', fontSize: 14, marginBottom: 5 },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 3,
  },
  ratingText: { color: '#fff', marginLeft: 5, fontSize: 14 },
  noRatingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
