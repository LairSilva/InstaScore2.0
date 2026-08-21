import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Copy, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  Flame, 
  Target, 
  Layers,
  Sliders,
  Award,
  BarChart3,
  Lightbulb,
  X
} from 'lucide-react';
import { 
  ProfileDNA, 
  ContentPillar, 
  StrategicAngleType, 
  StrategicContentItem, 
  QualityGateReport 
} from '../../types/strategic-brain';
import { SolutionFeedback } from '../SolutionFeedback';
import { apiFetch, ApiError } from '../../lib/api-client';

interface ContentLabProps {
  dna: ProfileDNA;
  onOpenPaywall: () => void;
  isPro?: boolean;
}

const OBJECTIVES = [
  { id: 'descoberta', label: 'Descoberta / Novos Seguidores', desc: 'Atrair público topo de funil com quebra de padrão', recommendedFormat: 'reel' },
  { id: 'autoridade', label: 'Construção de Autoridade', desc: 'Demonstrar método, profundidade e domínio técnico', recommendedFormat: 'carousel' },
  { id: 'vendas', label: 'Geração de Leads & Vendas', desc: 'Conectar dor profunda a oferta irresistível e CTA direta', recommendedFormat: 'stories' },
  { id: 'educacao', label: 'Educação Aprofundada', desc: 'Ensinar um processo com aplicação prática passo a passo', recommendedFormat: 'carousel' },
  { id: 'salvamentos', label: 'Salvamentos & Compartilhamentos', desc: 'Conteúdo de consulta rápida, checklists e frameworks', recommendedFormat: 'carousel' },
  { id: 'relacionamento', label: 'Relacionamento & Conexão', desc: 'Bastidores reais, valores e posicionamento pessoal', recommendedFormat: 'stories' }
];

const STRATEGIC_ANGLES: { type: StrategicAngleType; label: string; badge: string; desc: string }[] = [
  { type: 'contradição', label: 'Contradição / Anti-Senso Comum', badge: 'Alta Retenção', desc: 'Desafia uma crença popular do mercado que está prejudicando o público.' },
  { type: 'erro', label: 'Diagnóstico de Erro Silencioso', badge: 'Urgência', desc: 'Revela um erro comum que o público comete sem perceber.' },
  { type: 'dor', label: 'Agitação da Dor Real', badge: 'Conexão', desc: 'Descreve exatamente o sentimento de frustração e a consequência da inércia.' },
  { type: 'curiosidade', label: 'Mecanismo Único & Curiosidade', badge: 'Descoberta', desc: 'Apresenta um conceito inédito ou atalho validado que desperta interesse imediato.' },
  { type: 'demonstração', label: 'Demonstração Prática & Bastidor', badge: 'Autoridade', desc: 'Mostra o método funcionando na prática com dados e telas reais.' },
  { type: 'estudo de caso', label: 'Estudo de Caso / Antes & Depois', badge: 'Prova Social', desc: 'Narra a transformação concreta de um caso real.' },
  { type: 'opinião', label: 'Posicionamento Forte & Opinião', badge: 'Diferenciação', desc: 'Assume uma postura clara e corajosa sobre uma controvérsia do nicho.' },
  { type: 'objeção', label: 'Quebra de Objeção Oculta', badge: 'Conversão', desc: 'Elimina a principal dúvida ou hesitação que trava a decisão de compra.' },
  { type: 'transformação', label: 'Visão de Futuro & Transformação', badge: 'Desejo', desc: 'Mostra como é a vida/operação após a aplicação correta do método.' }
];

const REEL_MODELS = [
  { id: 'educational', label: 'Educacional / Técnico', desc: 'Gancho -> Problema -> Explicação -> Solução -> CTA' },
  { id: 'storytelling', label: 'Storytelling & Lição', desc: 'Gancho -> Contexto -> Conflito -> Virada -> Lição -> CTA' },
  { id: 'opinion', label: 'Opinião & Quebra de Crença', desc: 'Afirmação Forte -> Argumento -> Exemplo -> Conclusão' },
  { id: 'demonstration', label: 'Demonstração em Tempo Real', desc: 'Promessa -> Execução -> Explicação -> Resultado' },
  { id: 'case', label: 'Estudo de Caso / Transformação', desc: 'Antes -> Erro Antigo -> Ação Chave -> Resultado Final' }
];

export const ContentLab: React.FC<ContentLabProps> = ({ dna, onOpenPaywall, isPro = true }) => {
  const [selectedObjective, setSelectedObjective] = useState<string>('descoberta');
  const [selectedPillarId, setSelectedPillarId] = useState<string>(dna.content_pillars?.[0]?.id || 'pillar_1');
  const [selectedAngle, setSelectedAngle] = useState<StrategicAngleType>('contradição');
  const [selectedFormat, setSelectedFormat] = useState<'reel' | 'carousel' | 'stories'>('reel');
  const [selectedReelModel, setSelectedReelModel] = useState<string>('educational');
  const [customTopicFocus, setCustomTopicFocus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedItem, setGeneratedItem] = useState<StrategicContentItem | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showRationaleModal, setShowRationaleModal] = useState<boolean>(false);

  const selectedPillar = (dna.content_pillars || []).find(p => p?.id === selectedPillarId) || dna.content_pillars?.[0] || {
    id: 'pillar_1',
    name: 'Pilar Principal',
    objective: 'Autoridade e Conversão',
    target_audience: dna.target_audience || 'Público Qualificado',
    pain_or_problem: dna.audience_pain || 'Falta de clareza',
    desire: dna.audience_desire || 'Resultado acelerado',
    content_type: 'Reel / Carrossel',
    formats: ['reel', 'carousel'],
    example_topics: ['Como resolver o maior gargalo'],
    angles: ['contradição', 'erro']
  };

  const handleGenerate = async () => {
    if (!isPro) {
      onOpenPaywall();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiFetch<{ success: boolean; item: StrategicContentItem; message?: string }>('/api/strategic/content-lab', {
        method: 'POST',
        body: JSON.stringify({
          dna,
          primary_objective: selectedObjective,
          pilar: selectedPillar,
          angle_type: selectedAngle,
          format: selectedFormat,
          reel_model: selectedFormat === 'reel' ? selectedReelModel : undefined,
          custom_topic_focus: customTopicFocus
        })
      });

      if (data.success && data.item) {
        setGeneratedItem(data.item);
      } else {
        throw new Error('Não foi possível gerar a peça estratégica.');
      }
    } catch (err: any) {
      console.error('Content Lab error:', err);
      if (err instanceof ApiError && err.status === 403) {
        onOpenPaywall();
      } else {
        setErrorMessage(err?.message || 'Erro ao gerar conteúdo estratégico com IA.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div id="content_lab_module" className="bg-[#121826] border border-white/10 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Strategic Content Lab • InstaScore V12
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Criador Estratégico de Conteúdo
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Geração orientada por <strong className="text-gray-200">Objetivo → Pilar → Ângulo → Formato → Quality Gate</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-right">
            <span className="text-xs text-gray-400 block">DNA Ativo</span>
            <span className="text-sm font-semibold text-emerald-400">@{dna.username}</span>
          </div>
        </div>
      </div>

      {/* Creation Pipeline Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* Left Side: Parameters */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 1: Objective */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              1. Objetivo Primário da Peça
            </label>
            <div className="grid grid-cols-1 gap-2">
              {OBJECTIVES.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => {
                    setSelectedObjective(obj.id);
                    if (obj.recommendedFormat) setSelectedFormat(obj.recommendedFormat as any);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                    selectedObjective === obj.id
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-medium ring-1 ring-emerald-500/30'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-gray-200">{obj.label}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{obj.desc}</div>
                  </div>
                  {selectedObjective === obj.id && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Content Pillar */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              2. Pilar de Conteúdo
            </label>
            <select
              value={selectedPillarId}
              onChange={(e) => setSelectedPillarId(e.target.value)}
              className="w-full bg-[#0b0f19] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {dna.content_pillars.map((pillar) => (
                <option key={pillar.id} value={pillar.id}>
                  {pillar.name} ({pillar.objective})
                </option>
              ))}
            </select>
            {selectedPillar && (
              <div className="mt-2 text-[11px] text-gray-400 bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-gray-300 font-semibold">Dor atacada:</span> {selectedPillar.pain_or_problem}
              </div>
            )}
          </div>

          {/* Step 3: Strategic Angle */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              3. Ângulo Estratégico
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {STRATEGIC_ANGLES.map((angle) => (
                <button
                  key={angle.type}
                  type="button"
                  onClick={() => setSelectedAngle(angle.type)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    selectedAngle === angle.type
                      ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 font-medium'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  }`}
                >
                  <div className="font-semibold text-gray-200">{angle.label}</div>
                  <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">{angle.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Format Decision */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              4. Formato & Arquitetura
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('reel')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                  selectedFormat === 'reel'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                Reel / Vídeo
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat('carousel')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                  selectedFormat === 'carousel'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                Carrossel
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat('stories')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                  selectedFormat === 'stories'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                Stories Funil
              </button>
            </div>

            {/* If Reel, choose model */}
            {selectedFormat === 'reel' && (
              <div className="mt-3">
                <label className="text-[11px] text-gray-400 block mb-1">Modelo de Reel:</label>
                <select
                  value={selectedReelModel}
                  onChange={(e) => setSelectedReelModel(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {REEL_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.desc})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Optional Focus Topic */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Tópico Específico (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Por que cobrar barato atrai clientes difíceis"
              value={customTopicFocus}
              onChange={(e) => setCustomTopicFocus(e.target.value)}
              className="w-full bg-[#0b0f19] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            id="btn_generate_content_lab"
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Aplicando Quality Gate & Estratégia...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Gerar Peça com Estratégia Completa</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Strategic Deliverable Output */}
        <div className="lg:col-span-7 bg-[#0b0f19] border border-white/10 rounded-xl p-6 relative flex flex-col justify-between min-h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center my-auto py-16 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">Executando Strategic Brain V12</h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  Validando coerência com o Profile DNA, testando contra o filtro anti-genérico e calculando Quality Gate interno (&gt;75)...
                </p>
              </div>
            </div>
          ) : generatedItem ? (
            <div className="space-y-6">
              {/* Strategic Rationale Banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Raciocínio Estratégico Resumido
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRationaleModal(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Por que isso?
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Objetivo:</span>
                    <span className="font-semibold text-gray-200 capitalize">{generatedItem.primary_objective}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Pilar:</span>
                    <span className="font-semibold text-gray-200 truncate block">{generatedItem.pilar_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Ângulo:</span>
                    <span className="font-semibold text-amber-300 capitalize">{generatedItem.angle}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Formato:</span>
                    <span className="font-semibold text-cyan-300 uppercase">{generatedItem.format}</span>
                  </div>
                </div>
              </div>

              {/* Title & Hook */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Título & Gancho dos Primeiros 3 Segundos</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedItem.hook, 'hook')}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedSection === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar Gancho
                  </button>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {generatedItem.title}
                </h3>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200 space-y-1">
                  {generatedItem.visual_hook_3s && (
                    <div><strong className="text-amber-400">🎬 Gancho Visual (0-3s):</strong> {generatedItem.visual_hook_3s}</div>
                  )}
                  {generatedItem.spoken_hook_3s && (
                    <div><strong className="text-amber-400">🗣️ Gancho Falado (0-3s):</strong> "{generatedItem.spoken_hook_3s}"</div>
                  )}
                  {!generatedItem.visual_hook_3s && !generatedItem.spoken_hook_3s && (
                    <div><strong className="text-amber-400">Gancho Central:</strong> "{generatedItem.hook}"</div>
                  )}
                </div>
              </div>

              {/* Structure / Scenes / Slides */}
              {generatedItem.scenes_or_slides && generatedItem.scenes_or_slides.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 uppercase">
                      {generatedItem.format === 'carousel' ? 'Estrutura Narrativa Slide a Slide' : 'Roteiro Cena a Cena'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(JSON.stringify(generatedItem.scenes_or_slides, null, 2), 'scenes')}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedSection === 'scenes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copiar Estrutura
                    </button>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {generatedItem.scenes_or_slides.map((scene: any, idx: number) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-lg p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-gray-400 font-semibold">
                          <span>{scene.label || `Slide / Cena ${idx + 1}`}</span>
                          {scene.duration_seconds && <span>{scene.duration_seconds}s</span>}
                        </div>
                        <div className="text-gray-200">{scene.content || scene.spokenText || scene.body}</div>
                        {scene.visual_guidance && (
                          <div className="text-[11px] text-cyan-400">💡 {scene.visual_guidance}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption & CTA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Legenda Formatada & Chamada para Ação</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${generatedItem.caption}\n\nCTA: ${generatedItem.cta}`, 'caption')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedSection === 'caption' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar Legenda Completa
                  </button>
                </div>
                <div className="bg-[#121826] border border-white/10 rounded-lg p-4 text-xs text-gray-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                  {generatedItem.caption}
                  {generatedItem.cta && (
                    <div className="mt-3 pt-3 border-t border-white/10 font-semibold text-emerald-400">
                      👉 {generatedItem.cta}
                    </div>
                  )}
                </div>
              </div>

              {/* Quality Gate Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-gray-400">Quality Gate Score:</span>
                  <strong className="text-emerald-400 font-bold">{generatedItem.quality_report.total_score}/100</strong>
                  <span className="text-gray-500">(Anti-Genérico Aprovado)</span>
                </div>

                <SolutionFeedback
                  solutionType={`content_lab_${generatedItem.format}`}
                  itemTitle={generatedItem.title}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center my-auto py-16 text-center text-gray-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                <Lightbulb className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-semibold text-white">Nenhuma peça gerada ainda</h4>
                <p className="text-xs text-gray-400">
                  Configure o objetivo, pilar e formato na coluna ao lado e clique em <strong>Gerar Peça com Estratégia Completa</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* "Por que isso?" Modal / Drawer */}
      {showRationaleModal && generatedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121826] border border-white/15 rounded-2xl max-w-lg w-full p-6 text-white space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowRationaleModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <HelpCircle className="w-5 h-5" />
              Por que o InstaScore recomenda esta estrutura?
            </div>

            <div className="space-y-3 text-xs text-gray-300">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <strong className="text-emerald-400 block mb-1">Gargalo Diagnosticado:</strong>
                {generatedItem.strategic_rationale.why_this_recommendation.problem_identified || 'Posicionamento necessitando de diferenciação e autoridade de campo.'}
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <strong className="text-amber-400 block mb-1">Dados & Evidências:</strong>
                {generatedItem.strategic_rationale.why_this_recommendation.data_used || `Perfil ${dna.microsegment || dna.niche} focado no objetivo de ${generatedItem.primary_objective}.`}
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <strong className="text-cyan-400 block mb-1">Hipótese Estratégica:</strong>
                {generatedItem.strategic_rationale.why_this_recommendation.hypothesis || 'Utilizar quebra de padrão e ângulo não-óbvio aumenta a retenção em 3x comparado a listas genéricas de dicas.'}
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <strong className="text-indigo-400 block mb-1">Motivo da Decisão:</strong>
                {generatedItem.strategic_rationale.why_this_recommendation.reason || 'Este formato ataca diretamente a dor do público e direciona o tráfego para a oferta central.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRationaleModal(false)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-xl transition-all text-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
