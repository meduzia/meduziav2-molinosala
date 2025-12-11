"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle, Sparkles, RefreshCw, Save, X, Check, Loader2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface UGCTemplate {
  id: string;
  name: string;
  description: string;
  hooks: string[];
  category: string;
}

const UGC_TEMPLATES: UGCTemplate[] = [
  {
    id: "problem-solution",
    name: "Problem → Solution",
    description: "Muestra un problema y la solución con tu producto",
    hooks: [
      "¿Cansado de [problema]?",
      "La mayoría de [público] sufre de [problema]",
      "Nadie te dice cómo evitar [problema]",
      "Te apuesto que [problema]",
    ],
    category: "evergreen",
  },
  {
    id: "scarcity-urgency",
    name: "Scarcity & Urgency",
    description: "Crea FOMO usando escasez y urgencia",
    hooks: [
      "Quedan solo [X] en stock",
      "Última oportunidad de [oferta]",
      "Se acaba hoy: [descuento]%",
      "Solo para los primeros [X]",
    ],
    category: "limited-time",
  },
  {
    id: "social-proof",
    name: "Social Proof",
    description: "Leverage testimonios y credibilidad",
    hooks: [
      "[X] personas compran esto cada día",
      "Certificado por [autoridad]",
      "[X] clientes satisfechos ⭐⭐⭐⭐⭐",
      "Se vende más rápido que nunca",
    ],
    category: "trust",
  },
  {
    id: "curiosity-gap",
    name: "Curiosity Gap",
    description: "Genera curiosidad que obliga a clickear",
    hooks: [
      "Esto NO funcionará para ti... a menos que...",
      "La verdad sobre [tema] que nadie cuenta",
      "Este truco cambió todo",
      "Descubrí algo que no debería",
    ],
    category: "engagement",
  },
  {
    id: "before-after",
    name: "Before & After",
    description: "Transformación visual",
    hooks: [
      "Antes vs Después",
      "Así cambió mi vida",
      "De [state] a [state] en [time]",
      "La transformación que nadie se esperaba",
    ],
    category: "transformation",
  },
  {
    id: "contrary-statement",
    name: "Contrary Statement",
    description: "Contradice la creencia común",
    hooks: [
      "TODO lo que sabías sobre [tema] está mal",
      "Los expertos NO quieren que sepas esto",
      "[Industria] oculta este secreto",
      "Están mintiendo sobre [producto]",
    ],
    category: "contrarian",
  },
];

const UGC_FORMATS = [
  { id: "testimonial", label: "Testimonial (30-60s)" },
  { id: "demo", label: "Product Demo (15-30s)" },
  { id: "skit", label: "Funny Skit (15-60s)" },
  { id: "comparison", label: "Comparison (30-60s)" },
  { id: "unboxing", label: "Unboxing (20-45s)" },
  { id: "lifestyle", label: "Lifestyle (15-60s)" },
];

const PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram-reels", label: "Instagram Reels" },
  { id: "youtube-shorts", label: "YouTube Shorts" },
  { id: "facebook", label: "Facebook" },
];

interface GeneratedUGC {
  id: string;
  title: string;
  hook: string;
  format: string;
  platform: string;
  scriptOutline: string;
  visualNotes: string;
  voiceoverScript: string;
  createdAt: Date;
}

export default function UGCGeneratorPage() {
  const [creativeTitle, setCreativeTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [customHook, setCustomHook] = useState("");
  const [useCustomHook, setUseCustomHook] = useState(false);
  const [generatedUGC, setGeneratedUGC] = useState<GeneratedUGC | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const selectedTemplateData = UGC_TEMPLATES.find((t) => t.id === selectedTemplate);

  const handleGenerate = async () => {
    if (!creativeTitle || !selectedTemplate || !selectedFormat || !selectedPlatform) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const hook = useCustomHook ? customHook : selectedTemplateData?.hooks[0] || "";

      // Simulated generation - in production this would call an AI API
      const newUGC: GeneratedUGC = {
        id: `ugc-${Date.now()}`,
        title: creativeTitle,
        hook,
        format: selectedFormat,
        platform: selectedPlatform,
        scriptOutline: `
# Script Outline: ${creativeTitle}

## Hook (0-3 segundos)
${hook}

## Problem/Setup (3-10 segundos)
[Mostrar el problema o contexto que resuelve tu producto]
- Escena introductoria
- Presentar el pain point
- Crear empatía con la audiencia

## Solution/Product (10-20 segundos)
[Demostración del producto en acción]
- Cómo tu producto resuelve el problema
- Beneficios principales
- Calls to action visual

## Results/Transformation (20-30+ segundos)
[Resultado final]
- Transformación o resultado
- Testimonial personal
- Call to action final

## Visual Notes
- Lighting: Natural/Bright
- Camera Movement: Dynamic (zoom-in on product)
- Music: Trending sound for ${selectedPlatform}
- Transition: Quick cuts for engagement
        `,
        visualNotes: `
# Visual Direction for ${selectedFormat}

## Setting & Lighting
- Usa luz natural o ring light
- Background limpio pero con carácter (no blanco puro)
- Asegúrate que el producto sea visible

## Camera & Movement
- Comienza con hook directo a cámara
- Usa zoom-in en momentos clave
- Mantén movimiento constante pero no distraído
- Close-ups del producto

## Editing Style
- Transiciones rápidas (máx 200-300ms)
- Efectos sutiles (no overwhelming)
- Trending sounds para ${selectedPlatform}
- Text overlays para claridad

## Color Grade
- Warm & inviting
- High saturation para el producto
- Consistent with brand colors
        `,
        voiceoverScript: `
[NARRACIÓN OPCIONAL - Si necesitas VO]

0-2s: "${hook}"

2-8s: "La mayoría de gente [sufre del problema]. Pero aquí está lo que cambia todo..."

8-15s: "Conoce [Product Name]. Fue diseñado específicamente para..."

15-25s: "[Specific benefit]. Y en solo [timeframe], verás resultados como..."

25-30s: "No dejes pasar esta oportunidad. [CTA]. Link en bio."

[NOTAS DE PRONUNCIACIÓN]
- Habla con naturalidad, no como un robot
- Pausa ligeramente después de punchlines
- Enfatiza las palabras clave
- Energía consistente durante todo el script
        `,
        createdAt: new Date(),
      };

      setGeneratedUGC(newUGC);
      toast({
        title: "¡Éxito!",
        description: "Tu script UGC ha sido generado",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      toast({
        title: "Error",
        description: "No se pudo generar el script",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsCreative = async () => {
    if (!generatedUGC) return;

    try {
      // Aquí guardarías el UGC como un creative en la base de datos
      toast({
        title: "¡Guardado!",
        description: "Script guardado. Puedes verlo en tu librería de creativos.",
      });

      // Reset form
      setCreativeTitle("");
      setSelectedTemplate("");
      setSelectedFormat("");
      setSelectedPlatform("");
      setAdditionalNotes("");
      setCustomHook("");
      setUseCustomHook(false);
      setGeneratedUGC(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo guardar el script",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(168,85,247,0.15),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-gradient-primary">
                UGC Script Generator
              </h1>
            </div>
            <p className="text-foreground-muted/80">
              Genera scripts de User Generated Content virales basados en templates probados
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuración */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Básica */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                <CardDescription>Detalles principales del anuncio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-200 block mb-2">
                    Título del Creative
                  </label>
                  <Input
                    value={creativeTitle}
                    onChange={(e) => setCreativeTitle(e.target.value)}
                    placeholder="ej: Testimonial - Transformación de 30 días"
                    className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-200 block mb-2">
                      Formato
                    </label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                        <SelectValue placeholder="Selecciona formato" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {UGC_FORMATS.map((fmt) => (
                          <SelectItem key={fmt.id} value={fmt.id} className="text-slate-100">
                            {fmt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-200 block mb-2">
                      Plataforma
                    </label>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                        <SelectValue placeholder="Selecciona plataforma" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {PLATFORMS.map((plat) => (
                          <SelectItem key={plat.id} value={plat.id} className="text-slate-100">
                            {plat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200 block mb-2">
                    Notas Adicionales
                  </label>
                  <Textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="ej: Incluye beneficio X, evita Y, enfatiza Z..."
                    className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 h-20"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seleccionar Template */}
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Template de Hook</CardTitle>
                <CardDescription>Elige un template probado o crea uno personalizado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {UGC_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-100">{template.name}</h4>
                          <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                          {selectedTemplate === template.id && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-slate-300 font-medium">Hooks disponibles:</p>
                              <ul className="space-y-1">
                                {template.hooks.map((hook, idx) => (
                                  <li
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCustomHook(hook);
                                      setUseCustomHook(true);
                                    }}
                                    className="text-xs text-purple-300 hover:text-purple-200 cursor-pointer hover:underline"
                                  >
                                    • {hook}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {selectedTemplate === template.id && (
                          <Check className="h-5 w-5 text-purple-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Hook Option */}
                <div className="pt-4 border-t border-slate-700">
                  <label className="flex items-center gap-2 text-sm text-slate-200 mb-2">
                    <input
                      type="checkbox"
                      checked={useCustomHook}
                      onChange={(e) => setUseCustomHook(e.target.checked)}
                      className="rounded"
                    />
                    Usar hook personalizado
                  </label>
                  {useCustomHook && (
                    <Input
                      value={customHook}
                      onChange={(e) => setCustomHook(e.target.value)}
                      placeholder="Escribe tu hook personalizado..."
                      className="bg-slate-700/50 border-slate-600 text-slate-100"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !selectedTemplate || !selectedFormat || !selectedPlatform || !creativeTitle}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-12 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generando script...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generar Script UGC
                </>
              )}
            </Button>
          </div>

          {/* Preview / Output */}
          <div className="lg:col-span-1">
            {generatedUGC ? (
              <div className="space-y-4">
                {/* Script Output */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-400" />
                      Script Generado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                          Título
                        </p>
                        <p className="text-slate-100 font-semibold">{generatedUGC.title}</p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Hook</p>
                        <p className="text-purple-300 italic">"{generatedUGC.hook}"</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Formato</p>
                          <p className="text-xs bg-slate-700/50 px-2 py-1 rounded text-slate-200">
                            {UGC_FORMATS.find((f) => f.id === generatedUGC.format)?.label}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Plataforma</p>
                          <p className="text-xs bg-slate-700/50 px-2 py-1 rounded text-slate-200">
                            {PLATFORMS.find((p) => p.id === generatedUGC.platform)?.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Script Outline */}
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm max-h-96 overflow-y-auto">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Script Outline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words font-mono">
                      {generatedUGC.scriptOutline}
                    </pre>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={handleSaveAsCreative}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar como Creative
                  </Button>
                  <Button
                    onClick={() => {
                      setGeneratedUGC(null);
                      setCreativeTitle("");
                      setSelectedTemplate("");
                      setSelectedFormat("");
                      setSelectedPlatform("");
                      setAdditionalNotes("");
                    }}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generar Otro
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm h-full flex items-center justify-center">
                <CardContent className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-slate-500 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-400">
                    Genera un script para ver el resultado aquí
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8">
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200/80">
              Los scripts UGC funcionan mejor cuando son auténticos y naturales. Usa estos templates como base, pero personaliza según tu audiencia y producto.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
