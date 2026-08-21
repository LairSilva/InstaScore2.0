import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Circle, Rocket, Calendar, Target, Zap, ArrowRight, LayoutTemplate, Sparkles, PlusCircle, CheckCircle2 } from "lucide-react";
import { AnalysisResponse } from "../../types";
import { DigitalTwin, createDefaultDigitalTwin } from "../../core/DigitalTwin";
import { MissionDeliverableModal } from "../../components/MissionDeliverableModal";
import { MissionExecutionResult, MissionType, BioModifier } from "../../types/missions";
import { apiFetch, ApiError } from "../../lib/api-client";

interface GrowthCenterViewProps {
  diagnosisResult: AnalysisResponse;
  digitalTwin?: DigitalTwin | null;
  userName?: string;
  handle?: string;
  niche?: string;
}

export function GrowthCenterView({ 
  diagnosisResult, 
  digitalTwin: rawTwin,
  userName = "Criador",
  handle = "@usuario",
  niche = "Geral"
}: GrowthCenterViewProps) {
  const digitalTwin = rawTwin || createDefaultDigitalTwin(diagnosisResult);
  const { diagnosis, scoring } = diagnosisResult;

  // Persisted task status
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("instascore_completed_tasks");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customActions, setCustomActions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("instascore_custom_plan_actions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Mission Execution Modal state
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [activeMissionResult, setActiveMissionResult] = useState<MissionExecutionResult | null>(null);
  const [missionLoading, setMissionLoading] = useState(false);
  const [missionLoadingStage, setMissionLoadingStage] = useState("Iniciando IA estratégica...");
  const [missionError, setMissionError] = useState<string | null>(null);
  const [lastMissionParams, setLastMissionParams] = useState<{
    missionType: MissionType;
    title: string;
    instruction: string;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("instascore_completed_tasks", JSON.stringify(completedTasks));
    } catch (e) {
      console.warn("Error persisting task status:", e);
    }
  }, [completedTasks]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleExecuteMission = async (
    missionType: MissionType,
    title: string,
    instruction: string
  ) => {
    setIsMissionModalOpen(true);
    setMissionLoading(true);
    setMissionError(null);
    setLastMissionParams({ missionType, title, instruction });
    setMissionLoadingStage("Consultando IA especializada e parâmetros do diagnóstico...");

    try {
      const data = await apiFetch<{ success: boolean; result: MissionExecutionResult }>("/api/mission/execute", {
        method: "POST",
        body: JSON.stringify({
          userId: digitalTwin.id || "anonymous",
          missionType,
          criterionTitle: title,
          criterionImpact: instruction,
          userName: userName || "Criador",
          handle: handle || "@usuario",
          niche: niche || digitalTwin.identity.niche || "Geral",
          objective: "Crescimento e Conversão",
          targetAudience: digitalTwin.identity.targetAudience || "Público Alvo do Nicho",
          currentBio: (diagnosis as any)?.bio_analysis?.verbatim_text || digitalTwin.content.currentBio || "",
          currentName: userName,
          score: scoring?.score || 50,
          identifiedGaps: diagnosis.critical_gaps,
          modifier: "default"
        })
      });

      if (data.success && data.result) {
        setActiveMissionResult(data.result);
      } else {
        throw new Error("Falha na estruturação dos dados pela IA");
      }
    } catch (err: any) {
      console.error("Mission execution error:", err);
      setMissionError(err?.message || "Ocorreu um erro ao processar a missão com IA. Tente novamente.");
    } finally {
      setMissionLoading(false);
    }
  };

  const allActions = [
    {
      id: "top_action",
      title: diagnosis.tomorrow_action.title,
      instruction: diagnosis.tomorrow_action.instruction,
      effort: "medium",
      isPrimary: true
    },
    ...diagnosis.recommended_actions.map((act, idx) => ({
      id: `rec_action_${idx}`,
      title: act.title,
      instruction: act.instruction,
      effort: act.effort || "medium",
      isPrimary: false
    })),
    ...customActions.map(act => ({
      id: act.id,
      title: act.title,
      instruction: act.instruction,
      effort: act.effort || "medium",
      isCustom: true,
      source: act.source || "Benchmark",
      isPrimary: false
    }))
  ];

  const completedCount = allActions.filter(a => !!completedTasks[a.id]).length;
  const progressPercent = Math.round((completedCount / (allActions.length || 1)) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-5xl mx-auto pb-12"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Rocket size={14} /> Execution Engine
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">O que executar agora</h1>
        <p className="text-slate-400">
          Tarefas adaptáveis que evoluem conforme o seu Execution Score (Progresso: <strong className="text-emerald-400">{completedCount}/{allActions.length} concluídas • {progressPercent}%</strong>).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mission of highest ROI */}
          <div className={`border rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all ${
            completedTasks["top_action"] 
              ? "bg-slate-900/80 border-emerald-500/40 opacity-90" 
              : "bg-gradient-to-br from-emerald-900/40 to-slate-900 border-emerald-800/40"
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Target size={120} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                   <Zap size={14} /> Ação de Maior ROI
                </span>
                {completedTasks["top_action"] && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Concluída (+5 XP)
                  </span>
                )}
              </div>
              
              <h2 className={`text-2xl font-bold text-white ${completedTasks["top_action"] ? "line-through text-slate-400" : ""}`}>
                {diagnosis.tomorrow_action.title}
              </h2>
              <p className="text-slate-300 max-w-md leading-relaxed">{diagnosis.tomorrow_action.instruction}</p>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <button 
                  onClick={() => toggleTask("top_action")}
                  className={`px-5 py-2.5 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                    completedTasks["top_action"]
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                  }`}
                >
                  <CheckCircle size={16} /> 
                  {completedTasks["top_action"] ? "Desmarcar Execução" : "Marcar como Executado (+5 XP)"}
                </button>

                <button 
                  onClick={() => handleExecuteMission("bio_generator_pro", diagnosis.tomorrow_action.title, diagnosis.tomorrow_action.instruction)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
                >
                  <Sparkles size={14} className="text-emerald-400" />
                  Gerar Entregável com IA
                </button>
              </div>
            </div>
          </div>

          {/* Execution Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LayoutTemplate size={18} className="text-slate-400" />
                Plano Tático Dinâmico
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {completedCount} de {allActions.length} passos
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
              <motion.div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-4">
              {allActions.filter(a => !a.isPrimary).map((act) => {
                const isCompleted = !!completedTasks[act.id];
                return (
                  <div key={act.id} className="flex gap-4 group">
                    <button 
                      onClick={() => toggleTask(act.id)}
                      className="mt-1 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                    >
                      {isCompleted ? <CheckCircle size={22} className="text-emerald-500" /> : <Circle size={22} />}
                    </button>
                    <div className="space-y-1 pb-4 border-b border-slate-800/60 w-full group-hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm font-bold transition-all ${isCompleted ? "text-slate-500 line-through" : "text-slate-200"}`}>
                          {act.title}
                        </h4>
                        {(act as any).isCustom && (
                          <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold rounded">
                            {(act as any).source}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{act.instruction}</p>
                      
                      {!isCompleted && (
                        <button 
                          onClick={() => handleExecuteMission("custom_mission_resolver", act.title, act.instruction)}
                          className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          Solicitar Agente de Execução <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              Padrões do Perfil
            </h3>
            
            <div className="space-y-4">
              {diagnosis.critical_gaps && diagnosis.critical_gaps.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/30">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400 block mb-1">Ponto Crítico a Resolver</span>
                  <p className="text-xs text-rose-200/90 font-medium leading-relaxed">
                    {diagnosis.critical_gaps[0].title}: {diagnosis.critical_gaps[0].reason}
                  </p>
                </div>
              )}

              {diagnosis.strengths && diagnosis.strengths.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/30">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 block mb-1">Ponto Forte</span>
                  <p className="text-xs text-emerald-200/90 font-medium leading-relaxed">
                    {diagnosis.strengths[0].title}: {diagnosis.strengths[0].reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mission Execution Modal */}
      <MissionDeliverableModal
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
        missionResult={activeMissionResult}
        loading={missionLoading}
        loadingStage={missionLoadingStage}
        errorMessage={missionError}
        onRetry={() => {
          if (lastMissionParams) {
            handleExecuteMission(
              lastMissionParams.missionType,
              lastMissionParams.title,
              lastMissionParams.instruction
            );
          }
        }}
        onRegenerateBio={(mod) => handleExecuteMission("bio_generator_pro", "Nova Bio", "Regeneração com modificador")}
      />
    </motion.div>
  );
}

