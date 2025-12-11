/**
 * NUEVA ARQUITECTURA DE AGENTES V2
 *
 * Exporta todos los agentes y servicios del nuevo sistema
 */

// Agentes
export { executeStrategistAgent } from './strategist-agent'
export { executeAnglesAgent, executeAnglesAgentBatch } from './angles-agent'
export { executePromptsAgent, executePromptsAgentBatch } from './prompts-agent'

// Servicio de producción
export {
  generateImageWithNanoBanana,
  generateVideoWithSoraPro,
  checkNanoBananaTaskStatus,
  checkSoraProTaskStatus,
  produceContent,
  checkAllTasksStatus,
  createOutputFromTask,
} from './production-service'

// Re-export types
export type { AnglesGenerationResult } from './angles-agent'
export type { PromptGenerationInput } from './prompts-agent'
export type { ProductionResult } from './production-service'
