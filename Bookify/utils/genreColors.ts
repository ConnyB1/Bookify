// Utilidad para manejar colores de géneros
export const GENRE_COLORS = {
  // Géneros principales con colores distintivos
  'Ciencia Ficción': '#00bcd4', // Cyan - futurista
  'Misterio': '#1565c0', // Dark blue - misterioso
  'Fantasía': '#e91e63', // Pink - mágico
  'Romance': '#f44336', // Red - pasional
  'Terror': '#8A0303', // Dark red - tenebroso
  'Biografía': '#ff9800', // Orange - cálido/personal
  'Historia': '#795548', // Brown - clásico
  'Aventura': '#4caf50', // Green - naturaleza/aventura
  
  // Géneros adicionales
  'Ficción': '#2196f3', // Blue - clásico
  'No Ficción': '#607d8b', // Blue gray - serio
  'Educativo': '#3f51b5', // Indigo - académico
  'Técnico': '#9c27b0', // Purple - tecnológico
  'Arte': '#e91e63', // Pink - creativo
  'Cocina': '#ff5722', // Deep orange - cálido
  'Salud': '#8bc34a', // Light green - salud
  'Autoayuda': '#cddc39', // Lime - crecimiento
};

// Función para obtener color de género
export const getGenreColor = (genreName: string): string => {
  return GENRE_COLORS[genreName as keyof typeof GENRE_COLORS] || '#666666'; // Color por defecto
};

// Función para obtener una versión más clara del color (para fondos)
export const getGenreColorLight = (genreName: string): string => {
  const color = getGenreColor(genreName);
  // Convertir hex a rgba con transparencia
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, 0.2)`; // 20% de opacidad
};

// Función para obtener colores de contraste (texto)
export const getGenreTextColor = (genreName: string): string => {
  const color = getGenreColor(genreName);
  // Para colores oscuros, usar texto blanco, para claros usar texto negro
  const darkColors = ['#424242', '#673ab7', '#795548', '#607d8b', '#3f51b5', '#9c27b0'];
  return darkColors.includes(color) ? '#ffffff' : '#000000';
};