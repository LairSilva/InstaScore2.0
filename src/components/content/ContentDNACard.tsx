import React from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Target, 
  User, 
  Compass, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  Zap,
  Activity
} from "lucide-react";
import { ContentDNA, CagePillarId } from "../../types/content-engine";

interface ContentDNACardProps {
  dna: ContentDNA;
  onRefreshDNA?: () => void;
  isLoading?: boolean;
}

export const ContentDNACard: React.FC<ContentDNACardProps> = ({
  dna,
  onRefreshDNA,
  isLoading = false
}) => {
  const getPillarColor = (pillar: CagePillarId, score: number) => {
    if (score >= 70) return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", bar: "bg-emerald-500" };
    if (score >= 45) return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", bar: "bg-amber-500" };
    return { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", bar: "bg-rose-500" };
  };

  const pillarsList: { id: CagePillarId; label: string; sub: string; score: number }[] = [
    { id: "conversion", label: "Conversão", sub: "Oferta & Fechamento", score: dna.cageScores?.conversion ?? 50 },
    { id: "authority", label: "Autoridade", sub: "Prova & Reputação", score: dna.cageScores?.authority ?? 50 },
    { id: "growth", label: "Descoberta", sub: "Atração de Novos", score: dna.cageScores?.growth ?? 50 },
    { id: "expression", label: "Expressão", sub: "Retenção & Conexão", score: dna.cageScores?.expression ?? 50 }
  ];

  return (
    <div className="w-full rounded-2xl bg-[#0B0F19]/90 border border-white/10 p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-[#E1306C]/10 via-[#833AB4]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5E36] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white shadow-md shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-display tracking-tight">
                Strategic Content DNA
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FA26A0]/15 text-[#FA26A0] border border-[#FA26A0]/30 font-bold">
                {dna.source === "diagnostic" ? "C.A.G.E. Audit" : dna.source === "start_mode" ? "Start Mode" : "Personalizado"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Parametrização inteligente de temas, dores e pilares para @{dna.handle || "seu_perfil"}
            </p>
          </div>
        </div>

        {dna.profileStage && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
            <Activity size={13} className="text-[#FF5E36]" />
            <span>Fase: <strong className="text-white">{dna.profileStage}</strong></span>
          </div>
        )}
      </div>

      {/* Main DNA Grid: Niche, Audience, Positioning, Goal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Compass size={13} className="text-[#FF5E36]" />
            <span className="font-semibold">Nicho Principal</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-white line-clamp-2">
            {dna.niche}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <User size={13} className="text-[#FA26A0]" />
            <span className="font-semibold">Público-Alvo</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-200 line-clamp-2">
            {dna.targetAudience}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <ShieldCheck size={13} className="text-[#833AB4]" />
            <span className="font-semibold">Posicionamento</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-200 line-clamp-2">
            {dna.positioning}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Target size={13} className="text-emerald-400" />
            <span className="font-semibold">Objetivo Central</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-200 line-clamp-2">
            {dna.primaryGoal}
          </p>
        </div>
      </div>

      {/* C.A.G.E. Scores Horizontal Meters */}
      <div className="pt-3 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
            Distribuição de Tração C.A.G.E.
          </span>
          <span className="text-[11px] text-slate-500">
            Base para sugestões anti-gargalo
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {pillarsList.map(p => {
            const colors = getPillarColor(p.id, p.score);
            return (
              <div key={p.id} className={`p-2.5 rounded-xl border ${colors.bg} ${colors.border}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{p.label}</span>
                  <span className={`text-xs font-mono font-black ${colors.text}`}>{p.score}/100</span>
                </div>
                <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className={`h-full rounded-full ${colors.bar} transition-all duration-700`}
                    style={{ width: `${Math.max(5, Math.min(100, p.score))}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 truncate block">
                  {p.sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Opportunity Callout */}
      {dna.bottleneckSummary && (
        <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-amber-200">
              {dna.bottleneckSummary}
            </p>
            {dna.opportunityHeadline && (
              <p className="text-slate-300 mt-0.5">
                {dna.opportunityHeadline}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
