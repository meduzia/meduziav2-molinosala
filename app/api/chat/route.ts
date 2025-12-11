import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Recopilemos contexto del dashboard y Meta
    let dashboardContext = ''

    try {
      // Obtener datos de Meta (campañas de publicidad activas)
      const today = new Date()
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      const metaRes = await fetch(
        `/api/meta/campaigns?days=7`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (metaRes.ok) {
        const metaData = await metaRes.json()
        if (metaData.campaigns && metaData.campaigns.length > 0) {
          dashboardContext += '\n## Campañas Activas en Meta:\n'
          metaData.campaigns.slice(0, 5).forEach((campaign: any) => {
            dashboardContext += `- ${campaign.name}: Spend $${(campaign.spend || 0).toFixed(2)}, Status: ${campaign.status}\n`
          })
        }
      }

      // Obtener KPIs principales del dashboard
      const kpisRes = await fetch(
        `/api/kpis?from=${sevenDaysAgo.toISOString()}&to=${today.toISOString()}`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (kpisRes.ok) {
        const kpis = await kpisRes.json()
        if (kpis.kpis) {
          dashboardContext += '\n## KPIs Principales (Últimos 7 días):\n'
          if (kpis.kpis.totalSpend) dashboardContext += `- Spend Total: $${kpis.kpis.totalSpend.toFixed(2)}\n`
          if (kpis.kpis.totalRevenue) dashboardContext += `- Revenue Total: $${kpis.kpis.totalRevenue.toFixed(2)}\n`
          if (kpis.kpis.avgCPA) dashboardContext += `- CPA Promedio: $${kpis.kpis.avgCPA.toFixed(2)}\n`
          if (kpis.kpis.roas) dashboardContext += `- ROAS: ${kpis.kpis.roas.toFixed(2)}x\n`
          if (kpis.kpis.totalConversions) dashboardContext += `- Conversiones: ${kpis.kpis.totalConversions}\n`
        }
      }

      // Obtener alertas activas
      const alertsRes = await fetch(
        `/api/alerts?from=${sevenDaysAgo.toISOString()}&to=${today.toISOString()}`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (alertsRes.ok) {
        const alerts = await alertsRes.json()
        if (alerts.alerts && alerts.alerts.length > 0) {
          dashboardContext += `\n## Alertas Activas (${alerts.alerts.length}):\n`
          alerts.alerts.slice(0, 3).forEach((alert: any) => {
            dashboardContext += `- ${alert.adName}: CPA $${alert.cpa?.toFixed(2) || 'N/A'} ⚠️\n`
          })
        }
      }

      // Obtener top performers
      const topRes = await fetch(
        `/api/top?from=${sevenDaysAgo.toISOString()}&to=${today.toISOString()}`,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (topRes.ok) {
        const topData = await topRes.json()
        if (topData.topAds && topData.topAds.length > 0) {
          dashboardContext += `\n## Top Anuncios por Performance:\n`
          topData.topAds.slice(0, 3).forEach((ad: any) => {
            dashboardContext += `- ${ad.adName}: ROAS ${ad.roas?.toFixed(2) || 'N/A'}x, CPA $${ad.cpa?.toFixed(2) || 'N/A'}\n`
          })
        }
      }
    } catch (error) {
      console.warn('Error fetching dashboard context:', error)
    }

    // Sistema de prompt con contexto
    const systemPrompt = `Eres un asistente experto en marketing digital y publicidad en Meta (Facebook/Instagram).
Tu rol es ayudar al usuario a entender su dashboard de RetrofishAI y analizar sus campañas de Meta.

Responde preguntas sobre:
- Campañas activas en Meta y su rendimiento
- Métricas clave: Spend, Revenue, ROAS, CPA, Conversiones
- Anuncios que funcionan mejor (Top Performers)
- Alertas y problemas con CPA alto
- Tendencias de rendimiento
- Recomendaciones para optimizar

Contexto actual del dashboard (últimos 7 días):
${dashboardContext || 'Cargando datos...'}

Instrucciones:
1. Sé conciso y específico con los números
2. Identifica oportunidades de optimización basado en los datos
3. Alerta sobre problemas (CPA alto, ROAS bajo, etc.)
4. Proporciona recomendaciones accionables
5. Si falta información, sugiere dónde encontrarla en el dashboard`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const assistantMessage =
      response.choices[0]?.message?.content ||
      'No se pudo obtener una respuesta del asistente.'

    return NextResponse.json({
      success: true,
      response: assistantMessage,
    })
  } catch (error) {
    console.error('Chat API error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error en el servidor del chat',
      },
      { status: 500 }
    )
  }
}
