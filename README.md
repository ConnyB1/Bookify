# Bookify

Bookify es una plataforma móvil diseñada para fomentar la lectura mediante el intercambio de libros entre usuarios. La aplicación permite a los lectores dar una segunda vida a sus libros, descubrir nuevas lecturas cercanas a su ubicación y conectar con una comunidad de amantes de la literatura.

## Instalación y Ejecución

Para correr el proyecto, se necesitan dos terminales: una para el Backend y otra para el Frontend

### 1. Backend 

```bash
cd Bookify/bookify-back
npm i
npm run start:dev
```

### 2. Frontend 

Antes que nada se necessita cambiar la ip a la ip locar en el .env dentro del frontend
```env
EXPO_PUBLIC_API_URL=http://tu-ip:3000
```

```bash
cd Bookify/Bookify
npm i
npx expo start
```
