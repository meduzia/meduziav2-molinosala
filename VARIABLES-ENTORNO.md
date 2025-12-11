# Variables de Entorno Requeridas

Este archivo muestra todas las variables de entorno necesarias para el proyecto.
Copia este contenido a un archivo `.env.local` y completa los valores.

## Base de Datos Supabase

```env
# URL de tu proyecto Supabase (encontrar en Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Anon Key (pública, segura para usar en frontend)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (privada, solo para backend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Connection String directa (opcional, para Prisma)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

**¿Dónde conseguir estas?**
1. Ve a tu proyecto en https://supabase.com
2. Settings → API
3. Copia la URL y las keys

## AWS S3 (Para almacenar creativos)

```env
# Región de AWS donde está tu bucket
AWS_REGION=us-east-1

# Access Key ID de IAM user con permisos de S3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE

# Secret Access Key
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Nombre del bucket S3
AWS_S3_BUCKET_NAME=retrofish-creatives
```

**¿Cómo configurar?**
1. Ve a AWS Console → S3
2. Crea un bucket (o usa uno existente)
3. Ve a IAM → Users → Create User
4. Asigna política `AmazonS3FullAccess` o crea una política custom
5. Crea Access Keys para el usuario
6. Copia las keys aquí

## OpenAI (Para generar insights con IA)

```env
# API Key de OpenAI (obtener en https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**¿Cómo conseguir?**
1. Ve a https://platform.openai.com
2. Crea una cuenta o inicia sesión
3. Ve a API Keys → Create new secret key
4. Copia la key (solo se muestra una vez)

## Meta Ads API (Para workflows de n8n)

Estas variables se configuran en n8n, no en el código:

```env
# App ID de Meta Developers
META_APP_ID=1234567890123456

# App Secret
META_APP_SECRET=abc123def456ghi789jkl012mno345pqr678

# Access Token (Long-lived token recomendado)
META_ACCESS_TOKEN=EAABsbCS1iHgBO7ZC...

# Account ID de Meta Ads Manager
META_ACCOUNT_ID=act_123456789
```

**¿Cómo conseguir?**
1. Ve a https://developers.facebook.com
2. Crea una app o usa una existente
3. Agrega el producto "Marketing API"
4. Settings → Basic → Copia App ID y App Secret
5. Tools → Graph API Explorer → Genera Access Token
6. Para Account ID: ve a Ads Manager → URL contiene `act=ACCOUNT_ID`

## Telegram (Opcional, para notificaciones)

```env
# Bot Token de Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Chat ID donde enviar notificaciones
TELEGRAM_CHAT_ID=123456789
```

**¿Cómo conseguir?**
1. Habla con @BotFather en Telegram
2. Crea un nuevo bot con `/newbot`
3. Copia el token
4. Para Chat ID: envía un mensaje a tu bot y visita `https://api.telegram.org/bot<TOKEN>/getUpdates`

## Variables de Entorno Completas (Ejemplo)

```env
# ============================================
# SUPABASE
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1LXByb2plY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxMjM0NTYsImV4cCI6MTk2MDY5OTQ1Nn0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1LXByb2plY3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NTEyMzQ1NiwiZXhwIjoxOTYwNjk5NDU2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# ============================================
# AWS S3
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=retrofish-creatives

# ============================================
# OPENAI
# ============================================
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# META ADS (Para n8n workflows)
# ============================================
META_APP_ID=1234567890123456
META_APP_SECRET=abc123def456ghi789jkl012mno345pqr678
META_ACCESS_TOKEN=EAABsbCS1iHgBO7ZC...
META_ACCOUNT_ID=act_123456789

# ============================================
# TELEGRAM (Opcional)
# ============================================
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

## Notas Importantes

1. **NUNCA subas `.env.local` a Git** - Este archivo contiene información sensible
2. El archivo `.env.local` está en `.gitignore` por defecto
3. Para producción, configura estas variables en tu plataforma de hosting (Vercel, Netlify, etc.)
4. Las variables que empiezan con `NEXT_PUBLIC_` son públicas y se exponen al frontend
5. Las demás variables son privadas y solo se usan en el servidor

## Verificación

Para verificar que todas las variables están configuradas:

```bash
# En desarrollo
npm run dev

# Revisa la consola para ver si hay errores de variables faltantes
```

Si falta alguna variable, verás errores en la consola del servidor.

