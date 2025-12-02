import axios from 'axios';
import { API_CONFIG } from '../config/api';

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

export const Lugares = [
  { type: 'cafe', label: 'Cafeterías', icon: 'cafe' },
  { type: 'library', label: 'Bibliotecas', icon: 'library' },
  { type: 'park', label: 'Parques', icon: 'leaf' },
  { type: 'shopping_mall', label: 'Centros Comerciales', icon: 'cart' },
  { type: 'university', label: 'Universidades', icon: 'school' },
];


const obtenerdistancias = async (
  points: Array<{ lat1: number; lon1: number; lat2: number; lon2: number }>
): Promise<number[]> => {
  if (points.length === 0) return [];

  try {
    const { data } = await axios.post(
      `${API_CONFIG.BASE_URL}/api/books/distance/batch`,
      { points },
      { timeout: 10000 }
    );
    return data.data.distances;
  } catch (error) {
    return points.map(() => 0);
  }
};

export async function buscarlugarescercanos({ latitude, longitude, radius = 2000, type = 'cafe' }: NearbyParams): Promise<OSMPlace[]> {
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

    const places = data.elements
      .filter((e: any) => e.tags?.name)
      .map((e: any) => {
        const lat = e.lat || e.center?.lat || 0;
        const lon = e.lon || e.center?.lon || 0;
        return {
          place_id: `osm_${e.type}_${e.id}`,
          name: e.tags.name,
          display_name: direccion(e.tags),
          lat: lat.toString(),
          lon: lon.toString(),
          type: e.tags.amenity || e.tags.leisure || e.tags.shop || type,
          category: e.tags.amenity || e.tags.leisure || e.tags.shop || 'place',
          coords: { lat, lon },
        };
      });

    const points = places.map((place: any) => ({
      lat1: latitude,
      lon1: longitude,
      lat2: place.coords.lat,
      lon2: place.coords.lon,
    }));

    const distances = await obtenerdistancias(points);

    const placesWithDistance = places.map((place: any, index: number) => ({
      ...place,
      distance: distances[index],
    }));

    return placesWithDistance
      .sort((a: OSMPlace, b: OSMPlace) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 20);
  } catch (error) {
    console.error('[OSM] Error:', error);
    return [];
  }
}

export async function buscarlugar(query: string, location?: { lat: number; lng: number }): Promise<OSMPlace[]> {
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

    if (!Array.isArray(data)) return [];

    if (location) {
      const points = data.map((p: any) => ({
        lat1: location.lat,
        lon1: location.lng,
        lat2: parseFloat(p.lat),
        lon2: parseFloat(p.lon),
      }));

      const distances = await obtenerdistancias(points);

      return data.map((p: any, index: number) => ({
        place_id: p.place_id,
        name: p.name || p.display_name.split(',')[0],
        display_name: p.display_name,
        lat: p.lat,
        lon: p.lon,
        type: p.type,
        category: p.class,
        distance: distances[index],
      }));
    }

    return data.map((p: any) => ({
      place_id: p.place_id,
      name: p.name || p.display_name.split(',')[0],
      display_name: p.display_name,
      lat: p.lat,
      lon: p.lon,
      type: p.type,
      category: p.class,
      distance: undefined,
    }));
  } catch (error) {
    console.error('[OSM] Search error:', error);
    return [];
  }
}

function direccion(tags: any): string {
  const parts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:suburb'],
    tags['addr:city']
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : tags.name || 'Ubicación sin dirección';
}
