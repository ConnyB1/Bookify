import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUbicacionUsuario } from '../../hooks/location/useUserLocation';
import { usarbusqueda } from '../../hooks/location/usePlaceSearch';
import { useConfirmacionUbicacion } from '../../hooks/location/useLocationConfirmation';
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
  const { location: userLocation, loading: locationLoading } = useUbicacionUsuario();
  const { places, searching, selectedPlace, buscarlugares, selectPlace } = usarbusqueda();
  const { confirmLocation, confirming, alertVisible, alertConfig, hideAlert } = useConfirmacionUbicacion(exchangeId);

  const [selectedType, setSelectedType] = useState('cafe');
  const [searchRadius, setSearchRadius] = useState(5);
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: initialLocation?.latitude || 19.432608,
    longitude: initialLocation?.longitude || -99.133209,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    if (userLocation) {
      const delta = searchRadius / 111; 
      setMapRegion({
        ...userLocation,
        latitudeDelta: delta,
        longitudeDelta: delta,
      });
      if (mode === 'osm') {
        buscarlugares(userLocation.latitude, userLocation.longitude, selectedType, searchRadius * 1000);
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

  const handleConfirmLocation = async () => {
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
  };

  const handleChangeType = (type: string) => {
    setSelectedType(type);
    if (userLocation && mode === 'osm') {
      buscarlugares(userLocation.latitude, userLocation.longitude, type, searchRadius * 1000);
    }
  };

  const handleChangeRadius = (radius: number) => {
    setSearchRadius(radius);
    setShowRadiusSelector(false);
    if (userLocation && mode === 'osm') {
      buscarlugares(userLocation.latitude, userLocation.longitude, selectedType, radius * 1000);
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
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {mode === 'osm' && userLocation && (
          <Circle
            center={userLocation}
            radius={searchRadius * 1000} 
            fillColor="rgba(213, 0, 255, 0.1)"
            strokeColor="rgba(213, 0, 255, 0.3)"
            strokeWidth={2}
          />
        )}

        {mode === 'osm' &&
          places.map((place: any) => (
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
      </MapView>

      {mode === 'osm' && (
        <View style={styles.filters}>
          <PlaceTypeFilters
            selectedType={selectedType}
            onSelectType={handleChangeType}
            disabled={searching}
          />
        </View>
      )}
      {mode === 'osm' && (
        <View style={styles.radiusContainer}>
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

      {mode === 'osm' && searching && (
        <View style={styles.searching}>
          <ActivityIndicator size="small" color="#d500ff" />
          <Text style={styles.searchingText}>Buscando lugares...</Text>
        </View>
      )}

      {mode === 'osm' && places.length > 0 && !selectedPlace && (
        <View style={styles.places}>
          <PlacesList places={places} selectedPlace={selectedPlace} onSelectPlace={handleSelectPlace} />
        </View>
      )}

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

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
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
});

