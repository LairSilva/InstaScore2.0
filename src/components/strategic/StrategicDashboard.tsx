import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Target, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Flame, 
  BarChart3, 
  Edit3, 
  Check, 
  RefreshCw, 
  ArrowUpRight, 
  HelpCircle, 
  PieChart, 
  Sliders, 
  UserCheck,
  Zap,
  Award
} from 'lucide-react';
import { ProfileDNA, ContentPillar, ProfileClarityScore } from '../../types/strategic-brain';
import { ProfileDNAService } from '../../engine/strategic/ProfileDNAService';
import { BioStrategyModal } from './BioStrategyModal';
import { NameStrategyModal } from './NameStrategyModal';
import { apiFetch, ApiError } from '../../lib/api-client';

interface StrategicDashboardProps {
  initialDna?: ProfileDNA;
  username: string;
  onOpenContentLab?: () => void;
  onOpenPaywall?: () => void;
  isPro?: boolean;
}

export const StrategicDashboard: React.FC<StrategicDashboardProps> = ({
  initialDna,
  username,
  onOpenContentLab,
  onOpenPaywall,
  isPro = true
}) => {
  const [dna, setDna] = useState<ProfileDNA>(() => {
    return initialDna || ProfileDNAService.createDefaultDNA(username, 'Geral');
  });

  const [isEditingDna, setIsEditingDna] = useState<boolean>(false);
  const [editedDna, setEditedDna] = useState<ProfileDNA>(dna);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [isBioModalOpen, setIsBioModalOpen] = useState<boolean>(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState<boolean>(false);

  // Load persisted DNA on mount
  useEffect(() => {
    const loadData = async () => {
      if (username) {
        const loaded = await ProfileDNAService.getDNA(username);
        if (loaded) {
          setDna(loaded);
          setEditedDna(loaded);
        }
      }
    };
    loadData();
  }, [username]);

  const handleSaveDna = async () => {
    setIsSaving(true);
    try {
      const updated = await ProfileDNAService.saveDNA(editedDna);
      setDna(updated);
      setIsEditingDna(false);
    } catch (err) {
      console.error('Error saving Profile DNA:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecalculateStrategy = async () => {
    if (!isPro && onOpenPaywall) {
      onOpenPaywall();
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await apiFetch<{
        success: boolean;
        positioningReport?: any;
        clarityScore?: any;
        contentDistribution?: any;
      }>('/api/strategic/positioning', {
        method: 'POST',
        body: JSON.stringify({
          username: dna.username,
          account_name: dna.account_name,
          niche: dna.niche,
          subniche: dna.subniche,
          currentBio: dna.unique_value_proposition,
          goal: dna.business_model || 'Vendas e Autoridade',
          diagnosisScore: dna.clarity_score?.overall_score || 55
        })
      });

      if (data.success) {
        const newDna: ProfileDNA = {
          ...dna,
          subniche: data.positioningReport?.subniche || dna.subniche,
          microsegment: data.positioningReport?.microsegment || dna.microsegment,
          target_audience: data.positioningReport?.targetAudience || dna.target_audience,
          core_problem: data.positioningReport?.coreProblem || dna.core_problem,
          unique_value_proposition: data.positioningReport?.positioningStatement || dna.unique_value_proposition,
          clarity_score: data.clarityScore || dna.clarity_score,
          content_dna: data.contentDistribution ? {
            ...dna.content_dna,
            distribution: data.contentDistribution
          } : dna.content_dna
        };

        const saved = await ProfileDNAService.saveDNA(newDna);
        setDna(saved);
        setEditedDna(saved);
      }
    } catch (err: any) {
      console.error('Failed to recalculate positioning:', err);
      if (err instanceof ApiError && err.status === 403 && onOpenPaywall) {
        onOpenPaywall();
      } else {
        alert(err?.message || 'Não foi possível recalcular a estratégia no momento.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clarityScore = typeof dna.clarity_score === 'object' && dna.clarity_score !== null
    ? {
        overall_score: dna.clarity_score.overall_score || 68,
        positioning_clarity: dna.clarity_score.positioning_clarity || 70,
        audience_clarity: dna.clarity_score.audience_clarity || 65,
        value_proposition_clarity: dna.clarity_score.value_proposition_clarity || 72,
        differentiation_clarity: dna.clarity_score.differentiation_clarity || 50,
        authority_signals: dna.clarity_score.authority_signals || 55,
        bio_clarity: dna.clarity_score.bio_clarity || 70,
        content_alignment: dna.clarity_score.content_alignment || 65,
        strategic_consistency: dna.clarity_score.strategic_consistency || 68,
        biggest_bottleneck: dna.clarity_score.biggest_bottleneck || 'Falta de diferenciação clara no microsegmento.',
        second_opportunity: dna.clarity_score.second_opportunity || 'Fortalecer ganchos dos primeiros 3 segundos nos vídeos.',
        recommendation: dna.clarity_score.recommendation || 'Refinar o posicionamento para focar em uma dor não-óbvia.'
      }
    : {
        overall_score: typeof dna.clarity_score === 'number' ? dna.clarity_score : 68,
        positioning_clarity: typeof dna.clarity_score === 'number' ? Math.min(100, dna.clarity_score + 2) : 70,
        audience_clarity: typeof dna.clarity_score === 'number' ? Math.min(100, Math.max(30, dna.clarity_score - 5)) : 65,
        value_proposition_clarity: typeof dna.clarity_score === 'number' ? Math.min(100, dna.clarity_score + 4) : 72,
        differentiation_clarity: typeof dna.clarity_score === 'number' ? Math.max(25, dna.clarity_score - 18) : 50,
        authority_signals: typeof dna.clarity_score === 'number' ? Math.min(100, Math.max(30, dna.clarity_score - 8)) : 55,
        bio_clarity: typeof dna.clarity_score === 'number' ? Math.min(100, dna.clarity_score + 2) : 70,
        content_alignment: typeof dna.clarity_score === 'number' ? Math.min(100, dna.clarity_score) : 65,
        strategic_consistency: typeof dna.clarity_score === 'number' ? Math.min(100, Math.max(30, dna.clarity_score - 4)) : 68,
        biggest_bottleneck: 'Falta de diferenciação clara no microsegmento.',
        second_opportunity: 'Fortalecer ganchos dos primeiros 3 segundos nos vídeos.',
        recommendation: 'Refinar o posicionamento para focar em uma dor não-óbvia.'
      };

  const distribution = {
    authority: dna.content_dna?.distribution?.authority ?? dna.content_distribution?.autoridade ?? 40,
    discovery: dna.content_dna?.distribution?.discovery ?? dna.content_distribution?.descoberta ?? 25,
    conversion: dna.content_dna?.distribution?.conversion ?? dna.content_distribution?.conversao ?? 15,
    connection: dna.content_dna?.distribution?.connection ?? dna.content_distribution?.relacionamento ?? 20
  };

  const consultativeRationale = dna.content_dna?.consultative_rationale || 'Perfis de serviços e autoridade devem concentrar 40% em autoridade para validar o ticket e 25% em descoberta para atrair público qualificado constante.';

  return (
    <div id="strategic_dashboard_section" className="space-y-8 text-white">
      {/* ==================================================
          1. PRIMEIRA DOBRA DO DASHBOARD: SCORE → GARGALO → AÇÃO PRIORITÁRIA → EVIDÊNCIA → PLANO 7 DIAS
          ================================================== */}
      <div id="strategic-dashboard-hero-flow" className="space-y-6">
        
        {/* Top Header & Context */}
        <div className="bg-gradient-to-br from-[#121826] via-[#0f172a] to-[#121826] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                Sua Estratégia • InstaScore Strategic Brain V12
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Central de Posicionamento & DNA da Marca
              </h2>
              <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
                Diagnóstico executivo de <strong className="text-white font-semibold">@{username}</strong>. Identifique seu gargalo crítico, a hipótese de validação e o plano de 7 dias para acelerar resultados.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                id="btn_recalculate_strategy"
                onClick={handleRecalculateStrategy}
                disabled={isAnalyzing}
                className="bg-white/10 hover:bg-white/15 text-white font-medium py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 border border-white/10 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Analisando DNA...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Recalcular Estratégia</span>
                  </>
                )}
              </button>

              {onOpenContentLab && (
                <button
                  type="button"
                  id="btn_goto_content_lab"
                  onClick={onOpenContentLab}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 cursor-pointer min-h-[44px]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Abrir Content Lab</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Action Fast-Launchers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsBioModalOpen(true)}
              className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all group flex items-center justify-between cursor-pointer min-h-[44px]"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">Bio Strategy</span>
                <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">Reconstruir Bio Anti-Clichê</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsNameModalOpen(true)}
              className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all group flex items-center justify-between cursor-pointer min-h-[44px]"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">Name Strategy</span>
                <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">Otimizar Nome & Handle</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              type="button"
              onClick={onOpenContentLab}
              className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-all group flex items-center justify-between cursor-pointer min-h-[44px]"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Content Lab</span>
                <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">Gerar Roteiros & Carrosséis</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* 5-Step Above-the-Fold Diagnostic Core Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* 1. SCORE DO PERFIL */}
          <div className="lg:col-span-4 bg-[#121826] border border-white/10 rounded-2xl p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-[11px] font-mono font-bold text-[#FA26A0] uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#FF5E36]" /> 1. Score de Clareza
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Auditado
              </span>
            </div>

            <div className="py-5 space-y-2">
              <div className="text-5xl sm:text-6xl font-black text-white tracking-tight font-display">
                {clarityScore.overall_score}<span className="text-xl font-mono text-slate-500 font-normal">/100</span>
              </div>
              <p className="text-xs text-slate-300 max-w-xs">
                Potencial de destrave identificado: <strong className="text-emerald-400 font-bold">+{100 - clarityScore.overall_score} pts</strong> ao solucionar o gargalo principal.
              </p>
            </div>

            <div className="w-full pt-3 border-t border-white/10 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Posicionamento:</span>
                <span className="text-white font-mono font-bold">{clarityScore.positioning_clarity}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#FF5E36] to-[#E1306C] h-full rounded-full" style={{ width: `${clarityScore.positioning_clarity}%` }} />
              </div>
            </div>
          </div>

          {/* 2. PRINCIPAL GARGALO & 3. EVIDÊNCIA DETECTADA */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 2. Principal Gargalo */}
            <div className="bg-[#121826] border border-rose-500/30 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> 2. Principal Gargalo
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    Prioridade P0
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  {clarityScore.biggest_bottleneck}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O visitante não identifica em menos de 3 segundos quem você ajuda, qual dor você resolve ou por que escolher você em vez da concorrência.
                </p>
              </div>

              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-[11px] text-rose-200">
                <strong>Impacto direto:</strong> Redução de taxa de conversão de visitantes do perfil em seguidores e leads no Direct.
              </div>
            </div>

            {/* 3. Evidência Observada vs Inferência */}
            <div className="bg-[#121826] border border-white/10 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> 3. Evidência Observada
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Auditoria Real</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-xs text-slate-300 space-y-1 font-mono">
                  <span className="text-[10px] text-slate-500 uppercase block">Trecho de Posicionamento:</span>
                  <p className="italic text-cyan-200">
                    "{dna.unique_value_proposition || 'Ajudando você a ter resultados no digital'}"
                  </p>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-slate-300 font-semibold">Inferência diagnóstica:</strong> Promessa ampla sem especificação de método, ticket ou microsegmento concreto.
                </p>
              </div>

              <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                Validação estrutural: Categoria {dna.niche}
              </div>
            </div>

          </div>

        </div>

        {/* 4. AÇÃO PRIORITÁRIA COM HIPÓTESE & MÉTRICA */}
        <div className="bg-gradient-to-br from-[#121826] via-[#101E2E] to-[#121826] border border-emerald-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                4. AÇÃO PRIORITÁRIA DE AJUSTE (15 MINUTOS)
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-300 font-semibold">
              Impacto imediato no perfil
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* O Que Executar */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                A) O Que Executar Agora
              </span>
              <h4 className="font-bold text-sm text-white">{clarityScore.recommendation}</h4>
              <p className="text-slate-300 leading-relaxed">
                Reescreva a primeira linha da bio com público e resultado tangível. Insira um link com benefício claro de clique.
              </p>
            </div>

            {/* Hipótese a Ser Testada */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                B) Hipótese a Ser Testada
              </span>
              <h4 className="font-bold text-sm text-white">Aumento de Retenção e Conversão</h4>
              <p className="text-slate-300 leading-relaxed">
                Ao deixar a promessa ultra-específica, visitantes que chegam por Reels ou busca se sentem imediatamente qualificados e seguem.
              </p>
            </div>

            {/* Métrica para Acompanhar */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                C) Métrica para Acompanhar
              </span>
              <h4 className="font-bold text-sm text-white">Taxa de Cliques no Link & DMs</h4>
              <p className="text-slate-300 leading-relaxed">
                Monitore em 7 dias a proporção de cliques por visita ao perfil e a qualidade das mensagens recebidas.
              </p>
            </div>

          </div>
        </div>

        {/* 5. PLANO DE 7 DIAS (PASSO A PASSO) */}
        <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
                <Target className="w-4 h-4 text-[#38BDF8]" />
                5. Plano de Ação de 7 Dias (Passo a Passo)
              </h3>
              <p className="text-xs text-slate-400">Roteiro priorizado para executar sem sobrecarga.</p>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Passo 1 a 4 • Timeline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-[#FF5E36] uppercase block">Dia 1 • Posicionamento</span>
              <h4 className="font-bold text-white text-xs">Ajustar Bio e @Handle</h4>
              <p className="text-slate-400 text-[11px]">Aplicar a bio reestruturada em 3 blocos e otimizar termos de busca do nicho.</p>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-[#FA26A0] uppercase block">Dia 2 • Destaques</span>
              <h4 className="font-bold text-white text-xs">4 Destaques Essenciais</h4>
              <p className="text-slate-400 text-[11px]">Comece Aqui, Método/Serviço, Prova/Depoimentos e Contato Direto.</p>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-[#38BDF8] uppercase block">Dia 3 • Reels com Gancho</span>
              <h4 className="font-bold text-white text-xs">Vídeo de Autoridade</h4>
              <p className="text-slate-400 text-[11px]">Gravar 1 Reels utilizando a fórmula anti-clichê nos primeiros 3 segundos.</p>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase block">Dia 7 • Validação</span>
              <h4 className="font-bold text-white text-xs">Medir Conversão & Recalcular</h4>
              <p className="text-slate-400 text-[11px]">Analisar métricas de visitas, cliques no link e recalcular novo score no InstaScore.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Profile Clarity Score & Dynamic Content DNA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Clarity Score (8 Dimensions) */}
        <div className="lg:col-span-7 bg-[#121826] border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Profile Clarity Score (0-100)
              </h3>
              <p className="text-xs text-gray-400">
                Índice matemático de clareza estratégica e ausência de ruído comunicacional.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-emerald-400">{clarityScore.overall_score}</span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
          </div>

          {/* 8 Metric Dimensions Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">1. Posicionamento</span>
                <span className="font-semibold text-white">{clarityScore.positioning_clarity}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${clarityScore.positioning_clarity}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">2. Clareza de Audiência</span>
                <span className="font-semibold text-white">{clarityScore.audience_clarity}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${clarityScore.audience_clarity}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">3. Proposta de Valor</span>
                <span className="font-semibold text-white">{clarityScore.value_proposition_clarity}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${clarityScore.value_proposition_clarity}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">4. Diferenciação</span>
                <span className="font-semibold text-amber-400">{clarityScore.differentiation_clarity}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${clarityScore.differentiation_clarity}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">5. Sinais de Autoridade</span>
                <span className="font-semibold text-white">{clarityScore.authority_signals}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${clarityScore.authority_signals}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">6. Bio & Chamada</span>
                <span className="font-semibold text-white">{clarityScore.bio_clarity}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${clarityScore.bio_clarity}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">7. Alinhamento de Conteúdo</span>
                <span className="font-semibold text-white">{clarityScore.content_alignment}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${clarityScore.content_alignment}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">8. Consistência Estratégica</span>
                <span className="font-semibold text-white">{clarityScore.strategic_consistency}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${clarityScore.strategic_consistency}%` }} />
              </div>
            </div>
          </div>

          {/* Diagnostic Bottleneck Alert */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Gargalo Crítico Identificado:</span>
            </div>
            <p className="text-amber-200">{clarityScore.biggest_bottleneck}</p>
            <p className="text-gray-400 text-[11px] pt-1">
              <strong className="text-gray-300">Recomendação Estratégica:</strong> {clarityScore.recommendation}
            </p>
          </div>
        </div>

        {/* Dynamic Content DNA Distribution */}
        <div className="lg:col-span-5 bg-[#121826] border border-white/10 rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                Content DNA Dinâmico
              </h3>
              <span className="text-xs text-cyan-400 font-semibold uppercase">Distribuição Ideal</span>
            </div>
            <p className="text-xs text-gray-400">
              Proporção calibrada para a maturidade e modelo de negócio do seu perfil.
            </p>

            {/* Visual Distribution Stack */}
            <div className="space-y-3 mt-5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Autoridade / Método</span>
                  <strong className="text-emerald-400">{distribution.authority}%</strong>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${distribution.authority}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Descoberta / Novos Seguidores</span>
                  <strong className="text-cyan-400">{distribution.discovery}%</strong>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${distribution.discovery}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Conversão Direta / Oferta</span>
                  <strong className="text-amber-400">{distribution.conversion}%</strong>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${distribution.conversion}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Conexão / Relacionamento</span>
                  <strong className="text-indigo-400">{distribution.connection}%</strong>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${distribution.connection}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 text-[11px] text-gray-400 space-y-1">
            <strong className="text-gray-200 block">💡 Raciocínio de Distribuição:</strong>
            {consultativeRationale}
          </div>
        </div>
      </div>

      {/* Profile DNA Matrix (Visual & Editable) */}
      <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Matriz do Profile DNA
            </h3>
            <p className="text-xs text-gray-400">
              Esses dados alimentam todas as gerações de roteiros, carrosséis e diagnósticos.
            </p>
          </div>

          <div>
            {isEditingDna ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditedDna(dna);
                    setIsEditingDna(false);
                  }}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDna}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar DNA
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingDna(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar Parâmetros
              </button>
            )}
          </div>
        </div>

        {isEditingDna ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-gray-400 block mb-1 font-semibold">Nicho</label>
              <input
                type="text"
                value={editedDna.niche}
                onChange={(e) => setEditedDna({ ...editedDna, niche: e.target.value })}
                className="w-full bg-[#0b0f19] border border-white/15 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1 font-semibold">Subnicho</label>
              <input
                type="text"
                value={editedDna.subniche || ''}
                onChange={(e) => setEditedDna({ ...editedDna, subniche: e.target.value })}
                className="w-full bg-[#0b0f19] border border-white/15 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1 font-semibold">Microsegmento</label>
              <input
                type="text"
                value={editedDna.microsegment || ''}
                onChange={(e) => setEditedDna({ ...editedDna, microsegment: e.target.value })}
                className="w-full bg-[#0b0f19] border border-white/15 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1 font-semibold">Público-Alvo</label>
              <input
                type="text"
                value={editedDna.target_audience || ''}
                onChange={(e) => setEditedDna({ ...editedDna, target_audience: e.target.value })}
                className="w-full bg-[#0b0f19] border border-white/15 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1 font-semibold">Dor Central do Público</label>
              <input
                type="text"
                value={editedDna.core_problem || ''}
                onChange={(e) => setEditedDna({ ...editedDna, core_problem: e.target.value })}
                className="w-full bg-[#0b0f19] border border-white/15 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1 font-semibold">Diferencial / Proposta Única</label>
              <input
                type="text"
                value={editedDna.unique_value_proposition || ''}
                onChange={(e) => setEditedDna({ ...editedDna, unique_value_proposition: e.target.value })}
                className="w-full bg-[#0b0f19] border border-white/15 rounded-lg p-2.5 text-white"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">1. Nicho & Subnicho</span>
              <p className="text-white font-semibold">{dna.niche} {dna.subniche ? `→ ${dna.subniche}` : ''}</p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">2. Microsegmento Específico</span>
              <p className="text-emerald-300 font-semibold">{dna.microsegment || 'Em definição estratégica'}</p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">3. Público-Alvo Qualificado</span>
              <p className="text-white font-medium">{dna.target_audience || 'Profissionais e clientes do nicho'}</p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">4. Dor Principal Atacada</span>
              <p className="text-amber-200 font-medium">{dna.core_problem || 'Falta de método e clareza de conversão'}</p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">5. Oferta / Modelo</span>
              <p className="text-cyan-300 font-medium">{dna.offer_type || dna.business_model || 'Consultoria / Serviço'}</p>
            </div>

            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">6. Proposta Única de Valor</span>
              <p className="text-gray-200 font-medium">{dna.unique_value_proposition || 'Posicionamento estratégico diferenciado'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Pillars (3-5 Specific Pillars) */}
      <div className="bg-[#121826] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Pilares de Conteúdo Estratégicos
            </h3>
            <p className="text-xs text-gray-400">
              Cada pilar ataca uma dor específica com um objetivo de negócio claro.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(dna.content_pillars || []).map((pillar, idx) => (
            <div key={pillar?.id || idx} className="bg-[#0b0f19] border border-white/10 rounded-xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase">
                    Pilar 0{idx + 1}
                  </span>
                  <span className="text-[11px] text-gray-400 font-semibold">{pillar?.objective || 'Estratégico'}</span>
                </div>
                <h4 className="text-base font-bold text-white">{pillar?.name || `Pilar ${idx + 1}`}</h4>
                <p className="text-xs text-gray-300">{pillar?.description || pillar?.desire || pillar?.content_type || 'Alinhamento direto de conversão'}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                <div className="text-gray-400">
                  <strong className="text-gray-300 block text-[11px]">Dor atacada:</strong>
                  {pillar?.pain_or_problem || 'Gargalo de conversão e clareza'}
                </div>
                {pillar?.angles && pillar.angles.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {pillar.angles.slice(0, 3).map((a, i) => (
                      <span key={i} className="text-[10px] bg-white/5 text-gray-300 px-2 py-0.5 rounded">
                        #{a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <BioStrategyModal
        dna={dna}
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onApplyBio={async (text) => {
          const updated = { ...dna, unique_value_proposition: text };
          await ProfileDNAService.saveDNA(updated);
          setDna(updated);
        }}
      />

      <NameStrategyModal
        dna={dna}
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        onApplyName={async (name, handle) => {
          const updated = { ...dna, account_name: name, username: handle.replace('@', '') };
          await ProfileDNAService.saveDNA(updated);
          setDna(updated);
        }}
      />
    </div>
  );
};
