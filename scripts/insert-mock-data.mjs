/**
 * Script para insertar datos mock de Retrofish Digital en Supabase
 * Ejecutar: node scripts/insert-mock-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function insertMockData() {
  console.log('🚀 Insertando datos mock de Retrofish Digital en Supabase...\n');

  // Leer .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  let env = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configurados');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Generar fechas de los últimos 7 días
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  // Servicios de Retrofish
  const services = [
    'Social Media Management',
    'Google Ads',
    'SEO',
    'Web Design',
    'Content Creation'
  ];

  // Destinos
  const destinations = ['Argentina', 'LATAM', 'USA', 'Global'];

  // Ángulos creativos
  const angles = [
    'Crecimiento Empresarial',
    'Transformación Digital',
    'ROI Garantizado',
    'Estrategia Rentable',
    'Servicios Empresariales Premium'
  ];

  // Formatos
  const formats = ['Video', 'Image', 'Carousel', 'Story'];

  // Datos mock para ads_performance
  const mockAdsData = [];

  dates.forEach((date, dayIndex) => {
    services.forEach((service, serviceIndex) => {
      const destination = destinations[serviceIndex % destinations.length];
      const angle = angles[serviceIndex % angles.length];
      const format = formats[serviceIndex % formats.length];
      
      // Variar métricas para datos realistas
      const baseConversions = Math.floor(Math.random() * 20) + 10 + (dayIndex * 2);
      const baseSpend = baseConversions * (15 + Math.random() * 10);
      const revenue = baseSpend * (2.5 + Math.random() * 1.5);
      const impressions = baseConversions * (80 + Math.random() * 40);
      const clicks = Math.floor(impressions * (0.02 + Math.random() * 0.01));
      
      const cpa = baseConversions > 0 ? baseSpend / baseConversions : 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const roas = baseSpend > 0 ? revenue / baseSpend : 0;

      mockAdsData.push({
        ad_id: `RF-${service.substring(0, 3).toUpperCase()}-${dayIndex}-${serviceIndex}`,
        ad_name: `${service} - ${destination} - ${format}`,
        campaign_name: `Retrofish ${service} Campaign`,
        destination: destination,
        angle: angle,
        format: format,
        impressions: Math.floor(impressions),
        clicks: clicks,
        spend: Math.round(baseSpend * 100) / 100,
        conversions: baseConversions,
        revenue: Math.round(revenue * 100) / 100,
        ctr: Math.round(ctr * 100) / 100,
        cpa: Math.round(cpa * 100) / 100,
        roas: Math.round(roas * 100) / 100,
        date: date,
      });
    });
  });

  try {
    console.log(`📊 Insertando ${mockAdsData.length} registros de ads_performance...\n`);

    // Insertar en lotes de 10
    const batchSize = 10;
    for (let i = 0; i < mockAdsData.length; i += batchSize) {
      const batch = mockAdsData.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('ads_performance')
        .upsert(batch, { onConflict: 'ad_id' });

      if (error) {
        console.error(`❌ Error insertando lote ${i / batchSize + 1}:`, error.message);
      } else {
        console.log(`✅ Lote ${i / batchSize + 1}/${Math.ceil(mockAdsData.length / batchSize)} insertado`);
      }
    }

    console.log('\n✅ Datos mock insertados exitosamente!');
    console.log(`📊 Total: ${mockAdsData.length} registros de ads_performance`);
    console.log(`📅 Rango de fechas: ${dates[0]} a ${dates[dates.length - 1]}`);
    console.log('\n🎉 El dashboard ahora debería mostrar datos.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Verifica que las tablas existan en Supabase.');
    console.log('   Ejecuta: scripts/create-tables.sql en Supabase SQL Editor');
    process.exit(1);
  }
}

insertMockData();

