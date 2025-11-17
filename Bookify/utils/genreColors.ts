// Utilidad para manejar colores de géneros
export const GENRE_COLORS = {
  'Ciencia Ficción': '#00bcd4', // Cyan 
  'Misterio': '#1565c0', // azul oscuro
  'Fantasía': '#e91e63', // rosa
  'Romance': '#f44336', // rojo
  'Terror': '#8A0303', // rojo oscuro 
  'Biografía': '#ff9800', // naranja
  'Historia': '#795548', // cafe
  'Aventura': '#4caf50', // Verde
  'Ficción': '#2196f3', // azul
  'No Ficción': '#607d8b', // gris azulado
  'Educativo': '#3f51b5', // Indigo 
  'Técnico': '#9c27b0', // morado
  'Arte': '#e91e63', // rosa
  'Cocina': '#ff5722', // naranja oscuro
  'Salud': '#8bc34a', // verde claro
  'Autoayuda': '#cddc39', // lima
};
// Función para obtener el color
export const getGenreColor = (genreName: string): string => {
  return GENRE_COLORS[genreName as keyof typeof GENRE_COLORS] || '#666666'; // Color por defecto
};

// Función para obtener una versión más clara del color
export const getGenreColorLight = (genreName: string): string => {
  const color = getGenreColor(genreName);
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, 0.2)`; 
};

export const getGenreTextColor = (genreName: string): string => {
  const color = getGenreColor(genreName);
  const darkColors = ['#424242', '#673ab7', '#795548', '#607d8b', '#3f51b5', '#9c27b0'];
  return darkColors.includes(color) ? '#ffffff' : '#000000';
};