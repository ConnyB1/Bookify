# Configuración necesaria en AWS Cognito

## 1. User Pool Settings (us-east-2_Dd7ioFEaM)

### App Client Settings (41kg3u3aeoifg8cs1urgqdam48)

**Habilitar autenticación USER_PASSWORD_AUTH:**
- Ve a: Amazon Cognito > User pools > tu pool > App clients > 41kg3u3aeoifg8cs1urgqdam48
- En "Authentication flows" habilita:
  - ✅ ALLOW_USER_PASSWORD_AUTH
  - ✅ ALLOW_REFRESH_TOKEN_AUTH
  - ✅ ALLOW_USER_SRP_AUTH

**Callback URLs permitidas:**
```
http://localhost:19006
http://10.41.72.78:19006
exp://localhost:19000
bookify://
```

**Sign out URLs permitidas:**
```
http://localhost:19006/logout
http://10.41.72.78:19006/logout
exp://localhost:19000
bookify://logout
```

**OAuth Scopes:**
- ✅ openid
- ✅ email
- ✅ phone
- ✅ profile

### Configurar políticas de contraseña:
- Longitud mínima: 8 caracteres
- Requerir números: Sí (opcional)
- Requerir símbolos especiales: No (opcional)
- Requerir mayúsculas: Sí (opcional)
- Requerir minúsculas: Sí (opcional)

### Configurar verificación de email:
- Email verification: Required
- Verification type: Code
- From email address: Tu email verificado en SES o usa el default de Cognito

## 2. Permisos IAM necesarios

Tu usuario IAM (AKIASJ3CLKX6QHID7HSH) necesita estos permisos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:SignUp",
        "cognito-idp:ConfirmSignUp",
        "cognito-idp:InitiateAuth",
        "cognito-idp:RespondToAuthChallenge",
        "cognito-idp:GetUser",
        "cognito-idp:ResendConfirmationCode"
      ],
      "Resource": "arn:aws:cognito-idp:us-east-2:*:userpool/us-east-2_Dd7ioFEaM"
    }
  ]
}
```

## 3. Testing endpoints

### Register:
```bash
curl -X POST http://10.41.72.78:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_usuario": "testuser",
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

### Confirm Email:
```bash
curl -X POST http://10.41.72.78:3000/api/auth/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'
```

### Login:
```bash
curl -X POST http://10.41.72.78:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

## 4. Notas importantes

- El código de verificación se envía al email registrado
- Por defecto, Cognito enviará emails desde no-reply@verificationemail.com
- Para producción, configura Amazon SES con un dominio verificado
- Los tokens de acceso expiran por defecto en 1 hora
- El refresh token dura 30 días por defecto
