import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, ArrowRight, CheckCircle, Copy, Check, Target, 
  ShieldCheck, TrendingUp, Zap, Compass, Layers, Calendar, 
  Star, Share2, Download, AlertTriangle, UserCheck, RefreshCw,
  HelpCircle, ChevronDown, ChevronUp, Lock, Bookmark, MessageSquare
} from "lucide-react";
import { StartModeResult, NameSuggestion, BioOption } from "../types/start-mode";
import BrandSymbol from "./BrandSymbol";

interface StartModeResultViewProps {
  data: StartModeResult;
  onRestart: () => void;
  onSwitchToAuditMode: () => void;
}

export default function StartModeResultView({
  data,
  onRestart,
  onSwitchToAuditMode
}: StartModeResultViewProps) {
  const [selectedName, setSelectedName] = useState<NameSuggestion>(data.selectedName || data.nameSuggestions[0]);
  const [selectedBio, setSelectedBio] = useState<BioOption>(data.selectedBio || data.bioOptions[0]);
  const [copiedBio, setCopiedBio] = useState<boolean>(false);
  const [copiedPositioning, setCopiedPositioning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"names" | "bios" | "posts" | "calendar">("names");
  const [nameCategoryFilter, setNameCategoryFilter] = useState<string>("ALL");

  const handleCopyBio = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
  };

  const handleCopyPositioning = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPositioning(true);
    setTimeout(() => setCopiedPositioning(false), 2000);
  };

  const filteredNames = nameCategoryFilter === "ALL" 
    ? data.nameSuggestions 
    : data.nameSuggestions.filter(n => n.category === nameCategoryFilter);

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto text-left font-sans animate-fade-in">
      
      {/* HEADER BANNER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 bg-gradient-to-r from-[#120924]/90 via-[#0D1222]/90 to-[#1F0D3D]/90 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E1306C]/20 border border-[#E1306C]/30 text-xs font-mono font-bold text-[#FA26A0]">
            <Sparkles size={14} className="text-[#FF5E36]" /> INSTASCORE START OS V7
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-display">
            SEU INSTAGRAM COMEÇA AQUI
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Sua arquitetura completa de posicionamento, naming, bio, pilares e plano de 30 dias gerados para o seu projeto.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={onRestart}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} /> Novo Projeto
          </button>
          <button
            type="button"
            onClick={onSwitchToAuditMode}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5E36] to-[#E1306C] text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            Já tenho Instagram (Auditar) <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 1. START SCORE & C.A.G.E. PRE-LAUNCH READINESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Start Score Gauge */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              PRONTIDÃO DO PROJETO
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
              START SCORE
            </span>
          </div>

          <div className="flex items-center gap-5 my-2">
            <div className="relative shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#0D1222" strokeWidth="8" fill="none" />
                <circle 
                  cx="48" 
                  cy="48" 
                  r="40" 
                  stroke="url(#start-score-ring)" 
                  strokeWidth="8" 
                  fill="none"
                  strokeDasharray={`${(data.startScore / 100) * 251}, 251`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="start-score-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF5E36" />
                    <stop offset="100%" stopColor="#E1306C" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-white font-display">
                {data.startScore}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white text-lg font-display">Seu projeto está {data.startScore}/100 pronto</h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                Estratégia inicial estruturada com alto potencial de atração e conversão desde o 1º dia.
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#080B14] rounded-2xl border border-white/10 text-xs font-mono text-slate-300">
            <strong className="text-white">Nota de Arquitetura:</strong> O Start Score mede a clareza estratégica e não deve ser confundido com a auditoria de uma conta já ativa.
          </div>
        </div>

        {/* Right: C.A.G.E. Pre-launch Breakdown */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/15 space-y-4">
          <span className="text-xs font-mono font-bold text-[#FA26A0] uppercase tracking-wider block">
            MATRIZ C.A.G.E. DE LANÇAMENTO
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="block text-[10px] text-slate-400 font-mono font-bold">C • CONVERSION</span>
              <span className="text-xl font-black text-[#FF5E36] font-display">{data.cageScores.conversion}%</span>
              <p className="text-[10px] text-slate-400">Funil & CTAs</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="block text-[10px] text-slate-400 font-mono font-bold">A • AUTHORITY</span>
              <span className="text-xl font-black text-[#38BDF8] font-display">{data.cageScores.authority}%</span>
              <p className="text-[10px] text-slate-400">Posicionamento</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="block text-[10px] text-slate-400 font-mono font-bold">G • GROWTH</span>
              <span className="text-xl font-black text-emerald-400 font-display">{data.cageScores.growth}%</span>
              <p className="text-[10px] text-slate-400">Descoberta SEO</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="block text-[10px] text-slate-400 font-mono font-bold">E • EXPRESSION</span>
              <span className="text-xl font-black text-[#FA26A0] font-display">{data.cageScores.expression}%</span>
              <p className="text-[10px] text-slate-400">Identidade</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#120924] to-[#1F0D3D] border border-[#E1306C]/30 text-xs text-slate-200 flex items-center justify-between">
            <span className="font-bold">Território de Nicho:</span>
            <span className="font-mono text-[#FA26A0] font-bold">{data.territory.recommendedSubniche}</span>
          </div>
        </div>

      </div>

      {/* 2. PROFILE PREVIEW MOCKUP ("SEU PERFIL ANTES DE PUBLICAR") */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-[#FF5E36] uppercase tracking-widest">
              PRÉVIA VISUAL DO INSTAGRAM
            </span>
            <h2 className="text-xl font-bold text-white font-display">Seu perfil antes de publicar</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Clique em qualquer nome ou bio abaixo para atualizar esta prévia</span>
        </div>

        {/* Live Profile Card Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-7 bg-[#080B14] p-5 sm:p-6 rounded-3xl border border-white/15 space-y-4 shadow-2xl">
            {/* Header / Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF5E36] via-[#E1306C] to-[#833AB4] p-1 shrink-0">
                <div className="w-full h-full bg-[#080B14] rounded-full flex items-center justify-center text-white font-bold text-lg font-display">
                  {selectedName.name.charAt(0)}
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base font-display">{selectedName.name}</h3>
                <span className="text-xs font-mono text-[#FA26A0] font-semibold">{selectedName.handle}</span>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{data.territory.recommendedSubniche}</span>
              </div>
            </div>

            {/* Bio Text Render */}
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-200 whitespace-pre-line font-mono leading-relaxed">
              {selectedBio.text}
            </div>

            {/* Highlights Bar Mock */}
            <div className="pt-2 flex items-center gap-3 overflow-x-auto pb-1 text-[10px] font-mono text-slate-400">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white">✨</div>
                <span>Comece Aqui</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white">👤</div>
                <span>Sobre</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white">💼</div>
                <span>Serviços</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-white">💬</div>
                <span>Dúvidas</span>
              </div>
            </div>
          </div>

          {/* Checklist Status Right */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">Checklist de Estruturação</span>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <CheckCircle size={16} /> <span>Posicionamento definido</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <CheckCircle size={16} /> <span>Nome & @ selecionados</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <CheckCircle size={16} /> <span>Bio de conversão pronta</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <CheckCircle size={16} /> <span>4 Pilares de conteúdo gerados</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                <CheckCircle size={16} /> <span>Plano de 30 dias pronto</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. TABS NAVIGATION FOR DETAILED MODULES */}
      <div className="space-y-6">
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 text-xs font-bold font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("names")}
            className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "names"
                ? "bg-[#E1306C] text-white shadow-lg"
                : "bg-white/5 hover:bg-white/10 text-slate-400"
            }`}
          >
            1. Gerador de Nomes (20 Sugestões)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bios")}
            className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "bios"
                ? "bg-[#E1306C] text-white shadow-lg"
                : "bg-white/5 hover:bg-white/10 text-slate-400"
            }`}
          >
            2. Bio Builder (5 Versões)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "posts"
                ? "bg-[#E1306C] text-white shadow-lg"
                : "bg-white/5 hover:bg-white/10 text-slate-400"
            }`}
          >
            3. Primeiros 10 Conteúdos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "calendar"
                ? "bg-[#E1306C] text-white shadow-lg"
                : "bg-white/5 hover:bg-white/10 text-slate-400"
            }`}
          >
            4. Calendário de 30 Dias
          </button>
        </div>

        {/* TAB 1: NAMES GENERATOR */}
        {activeTab === "names" && (
          <div className="space-y-6 glass-panel p-6 rounded-3xl border border-white/15">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white font-display">20 Sugestões de Nomes de Perfil</h3>
                <p className="text-xs text-slate-300">Escolha o nome ideal para o seu projeto e aplique na prévia visual.</p>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                {["ALL", "Autoridade", "Memorável", "Premium", "Criativo", "Pessoal", "Comercial"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNameCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                      nameCategoryFilter === cat
                        ? "bg-[#FF5E36] text-white font-bold"
                        : "bg-white/5 hover:bg-white/10 text-slate-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Names Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNames.map((item, idx) => {
                const isSelected = selectedName.name === item.name;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                      isSelected
                        ? "bg-gradient-to-r from-[#120924] to-[#1F0D3D] border-[#E1306C] shadow-[0_0_20px_rgba(225,48,108,0.2)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#FA26A0] uppercase px-2 py-0.5 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/20">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          Memorabilidade: {item.memorabilityScore}%
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-base font-display">{item.name}</h4>
                      <p className="text-xs font-mono text-[#38BDF8] font-semibold">{item.handle}</p>
                      <p className="text-xs text-slate-300">{item.whyItWorks}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedName(item)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500 text-white cursor-default"
                          : "bg-white/10 hover:bg-white/20 text-slate-200"
                      }`}
                    >
                      {isSelected ? "✓ Nome Selecionado" : "Salvar este nome"}
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 italic font-mono pt-2 border-t border-white/10">
              * Sugestão de @ — a disponibilidade exata precisa ser confirmada no aplicativo do Instagram ao criar a conta.
            </p>
          </div>
        )}

        {/* TAB 2: BIO BUILDER */}
        {activeTab === "bios" && (
          <div className="space-y-6 glass-panel p-6 rounded-3xl border border-white/15">
            <div>
              <h3 className="text-lg font-bold text-white font-display">5 Versões Estratégicas de Bio</h3>
              <p className="text-xs text-slate-300">Todas as bios foram formatadas para respeitar o limite de 150 caracteres do Instagram.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.bioOptions.map((bio) => {
                const isSelected = selectedBio.id === bio.id;

                return (
                  <div
                    key={bio.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                      isSelected
                        ? "bg-gradient-to-r from-[#120924] to-[#1F0D3D] border-[#E1306C] shadow-[0_0_20px_rgba(225,48,108,0.2)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#FF5E36] uppercase px-2 py-0.5 rounded-full bg-[#FF5E36]/10 border border-[#FF5E36]/20">
                          {bio.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {bio.text.length} / 150 chars
                        </span>
                      </div>

                      <div className="p-3 bg-[#080B14] rounded-xl border border-white/10 text-xs text-slate-200 whitespace-pre-line font-mono leading-relaxed">
                        {bio.text}
                      </div>

                      <p className="text-xs text-slate-300 italic">{bio.highlight}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBio(bio)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500 text-white cursor-default"
                            : "bg-white/10 hover:bg-white/20 text-slate-200"
                        }`}
                      >
                        {isSelected ? "✓ Bio Ativa" : "Usar esta Bio"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyBio(bio.text)}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Copy size={14} /> Copiar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: FIRST 10 POSTS */}
        {activeTab === "posts" && (
          <div className="space-y-6 glass-panel p-6 rounded-3xl border border-white/15">
            <div>
              <h3 className="text-lg font-bold text-white font-display">10 Primeiras Publicações Priorizadas</h3>
              <p className="text-xs text-slate-300">Sua sequência de lançamento com roteiro, hook, objetivo e chamada para ação.</p>
            </div>

            <div className="space-y-4">
              {data.first10Posts.map((post) => (
                <div key={post.dayNumber} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#FF5E36] text-white font-mono font-bold text-xs flex items-center justify-center">
                        D{post.dayNumber}
                      </span>
                      <h4 className="font-bold text-white text-sm font-display">{post.topic}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 font-bold">
                        {post.format}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        {post.pillar}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold block">GANCHO DE ABERTURA (HOOK):</span>
                      <p className="font-bold text-white text-sm">“{post.hook}”</p>
                    </div>

                    <div className="p-3 bg-[#080B14] rounded-xl border border-white/10 font-mono text-slate-300 text-[11px] whitespace-pre-line">
                      <strong>Legenda Sugerida:</strong><br />
                      {post.suggestedCaption}
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                      <span><strong>Objetivo:</strong> {post.goal}</span>
                      <span className="text-[#FA26A0]"><strong>CTA:</strong> {post.cta}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CALENDAR 30 DAYS */}
        {activeTab === "calendar" && (
          <div className="space-y-6 glass-panel p-6 rounded-3xl border border-white/15">
            <div>
              <h3 className="text-lg font-bold text-white font-display">Calendário Estratégico de 30 Dias</h3>
              <p className="text-xs text-slate-300">Distribuição balanceada entre Descoberta, Autoridade, Relacionamento e Conversão.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data.calendar30Days.map((item) => (
                <div key={item.day} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#FF5E36]">Dia {item.day}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {item.funnelStage}
                    </span>
                  </div>
                  <h5 className="font-bold text-white truncate">{item.content}</h5>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                    <span>{item.format}</span>
                    <span className="text-emerald-400">{item.cta.slice(0, 20)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 4. "SUA PRÓXIMA AÇÃO" (NEXT IMMEDIATE ACTION CARD) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#E1306C]/40 bg-gradient-to-r from-[#120924] via-[#1D0C3A] to-[#120924] space-y-4">
        <div className="flex items-center gap-2.5 text-[#FA26A0] font-mono font-bold text-xs uppercase tracking-wider">
          <Zap size={18} className="text-[#FF5E36]" /> SUA PRÓXIMA AÇÃO IMEDIATA
        </div>

        <h3 className="text-xl font-bold text-white font-display">
          {data.nextImmediateAction.headline}
        </h3>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {data.nextImmediateAction.description}
        </p>

        <div className="pt-2 space-y-2">
          {data.nextImmediateAction.checklist.map((item, i) => (
            <div key={i} className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-200 flex items-center gap-3 font-mono">
              <CheckCircle size={16} className="text-emerald-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. VALUE TEASER & PREMIUM UPGRADE BANNER (NON-AGGRESSIVE) */}
      <div className="p-8 rounded-3xl border border-white/20 bg-gradient-to-r from-[#FF5E36]/15 via-[#E1306C]/20 to-[#833AB4]/15 space-y-6 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-mono font-bold border border-white/20">
            PRÓXIMOS PASSOS DA SUA JORNADA
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Pronto para colocar o perfil no ar e acompanhar seus resultados?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Após publicar os primeiros conteúdos, volte aqui para realizar seu primeiro diagnóstico real de perfil ativo no InstaScore!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => handleCopyPositioning(data.positioning.statement)}
            className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/15"
          >
            <Copy size={16} /> {copiedPositioning ? "Copiado!" : "Copiar Declaração de Posicionamento"}
          </button>
          <button
            type="button"
            onClick={onSwitchToAuditMode}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#FF5E36] to-[#E1306C] text-white font-bold rounded-2xl text-xs transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            Ir para Auditoria de Perfil Ativo <ArrowRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}
