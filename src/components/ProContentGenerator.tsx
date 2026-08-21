import React, { useState } from 'react';
import { 
  Sparkles, 
  Film, 
  Layers, 
  Zap, 
  Lock, 
  ArrowRight, 
  Check, 
  Copy, 
  Calendar, 
  Compass, 
  Image as ImageIcon,
  MessageCircle,
  Share2,
  Clock,
  Video,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useEntitlements } from '../hooks/useEntitlements';
import { SolutionFeedback } from './SolutionFeedback';
import { apiFetch, ApiError } from '../lib/api-client';

interface ProContentGeneratorProps {
  niche: string;
  objective: string;
  targetAudience: string;
  criticalGaps?: string[];
  strengths?: string[];
  score?: number;
  handle?: string;
  onOpenPaywall: () => void;
  defaultTab?: 'reels' | 'carousel' | 'stories' | 'positioning' | 'calendar' | 'visual';
}

type TabType = 'reels' | 'carousel' | 'stories' | 'positioning' | 'calendar' | 'visual';

export const ProContentGenerator: React.FC<ProContentGeneratorProps> = ({
  niche,
  objective,
  targetAudience,
  criticalGaps = [],
  strengths = [],
  score = 50,
  handle,
  onOpenPaywall,
  defaultTab = 'reels'
}) => {
  const { isPro, userId } = useEntitlements();
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Deliverables State Stores
  const [reelsResult, setReelsResult] = useState<any>(null);
  const [carouselResult, setCarouselResult] = useState<any>(null);
  const [storiesResult, setStoriesResult] = useState<any>(null);
  const [positioningResult, setPositioningResult] = useState<any>(null);
  const [calendarResult, setCalendarResult] = useState<any>(null);
  const [visualResult, setVisualResult] = useState<any>(null);

  // Form Inputs
  const [themeInput, setThemeInput] = useState('');
  const [offerInput, setOfferInput] = useState('');
  const [calendarDays, setCalendarDays] = useState<7 | 14>(7);
  const [imagePromptInput, setImagePromptInput] = useState('');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const executeProGeneration = async (tab: TabType) => {
    if (!isPro) {
      onOpenPaywall();
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    const gapsSummary = criticalGaps.slice(0, 3).join('; ') || 'Falta de clareza e ganchos fracos';

    try {
      if (tab === 'reels') {
        const data = await apiFetch<{ success: boolean; deliverable: any; paywallRequired?: boolean }>('/api/pro/reels-script', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            niche,
            objective,
            targetAudience,
            theme: themeInput || `Como resolver o maior problema de ${niche || 'clientes'}`,
            criticalGaps: gapsSummary
          })
        });
        if (data.success && data.deliverable) {
          setReelsResult(data.deliverable);
        } else if (data.paywallRequired) {
          onOpenPaywall();
        }
      } else if (tab === 'carousel') {
        const data = await apiFetch<{ success: boolean; deliverable: any; paywallRequired?: boolean }>('/api/pro/carousel', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            niche,
            objective,
            targetAudience,
            theme: themeInput || `Guia definitivo de posicionamento para ${niche || 'profissionais'}`
          })
        });
        if (data.success && data.deliverable) {
          setCarouselResult(data.deliverable);
        } else if (data.paywallRequired) {
          onOpenPaywall();
        }
      } else if (tab === 'stories') {
        const data = await apiFetch<{ success: boolean; deliverable: any; paywallRequired?: boolean }>('/api/pro/stories-sequence', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            niche,
            objective,
            targetAudience,
            offerOrProduct: offerInput || `Serviço/Consultoria no nicho de ${niche || 'Atendimento'}`
          })
        });
        if (data.success && data.deliverable) {
          setStoriesResult(data.deliverable);
        } else if (data.paywallRequired) {
          onOpenPaywall();
        }
      } else if (tab === 'positioning') {
        const data = await apiFetch<{ success: boolean; deliverable: any; paywallRequired?: boolean }>('/api/pro/positioning-strategy', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            niche,
            objective,
            targetAudience,
            strengths: strengths.slice(0, 2).join('; ') || 'Domínio técnico',
            criticalGaps: gapsSummary
          })
        });
        if (data.success && data.deliverable) {
          setPositioningResult(data.deliverable);
        } else if (data.paywallRequired) {
          onOpenPaywall();
        }
      } else if (tab === 'calendar') {
        const data = await apiFetch<{ success: boolean; deliverable: any; paywallRequired?: boolean }>('/api/pro/tactical-calendar', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            niche,
            objective,
            targetAudience,
            periodDays: calendarDays
          })
        });
        if (data.success && data.deliverable) {
          setCalendarResult(data.deliverable);
        } else if (data.paywallRequired) {
          onOpenPaywall();
        }
      } else if (tab === 'visual') {
        const data = await apiFetch<{ success: boolean; deliverable: any; paywallRequired?: boolean }>('/api/pro/generate-image', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            niche,
            prompt: imagePromptInput || `Capa com autoridade e contraste para ${niche || 'Instagram'}`
          })
        });
        if (data.success && data.deliverable) {
          setVisualResult(data.deliverable);
        } else if (data.paywallRequired) {
          onOpenPaywall();
        }
      }
    } catch (err: any) {
      console.error('[InstaScore PRO Generator Execution Error]', err);
      if (err instanceof ApiError && err.status === 403) {
        onOpenPaywall();
      } else {
        setErrorMessage(err?.message || "Ocorreu um erro ao gerar a solução com IA. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const tabsConfig = [
    { id: 'reels', label: 'Roteiros de Reels', icon: Film, subtitle: 'Ganchos 3s & falas cena a cena' },
    { id: 'carousel', label: 'Carrossel Slide a Slide', icon: Layers, subtitle: 'Estrutura visual e copy de capa' },
    { id: 'stories', label: 'Funil de Stories', icon: MessageCircle, subtitle: 'Sequência de 5 stories de conversão' },
    { id: 'positioning', label: 'Posicionamento Único', icon: Compass, subtitle: 'Território & 3 pilares táticos' },
    { id: 'calendar', label: 'Calendário Tático', icon: Calendar, subtitle: 'Planejamento de 7 ou 14 dias' },
    { id: 'visual', label: 'Direção Visual & Arte', icon: ImageIcon, subtitle: 'Briefings & prompts de imagem' }
  ];

  return (
    <div id="pro-resolution-hub" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl mt-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-indigo-400 text-xs sm:text-sm font-semibold tracking-wider uppercase">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>InstaScore PRO — Central de Resolução com IA</span>
        </div>
        {!isPro && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Lock className="w-3.5 h-3.5" />
            Recurso Exclusivo PRO
          </span>
        )}
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
        Corrija os Gargalos do Perfil com Soluções Prontas
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-2xl leading-relaxed">
        Não fique apenas no diagnóstico: gere roteiros completos de Reels, carrosséis estruturados, sequências de stories de alta conversão e matrizes de posicionamento prontas para executar.
      </p>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500/50 shadow-md'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </div>
              <div>
                <div className="text-xs font-semibold leading-snug">{tab.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Input Bar based on Active Tab */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 mb-6">
        {activeTab === 'reels' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Tema ou Dúvida Central do Reel:</span>
              <span className="text-[10px] text-slate-500 font-normal">Personalize para um assunto específico</span>
            </label>
            <input
              type="text"
              id="input-reels-theme"
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              placeholder={`Ex: Como atrair clientes qualificados no nicho de ${niche || 'serviços'}`}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {activeTab === 'carousel' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Tema Principal do Carrossel:</span>
              <span className="text-[10px] text-slate-500 font-normal">Gera estrutura de 7 a 8 slides</span>
            </label>
            <input
              type="text"
              id="input-carousel-theme"
              value={themeInput}
              onChange={(e) => setThemeInput(e.target.value)}
              placeholder={`Ex: 5 erros fatais que travam as vendas no Instagram para ${niche || 'criadores'}`}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Oferta, Produto ou Serviço a ser Vendido nos Stories:</span>
              <span className="text-[10px] text-slate-500 font-normal">Gera funil diário de 5 stories</span>
            </label>
            <input
              type="text"
              id="input-stories-offer"
              value={offerInput}
              onChange={(e) => setOfferInput(e.target.value)}
              placeholder={`Ex: Consultoria Individual de 1h / Mentoria para ${niche || 'profissionais'}`}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {activeTab === 'positioning' && (
          <div className="text-xs text-slate-400">
            A IA utilizará os dados do diagnóstico C.A.G.E., pontos fortes e gargalos identificados para criar o território de autoridade e diferenciação contra concorrentes genéricos.
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-300">Duração do Calendário Tático:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalendarDays(7)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  calendarDays === 7
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                7 Dias (Sprint Inicial)
              </button>
              <button
                type="button"
                onClick={() => setCalendarDays(14)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  calendarDays === 14
                    ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                14 Dias (Ciclo Completo)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'visual' && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Briefing ou Tema da Imagem / Post:</span>
              <span className="text-[10px] text-slate-500 font-normal">Gera prompt Midjourney + layout Canva</span>
            </label>
            <input
              type="text"
              id="input-visual-prompt"
              value={imagePromptInput}
              onChange={(e) => setImagePromptInput(e.target.value)}
              placeholder={`Ex: Foto de criador em ambiente de trabalho moderno com foco em autoridade`}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Generate Trigger */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            id={`btn-generate-${activeTab}`}
            disabled={loading}
            onClick={() => executeProGeneration(activeTab)}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              !isPro
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 hover:opacity-95 text-white shadow-indigo-500/25'
            }`}
          >
            {!isPro ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Desbloquear com InstaScore PRO</span>
              </>
            ) : loading ? (
              <span>Gerando com Inteligência Artificial...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Solução Pronta Agora</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Deliverables Output Canvas */}
      {/* 1. REELS DELIVERABLE */}
      {activeTab === 'reels' && reelsResult && (
        <div id="reels-deliverable-card" className="bg-slate-950 border border-indigo-900/40 rounded-2xl p-5 sm:p-6 text-slate-200 space-y-5 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Roteiro de Reels PRO</span>
              <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">{reelsResult.title}</h4>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(reelsResult, null, 2), 'reels')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
            >
              {copiedKey === 'reels' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'reels' ? 'Copiado!' : 'Copiar Roteiro'}</span>
            </button>
          </div>

          {/* 3s Hook Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
            <div>
              <div className="text-[11px] font-bold text-indigo-300 uppercase mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gancho Visual (0 a 3s)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{reelsResult.visualHook3s}</p>
            </div>
            <div>
              <div className="text-[11px] font-bold text-emerald-300 uppercase mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gancho Falado (0 a 3s)</span>
              </div>
              <p className="text-xs text-slate-300 font-medium italic leading-relaxed">"{reelsResult.spokenHook3s}"</p>
            </div>
          </div>

          {/* Scenes Breakdown */}
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Direção Cena a Cena:</div>
            <div className="space-y-3">
              {reelsResult.scenes?.map((scene: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span className="text-indigo-400">Cena #{scene.sceneNumber || idx + 1}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{scene.timeframe}</span>
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-500 font-medium">Visual: </span>
                    {scene.visual}
                  </div>
                  <div className="text-white font-medium bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="text-emerald-400 font-semibold">Fala: </span>"{scene.spokenText}"
                  </div>
                  {scene.onScreenText && (
                    <div className="text-[11px] text-amber-300/90">
                      <span className="text-slate-500">Texto na tela: </span>{scene.onScreenText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Caption & CTA */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div className="text-xs font-bold text-slate-300">Legenda Pronta para Publicar:</div>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{reelsResult.caption}</p>
            {reelsResult.ctaAction && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-emerald-400 font-semibold">
                CTA: {reelsResult.ctaAction}
              </div>
            )}
          </div>

          <SolutionFeedback solutionType="reels_script" itemTitle={reelsResult.title} userId={userId} />
        </div>
      )}

      {/* 2. CAROUSEL DELIVERABLE */}
      {activeTab === 'carousel' && carouselResult && (
        <div id="carousel-deliverable-card" className="bg-slate-950 border border-indigo-900/40 rounded-2xl p-5 sm:p-6 text-slate-200 space-y-5 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Estrutura de Carrossel Slide a Slide</span>
              <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">{carouselResult.title}</h4>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(carouselResult, null, 2), 'carousel')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
            >
              {copiedKey === 'carousel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'carousel' ? 'Copiado!' : 'Copiar Carrossel'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {carouselResult.slides?.map((slide: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                    <span className="text-indigo-400">Slide {slide.slideNumber || idx + 1}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 uppercase">{slide.type}</span>
                  </div>
                  <div className="font-bold text-white text-sm mb-1">{slide.headline}</div>
                  {slide.subheadline && <div className="text-xs text-indigo-300/90 mb-2">{slide.subheadline}</div>}
                  <p className="text-slate-300 text-xs leading-relaxed">{slide.body}</p>
                </div>
                {slide.visualNote && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-amber-300/80 italic">
                    🎨 Layout: {slide.visualNote}
                  </div>
                )}
              </div>
            ))}
          </div>

          {carouselResult.caption && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="text-xs font-bold text-slate-300">Legenda de Publicação:</div>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{carouselResult.caption}</p>
            </div>
          )}

          <SolutionFeedback solutionType="carousel_structure" itemTitle={carouselResult.title} userId={userId} />
        </div>
      )}

      {/* 3. STORIES DELIVERABLE */}
      {activeTab === 'stories' && storiesResult && (
        <div id="stories-deliverable-card" className="bg-slate-950 border border-indigo-900/40 rounded-2xl p-5 sm:p-6 text-slate-200 space-y-5 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Funil Diário de 5 Stories de Conversão</span>
              <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">{storiesResult.sequenceTitle}</h4>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(storiesResult, null, 2), 'stories')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
            >
              {copiedKey === 'stories' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'stories' ? 'Copiado!' : 'Copiar Funil'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {storiesResult.stories?.map((story: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-emerald-400">Story #{story.storyNumber || idx + 1} — {story.stage}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{story.format}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 font-medium text-slate-100 border border-slate-800/80">
                  "{story.speechOrText}"
                </div>
                {story.interactiveElement && (
                  <div className="text-indigo-300 text-xs font-semibold flex items-center gap-1">
                    <span>⚡ Elemento Interativo:</span> {story.interactiveElement}
                  </div>
                )}
                {story.visualGuidance && (
                  <div className="text-[11px] text-slate-400">
                    👁️ Orientação visual: {story.visualGuidance}
                  </div>
                )}
              </div>
            ))}
          </div>

          {storiesResult.directMessageReplyScript && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-2">
              <div className="text-xs font-bold text-emerald-300">Script de Resposta no Direct:</div>
              <p className="text-slate-200 font-mono text-xs">{storiesResult.directMessageReplyScript}</p>
            </div>
          )}

          <SolutionFeedback solutionType="stories_funnel" itemTitle={storiesResult.sequenceTitle} userId={userId} />
        </div>
      )}

      {/* 4. POSITIONING DELIVERABLE */}
      {activeTab === 'positioning' && positioningResult && (
        <div id="positioning-deliverable-card" className="bg-slate-950 border border-indigo-900/40 rounded-2xl p-5 sm:p-6 text-slate-200 space-y-5 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Matriz Estratégica de Posicionamento</span>
              <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">{positioningResult.contentTerritory}</h4>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(positioningResult, null, 2), 'positioning')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
            >
              {copiedKey === 'positioning' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'positioning' ? 'Copiado!' : 'Copiar Matriz'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-2">
            <div className="text-[11px] font-bold text-indigo-300 uppercase">Promessa Central Única (Sem Clichês):</div>
            <p className="text-sm font-semibold text-white leading-relaxed">"{positioningResult.corePromise}"</p>
            <div className="text-slate-400 text-xs mt-2">
              <span className="font-semibold text-slate-300">Ângulo de Diferenciação: </span>
              {positioningResult.differentiationAngle}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">3 Pilares Táticos de Conteúdo:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {positioningResult.contentPillars?.map((pillar: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-indigo-400 font-bold">
                    <span>{pillar.pillarName}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px]">{pillar.percentage}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>

          {positioningResult.antiTopics && positioningResult.antiTopics.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 text-xs space-y-2">
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Anti-Temas (O que NUNCA postar para não diluir autoridade):</span>
              </div>
              <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                {positioningResult.antiTopics.map((topic: string, i: number) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>
          )}

          <SolutionFeedback solutionType="positioning_matrix" itemTitle={positioningResult.contentTerritory} userId={userId} />
        </div>
      )}

      {/* 5. CALENDAR DELIVERABLE */}
      {activeTab === 'calendar' && calendarResult && (
        <div id="calendar-deliverable-card" className="bg-slate-950 border border-indigo-900/40 rounded-2xl p-5 sm:p-6 text-slate-200 space-y-5 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Cronograma Editorial Tático</span>
              <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">{calendarResult.calendarTitle}</h4>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(calendarResult, null, 2), 'calendar')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
            >
              {copiedKey === 'calendar' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'calendar' ? 'Copiado!' : 'Copiar Calendário'}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {calendarResult.days?.map((item: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 shrink-0">
                    D{item.day || idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs sm:text-sm">{item.headline}</div>
                    <div className="text-[11px] text-slate-400">{item.hookIdea}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 rounded bg-slate-800 text-indigo-300 text-[10px] font-semibold uppercase">{item.format}</span>
                  <span className="px-2 py-1 rounded bg-slate-950 text-slate-400 text-[10px]">{item.strategicGoal}</span>
                </div>
              </div>
            ))}
          </div>

          <SolutionFeedback solutionType="tactical_calendar" itemTitle={calendarResult.calendarTitle} userId={userId} />
        </div>
      )}

      {/* 6. VISUAL DELIVERABLE */}
      {activeTab === 'visual' && visualResult && (
        <div id="visual-deliverable-card" className="bg-slate-950 border border-indigo-900/40 rounded-2xl p-5 sm:p-6 text-slate-200 space-y-5 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Direção de Arte & Briefing Visual</span>
              <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">{visualResult.recommendedVisualConcept}</h4>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(visualResult, null, 2), 'visual')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
            >
              {copiedKey === 'visual' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'visual' ? 'Copiado!' : 'Copiar Briefing'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div className="text-xs font-bold text-indigo-300">Prompt Otimizado para Midjourney v6:</div>
            <p className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800/80 select-all">
              {visualResult.midjourneyPrompt}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div className="text-xs font-bold text-slate-300">Instruções de Montagem no Canva/Figma:</div>
            <p className="text-slate-300 text-xs leading-relaxed">{visualResult.canvaDesignInstructions}</p>
          </div>

          <SolutionFeedback solutionType="visual_art_direction" itemTitle={visualResult.recommendedVisualConcept} userId={userId} />
        </div>
      )}
    </div>
  );
};
