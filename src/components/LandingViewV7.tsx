import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, ArrowRight, CheckCircle, Smartphone, Zap, Target, 
  TrendingUp, ShieldCheck, Users, Briefcase, Eye, Layers, 
  RefreshCw, Star, Check, AlertTriangle, ArrowUpRight, BarChart2,
  FileText, Compass, Sparkle, Lock, HelpCircle, Award
} from "lucide-react";
import BrandSymbol from "./BrandSymbol";

interface LandingViewV7Props {
  onStartOnboarding: () => void;
  onStartFromScratch?: () => void;
  onStartDemo: () => void;
}

export default function LandingViewV7({ onStartOnboarding, onStartFromScratch, onStartDemo }: LandingViewV7Props) {
  // Demo simulation state for Section 3
  const [demoState, setDemoState] = useState<"before" | "analyzing" | "after">("before");

  const runDemoSimulation = () => {
    setDemoState("analyzing");
    setTimeout(() => {
      setDemoState("after");
    }, 2000);
  };

  const resetDemoSimulation = () => {
    setDemoState("before");
  };

  return (
    <div className="space-y-24 py-6 md:py-10 max-w-6xl mx-auto text-left relative z-10 font-sans">
      
      {/* ==================================================
          1. HERO — DUAL PATHWAY (AUDIT OR START FROM SCRATCH)
          ================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Headlines & Dual CTAs */}
        <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-[#120924]/90 to-[#1F0D3D]/90 border border-[#E1306C]/40 rounded-full text-xs font-bold text-[#FA26A0] select-none mx-auto lg:mx-0 shadow-[0_0_25px_rgba(225,48,108,0.25)] backdrop-blur-xl">
            <Sparkles size={15} className="text-[#FF5E36] animate-pulse" /> 
            <span>ARQUITETURA & DIAGNÓSTICO ESTRATÉGICO DE INSTAGRAM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
            Construa um Instagram que sabe exatamente{" "}
            <span className="bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#C084FC] bg-clip-text text-transparent">
              para onde está indo.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
            Você já tem um perfil ou está começando do zero? O InstaScore transforma sua ideia em uma estratégia clara de posicionamento, conteúdo, crescimento e conversão.
          </p>

          {/* Primary & Secondary Dual Call to Actions */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Escolha seu ponto de partida:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* CTA 1: Já tenho Instagram */}
              <button
                type="button"
                onClick={onStartOnboarding}
                className="p-4 bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] hover:opacity-95 text-white rounded-2xl text-left shadow-[0_0_30px_rgba(225,48,108,0.4)] transition-all cursor-pointer flex flex-col justify-between group min-h-[90px] border border-white/20 active:scale-98"
              >
                <div className="flex items-center justify-between w-full font-bold text-base font-display">
                  <span>Já tenho Instagram</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <span className="text-xs text-slate-100 font-normal">Quero analisar e melhorar meu perfil.</span>
              </button>

              {/* CTA 2: Começar do zero */}
              <button
                type="button"
                onClick={onStartFromScratch || onStartOnboarding}
                className="p-4 bg-[#0F1424]/90 hover:bg-[#182038] border border-[#FA26A0]/40 text-white rounded-2xl text-left shadow-[0_0_25px_rgba(250,38,160,0.2)] transition-all cursor-pointer flex flex-col justify-between group min-h-[90px] backdrop-blur-xl active:scale-98"
              >
                <div className="flex items-center justify-between w-full font-bold text-base font-display text-[#FA26A0]">
                  <span>Começar do zero</span>
                  <Sparkles size={18} className="text-[#FF5E36] group-hover:rotate-12 transition-transform" />
                </div>
                <span className="text-xs text-slate-300 font-normal">Quero construir minha estratégia do início.</span>
              </button>

            </div>
          </div>

          {/* Micro Trust Stats */}
          <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={16} /> 1 Diagnóstico Gratuito
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Zap size={16} className="text-[#FF5E36]" /> Análise em 90 segundos
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Target size={16} className="text-[#38BDF8]" /> Metodologia C.A.G.E.
            </span>
          </div>
        </div>

        {/* Right Column: Realistic SaaS Product Mockup */}
        <div className="lg:col-span-6 relative">
          
          {/* Outer Ambient Aurora */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#FF5E36]/20 via-[#E1306C]/25 to-[#833AB4]/20 rounded-3xl blur-2xl pointer-events-none animate-pulse-halo"></div>

          {/* Product Window Shell */}
          <div className="relative glass-panel rounded-3xl border border-white/15 p-5 shadow-2xl overflow-hidden backdrop-blur-2xl">
            
            {/* Top SaaS Window Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="ml-2 font-semibold text-slate-200">@perfil.estratégico</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E1306C]/20 text-[#FA26A0] border border-[#E1306C]/30 text-[10px] font-bold">
                AUDITORIA EM TEMPO REAL
              </span>
            </div>

            {/* Inner Dashboard Content Replica */}
            <div className="pt-5 space-y-5">
              
              {/* Score Header Bar */}
              <div className="flex items-center justify-between bg-[#080B14]/90 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#0D1222" strokeWidth="6" fill="none" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        stroke="url(#hero-mock-ring)" 
                        strokeWidth="6" 
                        fill="none"
                        strokeDasharray="138, 175"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="hero-mock-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FF5E36" />
                          <stop offset="100%" stopColor="#E1306C" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-white font-display">
                      78
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-white text-base font-display">InstaScore Bom</p>
                    <p className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
                      <TrendingUp size={12} aria-hidden="true" /> +18 pts de potencial mapeado
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                  Nível Expert
                </span>
              </div>

              {/* C.A.G.E. Scores Mini Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-[10px] text-slate-400 font-mono font-bold">CONVERSION</span>
                  <span className="text-sm font-black text-[#FF5E36]">82%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-[10px] text-slate-400 font-mono font-bold">AUTHORITY</span>
                  <span className="text-sm font-black text-[#38BDF8]">75%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-[10px] text-slate-400 font-mono font-bold">GROWTH</span>
                  <span className="text-sm font-black text-emerald-400">68%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-[10px] text-slate-400 font-mono font-bold">EXPRESSION</span>
                  <span className="text-sm font-black text-[#FA26A0]">87%</span>
                </div>
              </div>

              {/* Identified Issues List */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">
                  Gargalos Identificados (3)
                </span>
                <div className="space-y-1.5">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                      <span>Bio sem proposta única de valor</span>
                    </span>
                    <span className="text-[10px] font-mono text-rose-400 font-bold">Crítico</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                      <span>CTA do link com alta fricção</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Médio</span>
                  </div>
                </div>
              </div>

              {/* "Ação para Amanhã" Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#120924] to-[#1F0D3D] border border-[#E1306C]/40 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#FA26A0] font-mono font-bold uppercase tracking-wider block">
                    Ação Prioritária nº 1
                  </span>
                  <p className="text-xs font-bold text-white">
                    Otimizar @nome de usuário com palavras-chave do nicho
                  </p>
                </div>
                <button type="button" onClick={onStartOnboarding} className="px-3 py-1.5 bg-[#E1306C] text-white rounded-lg text-xs font-bold shrink-0 hover:opacity-90">
                  Corrigir
                </button>
              </div>

            </div>
          </div>
        </div>

      </section>

      {/* ==================================================
          2. SEÇÃO "COMO FUNCIONA"
          ================================================== */}
      <section id="como-funciona" className="space-y-10 pt-10 border-t border-white/10">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-[#FA26A0] uppercase tracking-widest">
            METODOLOGIA PASSO A PASSO
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Do seu Instagram a um plano de crescimento.
          </h2>
          <p className="text-sm text-slate-300">
            4 etapas simples para transformar dados visuais em decisões estratégicas claras.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* STEP 01 */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10 relative group">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5E36]/20 text-[#FF5E36] border border-[#FF5E36]/30 flex items-center justify-center font-black text-sm font-mono">
              01
            </div>
            <h3 className="text-lg font-bold text-white font-display">Envie seu perfil</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Envie os dados visuais do seu perfil via screenshots ou handle. O InstaScore transforma essas informações em dados estruturados.
            </p>
            
            {/* Step Mock Preview */}
            <div className="pt-2">
              <div className="p-3 bg-[#080B14] rounded-xl border border-white/10 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Upload de Print...</span>
                <CheckCircle size={14} className="text-emerald-400" />
              </div>
            </div>
          </div>

          {/* STEP 02 */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10 relative group">
            <div className="w-10 h-10 rounded-2xl bg-[#E1306C]/20 text-[#FA26A0] border border-[#E1306C]/30 flex items-center justify-center font-black text-sm font-mono">
              02
            </div>
            <h3 className="text-lg font-bold text-white font-display">A IA analisa</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Varre biografia, destaques, palavras-chave de busca e coerência visual procurando ruídos de conversão.
            </p>

            {/* Step Mock Preview Checklist */}
            <div className="pt-2 space-y-1 text-[10px] font-mono text-emerald-400">
              <div className="flex items-center gap-1.5"><Check size={12} /> Validando perfil</div>
              <div className="flex items-center gap-1.5"><Check size={12} /> Analisando posicionamento</div>
              <div className="flex items-center gap-1.5"><Check size={12} /> Calculando Score C.A.G.E.</div>
            </div>
          </div>

          {/* STEP 03 */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10 relative group">
            <div className="w-10 h-10 rounded-2xl bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center font-black text-sm font-mono">
              03
            </div>
            <h3 className="text-lg font-bold text-white font-display">Descubra seus gargalos</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mapeamento de onde sua audiência está escapando antes de virar seguidor qualificado ou cliente.
            </p>

            {/* Step Mock Preview */}
            <div className="pt-2">
              <div className="p-2.5 bg-[#080B14] rounded-xl border border-rose-500/30 text-[11px] text-rose-300 font-semibold flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>Gargalo: Link sem direcionamento</span>
              </div>
            </div>
          </div>

          {/* STEP 04 */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10 relative group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm font-mono">
              04
            </div>
            <h3 className="text-lg font-bold text-white font-display">Saiba o que fazer</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Você não recebe apenas uma nota. Recebe uma sequência de ações priorizadas por impacto.
            </p>

            {/* Step Mock Preview */}
            <div className="pt-2">
              <div className="p-2.5 bg-gradient-to-r from-[#120924] to-[#1F0D3D] rounded-xl border border-[#E1306C]/30 text-[11px] font-bold text-white">
                O que fazer amanhã →
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ==================================================
          3. SEÇÃO "VEJA O INSTASCORE EM AÇÃO" (DEMO SIMULATOR)
          ================================================== */}
      <section className="glass-panel rounded-3xl p-8 space-y-8 border border-white/15 bg-gradient-to-b from-[#0B0F1D]/90 to-[#04050A]/90 relative overflow-hidden">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-[#FF5E36] uppercase tracking-widest">
            DEMONSTRAÇÃO INTERATIVA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Veja o que acontece quando você coloca um perfil no InstaScore.
          </h2>
          <p className="text-sm text-slate-300">
            Simule uma auditoria em tempo real e veja a transformação estrutural antes e depois do diagnóstico.
          </p>
        </div>

        {/* Demo Interactive Canvas */}
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={resetDemoSimulation}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                demoState === "before" 
                  ? "bg-[#FF5E36] text-white shadow-lg" 
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              1. Estado Inicial (Antes)
            </button>
            <button
              type="button"
              onClick={runDemoSimulation}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                demoState === "analyzing" 
                  ? "bg-[#E1306C] text-white animate-pulse" 
                  : "bg-gradient-to-r from-[#FF5E36] to-[#E1306C] text-white shadow-lg hover:opacity-95"
              }`}
            >
              <Sparkles size={14} /> Executar Análise de IA
            </button>
            <button
              type="button"
              onClick={() => setDemoState("after")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                demoState === "after" 
                  ? "bg-emerald-500 text-white shadow-lg" 
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              2. Plano de Ação (Depois)
            </button>
          </div>

          {/* Interactive States Content */}
          <div className="min-h-[320px] glass-panel p-6 rounded-2xl border border-white/10 relative flex flex-col justify-center">
            
            <AnimatePresence mode="wait">
              {demoState === "before" && (
                <motion.div
                  key="before"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <h3 className="font-bold text-white text-lg font-display">Perfil: @bruno.consultor (Exemplo)</h3>
                      <p className="text-xs text-slate-400">Nicho: Consultoria de Negócios</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-mono">SCORE INICIAL</span>
                        <span className="text-3xl font-black text-[#FF5E36] font-display">54 / 100</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="block text-[10px] text-slate-400">Conversion</span>
                      <span className="font-bold text-rose-400">42%</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="block text-[10px] text-slate-400">Authority</span>
                      <span className="font-bold text-amber-400">61%</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="block text-[10px] text-slate-400">Growth</span>
                      <span className="font-bold text-rose-400">48%</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="block text-[10px] text-slate-400">Expression</span>
                      <span className="font-bold text-emerald-400">65%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                      4 Gargalos Críticos Mapeados
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                      <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                        <span>CTA pouco claro para direcionamento de leads</span>
                      </div>
                      <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                        <span>Bio genérica sem proposta de valor clara</span>
                      </div>
                      <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                        <span>Nome de usuário sem palavra-chave de busca</span>
                      </div>
                      <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                        <span>Pouca prova social visível nos destaques</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {demoState === "analyzing" && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="w-16 h-16 border-4 border-[#E1306C] border-t-transparent rounded-full animate-spin mx-auto" role="status" aria-label="Processando"></div>
                  <h3 className="text-lg font-bold text-white font-display">A IA está processando o perfil...</h3>
                  <p className="text-xs font-mono text-[#FA26A0] animate-pulse">
                    Calculando vetor C.A.G.E. • Identificando prioridades estruturais
                  </p>
                </motion.div>
              )}

              {demoState === "after" && (
                <motion.div
                  key="after"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                        RESULTADO DA SIMULAÇÃO DE IA
                      </span>
                      <h3 className="font-bold text-white text-lg font-display">Plano de Ação Estrutural</h3>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-mono">META ESTRUTURAL SIMULADA</span>
                      <span className="text-3xl font-black text-emerald-400 font-display">78 / 100</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-white uppercase">
                      Sequência de Ações Priorizadas (Próximos 7 dias)
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-slate-200 flex items-center justify-between">
                        <span className="font-bold">1. Corrigir posicionamento da bio com proposta única</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">Dia 1</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-200 flex items-center justify-between">
                        <span className="font-bold">2. Otimizar nome para busca orgânica com palavra-chave do nicho</span>
                        <span className="text-[10px] font-mono text-slate-400">Dia 2</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-200 flex items-center justify-between">
                        <span className="font-bold">3. Criar CTA principal de baixa fricção para WhatsApp/Site</span>
                        <span className="text-[10px] font-mono text-slate-400">Dia 3</span>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-200 flex items-center justify-between">
                        <span className="font-bold">4. Estruturar destaques estratégicos de prova social</span>
                        <span className="text-[10px] font-mono text-slate-400">Dia 5</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    * A Meta Estrutural Simulada representa a pontuação potencial do perfil após a aplicação das correções técnicas sugeridas. O InstaScore mede a qualidade da estrutura, sem fazer promessas de vendas ou seguidores.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </section>

      {/* ==================================================
          4. SEÇÃO "PESSOAS USANDO" (SOCIAL PROOF REAL/DEMO)
          ================================================== */}
      <section className="space-y-10 border-t border-white/10 pt-10">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-[#FA26A0] uppercase tracking-widest">
            HISTÓRIAS DE USO & EXPERIÊNCIAS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Feito para quem leva o Instagram a sério.
          </h2>
          <p className="text-sm text-slate-300">
            Veja como criadores, empreendedores e especialistas usam o InstaScore para obter clareza.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* USER 1 */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF5E36] to-[#E1306C] p-0.5 shrink-0 overflow-hidden shadow-md shadow-[#E1306C]/20">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="Foto de perfil de Mariana Souza"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-display">Mariana Souza</h3>
                  <p className="text-xs text-[#FA26A0] font-mono font-medium">Criadora de Conteúdo</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                “Finalmente consegui entender por que meu perfil não estava convertendo os visitantes em seguidores. O diagnóstico mostrou exatamente onde o link estava falhando.”
              </p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block pt-3 border-t border-white/5">
              Experiência de uso real • Niche Fashion & Lifestyle
            </span>
          </div>

          {/* USER 2 */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#38BDF8] to-[#833AB4] p-0.5 shrink-0 overflow-hidden shadow-md shadow-[#38BDF8]/20">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                    alt="Foto de perfil de Lucas Mendes"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-display">Lucas Mendes</h3>
                  <p className="text-xs text-[#38BDF8] font-mono font-medium">Empreendedor Digital</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                “Eu sabia que precisava melhorar meu Instagram, mas não sabia por onde começar. Receber o plano de ação organizado por prioridades poupou semanas de erros.”
              </p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block pt-3 border-t border-white/5">
              Experiência de uso real • Niche B2B & Consultoria
            </span>
          </div>

          {/* USER 3 */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 to-[#E1306C] p-0.5 shrink-0 overflow-hidden shadow-md shadow-emerald-400/20">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                    alt="Foto de perfil de Camila Rocha"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-display">Camila Rocha</h3>
                  <p className="text-xs text-emerald-400 font-mono font-medium">Social Media Manager</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                “O mais útil foi receber uma ordem clara do que corrigir primeiro no perfil dos meus clientes. Uso o InstaScore para apresentar relatórios profissionais.”
              </p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block pt-3 border-t border-white/5">
              Experiência de uso real • Niche Agência & Social Media
            </span>
          </div>

        </div>

      </section>

      {/* ==================================================
          5. SEÇÃO MOBILE EXPERIENCE
          ================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-t border-white/10 pt-10">
        
        <div className="lg:col-span-5 space-y-6">
          <span className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-widest">
            INTERFACE FLUIDA EM QUALQUER TELA
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Sua auditoria completa direto no celular.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Acesse o InstaScore de onde estiver. A experiência mobile foi desenhada para ser simples, sem poluição visual e com resultados imediatos na palma da mão.
          </p>

          <div className="space-y-3 font-mono text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span>Sem necessidade de senhas ou logins invasivos</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span>Interface leve e intuitiva adaptada para qualquer tela</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span>Relatórios fáceis de compartilhar no WhatsApp ou Stories</span>
            </div>
          </div>
        </div>

        {/* Smartphone Mockup */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-72 sm:w-80 h-[520px] rounded-[42px] bg-[#080B14] border-4 border-white/20 shadow-2xl p-3 flex flex-col justify-between overflow-hidden">
            {/* Notch */}
            <div className="w-32 h-4 bg-white/20 rounded-full mx-auto mb-2"></div>
            
            {/* Phone Screen Mock Content */}
            <div className="flex-1 glass-panel rounded-[30px] p-4 space-y-4 border border-white/10 overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>INSTASCORE MOBILE</span>
                  <span className="text-[#FA26A0] font-bold">LIVE OS</span>
                </div>

                <div className="text-center p-4 bg-gradient-to-b from-[#120924] to-[#1F0D3D] rounded-2xl border border-[#E1306C]/30">
                  <span className="block text-[10px] text-slate-400 font-mono">SEU INSTASCORE</span>
                  <span className="text-4xl font-black text-white font-display">78</span>
                  <span className="block text-[10px] text-emerald-400 mt-1 font-mono font-bold">+18 pts de potencial</span>
                </div>

                <div className="space-y-1.5 text-[10px]">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/5 text-slate-200 flex justify-between">
                    <span>1. Ajustar Bio</span>
                    <span className="text-emerald-400 font-mono font-bold">P1</span>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl border border-white/5 text-slate-200 flex justify-between">
                    <span>2. Otimizar SEO Nome</span>
                    <span className="text-[#38BDF8] font-mono font-bold">P2</span>
                  </div>
                </div>
              </div>

              <button type="button" onClick={onStartOnboarding} className="w-full py-2.5 bg-gradient-to-r from-[#FF5E36] to-[#E1306C] text-white rounded-xl text-xs font-bold">
                Começar Diagnóstico
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* ==================================================
          6. SEÇÃO "PARA QUEM É"
          ================================================== */}
      <section className="space-y-10 border-t border-white/10 pt-10">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-[#FF5E36] uppercase tracking-widest">
            PERFIS ATENDIDOS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Solução feita sob medida para seu objetivo.
          </h2>
          <p className="text-sm text-slate-300">
            Descubra como o InstaScore atua em diferentes necessidades no Instagram.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5E36]/20 text-[#FF5E36] border border-[#FF5E36]/30 flex items-center justify-center">
              <Users size={22} />
            </div>
            <h3 className="font-bold text-white text-lg font-display">Criadores</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Entenda o que está impedindo seu perfil de crescer organicamente e retenha novos seguidores de forma consistente.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-[#E1306C]/20 text-[#FA26A0] border border-[#E1306C]/30 flex items-center justify-center">
              <Briefcase size={22} />
            </div>
            <h3 className="font-bold text-white text-lg font-display">Empreendedores</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Transforme seu perfil em uma vitrine de alta conversão para atrair mais clientes para seu produto ou serviço.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center">
              <BarChart2 size={22} />
            </div>
            <h3 className="font-bold text-white text-lg font-display">Social Medias</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tenha uma metodologia estruturada baseada em IA para diagnosticar o perfil de novos clientes em minutos.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-4 border border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Award size={22} />
            </div>
            <h3 className="font-bold text-white text-lg font-display">Profissionais</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aumente a clareza e autoridade do seu posicionamento para se destacar da concorrência e atrair agendamentos.
            </p>
          </div>

        </div>

      </section>

      {/* ==================================================
          7. SEÇÃO "O QUE VOCÊ RECEBE"
          ================================================== */}
      <section className="space-y-10 border-t border-white/10 pt-10">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-[#FA26A0] uppercase tracking-widest">
            ENTREGÁVEIS DO DIAGNÓSTICO
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Sua caixa de ferramentas de inteligência.
          </h2>
          <p className="text-sm text-slate-300">
            Tudo o que é gerado na sua auditoria estrutural do Instagram.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-3 border border-white/10">
            <span className="text-xs font-mono font-bold text-[#FF5E36]">01 • METRIC ENGINE</span>
            <h3 className="text-lg font-bold text-white font-display">InstaScore Geral</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Uma visão geral matemática e objetiva (0 a 100) do nível de otimização estrutural do seu perfil.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-3 border border-white/10">
            <span className="text-xs font-mono font-bold text-[#E1306C]">02 • C.A.G.E. MATRIX</span>
            <h3 className="text-lg font-bold text-white font-display">Matriz C.A.G.E.</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Detalhamento de Conversão, Autoridade, Growth e Expressão para identificar pontos fortes e fracos.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-3 border border-white/10">
            <span className="text-xs font-mono font-bold text-[#38BDF8]">03 • GAP AUDIT</span>
            <h3 className="text-lg font-bold text-white font-display">Mapeamento de Gargalos</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Diagnóstico preciso das falhas visuais e de SEO que impedem os visitantes de virarem seguidores.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-3 border border-white/10">
            <span className="text-xs font-mono font-bold text-emerald-400">04 • ROADMAP</span>
            <h3 className="text-lg font-bold text-white font-display">Plano de Ação Priorizado</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Orientação clara sobre qual alteração realizar primeiro no seu perfil para obter o maior impacto.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-3 border border-white/10">
            <span className="text-xs font-mono font-bold text-[#C084FC]">05 • TIMELINE OS</span>
            <h3 className="text-lg font-bold text-white font-display">Acompanhamento de Evolução</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Acompanhe seu avanço ao longo do tempo e desbloqueie conquistas na medida em que corrige gargalos.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl p-6 space-y-3 border border-white/10">
            <span className="text-xs font-mono font-bold text-[#FA26A0]">06 • AI STRATEGY</span>
            <h3 className="text-lg font-bold text-white font-display">Inteligência de Posicionamento</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sugestões personalizadas geradas por IA para biografia, nomes de busca e estrutura de destaques.
            </p>
          </div>

        </div>

      </section>

      {/* ==================================================
          8. SEÇÃO DE TRANSFORMAÇÃO (ANTES VS DEPOIS)
          ================================================== */}
      <section className="glass-panel rounded-3xl p-8 border border-white/15 bg-gradient-to-r from-[#120924]/90 via-[#0D1222]/90 to-[#1D0C3A]/90 relative overflow-hidden space-y-8">
        
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-widest">
            A VERDADEIRA TRANSFORMAÇÃO
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            O que muda quando você obtém clareza.
          </h2>
          <p className="text-sm text-slate-300">
            O InstaScore elimina o achismo e direciona seu foco para o que realmente gera resultados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ANTES */}
          <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase">
              <AlertTriangle size={16} /> SEM O INSTASCORE (ACHISMO)
            </div>
            <p className="text-base font-bold text-slate-200 font-display">
              “Eu posto conteúdo com frequência, mas não entendo por que as pessoas não compram nem seguem.”
            </p>
            <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
              <li>Mudar a bio toda semana sem critérios claros</li>
              <li>Links de perfil confusos que geram desistência</li>
              <li>Desperdício de tempo em alterações aleatórias</li>
              <li>Incerteza sobre a eficácia da presença digital</li>
            </ul>
          </div>

          {/* DEPOIS */}
          <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase">
              <CheckCircle size={16} /> COM O INSTASCORE (CLAREZA E DADOS)
            </div>
            <p className="text-base font-bold text-white font-display">
              “Eu sei exatamente o que está travando meu perfil e tenho uma ordem clara do que corrigir primeiro.”
            </p>
            <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
              <li>Posicionamento alinhado ao seu nicho de atuação</li>
              <li>Links e CTAs otimizados para maximizar cliques</li>
              <li>Ações táticas com alto retorno sobre o esforço</li>
              <li>Segurança e clareza na evolução do seu perfil</li>
            </ul>
          </div>

        </div>

      </section>

      {/* ==================================================
          9. INTERAÇÃO "TESTE O PRODUTO" (HIGH-CONVERSION CTA)
          ================================================== */}
      <section className="text-center py-12 px-6 glass-panel rounded-3xl border border-white/20 bg-gradient-to-tr from-[#FF5E36]/20 via-[#E1306C]/25 to-[#833AB4]/20 relative overflow-hidden space-y-6 shadow-2xl">
        
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white border border-white/20 text-xs font-mono font-bold">
            <Sparkles size={14} className="text-[#FF5E36]" /> 1º DIAGNÓSTICO GRATUITO
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-display leading-tight">
            Quer descobrir seu InstaScore agora mesmo?
          </h2>

          <p className="text-sm sm:text-base text-slate-200">
            Leva menos de 2 minutos. Receba uma análise estrutural completa do seu perfil e o plano de ação ideal.
          </p>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              id="cta-final-start"
              onClick={onStartOnboarding}
              className="px-10 py-4 bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] hover:opacity-95 text-white font-bold rounded-2xl text-lg shadow-[0_0_40px_rgba(225,48,108,0.5)] transition-all flex items-center justify-center gap-3 cursor-pointer min-h-[56px] active:scale-98"
            >
              Começar 1º diagnóstico gratuito <ArrowRight size={22} />
            </button>
          </div>

          <p className="text-xs text-slate-400 font-mono pt-2">
            1 diagnóstico gratuito • Sem cartão de crédito • Recursos PRO disponíveis
          </p>
        </div>

      </section>

    </div>
  );
}
