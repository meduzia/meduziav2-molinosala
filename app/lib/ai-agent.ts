import { getScraperData } from "@/lib/scrapers";
import type { ScraperItem } from "@/data/scrapers";

/**
 * Función para consultar al agente de IA
 *
 * Conecta con OpenAI (gpt-3.5-turbo) para generar respuestas inteligentes
 * basadas en el contexto actual del dashboard.
 *
 * @param query - Pregunta del usuario
 * @returns Promise con la respuesta del agente
 */
export async function askAgent(query: string): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: query }),
    })

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.response || 'No se pudo obtener una respuesta'
  } catch (error) {
    console.error('Error calling chat API:', error)
    // Fallback a respuestas predefinidas si OpenAI falla
    return await getFallbackResponse(query)
  }
}

/**
 * Respuestas predefinidas como fallback si OpenAI no está disponible
 */
async function getFallbackResponse(query: string): Promise<string> {
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));

  const lowerQuery = query.toLowerCase();

  // Buscar en scrapers si la pregunta menciona categorías específicas
  const scraperKeywords = ["competencia", "competidor", "competidores", "noticia", "noticias", "tendencia", "tendencias"];
  const hasScraperKeyword = scraperKeywords.some(keyword => lowerQuery.includes(keyword));

  if (hasScraperKeyword) {
    const scraperData = await getScraperData();
    
    // Determinar categoría si se menciona específicamente
    let category: ScraperItem["category"] | null = null;
    if (lowerQuery.includes("competencia") || lowerQuery.includes("competidor")) {
      category = "competencia";
    } else if (lowerQuery.includes("noticia") || lowerQuery.includes("noticias")) {
      category = "noticias";
    } else if (lowerQuery.includes("tendencia") || lowerQuery.includes("tendencias")) {
      category = "tendencias";
    }

    // Filtrar por categoría si se especificó
    let filtered = scraperData;
    if (category) {
      filtered = scraperData.filter(item => item.category === category);
    }

    // Buscar términos específicos en títulos y resúmenes
    const searchTerms = lowerQuery.split(/\s+/).filter(term => 
      term.length > 3 && !scraperKeywords.includes(term)
    );
    
    if (searchTerms.length > 0) {
      const searchResults = filtered.filter(item => {
        const itemText = `${item.title} ${item.summary}`.toLowerCase();
        return searchTerms.some(term => itemText.includes(term));
      });
      
      if (searchResults.length > 0) {
        filtered = searchResults;
      }
    }

    // Limitar a los 3 más relevantes
    const relevant = filtered.slice(0, 3);

    if (relevant.length > 0) {
      let response = `He encontrado ${relevant.length} información relevante de los scrapers:\n\n`;
      
      relevant.forEach((item, index) => {
        const categoryEmoji = item.category === "noticias" ? "📰" : item.category === "competencia" ? "🎯" : "📈";
        const date = new Date(item.date).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
        
        response += `## ${index + 1}. ${categoryEmoji} ${item.title}\n\n`;
        response += `**Fuente:** ${item.source}  \n`;
        response += `**Fecha:** ${date}  \n\n`;
        response += `${item.summary}\n\n`;
        response += `---\n\n`;
      });

      if (filtered.length > relevant.length) {
        response += `\n*Hay ${filtered.length - relevant.length} artículo(s) más disponible(s) en la página de scrapers.*`;
      }

      return response;
    }

    // Si no hay resultados específicos pero se mencionó una categoría
    if (category) {
      const categoryName = category === "competencia" ? "competencia" : category === "noticias" ? "noticias" : "tendencias";
      return `He buscado información sobre **${categoryName}** en los scrapers, pero no encontré resultados específicos para tu pregunta.\n\nPuedes visitar la página [/scrapers](/scrapers) y filtrar por la categoría "${categoryName}" para ver toda la información disponible.`;
    }
  }

  // Respuestas sobre KPIs y métricas
  if (lowerQuery.includes("spend") || lowerQuery.includes("gasto") || lowerQuery.includes("inversión")) {
    return "El Ad Spend representa el total invertido en publicidad durante el período seleccionado. Puedes ver la tendencia en el gráfico 'Spend vs Revenue' y compararlo con el período anterior usando los indicadores de tendencia en las tarjetas de métricas.";
  }

  if (lowerQuery.includes("cpa") || lowerQuery.includes("costo")) {
    return "El CPA (Costo por Adquisición) muestra cuánto cuesta obtener una conversión. Un CPA alto (>$150) genera alertas. Puedes ver la evolución del CPA en el gráfico 'CPA Evolution' y revisar los anuncios con CPA alto en la sección 'Active Alerts'.";
  }

  if (lowerQuery.includes("póliza") || lowerQuery.includes("conversión") || lowerQuery.includes("venta")) {
    return "Las conversiones representan el número total de conversiones (leads o ventas) durante el período. Puedes ver la tendencia y compararla con el período anterior usando el indicador en la tarjeta de métricas.";
  }

  if (lowerQuery.includes("ctr") || lowerQuery.includes("clic")) {
    return "El CTR (Click-Through Rate) es el porcentaje de personas que hacen clic en tus anuncios después de verlos. Un CTR alto indica que tus creativos son relevantes para tu audiencia.";
  }

  if (lowerQuery.includes("roas") || lowerQuery.includes("retorno")) {
    return "El ROAS (Return on Ad Spend) muestra cuántos dólares de ingresos generas por cada dólar gastado. Puedes ver la evolución en el gráfico 'Evolución ROAS'. Un ROAS de 3.0 o superior es considerado bueno.";
  }

  // Respuestas sobre gráficos
  if (lowerQuery.includes("gráfico") || lowerQuery.includes("chart") || lowerQuery.includes("visualización")) {
    return "El dashboard incluye varios gráficos: 'Spend vs Revenue' muestra la relación entre gasto e ingresos, 'CPA Evolution' muestra la tendencia del costo por adquisición, y hay gráficos de destinos y formatos. Todos se actualizan según el rango de fechas seleccionado.";
  }

  // Respuestas sobre predicciones
  if (lowerQuery.includes("predicción") || lowerQuery.includes("proyección") || lowerQuery.includes("futuro")) {
    return "Las predicciones se basan en regresión lineal de los últimos 14 días. Puedes ver la proyección de gasto en 30 días, el uso del budget mensual, y la proyección de CPA en el card 'Predicciones de Gasto'. También puedes ver la proyección visual en el gráfico 'Spend vs Revenue'.";
  }

  // Respuestas sobre alertas
  if (lowerQuery.includes("alerta") || lowerQuery.includes("problema") || lowerQuery.includes("alto cpa")) {
    return "Las alertas muestran anuncios con CPA superior a $150. Puedes verlas en la sección 'Active Alerts' en la parte superior del dashboard. También verás un badge en el header con el número de alertas activas.";
  }

  // Respuestas sobre ángulos ganadores
  if (lowerQuery.includes("ángulo") || lowerQuery.includes("angle") || lowerQuery.includes("mejor")) {
    return "Los 'Ángulos Ganadores' muestran los mejores ángulos creativos ordenados por CPA (menor primero). El mejor ángulo tiene un badge '🏆 BEST' y fondo verde. Puedes ver métricas como número de anuncios, CPA promedio, conversiones totales y ROAS promedio.";
  }

  // Respuestas sobre scrapers
  if (lowerQuery.includes("scraper")) {
    return "Los scrapers monitorean noticias, competencia y tendencias del mercado. Puedes acceder a esta información en la página [/scrapers](/scrapers). Allí encontrarás tarjetas con información filtrable por categoría y un buscador para encontrar contenido específico.\n\nPregúntame específicamente sobre 'competencia', 'noticias' o 'tendencias' y te mostraré información relevante de los scrapers.";
  }

  // Respuestas sobre filtros de fecha
  if (lowerQuery.includes("fecha") || lowerQuery.includes("período") || lowerQuery.includes("rango") || lowerQuery.includes("filtro")) {
    return "Puedes cambiar el rango de fechas usando el selector en la parte superior del dashboard. Tienes presets como 'Últimos 7 días', 'Últimos 30 días', 'Este mes', o puedes seleccionar un rango personalizado. Todos los datos se actualizan automáticamente al cambiar el filtro.";
  }

  // Respuestas sobre top performers
  if (lowerQuery.includes("top") || lowerQuery.includes("mejor") || lowerQuery.includes("anuncio")) {
    return "La tabla 'Top anuncios por CPA' muestra los anuncios ordenados por CPA (más alto primero). Puedes ver el estado de cada anuncio con indicadores de color: 🔴 para CPA > $150, 🟡 para $100-$150, y 🟢 para CPA < $100.";
  }

  // Respuestas genéricas de ayuda
  if (lowerQuery.includes("ayuda") || lowerQuery.includes("help") || lowerQuery.includes("cómo")) {
    return "Puedo ayudarte a entender cualquier parte del dashboard. Pregúntame sobre métricas (CPA, ROAS, Spend), gráficos, predicciones, alertas, ángulos ganadores, o información de scrapers. También puedes preguntar cómo usar los filtros o interpretar los datos.";
  }

  // Respuestas sobre el dashboard en general
  if (lowerQuery.includes("dashboard") || lowerQuery.includes("panel")) {
    return "El dashboard muestra métricas clave de performance de publicidad, gráficos de tendencias, alertas de CPA alto, ángulos ganadores, y predicciones. Todo se actualiza según el rango de fechas seleccionado. También puedes acceder a información de scrapers en '/scrapers'.";
  }

  // Respuesta por defecto
  return "Puedo ayudarte a entender el dashboard y los scrapers. Pregúntame sobre métricas (CPA, ROAS, Spend, Conversiones, CTR), gráficos, predicciones, alertas, ángulos ganadores, o información de scrapers. ¿Sobre qué te gustaría saber más?";
}

