import { scraperData, type ScraperItem } from "@/data/scrapers";

/**
 * Obtiene datos de los scrapers
 * 
 * Por ahora devuelve datos mock. En el futuro, esta función puede ser reemplazada
 * para consumir datos reales de APIs de scrapers.
 * 
 * @returns Promise con array de items de scrapers
 */
export async function getScraperData(): Promise<ScraperItem[]> {
  // TODO: Reemplazar con llamada real a API de scrapers
  // Ejemplo futuro:
  // const response = await fetch('https://api.scrapers.com/data');
  // return await response.json();
  
  // Simular delay de red para hacer la función más realista
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  // Por ahora, devolver datos mock
  return scraperData;
}

/**
 * Obtiene datos de scrapers por categoría específica
 * 
 * @param category - Categoría a filtrar
 * @returns Promise con array de items filtrados por categoría
 */
export async function getScraperDataByCategory(
  category: ScraperItem["category"] | "todas"
): Promise<ScraperItem[]> {
  const data = await getScraperData();
  
  if (category === "todas") {
    return data;
  }
  
  return data.filter((item) => item.category === category);
}

/**
 * Busca en los datos de scrapers
 * 
 * @param query - Término de búsqueda
 * @returns Promise con array de items que coinciden con la búsqueda
 */
export async function searchScraperData(query: string): Promise<ScraperItem[]> {
  const data = await getScraperData();
  
  if (!query.trim()) {
    return data;
  }
  
  const searchTerm = query.toLowerCase();
  return data.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.summary.toLowerCase().includes(searchTerm) ||
      item.source.toLowerCase().includes(searchTerm)
  );
}

