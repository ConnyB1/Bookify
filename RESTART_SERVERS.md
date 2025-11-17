# 🔄 Instrucciones para Reiniciar los Servidores

## Problema
La app sigue usando la IP antigua `192.168.1.100:3000` en lugar de la nueva `192.168.50.75:3000`

## Solución

### 1. Detener Expo (Frontend)
En la terminal donde está corriendo `npx expo start`:
- Presiona `Ctrl + C`

### 2. Reiniciar Expo con caché limpio
```powershell
cd "c:\Users\costco\Documents\Uni\alicaciones moviles\proyecto final\Bookify"
npx expo start -c
```

### 3. Verificar Backend
El backend debería mostrar:
```
🚀 Backend running on:
   - Local:   http://127.0.0.1:3000
   - Network: http://0.0.0.0:3000 (accessible from LAN)
```

### 4. Verificar logs de la app
Deberías ver en los logs:
```
[API CONFIG] BASE_URL: http://192.168.50.75:3000
[API CONFIG] EXPO_PUBLIC_API_URL: http://192.168.50.75:3000
```

### 5. Si persiste el error de Network request failed

**Opción A: Verificar firewall**
```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "Bookify Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Opción B: Probar conectividad**
```powershell
curl http://192.168.50.75:3000 -UseBasicParsing
```

**Opción C: Verificar que tu dispositivo Android esté en la misma red WiFi**
- Tu PC: WiFi `192.168.50.75`
- Tu Android: Debe estar en la misma red WiFi

### 6. Escanear QR de nuevo
En Expo Go, escanea el nuevo código QR generado después de reiniciar con `-c`

## Archivos Modificados
- ✅ `.env` - Eliminada variable `DEFAULT_IP` incorrecta
- ✅ `config/api.ts` - Simplificado para usar solo `EXPO_PUBLIC_API_URL`
- ✅ `config/api.ts` - Agregados logs de debugging
- ✅ `bookify-back/src/main.ts` - Mejorados logs del backend
