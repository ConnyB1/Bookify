# ⚠️ Cambios Importantes en Autenticación

## Problema Resuelto

AWS Cognito estaba configurado con **email alias**, lo que causaba el error:
```
InvalidParameterException: Username cannot be of email format, since user pool is configured for email alias.
```

## Solución Implementada

Ahora la autenticación usa **nombre_usuario** en lugar de **email** como identificador principal.

---

## 📋 Cambios en el Backend

### DTOs Actualizados (`src/auth/dto/auth.dto.ts`)

**LoginDto:**
```typescript
{
  nombre_usuario: string;  // ← Antes era "email"
  password: string;
}
```

**ConfirmEmailDto:**
```typescript
{
  nombre_usuario: string;  // ← Antes era "email"
  code: string;
}
```

**ResendCodeDto:**
```typescript
{
  nombre_usuario: string;  // ← Antes era "email"
}
```

### Servicio Actualizado (`src/auth/auth.service.ts`)

- ✅ **Registro**: Usa `nombre_usuario` como Username en Cognito
- ✅ **Login**: Autentica con `nombre_usuario`
- ✅ **Confirmación**: Confirma con `nombre_usuario`
- ✅ **Reenvío de código**: Usa `nombre_usuario`

---

## 📱 Cambios en el Frontend

### Login (`app/Auth/Login.tsx`)
- Campo cambiado de "Email" a "Nombre de Usuario"
- Envía `nombre_usuario` en lugar de `email` al backend

### Register (`app/Auth/Register.tsx`)
- Confirmación de email ahora usa `nombre_usuario`
- Reenvío de código usa `nombre_usuario`

---

## 🧪 Cómo Usar Ahora

### 1. **Registro**
```json
POST /api/auth/register
{
  "nombre_usuario": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### 2. **Confirmar Email**
```json
POST /api/auth/confirm
{
  "nombre_usuario": "johndoe",  // ← Usa el nombre de usuario, NO el email
  "code": "123456"
}
```

### 3. **Login**
```json
POST /api/auth/login
{
  "nombre_usuario": "johndoe",  // ← Usa el nombre de usuario, NO el email
  "password": "SecurePass123"
}
```

### 4. **Reenviar Código**
```json
POST /api/auth/resend-code
{
  "nombre_usuario": "johndoe"  // ← Usa el nombre de usuario, NO el email
}
```

---

## ✅ Flujo Completo de Registro e Inicio de Sesión

### Paso 1: Registrarse
1. Abre la app
2. Ve a "Regístrate aquí"
3. Ingresa:
   - **Nombre de Usuario**: `testuser` (sin espacios, sin @)
   - **Email**: `tu-email@gmail.com` (email real para recibir código)
   - **Contraseña**: `Test1234!`
   - **Confirmar Contraseña**: `Test1234!`
4. Presiona "Sign In"

### Paso 2: Confirmar Email
1. Revisa tu email (también spam/promociones)
2. Copia el código de 6 dígitos
3. Ingrésalo en el modal que apareció
4. Presiona "Confirmar"

### Paso 3: Iniciar Sesión
1. Serás redirigido automáticamente al Login
2. Ingresa:
   - **Nombre de Usuario**: `testuser` (el mismo que registraste)
   - **Contraseña**: `Test1234!`
3. Presiona "Sign In"
4. ¡Listo! Estarás en la app

---

## 🔑 Datos Importantes

| Campo | Uso |
|-------|-----|
| **nombre_usuario** | Para login, confirmación y reenvío de código |
| **email** | Solo para registro y recibir el código de verificación |
| **password** | Para registro y login |

---

## 🐛 Errores Comunes

### "Usuario no encontrado"
- Verifica que estés usando el **nombre de usuario**, no el email
- El nombre de usuario es case-sensitive

### "Código de confirmación inválido"
- El código expira en 24 horas
- Usa "Reenviar código" si expiró
- Asegúrate de usar tu **nombre de usuario**, no el email

### "Credenciales inválidas"
- Primero debes confirmar tu email
- Usa el **nombre de usuario** para login, no el email
- Verifica que la contraseña sea correcta

---

## 📝 Ejemplo Completo

```bash
# 1. Registro
curl -X POST http://10.41.72.78:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_usuario": "testuser",
    "email": "test@example.com",
    "password": "Test1234!"
  }'

# 2. Confirmar (usa NOMBRE_USUARIO, no email)
curl -X POST http://10.41.72.78:3000/api/auth/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_usuario": "testuser",
    "code": "123456"
  }'

# 3. Login (usa NOMBRE_USUARIO, no email)
curl -X POST http://10.41.72.78:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_usuario": "testuser",
    "password": "Test1234!"
  }'
```

---

**¡Ahora puedes registrarte e iniciar sesión correctamente!** 🎉
