import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Save, CheckCircle, ArrowRight, Zap, Target, TrendingUp } from "lucide-react";
import { AnalysisResponse } from "../../types";
import { DigitalTwin, createDefaultDigitalTwin } from "../../core/DigitalTwin";
import { PredictionEngine, PredictionResult } from "../../engine/prediction/PredictionEngine";
import { apiFetch } from "../../lib/api-client";

interface SimulatorViewProps {
  diagnosisResult: AnalysisResponse;
  currentScore: number;
  digitalTwin?: DigitalTwin | null;
}

export function SimulatorView({ diagnosisResult, currentScore, digitalTwin: rawTwin }: SimulatorViewProps) {
  const digitalTwin = rawTwin || createDefaultDigitalTwin(diagnosisResult);
  const [bio, setBio] = useState(digitalTwin.content?.currentBio || "Designer gráfico ajudando marcas a crescerem.");
  const [cta, setCta] = useState(digitalTwin.content?.currentCta || "Link abaixo");
  const [simulating, setSimulating] = useState(false);
  const [optimizingAi, setOptimizingAi] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  const intel = diagnosisResult?.diagnosis?.intelligence;
  const diagnosedBioHypothesis = intel?.profileArchitecture?.recommendedNextStep;
  const diagnosedExperiments = intel?.priorityExperiments || [];

  const handleApplyPreset = (text: string, ctaText?: string) => {
    setBio(text);
    if (ctaText) setCta(ctaText);
  };

  const handleSimulate = () => {
    setSimulating(true);
    setTimeout(() => {
      // Prediction Engine Real based on Digital Twin context
      const predicted = PredictionEngine.predictImpact(digitalTwin, "Bio");
      setPrediction(predicted);
      setSimulating(false);
    }, 1200);
  };

  const handleOptimizeWithAi = async () => {
    setOptimizingAi(true);
    setAiRationale(null);
    setOptimizeError(null);
    try {
      const data = await apiFetch<{ success: boolean; bios: string[]; ctas: string[]; rationale: string }>("/api/simulator/optimize", {
        method: "POST",
        body: JSON.stringify({
          currentBio: bio,
          currentCta: cta,
          niche: diagnosisResult?.scoring?.categories?.["positioning"]?.name || "Estratégico",
          objective: "Aumentar conversão no link da bio"
        })
      });

      if (data.success && data.bios && data.bios.length > 0) {
        setBio(data.bios[0]);
        if (data.ctas && data.ctas.length > 0) {
          setCta(data.ctas[0]);
        }
        if (data.rationale) {
          setAiRationale(data.rationale);
        }
      }
    } catch (err: any) {
      console.warn("[Simulator AI Optimize Error]", err);
      setOptimizeError(err?.message || "Não foi possível otimizar com IA no momento.");
    } finally {
      setOptimizingAi(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-5xl mx-auto pb-12"
    >
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Target size={14} /> Prediction Engine
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">E se você mudasse hoje?</h1>
        <p className="text-slate-400">Nossa inteligência prevê o impacto exato no seu funil de crescimento antes mesmo de você aplicar as mudanças no Instagram.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Editor */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="font-bold text-white mb-4">Parâmetros de Simulação</h3>
          
          {/* Quick Presets from Diagnosis */}
          {diagnosedBioHypothesis && (
            <div className="p-3.5 bg-violet-950/20 border border-violet-800/30 rounded-2xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-violet-300 uppercase tracking-wider block">Sugestão do Diagnóstico de Arquitetura:</span>
              <p className="text-xs text-slate-300">{diagnosedBioHypothesis}</p>
              <button
                type="button"
                onClick={() => handleApplyPreset(diagnosedBioHypothesis, "Toque no link abaixo")}
                className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
              >
                Aplicar esta sugestão no simulador →
              </button>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nova Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Insira a promessa principal do seu perfil..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:border-violet-500 focus:outline-none transition-colors resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Call to Action Principal</label>
              <input 
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Qual ação os visitantes devem tomar?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:border-violet-500 focus:outline-none transition-colors"
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleOptimizeWithAi}
                disabled={optimizingAi}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-violet-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-violet-500/20 disabled:opacity-50"
              >
                {optimizingAi ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin"></div>
                    Gerando sugestões com IA...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-violet-400" /> Otimizar Bio & CTA com IA
                  </>
                )}
              </button>
            </div>

            {aiRationale && (
              <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-800/30 text-xs text-violet-300 leading-relaxed">
                <span className="font-bold text-violet-200">Justificativa IA:</span> {aiRationale}
              </div>
            )}
            
            <button 
              onClick={handleSimulate}
              disabled={simulating || (!bio && !cta)}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30"
            >
              {simulating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  Rodando modelos preditivos...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Prever Impacto da Mudança
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prediction Results */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col">
          {prediction === null && !simulating && (
             <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 relative z-10 opacity-60">
                <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto flex items-center justify-center">
                  <TrendingUp size={24} className="text-slate-500" />
                </div>
                <div className="max-w-xs">
                  <p className="text-slate-400 text-sm font-medium">O modelo aguarda seus parâmetros para projetar ROI, Velocidade de Crescimento e Taxa de Retenção.</p>
                </div>
             </div>
          )}
          
          {(prediction !== null || simulating) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-between relative z-10"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Resultado Preditivo</h3>
                  {simulating ? (
                    <div className="h-5 w-20 bg-slate-800 animate-pulse rounded"></div>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded flex items-center gap-1">
                      <CheckCircle size={10} /> Confiança {prediction?.confidence}%
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                     <span className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Impacto no Score</span>
                     {simulating ? (
                       <div className="h-8 w-16 bg-slate-800 animate-pulse rounded mx-auto"></div>
                     ) : (
                       <div className="flex items-end justify-center gap-2">
                         <span className="text-4xl font-black text-emerald-400">{prediction?.scoreImpact}</span>
                         <span className="text-sm font-bold text-emerald-500/50 mb-1">+{prediction!.scoreImpact - currentScore}</span>
                       </div>
                     )}
                   </div>
                   <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                     <span className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Aumento em Conversão</span>
                     {simulating ? (
                       <div className="h-8 w-16 bg-slate-800 animate-pulse rounded mx-auto"></div>
                     ) : (
                       <div className="flex items-end justify-center gap-2">
                         <span className="text-4xl font-black text-amber-400">+{prediction?.conversionImpact.toFixed(1)}%</span>
                       </div>
                     )}
                   </div>
                </div>
              </div>
              
              {!simulating && prediction && (
                 <div className="p-5 bg-violet-500/10 border border-violet-500/20 rounded-2xl space-y-3 mt-6">
                   <h4 className="font-bold text-violet-300 flex items-center gap-2">
                     <Zap size={16} /> ROI Estimado
                   </h4>
                   <p className="text-sm text-violet-200/70 leading-relaxed">
                     Esta estrutura melhora sua capacidade de atrair cliques no link. 
                     Estimamos que a nova Bio precisará de <strong className="text-violet-300">{prediction.timeToROI}</strong> no algoritmo 
                     para indexar as novas palavras-chave do nicho.
                   </p>
                   <button className="w-full mt-2 py-2.5 bg-slate-900 border border-slate-800 hover:border-violet-500/50 text-white text-xs font-bold rounded-xl transition-all">
                     Implementar Agora (Execution Engine)
                   </button>
                 </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
