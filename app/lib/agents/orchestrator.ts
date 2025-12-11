/**
 * Campaign Orchestrator
 *
 * Coordina la ejecución de todos los agentes en orden:
 * 1. Research Agent
 * 2. Angles Agent
 * 3. Scriptwriter Agent (opcional)
 * 4. Variations Agent (opcional, para top performers)
 */

import { v4 as uuidv4 } from 'uuid'
import { executeResearchAgent } from './research-agent'
import { executeAnglesAgent } from './angles-agent'
import { executeScriptwriterAgent } from './scriptwriter-agent'
import { executeImageGeneratorAgent } from './image-generator-agent'
import { executeVariationsAgent } from './variations-agent'
import type {
  Campaign,
  CampaignInput,
  CampaignOrchestrationFlow,
  ResearchOutput,
  AnglesOutput,
  CreativeAngle,
  VideoPrompt,
  ImagePrompt,
} from './types'

export interface OrchestrationOptions {
  executeResearch?: boolean
  executeAngles?: boolean
  executeScriptwriting?: boolean
  executeImageGeneration?: boolean
  executeVariations?: boolean
  numVariationsPerPrompt?: number
}

export class CampaignOrchestrator {
  private campaign: Campaign
  public onFlowComplete?: (flow: CampaignOrchestrationFlow) => Promise<void>

  constructor(input: CampaignInput) {
    this.campaign = {
      id: input.id || uuidv4(),
      input,
      flows: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  /**
   * Ejecutar el flujo completo de la campaña
   */
  async executeFull(options: OrchestrationOptions = {}): Promise<Campaign> {
    const {
      executeResearch = true,
      executeAngles = true,
      executeScriptwriting = false,
      executeImageGeneration = false,
      executeVariations = false,
      numVariationsPerPrompt = 3,
    } = options

    console.log(`[Orchestrator] Starting campaign execution: ${this.campaign.id}`)

    this.campaign.status = 'in_progress'
    this.campaign.updatedAt = new Date()

    try {
      // Step 1: Research
      if (executeResearch) {
        await this.executeResearchStep()
      }

      // Step 2: Angles
      if (executeAngles && this.campaign.research) {
        await this.executeAnglesStep()
      }

      // Step 3: Scriptwriting
      if (executeScriptwriting && this.campaign.angles) {
        await this.executeScriptwritingStep()
      }

      // Step 4: Image Generation
      if (executeImageGeneration && this.campaign.angles) {
        await this.executeImageGenerationStep()
      }

      // Step 5: Variations
      if (executeVariations && this.campaign.prompts) {
        await this.executeVariationsStep(numVariationsPerPrompt)
      }

      this.campaign.status = 'completed'
      console.log(`[Orchestrator] Campaign ${this.campaign.id} completed`)
    } catch (error) {
      this.campaign.status = 'failed'
      console.error(`❌ [Orchestrator] Campaign execution failed:`, error)
    }

    this.campaign.updatedAt = new Date()
    return this.campaign
  }

  /**
   * Ejecutar solo Research
   */
  async executeResearchOnly(): Promise<Campaign> {
    return this.executeFull({
      executeResearch: true,
      executeAngles: false,
      executeScriptwriting: false,
      executeVariations: false,
    })
  }

  /**
   * Ejecutar Research + Angles
   */
  async executeResearchAndAngles(): Promise<Campaign> {
    return this.executeFull({
      executeResearch: true,
      executeAngles: true,
      executeScriptwriting: false,
      executeVariations: false,
    })
  }

  /**
   * Ejecutar todo incluyendo generación de prompts
   */
  async executeAll(): Promise<Campaign> {
    return this.executeFull({
      executeResearch: true,
      executeAngles: true,
      executeScriptwriting: true,
      executeVariations: false,
    })
  }

  /**
   * Ejecutar con todo incluyendo variaciones
   */
  async executeWithVariations(numVariations: number = 3): Promise<Campaign> {
    return this.executeFull({
      executeResearch: true,
      executeAngles: true,
      executeScriptwriting: true,
      executeVariations: true,
      numVariationsPerPrompt: numVariations,
    })
  }

  private async executeResearchStep(): Promise<void> {
    const flow: CampaignOrchestrationFlow = {
      step: 'research',
      status: 'running',
      input: this.campaign.input,
      startedAt: new Date(),
    }

    this.campaign.flows.push(flow)

    try {
      const result = await executeResearchAgent(this.campaign.input)

      if (result.success && result.output) {
        this.campaign.research = result.output as ResearchOutput
        flow.status = 'completed'
        flow.output = result.output
      } else {
        flow.status = 'failed'
        flow.error = result.error || 'Unknown error'
      }
    } catch (error) {
      flow.status = 'failed'
      flow.error = error instanceof Error ? error.message : String(error)
    }

    flow.completedAt = new Date()

    // Persist to DB if callback provided
    if (this.onFlowComplete) {
      await this.onFlowComplete(flow)
    }
  }

  private async executeAnglesStep(): Promise<void> {
    if (!this.campaign.research) {
      throw new Error('Research output required for Angles step')
    }

    const flow: CampaignOrchestrationFlow = {
      step: 'angles',
      status: 'running',
      input: {
        campaign_input: this.campaign.input,
        research: this.campaign.research,
      },
      startedAt: new Date(),
    }

    this.campaign.flows.push(flow)

    try {
      const result = await executeAnglesAgent(
        this.campaign.input,
        this.campaign.research
      )

      if (result.success && result.output) {
        this.campaign.angles = result.output as AnglesOutput
        flow.status = 'completed'
        flow.output = result.output
      } else {
        flow.status = 'failed'
        flow.error = result.error || 'Unknown error'
      }
    } catch (error) {
      flow.status = 'failed'
      flow.error = error instanceof Error ? error.message : String(error)
    }

    flow.completedAt = new Date()

    // Persist to DB if callback provided
    if (this.onFlowComplete) {
      await this.onFlowComplete(flow)
    }
  }

  private async executeScriptwritingStep(): Promise<void> {
    if (!this.campaign.research || !this.campaign.angles) {
      throw new Error(
        'Research and Angles output required for Scriptwriting step'
      )
    }

    const flow: CampaignOrchestrationFlow = {
      step: 'scriptwriting',
      status: 'running',
      input: {
        campaign_input: this.campaign.input,
        research: this.campaign.research,
        angles: this.campaign.angles,
      },
      startedAt: new Date(),
    }

    this.campaign.flows.push(flow)

    try {
      // Process angles in batches to avoid too many requests
      const angles = this.campaign.angles.angles

      const result = await executeScriptwriterAgent(
        this.campaign.input,
        this.campaign.research,
        angles
      )

      if (result.success && result.output) {
        this.campaign.prompts = result.output.prompts
        flow.status = 'completed'
        flow.output = result.output
      } else {
        flow.status = 'failed'
        flow.error = result.error || 'Unknown error'
      }
    } catch (error) {
      flow.status = 'failed'
      flow.error = error instanceof Error ? error.message : String(error)
    }

    flow.completedAt = new Date()

    // Persist to DB if callback provided
    if (this.onFlowComplete) {
      await this.onFlowComplete(flow)
    }
  }

  private async executeImageGenerationStep(): Promise<void> {
    if (!this.campaign.research || !this.campaign.angles) {
      throw new Error(
        'Research and Angles output required for Image Generation step'
      )
    }

    const flow: CampaignOrchestrationFlow = {
      step: 'image_generation',
      status: 'running',
      input: {
        campaign_input: this.campaign.input,
        research: this.campaign.research,
        angles: this.campaign.angles,
      },
      startedAt: new Date(),
    }

    this.campaign.flows.push(flow)

    try {
      const angles = this.campaign.angles.angles

      const result = await executeImageGeneratorAgent(
        this.campaign.input,
        this.campaign.research,
        angles
      )

      if (result.success && result.output) {
        this.campaign.image_prompts = result.output.prompts
        flow.status = 'completed'
        flow.output = result.output
      } else {
        flow.status = 'failed'
        flow.error = result.error || 'Unknown error'
      }
    } catch (error) {
      flow.status = 'failed'
      flow.error = error instanceof Error ? error.message : String(error)
    }

    flow.completedAt = new Date()

    // Persist to DB if callback provided
    if (this.onFlowComplete) {
      await this.onFlowComplete(flow)
    }
  }

  private async executeVariationsStep(
    numVariationsPerPrompt: number
  ): Promise<void> {
    if (!this.campaign.prompts || this.campaign.prompts.length === 0) {
      throw new Error('Prompts required for Variations step')
    }

    const flow: CampaignOrchestrationFlow = {
      step: 'variations',
      status: 'running',
      input: {
        prompts: this.campaign.prompts,
        num_variations: numVariationsPerPrompt,
      },
      startedAt: new Date(),
    }

    this.campaign.flows.push(flow)

    try {
      // Select top prompts (e.g., all for now, but could filter by performance)
      const topPrompts = this.campaign.prompts.slice(0, 10)

      const result = await executeVariationsAgent(
        topPrompts,
        numVariationsPerPrompt
      )

      if (result.success && result.output) {
        this.campaign.variations = result.output.variations
        flow.status = 'completed'
        flow.output = result.output
      } else {
        flow.status = 'failed'
        flow.error = result.error || 'Unknown error'
      }
    } catch (error) {
      flow.status = 'failed'
      flow.error = error instanceof Error ? error.message : String(error)
    }

    flow.completedAt = new Date()

    // Persist to DB if callback provided
    if (this.onFlowComplete) {
      await this.onFlowComplete(flow)
    }
  }

  /**
   * Obtener el estado actual de la campaña
   */
  getCampaign(): Campaign {
    return this.campaign
  }

  /**
   * Obtener resumen de la campaña
   */
  getSummary(): {
    campaignId: string
    status: string
    completedSteps: number
    totalSteps: number
    research?: { painPoints: number; benefits: number }
    angles?: { total: number }
    prompts?: { total: number }
    variations?: { total: number }
  } {
    return {
      campaignId: this.campaign.id,
      status: this.campaign.status,
      completedSteps: this.campaign.flows.filter((f) => f.status === 'completed')
        .length,
      totalSteps: this.campaign.flows.length,
      research: this.campaign.research
        ? {
            painPoints: this.campaign.research.pain_points?.length || 0,
            benefits: this.campaign.research.benefits?.length || 0,
          }
        : undefined,
      angles: this.campaign.angles
        ? { total: this.campaign.angles.angles?.length || 0 }
        : undefined,
      prompts: this.campaign.prompts
        ? { total: this.campaign.prompts.length }
        : undefined,
      variations: this.campaign.variations
        ? { total: this.campaign.variations.length }
        : undefined,
    }
  }
}

/**
 * Helper para crear y ejecutar una campaña en una línea
 */
export async function createAndExecuteCampaign(
  input: CampaignInput,
  options?: OrchestrationOptions
): Promise<Campaign> {
  const orchestrator = new CampaignOrchestrator(input)
  return orchestrator.executeFull(options)
}
