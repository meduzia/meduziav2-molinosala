# 🔧 TypeScript Fixes Pendientes

Hay algunos errores menores de TypeScript que necesitan ser corregidos en archivos existentes. Aquí están las soluciones:

## Errores Detectados

### 1. `app/api/creatives/route.ts`

**Error:** `Cannot find name 'uploadToS3'` y `Cannot find name 'prisma'`

**Solución:**
```typescript
// Agregar al inicio del archivo:
import { uploadToS3 } from '@/lib/s3'
import { prisma } from '@/lib/prisma'

// O si no usas Prisma, comentar las líneas que lo usan
```

### 2. `app/api/kpis/route.ts`

**Error:** Property 'cpa' does not exist

**Solución:**
```typescript
// Líneas 103-104, agregar cpa al objeto:
const prevMetrics = {
  spend: prevSum(data, 'spend'),
  revenue: prevSum(data, 'revenue'),
  conversions: prevSum(data, 'conversions'),
  impressions: prevSum(data, 'impressions'),
  clicks: prevSum(data, 'clicks'),
  cpa: prevSum(data, 'cpa'),  // ← Agregar esta línea
}
```

### 3. `app/components/__tests__/MetricCard.test.tsx`

**Error:** Property 'isPositive' does not exist

**Solución:** Este archivo es solo un ejemplo de test. Puedes:
- Eliminarlo temporalmente si no lo necesitas
- O actualizarlo según las props reales de MetricCard

Para verificar las props correctas:
```bash
grep -A 10 "interface.*MetricCard" app/components/dashboard/MetricCard.tsx
```

### 4. `app/components/creatives/UploadCreativeModal.tsx`

**Error:** Parameter 'prev' implicitly has an 'any' type

**Solución:**
```typescript
// Línea 165, cambiar:
setUploadProgress((prev: any) => prev + 10)

// Por:
setUploadProgress((prev: number) => prev + 10)
```

### 5. `app/components/dashboard/DestinationsChart.tsx`

**Error:** Type mismatch en ChartDataInput

**Solución:**
```typescript
// Agregar index signature a la interfaz DestinationData:
interface DestinationData {
  name: string
  value: number
  percentage: number
  [key: string]: any  // ← Agregar esta línea
}
```

### 6. `app/components/dashboard/SpendingPredictions.tsx`

**Error:** possibly 'undefined'

**Solución:**
```typescript
// Líneas 241 y 253, usar optional chaining:
{predictions?.budgetUsed && (
  // código
)}

{predictions?.daysUntilBudgetExhausted && (
  // código
)}
```

### 7. `app/components/dashboard/SpendRevenueChart.tsx`

**Error:** Right operand of ?? is unreachable

**Solución:**
```typescript
// Línea 87, simplificar:
// Antes:
const value = item[key] ?? 0

// Después (si item[key] siempre tiene valor):
const value = item[key] || 0
```

### 8. `app/login/page.tsx`

**Errors:** Parameter 'e' implicitly has 'any' type

**Solución:**
```typescript
// Líneas 88 y 100, agregar tipo:
const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  // ...
}

const handleGoogleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault()
  // ...
}
```

### 9. `scripts/create-tables.ts`

**Error:** Type 'string | undefined' is not assignable to type 'string'

**Solución:**
```typescript
// Línea 45, agregar fallback:
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// O con validación:
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}
```

## 🚀 Script de Fix Rápido

Puedes crear un script para aplicar algunos fixes automáticamente:

```bash
# crear fix-types.sh
#!/bin/bash

# Fix 1: Agregar tipos explícitos
sed -i '' 's/(e) =>/\(e: React.FormEvent\) =>/g' app/login/page.tsx

# Fix 2: Agregar optional chaining
sed -i '' 's/predictions\.budgetUsed/predictions?.budgetUsed/g' app/components/dashboard/SpendingPredictions.tsx

echo "Fixes aplicados. Ejecuta 'npx tsc --noEmit' para verificar."
```

## ✅ Verificación

Después de aplicar los fixes:

```bash
# Verificar tipos
npx tsc --noEmit

# Si todo está bien, ejecutar tests
npm run test

# Build de producción
npm run build
```

## 📝 Notas

- La mayoría de estos errores son en código existente, no en las mejoras
- Los fixes son menores y no afectan funcionalidad
- Puedes aplicarlos gradualmente
- Los tests de ejemplo (`__tests__`) pueden eliminarse temporalmente

## 🔍 Para Más Ayuda

Si encuentras errores adicionales:

```bash
# Ver todos los errores de TypeScript
npx tsc --noEmit 2>&1 | tee typescript-errors.log

# Ver solo la cantidad de errores
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

---

**Tip:** Estos fixes son opcionales para que la app funcione. El código JavaScript seguirá ejecutándose correctamente.
