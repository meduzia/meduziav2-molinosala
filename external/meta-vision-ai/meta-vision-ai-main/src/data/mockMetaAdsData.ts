export interface AdData {
  id: string;
  name: string;
  type: 'image' | 'video';
  roas: number;
  ctr: number;
  cpa: number;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  status: 'winning' | 'scaling' | 'testing' | 'paused';
  recommendation: string;
  thumbnailUrl: string;
}

export interface PerformanceData {
  date: string;
  roas: number;
  spend: number;
  revenue: number;
  conversions: number;
}

export const performanceOverTime: PerformanceData[] = [
  { date: '2024-10-01', roas: 3.2, spend: 1250, revenue: 4000, conversions: 45 },
  { date: '2024-10-02', roas: 3.5, spend: 1300, revenue: 4550, conversions: 52 },
  { date: '2024-10-03', roas: 3.1, spend: 1400, revenue: 4340, conversions: 48 },
  { date: '2024-10-04', roas: 4.2, spend: 1500, revenue: 6300, conversions: 68 },
  { date: '2024-10-05', roas: 3.8, spend: 1600, revenue: 6080, conversions: 65 },
  { date: '2024-10-06', roas: 4.5, spend: 1550, revenue: 6975, conversions: 72 },
  { date: '2024-10-07', roas: 4.1, spend: 1700, revenue: 6970, conversions: 70 },
];

export const adsData: AdData[] = [
  {
    id: 'AD-001',
    name: 'Verano 2024 - Colección Premium',
    type: 'video',
    roas: 4.8,
    ctr: 3.2,
    cpa: 18.5,
    spend: 2500,
    revenue: 12000,
    impressions: 125000,
    clicks: 4000,
    conversions: 135,
    status: 'winning',
    recommendation: 'ESCALAR: Aumentar presupuesto en 50%. Este anuncio está generando un ROAS excepcional.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop'
  },
  {
    id: 'AD-002',
    name: 'Descuento Flash 24h',
    type: 'image',
    roas: 4.2,
    ctr: 2.8,
    cpa: 22.0,
    spend: 1800,
    revenue: 7560,
    impressions: 95000,
    clicks: 2660,
    conversions: 121,
    status: 'winning',
    recommendation: 'ESCALAR: Duplicar inversión. Excelente performance en conversiones.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=300&fit=crop'
  },
  {
    id: 'AD-003',
    name: 'Testimonios Clientes Reales',
    type: 'video',
    roas: 3.5,
    ctr: 2.1,
    cpa: 28.5,
    spend: 1500,
    revenue: 5250,
    impressions: 80000,
    clicks: 1680,
    conversions: 88,
    status: 'scaling',
    recommendation: 'MANTENER: Rendimiento estable. Continuar monitoreando métricas.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=400&h=300&fit=crop'
  },
  {
    id: 'AD-004',
    name: 'Producto Estrella - Estática',
    type: 'image',
    roas: 2.8,
    ctr: 1.5,
    cpa: 35.0,
    spend: 1200,
    revenue: 3360,
    impressions: 70000,
    clicks: 1050,
    conversions: 60,
    status: 'testing',
    recommendation: 'VARIAR: Probar nuevo copy y audiencia. CTR bajo indica baja relevancia.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'
  },
  {
    id: 'AD-005',
    name: 'Tutorial Uso Producto',
    type: 'video',
    roas: 3.9,
    ctr: 2.5,
    cpa: 24.0,
    spend: 2000,
    revenue: 7800,
    impressions: 110000,
    clicks: 2750,
    conversions: 115,
    status: 'scaling',
    recommendation: 'ESCALAR: Aumentar presupuesto gradualmente. Video engagement alto.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=300&fit=crop'
  },
  {
    id: 'AD-006',
    name: 'Comparación Antes/Después',
    type: 'image',
    roas: 1.8,
    ctr: 1.2,
    cpa: 45.0,
    spend: 1100,
    revenue: 1980,
    impressions: 65000,
    clicks: 780,
    conversions: 44,
    status: 'paused',
    recommendation: 'PAUSAR: ROAS por debajo del objetivo. Rediseñar creatividad completamente.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=300&fit=crop'
  },
  {
    id: 'AD-007',
    name: 'Unboxing Experiencia',
    type: 'video',
    roas: 4.5,
    ctr: 3.0,
    cpa: 20.0,
    spend: 2200,
    revenue: 9900,
    impressions: 130000,
    clicks: 3900,
    conversions: 165,
    status: 'winning',
    recommendation: 'ESCALAR: Top performer. Incrementar inversión agresivamente.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&h=300&fit=crop'
  },
  {
    id: 'AD-008',
    name: 'Oferta Limitada Stock',
    type: 'image',
    roas: 3.2,
    ctr: 2.3,
    cpa: 26.0,
    spend: 1600,
    revenue: 5120,
    impressions: 88000,
    clicks: 2024,
    conversions: 98,
    status: 'scaling',
    recommendation: 'MANTENER: Buen equilibrio entre coste y conversión.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea841c45?w=400&h=300&fit=crop'
  }
];

export const creativeTypeComparison = {
  video: {
    avgRoas: 4.1,
    avgCtr: 2.7,
    avgCpa: 22.8,
    totalSpend: 9700,
    totalRevenue: 39770,
    conversions: 566,
    count: 4
  },
  image: {
    avgRoas: 3.0,
    avgCtr: 1.9,
    avgCpa: 32.0,
    totalSpend: 5700,
    totalRevenue: 18020,
    conversions: 323,
    count: 4
  }
};

export const aiRecommendations = [
  {
    priority: 'high',
    title: 'Escalar Anuncios de Video',
    description: 'Los videos están superando a las imágenes en un 37% en ROAS. Recomendar reasignar 30% del presupuesto de imágenes a videos.',
    action: 'Aumentar presupuesto de AD-001, AD-007',
    impact: '+$12,500 revenue estimado'
  },
  {
    priority: 'high',
    title: 'Pausar Bajo Rendimiento',
    description: 'AD-006 está consumiendo presupuesto con ROAS de 1.8, muy por debajo del objetivo de 3.0.',
    action: 'Pausar AD-006 inmediatamente',
    impact: 'Ahorrar $1,100/día en gasto improductivo'
  },
  {
    priority: 'medium',
    title: 'Optimizar Audiencias',
    description: 'CTR promedio de imágenes es bajo (1.9%). Segmentar audiencias más específicas o probar lookalikes.',
    action: 'A/B test con 3 nuevas audiencias',
    impact: '+0.8% CTR estimado'
  },
  {
    priority: 'medium',
    title: 'Duplicar Ganadores',
    description: 'AD-001 y AD-007 son consistentemente top performers. Crear variaciones para evitar fatiga.',
    action: 'Crear 2-3 variaciones por anuncio',
    impact: 'Extender ciclo de vida 40%'
  },
  {
    priority: 'low',
    title: 'Horarios Optimizados',
    description: 'Análisis muestra mejor conversión entre 18:00-22:00. Ajustar programación.',
    action: 'Configurar dayparting strategy',
    impact: '+15% efficiency en horarios pico'
  }
];

export const overallMetrics = {
  totalSpend: 15400,
  totalRevenue: 57790,
  totalRoas: 3.75,
  avgCtr: 2.3,
  avgCpa: 27.4,
  totalConversions: 889,
  activeAds: 7,
  pausedAds: 1
};

// Benchmarking data
export interface BenchmarkData {
  metric: string;
  myValue: number;
  industryAvg: number;
  competitor1: number;
  competitor2: number;
  unit: string;
}

export const benchmarkData: BenchmarkData[] = [
  { metric: 'CTR', myValue: 2.3, industryAvg: 1.8, competitor1: 2.1, competitor2: 1.9, unit: '%' },
  { metric: 'CPA', myValue: 27.4, industryAvg: 32.0, competitor1: 29.5, competitor2: 35.2, unit: '$' },
  { metric: 'ROAS', myValue: 3.75, industryAvg: 3.2, competitor1: 3.5, competitor2: 3.0, unit: 'x' },
  { metric: 'CPM', myValue: 12.5, industryAvg: 14.2, competitor1: 13.8, competitor2: 15.1, unit: '$' },
  { metric: 'Frecuencia', myValue: 2.8, industryAvg: 3.2, competitor1: 3.0, competitor2: 3.5, unit: '' },
];

export interface CompetitorTrend {
  date: string;
  myRoas: number;
  industryAvg: number;
  competitor1: number;
}

export const competitorTrends: CompetitorTrend[] = [
  { date: '2024-10-01', myRoas: 3.2, industryAvg: 3.0, competitor1: 3.3 },
  { date: '2024-10-02', myRoas: 3.5, industryAvg: 3.1, competitor1: 3.4 },
  { date: '2024-10-03', myRoas: 3.1, industryAvg: 3.2, competitor1: 3.2 },
  { date: '2024-10-04', myRoas: 4.2, industryAvg: 3.3, competitor1: 3.6 },
  { date: '2024-10-05', myRoas: 3.8, industryAvg: 3.2, competitor1: 3.5 },
  { date: '2024-10-06', myRoas: 4.5, industryAvg: 3.4, competitor1: 3.7 },
  { date: '2024-10-07', myRoas: 4.1, industryAvg: 3.3, competitor1: 3.6 },
];

// Creative Angles data
export interface CreativeAngle {
  id: string;
  name: string;
  ctr: number;
  conversionRate: number;
  cpa: number;
  engagement: number;
  spend: number;
  revenue: number;
  roas: number;
  objective: 'alcance' | 'tráfico' | 'ventas';
}

export const creativeAngles: CreativeAngle[] = [
  {
    id: 'ANG-001',
    name: 'Viaje Sostenible',
    ctr: 2.8,
    conversionRate: 4.2,
    cpa: 24.5,
    engagement: 8.5,
    spend: 2200,
    revenue: 9680,
    roas: 4.4,
    objective: 'ventas'
  },
  {
    id: 'ANG-002',
    name: 'Escape Digital',
    ctr: 3.1,
    conversionRate: 3.8,
    cpa: 26.0,
    engagement: 7.2,
    spend: 1900,
    revenue: 7600,
    roas: 4.0,
    objective: 'tráfico'
  },
  {
    id: 'ANG-003',
    name: 'Romántico',
    ctr: 2.5,
    conversionRate: 5.1,
    cpa: 22.0,
    engagement: 9.8,
    spend: 2400,
    revenue: 10800,
    roas: 4.5,
    objective: 'ventas'
  },
  {
    id: 'ANG-004',
    name: 'Aventura Económica',
    ctr: 2.9,
    conversionRate: 3.5,
    cpa: 28.5,
    engagement: 6.8,
    spend: 1600,
    revenue: 5760,
    roas: 3.6,
    objective: 'alcance'
  },
  {
    id: 'ANG-005',
    name: 'Familiar Premium',
    ctr: 2.2,
    conversionRate: 4.8,
    cpa: 25.5,
    engagement: 7.9,
    spend: 2100,
    revenue: 8820,
    roas: 4.2,
    objective: 'ventas'
  },
  {
    id: 'ANG-006',
    name: 'Experiencia Local',
    ctr: 3.4,
    conversionRate: 3.2,
    cpa: 30.0,
    engagement: 8.9,
    spend: 1500,
    revenue: 5250,
    roas: 3.5,
    objective: 'tráfico'
  }
];

export interface AngleTrend {
  date: string;
  sostenible: number;
  romantico: number;
  aventura: number;
  familiar: number;
}

export const angleTrends: AngleTrend[] = [
  { date: '2024-10-01', sostenible: 4.1, romantico: 4.2, aventura: 3.2, familiar: 3.8 },
  { date: '2024-10-02', sostenible: 4.3, romantico: 4.4, aventura: 3.5, familiar: 4.0 },
  { date: '2024-10-03', sostenible: 4.2, romantico: 4.3, aventura: 3.4, familiar: 3.9 },
  { date: '2024-10-04', sostenible: 4.5, romantico: 4.6, aventura: 3.7, familiar: 4.3 },
  { date: '2024-10-05', sostenible: 4.4, romantico: 4.5, aventura: 3.6, familiar: 4.2 },
  { date: '2024-10-06', sostenible: 4.6, romantico: 4.7, aventura: 3.8, familiar: 4.4 },
  { date: '2024-10-07', sostenible: 4.4, romantico: 4.5, aventura: 3.6, familiar: 4.2 },
];

// Traveler Archetypes data
export interface TravelerArchetype {
  id: string;
  name: string;
  description: string;
  avgAge: string;
  topCountries: string[];
  preferredDevice: string;
  avgSpend: number;
  conversionRate: number;
  totalReach: number;
}

export const travelerArchetypes: TravelerArchetype[] = [
  {
    id: 'ARCH-001',
    name: 'Explorador',
    description: 'Busca experiencias únicas y destinos poco comunes',
    avgAge: '25-35',
    topCountries: ['España', 'México', 'Argentina'],
    preferredDevice: 'Mobile',
    avgSpend: 45.2,
    conversionRate: 4.5,
    totalReach: 85000
  },
  {
    id: 'ARCH-002',
    name: 'Relajado',
    description: 'Prioriza descanso y confort en destinos tranquilos',
    avgAge: '35-50',
    topCountries: ['España', 'Colombia', 'Chile'],
    preferredDevice: 'Desktop',
    avgSpend: 52.8,
    conversionRate: 5.2,
    totalReach: 72000
  },
  {
    id: 'ARCH-003',
    name: 'Familiar',
    description: 'Viaja con familia, busca seguridad y actividades para niños',
    avgAge: '30-45',
    topCountries: ['México', 'España', 'Perú'],
    preferredDevice: 'Mobile',
    avgSpend: 68.5,
    conversionRate: 5.8,
    totalReach: 95000
  },
  {
    id: 'ARCH-004',
    name: 'Romántico',
    description: 'Busca escapadas en pareja y experiencias íntimas',
    avgAge: '25-40',
    topCountries: ['España', 'Argentina', 'Colombia'],
    preferredDevice: 'Mobile',
    avgSpend: 58.3,
    conversionRate: 6.2,
    totalReach: 68000
  },
  {
    id: 'ARCH-005',
    name: 'Negocios',
    description: 'Viajes corporativos y eventos profesionales',
    avgAge: '30-55',
    topCountries: ['España', 'México', 'Chile'],
    preferredDevice: 'Desktop',
    avgSpend: 42.1,
    conversionRate: 3.8,
    totalReach: 45000
  }
];

// Archetype + Angle Matrix
export interface ArchetypeAngleCombo {
  archetypeId: string;
  archetypeName: string;
  angleName: string;
  roas: number;
  ctr: number;
  conversionRate: number;
  spend: number;
  performance: 'excelente' | 'bueno' | 'regular' | 'bajo';
}

export const archetypeAngleMatrix: ArchetypeAngleCombo[] = [
  // Explorador
  { archetypeId: 'ARCH-001', archetypeName: 'Explorador', angleName: 'Viaje Sostenible', roas: 5.2, ctr: 3.8, conversionRate: 5.5, spend: 850, performance: 'excelente' },
  { archetypeId: 'ARCH-001', archetypeName: 'Explorador', angleName: 'Aventura Económica', roas: 4.8, ctr: 3.5, conversionRate: 4.9, spend: 720, performance: 'excelente' },
  { archetypeId: 'ARCH-001', archetypeName: 'Explorador', angleName: 'Experiencia Local', roas: 4.5, ctr: 4.2, conversionRate: 4.2, spend: 680, performance: 'bueno' },
  { archetypeId: 'ARCH-001', archetypeName: 'Explorador', angleName: 'Romántico', roas: 3.2, ctr: 2.1, conversionRate: 3.5, spend: 420, performance: 'regular' },
  
  // Relajado
  { archetypeId: 'ARCH-002', archetypeName: 'Relajado', angleName: 'Escape Digital', roas: 5.5, ctr: 3.2, conversionRate: 6.1, spend: 920, performance: 'excelente' },
  { archetypeId: 'ARCH-002', archetypeName: 'Relajado', angleName: 'Romántico', roas: 4.9, ctr: 2.8, conversionRate: 5.8, spend: 780, performance: 'excelente' },
  { archetypeId: 'ARCH-002', archetypeName: 'Relajado', angleName: 'Experiencia Local', roas: 3.8, ctr: 2.5, conversionRate: 4.2, spend: 550, performance: 'bueno' },
  
  // Familiar
  { archetypeId: 'ARCH-003', archetypeName: 'Familiar', angleName: 'Familiar Premium', roas: 5.8, ctr: 3.0, conversionRate: 6.5, spend: 1150, performance: 'excelente' },
  { archetypeId: 'ARCH-003', archetypeName: 'Familiar', angleName: 'Aventura Económica', roas: 4.2, ctr: 2.7, conversionRate: 4.8, spend: 820, performance: 'bueno' },
  { archetypeId: 'ARCH-003', archetypeName: 'Familiar', angleName: 'Viaje Sostenible', roas: 4.0, ctr: 2.5, conversionRate: 4.5, spend: 690, performance: 'bueno' },
  
  // Romántico
  { archetypeId: 'ARCH-004', archetypeName: 'Romántico', angleName: 'Romántico', roas: 6.2, ctr: 3.5, conversionRate: 7.2, spend: 1050, performance: 'excelente' },
  { archetypeId: 'ARCH-004', archetypeName: 'Romántico', angleName: 'Escape Digital', roas: 5.1, ctr: 3.1, conversionRate: 5.8, spend: 880, performance: 'excelente' },
  { archetypeId: 'ARCH-004', archetypeName: 'Romántico', angleName: 'Experiencia Local', roas: 4.3, ctr: 2.9, conversionRate: 4.9, spend: 720, performance: 'bueno' },
  
  // Negocios
  { archetypeId: 'ARCH-005', archetypeName: 'Negocios', angleName: 'Experiencia Local', roas: 3.9, ctr: 2.2, conversionRate: 4.1, spend: 580, performance: 'bueno' },
  { archetypeId: 'ARCH-005', archetypeName: 'Negocios', angleName: 'Viaje Sostenible', roas: 3.5, ctr: 2.0, conversionRate: 3.8, spend: 490, performance: 'regular' },
];
