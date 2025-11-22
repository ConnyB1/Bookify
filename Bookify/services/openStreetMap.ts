import axios from 'axios';

// 🆓 Servicio GRATIS usando OpenStreetMap (Nominatim + Overpass API)

export interface OSMPlace {
  place_id: string;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  category: string;
  distance?: number;
}

interface NearbyParams {
  latitude: number;
  longitude: number;
  radius?: number;
  type?: string;
}

const OSM_TAGS: Record<string, Array<[string, string]>> = {
  cafe: [['amenity', 'cafe'], ['amenity', 'restaurant'], ['amenity', 'fast_food']],
  library: [['amenity', 'library']],
  park: [['leisure', 'park'], ['leisure', 'garden']],
  shopping_mall: [['shop', 'mall'], ['shop', 'supermarket'], ['amenity', 'marketplace']],
  university: [['amenity', 'university'], ['amenity', 'college'], ['amenity', 'school']],
};

export const SAFE_MEETING_PLACE_TYPES = [
  { type: 'cafe', label: 'Cafeterías', icon: 'cafe' },
  { type: 'library', label: 'Bibliotecas', icon: 'library' },
  { type: 'park', label: 'Parques', icon: 'leaf' },
  { type: 'shopping_mall', label: 'Centros Comerciales', icon: 'cart' },
  { type: 'university', label: 'Universidades', icon: 'school' },
];

// Calcular distancia 
const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Buscar lugares cercanos con Overpass API
export async function searchNearbyPlaces({ latitude, longitude, radius = 2000, type = 'cafe' }: NearbyParams): Promise<OSMPlace[]> {
  try {
    const tags = OSM_TAGS[type] || OSM_TAGS.cafe;
    const queries = tags.flatMap(([k, v]) => [
      `node["${k}"="${v}"](around:${radius},${latitude},${longitude});`,
      `way["${k}"="${v}"](around:${radius},${latitude},${longitude});`
    ]).join('\n');

    const { data } = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `[out:json][timeout:25];(${queries});out body;>;out skel qt;`,
      { headers: { 'Content-Type': 'text/plain' }, timeout: 30000 }
    );

    if (!data?.elements) return [];

    return data.elements
      .filter((e: any) => e.tags?.name)
      .map((e: any) => {
        const lat = e.lat || e.center?.lat || 0;
        const lon = e.lon || e.center?.lon || 0;
        return {
          place_id: `osm_${e.type}_${e.id}`,
          name: e.tags.name,
          display_name: formatAddress(e.tags),
          lat: lat.toString(),
          lon: lon.toString(),
          type: e.tags.amenity || e.tags.leisure || e.tags.shop || type,
          category: e.tags.amenity || e.tags.leisure || e.tags.shop || 'place',
          distance: calcDistance(latitude, longitude, lat, lon),
        };
      })
      .sort((a: OSMPlace, b: OSMPlace) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 20);
  } catch (error) {
    console.error('[OSM] Error:', error);
    return [];
  }
}

// Buscar por texto con Nominatim
export async function searchPlacesByText(query: string, location?: { lat: number; lng: number }): Promise<OSMPlace[]> {
  try {
    const params: any = { q: query, format: 'json', addressdetails: 1, limit: 10 };
    if (location) {
      Object.assign(params, {
        lat: location.lat,
        lon: location.lng,
        bounded: 1,
        viewbox: `${location.lng - 0.1},${location.lat - 0.1},${location.lng + 0.1},${location.lat + 0.1}`
      });
    }

    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params,
      headers: { 'User-Agent': 'Bookify-App/1.0' }
    });

    return Array.isArray(data) ? data.map(p => ({
      place_id: p.place_id,
      name: p.name || p.display_name.split(',')[0],
      display_name: p.display_name,
      lat: p.lat,
      lon: p.lon,
      type: p.type,
      category: p.class,
      distance: location ? calcDistance(location.lat, location.lng, parseFloat(p.lat), parseFloat(p.lon)) : undefined,
    })) : [];
  } catch (error) {
    console.error('[OSM] Search error:', error);
    return [];
  }
}

// Geocoding
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: address, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'Bookify-App/1.0' }
    });
    return data?.[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
  } catch (error) {
    console.error('[OSM] Geocoding error:', error);
    return null;
  }
}

// Formatear dirección
function formatAddress(tags: any): string {
  const parts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:suburb'],
    tags['addr:city']
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : tags.name || 'Ubicación sin dirección';
}
