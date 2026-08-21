import React, { useState } from "react";
import { motion } from "motion/react";
import { Globe, Trophy, ArrowUpRight, ArrowDownRight, Users, Zap, TrendingUp, AlertTriangle, Layers, CheckCircle2, ShieldCheck } from "lucide-react";
import { DigitalTwin, createDefaultDigitalTwin } from "../../core/DigitalTwin";
import { GlobalIntelligenceEngine } from "../../engine/analytics/GlobalIntelligenceEngine";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface GlobalBenchmarkViewProps {
  digitalTwin?: DigitalTwin | null;
  onNavigateToGrowth?: () => void;
}

export function GlobalBenchmarkView({ digitalTwin: rawTwin, onNavigateToGrowth }: GlobalBenchmarkViewProps) {
  const digitalTwin = rawTwin || createDefaultDigitalTwin();
  const benchmark = GlobalIntelligenceEngine.getBenchmarkForNiche(digitalTwin.identity?.niche || "Geral");
  const comparison = GlobalIntelligenceEngine.compareTwinToGlobal(digitalTwin);

  const [addedToPlan, setAddedToPlan] = useState(false);

  const handleAddToPlan = () => {
    setAddedToPlan(true);
    try {
      const existing = localStorage.getItem("instascore_custom_plan_actions") || "[]";
      const actions = JSON.parse(existing);
      actions.unshift({
        id: `plan_action_${Date.now()}`,
        title: `Adotar: ${comparison.recommendedPatternToAdopt}`,
        instruction: `Eliminar padrão em declínio ("${comparison.patternToDrop}") e priorizar o padrão validado na coorte de ${benchmark.niche}.`,
        effort: "medium",
        source: "Global Benchmark V6",
        addedAt: new Date().toISOString()
      });
      localStorage.setItem("instascore_custom_plan_actions", JSON.stringify(actions.slice(0, 10)));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  };

  const chartData = [
    {
      name: 'Score Geral',
      "Seu Perfil": digitalTwin.metrics?.overallScore || 50,
      "Média (Nicho)": benchmark.averageScore,
      "Top 1%": benchmark.topPercentileScore,
    },
    {
      name: 'Vel. de Conversão',
      "Seu Perfil": digitalTwin.metrics?.conversionVelocity || 45,
      "Média (Nicho)": benchmark.averageConversionVelocity,
      "Top 1%": benchmark.topPercentileConversionVelocity,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl">
          <p className="font-bold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value} pts
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-5xl mx-auto pb-12"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Globe size={14} /> Global Intelligence & Benchmarking
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Onde você está no mercado?</h1>
        <p className="text-slate-400">
          Comparamos os dados do seu Digital Twin com a coorte agregada de <strong className="text-slate-200 uppercase">{benchmark.niche}</strong>.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-cyan-400/90 bg-cyan-950/50 px-2.5 py-1 rounded-md border border-cyan-800/40">
            {benchmark.methodologySource} • {benchmark.sampleSizeLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Status Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden h-full">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Trophy size={140} />
            </div>
            
            <div className="relative z-10 space-y-4">
              <h3 className="font-bold text-white text-lg">Seu Posicionamento</h3>
              
              <div className="pt-2">
                {comparison.status === "TOP_PERFORMER" && (
                  <div className="inline-flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl">
                    <Trophy size={18} /> Top 1% do Mercado
                  </div>
                )}
                {comparison.status === "ABOVE_AVERAGE" && (
                  <div className="inline-flex items-center gap-2 text-cyan-400 font-bold bg-cyan-500/10 px-4 py-2 rounded-xl">
                    <TrendingUp size={18} /> Acima da Média
                  </div>
                )}
                {comparison.status === "BELOW_AVERAGE" && (
                  <div className="inline-flex items-center gap-2 text-amber-400 font-bold bg-amber-500/10 px-4 py-2 rounded-xl">
                    <ArrowDownRight size={18} /> Abaixo da Média
                  </div>
                )}
              </div>
              
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                Você precisa de <strong className="text-white">+{comparison.gapToTop} pontos</strong> no seu C.A.G.E Score para atingir o Top 1% do seu nicho.
              </p>

              <div className="pt-4 border-t border-slate-800 mt-6">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Seu Diferencial Competitivo</span>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Zap size={14} />
                  </div>
                  <span className="text-sm font-medium text-slate-300">
                    Velocidade de Execução ({digitalTwin.metrics?.executionScore || 50}/100)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 h-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Comparativo Direto de Coorte</h3>
            <span className="text-[10px] text-slate-400 font-mono">Normalizado 0-100</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Seu Perfil" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Média (Nicho)" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Top 1%" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Extracted Patterns (Module 4/12) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Layers size={20} className="text-cyan-400" />
            Padrões Estruturais Identificados ({benchmark.niche})
          </h3>
          <span className="text-xs font-mono text-slate-500">Módulo 12: Algoritmo Global</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
               <ArrowUpRight size={16} className="text-emerald-400" />
               <span className="font-bold text-slate-200">Em alta no seu nicho</span>
             </div>
             <ul className="space-y-3">
               {benchmark.winningPatterns.map((pattern, idx) => (
                 <li key={idx} className="flex gap-3 text-sm text-slate-300">
                   <span className="text-emerald-500 font-bold shrink-0">{(idx + 1).toString().padStart(2, '0')}.</span> 
                   {pattern}
                 </li>
               ))}
             </ul>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
               <ArrowDownRight size={16} className="text-rose-400" />
               <span className="font-bold text-slate-200">Em declínio</span>
             </div>
             <ul className="space-y-3">
               {benchmark.decliningPatterns.map((pattern, idx) => (
                 <li key={idx} className="flex gap-3 text-sm text-slate-400">
                   <span className="text-rose-500/50 font-bold shrink-0">{(idx + 1).toString().padStart(2, '0')}.</span> 
                   {pattern}
                 </li>
               ))}
             </ul>
          </div>
        </div>
        
        {/* Recommendation based on gaps */}
        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
           <div className="space-y-1">
             <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
               <ShieldCheck size={12} /> Ação Recomendada pela Coorte
             </span>
             <p className="text-sm font-medium text-cyan-100">
               Implementar: "{comparison.recommendedPatternToAdopt}" e parar de utilizar "{comparison.patternToDrop}".
             </p>
           </div>
           {addedToPlan ? (
             <span className="shrink-0 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5">
               <CheckCircle2 size={14} /> Adicionado ao Plano Tático
             </span>
           ) : (
             <button 
               onClick={handleAddToPlan}
               className="shrink-0 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer active:scale-95"
             >
               Adicionar ao Plano (Growth Center)
             </button>
           )}
        </div>
      </div>
    </motion.div>
  );
}

