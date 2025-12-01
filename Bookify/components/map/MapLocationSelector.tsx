import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, ScrollView,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUserLocation } from '../../hooks/location/useUserLocation';
import { usePlaceSearch } from '../../hooks/location/usePlaceSearch';
import { useLocationConfirmation } from '../../hooks/location/useLocationConfirmation';
import { useAlertDialog } from '../../hooks/useAlertDialog';
import { PlaceTypeFilters } from '../location/PlaceTypeFilters';
import { PlacesList } from '../location/PlacesList';
import { LocationConfirmation } from '../location/LocationConfirmation';
import { LoadingScreen } from '../common/LoadingScreen';
import CustomAlert from '../CustomAlert';

type MapMode = 'osm' | 'manual';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface MapLocationSelectorProps {
  mode: MapMode;
  exchangeId: string | string[];
  initialLocation?: LatLng;
  onConfirm?: (location: any) => void;
}

const RADIUS_OPTIONS = [1, 2, 5, 10, 20];

export function MapLocationSelector({
  mode,
  exchangeId,
  initialLocation,
  onConfirm,
}: MapLocationSelectorProps) {
  const { location: userLocation, loading: locationLoading } = useUserLocation();
  const { places, searching, selectedPlace, searchPlaces, selectPlace } = usePlaceSearch();
  const { confirmLocation, confirming, alertVisible, alertConfig, hideAlert } = useLocationConfirmation(exchangeId);
  const { showAlert: showLocalAlert, hideAlert: hideLocalAlert, alertVisible: localAlertVisible, alertConfig: localAlertConfig } = useAlertDialog();

  const [selectedType, setSelectedType] = useState('cafe');
  const [searchRadius, setSearchRadius] = useState(5); // Radio en km
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [mapRegion, setMapRegion] = useState({
    latitude: initialLocation?.latitude || 19.432608,
    longitude: initialLocation?.longitude || -99.133209,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    if (userLocation) {
      const delta = searchRadius / 111; // Aproximación: 1 grado ≈ 111 km
      setMapRegion({
        ...userLocation,
        latitudeDelta: delta,
        longitudeDelta: delta,
      });
      if (mode === 'osm') {
        // Convertir km a metros para la API
        searchPlaces(userLocation.latitude, userLocation.longitude, selectedType, searchRadius * 1000);
      }
    }
  }, [userLocation, mode, searchRadius]);

  const handleSelectPlace = (place: any) => {
    selectPlace(place);
    setMapRegion({
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const handleCancelSelection = () => {
    selectPlace(null);
  };

  const handleRecenterMap = () => {
    if (userLocation) {
      setMapRegion({
        ...userLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const handleMapPress = (event: any) => {
    if (mode === 'manual') {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      setSelectedLocation({ latitude, longitude });
      setMapRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    }
  };

  const handleConfirmLocation = async () => {
    if (mode === 'osm') {
      if (!selectedPlace) return;
      const result = await confirmLocation({
        lat: parseFloat(selectedPlace.lat),
        lng: parseFloat(selectedPlace.lon),
        nombre: selectedPlace.name,
        direccion: selectedPlace.display_name,
        place_id: selectedPlace.place_id,
      });
      if (result && onConfirm) {
        onConfirm({
          lat: parseFloat(selectedPlace.lat),
          lng: parseFloat(selectedPlace.lon),
          nombre: selectedPlace.name,
        });
      }
    } else if (mode === 'manual') {
      if (!selectedLocation) {
        showLocalAlert('Error', 'Por favor, selecciona una ubicación en el mapa', [
          { text: 'OK', onPress: hideLocalAlert }
        ]);
        return;
      }
      if (!locationName.trim()) {
        showLocalAlert('Error', 'Por favor, ingresa un nombre para el lugar', [
          { text: 'OK', onPress: hideLocalAlert }
        ]);
        return;
      }
      const result = await confirmLocation({
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        nombre: locationName,
        direccion: locationAddress || 'Ubicación personalizada',
        place_id: null,
      });
      if (result && onConfirm) {
        onConfirm({ lat: selectedLocation.latitude, lng: selectedLocation.longitude, nombre: locationName });
      }
    }
  };

  const handleChangeType = (type: string) => {
    setSelectedType(type);
    if (userLocation && mode === 'osm') {
      // Convertir km a metros para la API
      searchPlaces(userLocation.latitude, userLocation.longitude, type, searchRadius * 1000);
    }
  };

  const handleChangeRadius = (radius: number) => {
    setSearchRadius(radius);
    setShowRadiusSelector(false);
    if (userLocation && mode === 'osm') {
      // Convertir km a metros para la API
      searchPlaces(userLocation.latitude, userLocation.longitude, selectedType, radius * 1000);
    }
  };

  if (locationLoading && !userLocation) {
    return <LoadingScreen message="Obteniendo ubicación..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onPress={handleMapPress}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {/* Círculo de radio de búsqueda */}
        {mode === 'osm' && userLocation && (
          <Circle
            center={userLocation}
            radius={searchRadius * 1000} // Convertir km a metros
            fillColor="rgba(213, 0, 255, 0.1)"
            strokeColor="rgba(213, 0, 255, 0.3)"
            strokeWidth={2}
          />
        )}

        {/* OSM mode: markers de lugares */}
        {mode === 'osm' &&
          places.map((place) => (
            <Marker
              key={place.place_id}
              coordinate={{
                latitude: parseFloat(place.lat),
                longitude: parseFloat(place.lon),
              }}
              title={place.name}
              onPress={() => handleSelectPlace(place)}
              pinColor={selectedPlace?.place_id === place.place_id ? '#d500ff' : '#FF6B6B'}
            />
          ))}

        {/* Manual mode: marker de ubicación seleccionada */}
        {mode === 'manual' && selectedLocation && (
          <Marker coordinate={selectedLocation} pinColor="#d500ff" title="Lugar de encuentro">
            <View style={styles.markerContainer}>
              <Ionicons name="location" size={40} color="#d500ff" />
            </View>
          </Marker>
        )}
      </MapView>
      {/* Instrucciones para modo manual */}
      {mode === 'manual' && (
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionsContent}>
            <Ionicons name="information-circle" size={22} color="#d500ff" />
            <Text style={styles.instructionsText}>
              Toca el mapa para seleccionar el lugar
            </Text>
          </View>
        </View>
      )}

      {/* Filtros para modo OSM */}
      {mode === 'osm' && (
        <View style={styles.filters}>
          <PlaceTypeFilters
            selectedType={selectedType}
            onSelectType={handleChangeType}
            disabled={searching}
          />
        </View>
      )}
      {/* Selector de radio de búsqueda y botón de geolocalización */}
      {mode === 'osm' && (
        <View style={styles.radiusContainer}>
          {/* Botón de geolocalización */}
          <LinearGradient
            colors={['#6100BD', '#D500FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.radiusButton}
          > 
            <TouchableOpacity
              style={styles.geoButton}
              onPress={handleRecenterMap}
            >
              <Ionicons name="locate" size={20} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Botón de radio con dropdown */}
          <View>
            <LinearGradient
              colors={['#6100BD', '#D500FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.radiusButton}
            >
              <TouchableOpacity
                style={styles.radiusButtonContent}
                onPress={() => setShowRadiusSelector(!showRadiusSelector)}
              >
                <Ionicons name="resize-outline" size={20} color="#fff" />
                <Text style={styles.radiusButtonText}>{searchRadius} km</Text>
                <Ionicons 
                  name={showRadiusSelector ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </LinearGradient>

            {showRadiusSelector && (
              <View style={styles.radiusOptions}>
                {RADIUS_OPTIONS.map((radius) => (
                  searchRadius === radius ? (
                    <LinearGradient
                      key={radius}
                      colors={['#6100BD', '#D500FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.radiusOption}
                    >
                      <TouchableOpacity
                        style={styles.radiusOptionContent}
                        onPress={() => handleChangeRadius(radius)}
                      >
                        <Text style={styles.radiusOptionTextActive}>
                          {radius} km
                        </Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  ) : (
                    <TouchableOpacity
                      key={radius}
                      style={styles.radiusOption}
                      onPress={() => handleChangeRadius(radius)}
                    >
                      <Text style={styles.radiusOptionText}>
                        {radius} km
                      </Text>
                    </TouchableOpacity>
                  )
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Indicador de búsqueda */}
      {mode === 'osm' && searching && (
        <View style={styles.searching}>
          <ActivityIndicator size="small" color="#d500ff" />
          <Text style={styles.searchingText}>Buscando lugares...</Text>
        </View>
      )}

      {/* Lista de lugares para modo OSM */}
      {mode === 'osm' && places.length > 0 && !selectedPlace && (
        <View style={styles.places}>
          <PlacesList places={places} selectedPlace={selectedPlace} onSelectPlace={handleSelectPlace} />
        </View>
      )}

      {/* Confirmación para modo OSM */}
      {mode === 'osm' && selectedPlace && (
        <View style={styles.confirm}>
          <LocationConfirmation
            selectedPlace={selectedPlace}
            onConfirm={handleConfirmLocation}
            onCancel={handleCancelSelection}
            loading={confirming}
          />
        </View>
      )}

      {/* Formulario para modo manual */}
      {mode === 'manual' && selectedLocation && (
        <View style={styles.formContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.formTitle}>Información del Lugar</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre del lugar *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Starbucks Centro"
                placeholderTextColor="#666"
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Av. Juárez 123"
                placeholderTextColor="#666"
                value={locationAddress}
                onChangeText={setLocationAddress}
              />
            </View>

            <View style={styles.coordsInfo}>
              <Ionicons name="location-outline" size={16} color="#d500ff" />
              <Text style={styles.coordsText}>
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
            </View>

            {(!locationName.trim() || confirming) ? (
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonDisabled]}
                disabled={true}
              >
                {confirming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.confirmButtonText}>Confirmar Ubicación</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <LinearGradient
                colors={['#6100BD', '#D500FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmButton}
              >
                <TouchableOpacity
                  style={styles.confirmButtonContent}
                  onPress={handleConfirmLocation}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.confirmButtonText}>Confirmar Ubicación</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </ScrollView>
        </View>
      )}

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
      
      <CustomAlert
        visible={localAlertVisible}
        title={localAlertConfig.title}
        message={localAlertConfig.message}
        buttons={localAlertConfig.buttons}
        onClose={hideLocalAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#151718' 
  },
  map: { 
    flex: 1 
  },
  markerContainer: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  // Selector de radio
  radiusContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  geoButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusButton: {
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  radiusButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  radiusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  radiusOptions: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
  },
  radiusOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  radiusOptionContent: {
    alignItems: 'center',
  },
  radiusOptionText: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  radiusOptionTextActive: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  
  // Instrucciones
  instructionsContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 80,
    backgroundColor: 'rgba(21, 23, 24, 0.95)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d500ff',
    shadowColor: '#d500ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionsText: { 
    flex: 1, 
    fontSize: 14, 
    color: '#fff', 
    fontWeight: '600',
    lineHeight: 20,
  },
  
  // Filtros y búsqueda
  filters: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0,
    zIndex: 11,
  },
  searching: {
    position: 'absolute',
    top: 160,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(21, 23, 24, 0.95)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#d500ff',
    shadowColor: '#d500ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  searchingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Lista y confirmación
  places: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0 
  },
  confirm: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0 
  },
  
  // Formulario modo manual
  formContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#1f1f1f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    borderTopColor: '#d500ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: '55%',
  },
  formTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#fff', 
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: { 
    marginBottom: 16 
  },
  inputLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#ccc', 
    marginBottom: 8 
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  coordsInfo: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12, 
    backgroundColor: 'rgba(213, 0, 255, 0.1)', 
    borderRadius: 10, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(213, 0, 255, 0.3)',
  },
  coordsText: { 
    fontSize: 13, 
    color: '#d500ff', 
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  confirmButton: {
    borderRadius: 14,
    shadowColor: '#d500ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  confirmButtonDisabled: { 
    backgroundColor: '#555',
    shadowOpacity: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
    width: '100%',
  },
  confirmButtonText: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#fff' 
  },
});
