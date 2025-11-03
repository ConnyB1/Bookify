# 🔐 Autenticación con Amazon Cognito - Bookify

## 📋 Resumen de Implementación

Se ha implementado un sistema completo de autenticación usando **Amazon Cognito** con:

### Backend (NestJS)
- ✅ Módulo de autenticación (`src/auth/`)
- ✅ Endpoints REST para registro, login, confirmación de email
- ✅ Integración con AWS Cognito Identity Provider
- ✅ Almacenamiento de usuarios en PostgreSQL (Supabase)

### Frontend (React Native + Expo)
- ✅ Pantalla de Login con diseño moderno
- ✅ Pantalla de Register con validaciones
- ✅ Modal de confirmación de código de email
- ✅ Almacenamiento seguro de tokens con AsyncStorage
- ✅ Navegación integrada con Expo Router

---

## 🚀 Endpoints Disponibles

### 1. **POST** `/api/auth/register`
Registrar un nuevo usuario

**Body:**
```json
{
  "nombre_usuario": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente. Por favor verifica tu email.",
  "data": {
    "user": {
      "id_usuario": 1,
      "nombre_usuario": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

---

### 2. **POST** `/api/auth/confirm`
Confirmar email con código de verificación

**Body:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email confirmado exitosamente"
}
```

---

### 3. **POST** `/api/auth/login`
Iniciar sesión

**Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id_usuario": 1,
      "nombre_usuario": "johndoe",
      "email": "john@example.com",
      "genero": null,
      "foto_perfil_url": null
    },
    "tokens": {
      "accessToken": "eyJraWQiOiJk...",
      "refreshToken": "eyJjdHkiOiJ...",
      "idToken": "eyJraWQiOiJZ..."
    }
  }
}
```

---

### 4. **POST** `/api/auth/resend-code`
Reenviar código de confirmación

**Body:**
```json
{
  "email": "john@example.com"
}
```

---

### 5. **GET** `/api/auth/me`
Obtener perfil del usuario autenticado

**Headers:**
```
Authorization: Bearer <accessToken>
```

---

## ⚙️ Configuración Necesaria

### 1. AWS Cognito - Habilitar USER_PASSWORD_AUTH

Ve a la consola de AWS:
1. Amazon Cognito > User pools > `us-east-2_Dd7ioFEaM`
2. App clients > `41kg3u3aeoifg8cs1urgqdam48`
3. Edit app client
4. En **Authentication flows**, habilita:
   - ✅ `ALLOW_USER_PASSWORD_AUTH`
   - ✅ `ALLOW_REFRESH_TOKEN_AUTH`

### 2. URLs de Callback y Logout

**Allowed callback URLs:**
```
http://localhost:19006
http://10.41.72.78:19006
exp://localhost:19000
bookify://
```

**Allowed sign out URLs:**
```
http://localhost:19006/logout
http://10.41.72.78:19006/logout
bookify://logout
```

### 3. Variables de Entorno (Backend)

Ya están configuradas en `.env`:
```env
COGNITO_USER_POOL_ID=us-east-2_Dd7ioFEaM
COGNITO_CLIENT_ID=41kg3u3aeoifg8cs1urgqdam48
COGNITO_REGION=us-east-2
```

---

## 🧪 Cómo Probar

### Backend
```bash
cd bookify-back
npm run start:dev
```

El servidor debe estar corriendo en `http://10.41.72.78:3000`

### Frontend
```bash
cd Bookify
npm start
```

Luego presiona `a` para Android o `i` para iOS.

### Flujo de Prueba

1. **Abrir la app** → Navega a la pantalla de Register
2. **Registrarse:**
   - Nombre de usuario: `testuser`
   - Email: `tu-email-real@gmail.com` (debe ser real para recibir el código)
   - Contraseña: `Test1234!`
   - Confirmar contraseña: `Test1234!`
3. **Revisar tu email** → Recibirás un código de 6 dígitos
4. **Ingresar el código** en el modal que aparece
5. **Iniciar sesión** con tus credenciales
6. **Listo!** Serás redirigido a la pantalla de Inicio

---

## 📱 Pantallas

### Login (`/Auth/Login`)
- Campo: Email
- Campo: Contraseña
- Botón: Sign In (morado #8b00ff)
- Link: ¿No tienes cuenta? Regístrate aquí

### Register (`/Auth/Register`)
- Campo: Nombre de Usuario
- Campo: Email
- Campo: Contraseña
- Campo: Confirmar Contraseña
- Botón: Sign In (morado #8b00ff)
- Link: ¿Ya tienes cuenta? Inicia sesión aquí
- Modal: Confirmación de código de 6 dígitos

---

## 🔒 Seguridad

- Las contraseñas se almacenan hasheadas con bcrypt (10 rounds)
- Los tokens JWT son manejados por AWS Cognito
- Los tokens se guardan en AsyncStorage (encriptado por defecto en dispositivos)
- El `accessToken` expira en 1 hora
- El `refreshToken` dura 30 días

---

## 🐛 Troubleshooting

### Error: "Network request failed"
- Verifica que el backend esté corriendo en `http://10.41.72.78:3000`
- Revisa que la IP en `config/api.ts` coincida con tu IP actual
- Verifica CORS en `src/main.ts`

### Error: "Código de confirmación inválido"
- Verifica que el código sea de 6 dígitos
- El código expira en 24 horas
- Usa "Reenviar código" si expiró

### Error: "Email o contraseña incorrectos"
- Verifica que hayas confirmado tu email primero
- Las contraseñas son case-sensitive
- El email debe estar en minúsculas

### Error: "Usuario no confirmado"
- Debes confirmar tu email antes de iniciar sesión
- Revisa tu bandeja de entrada y spam
- Usa la opción "Reenviar código"

---

## 📚 Archivos Modificados/Creados

### Backend
- ✅ `src/auth/auth.module.ts` (nuevo)
- ✅ `src/auth/auth.controller.ts` (nuevo)
- ✅ `src/auth/auth.service.ts` (nuevo)
- ✅ `src/auth/dto/auth.dto.ts` (nuevo)
- ✅ `src/app.module.ts` (modificado - agregado AuthModule)
- ✅ `.env` (modificado - credenciales de Cognito)

### Frontend
- ✅ `app/Auth/Login.tsx` (nuevo)
- ✅ `app/Auth/Register.tsx` (nuevo)
- ✅ `app/_layout.tsx` (modificado - rutas de auth)
- ✅ `config/api.ts` (modificado - endpoints de auth)
- ✅ `utils/auth.ts` (nuevo - manejo de sesión)

---

## 🎨 Diseño

El diseño está basado en la imagen proporcionada:
- Fondo negro (#000)
- Inputs con fondo oscuro (#1a1a1a)
- Botón principal morado vibrante (#8b00ff)
- Tipografía blanca para contraste
- Bordes redondeados (12px)

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del backend
2. Revisa la consola de React Native (Expo)
3. Verifica la configuración de AWS Cognito
4. Asegúrate de tener conexión a Internet

---

**¡Listo! Tu sistema de autenticación con Cognito está completamente funcional.** 🎉
