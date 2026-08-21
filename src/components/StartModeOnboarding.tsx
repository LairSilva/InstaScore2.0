import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, ArrowRight, ArrowLeft, Check, CheckCircle, Copy, 
  Target, Shield, Lightbulb, Compass, Zap, Layers, FileText, 
  Calendar, Star, AlertCircle, Bookmark, CheckSquare, Award
} from "lucide-react";
import { StartProjectInput, StartModeResult } from "../types/start-mode";
import { generateStartModeStrategy } from "../engine/start-mode-generator";
import { apiFetch } from "../lib/api-client";

interface StartModeOnboardingProps {
  onComplete: (result: StartModeResult) => void;
  onCancel: () => void;
}

export default function StartModeOnboarding({ onComplete, onCancel }: StartModeOnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const [projectIdea, setProjectIdea] = useState<string>("");
  const [objective, setObjective] = useState<string>("Crescer audiência e vender produtos/serviços");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Quick project idea suggestion pills
  const ideaSuggestions = [
    "Página de academia e treinos",
    "Loja de roupas femininas",
    "Página sobre inteligência artificial",
    "Criador de conteúdo sobre viagens",
    "Prestação de serviços / Consultoria",
    "E-commerce de acessórios e presentes",
    "Perfil de desenvolvimento pessoal",
    "Especialista em marketing e vendas"
  ];

  // Objective options
  const objectiveOptions = [
    { label: "Crescer audiência qualificada", desc: "Ganhar seguidores alinhados com meu nicho" },
    { label: "Vender produtos e e-commerce", desc: "Converter visitantes em compradores na loja" },
    { label: "Conseguir clientes de serviços", desc: "Atrair agendamentos, orçamentos e consultorias" },
    { label: "Construir autoridade de mercado", desc: "Ser reconhecido como referência na área" },
    { label: "Criar uma marca pessoal forte", desc: "Destacar minha imagem e repertório único" },
    { label: "Monetizar conteúdo", desc: "Criar infoprodutos, comunidade paga e parcerias" }
  ];

  const handleStartGeneration = async () => {
    if (!projectIdea.trim() || isGenerating) return;
    setIsGenerating(true);

    const input: StartProjectInput = {
      projectIdea,
      objective
    };

    try {
      const data = await apiFetch<{ success: boolean; result: StartModeResult }>("/api/start-mode/generate", {
        method: "POST",
        body: JSON.stringify({
          projectIdea,
          objective
        })
      });

      if (data.success && data.result) {
        setIsGenerating(false);
        onComplete(data.result);
        return;
      }
      throw new Error("Erro na geração");
    } catch (err) {
      console.warn("[Start Mode AI] Falling back to deterministic engine:", err);
      const fallbackResult = generateStartModeStrategy(input);
      setIsGenerating(false);
      onComplete(fallbackResult);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-sans text-left">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> VOLTAR PARA A HOME
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E1306C]/20 border border-[#E1306C]/30 text-xs font-mono font-bold text-[#FA26A0]">
          <Sparkles size={14} className="text-[#FF5E36]" /> ARQUITETO INSTASCORE V7
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: PROJECT IDEA & OBJECTIVE */}
        {step === 1 && !isGenerating && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 glass-panel p-6 sm:p-8 rounded-3xl border border-white/15 backdrop-blur-2xl"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#FF5E36] uppercase tracking-widest">
                ETAPA 01 DE 02 • DESCOBERTA DO PROJETO
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                O que você quer construir no Instagram?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Descreva sua ideia em poucas palavras. Não precisa ser perfeito, a IA do InstaScore irá estruturar seu posicionamento do zero.
              </p>
            </div>

            {/* Main Input Textarea */}
            <div className="space-y-3">
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase">
                Sua Ideia ou Nicho de Atuação
              </label>
              <textarea
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                placeholder="Exemplo: Quero criar uma página sobre inteligência artificial para ajudar profissionais a economizarem tempo..."
                rows={3}
                className="w-full p-4 rounded-2xl bg-[#080B14] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#E1306C] text-sm leading-relaxed transition-all resize-none"
              />

              {/* Quick suggestion pills */}
              <div className="pt-2">
                <span className="block text-[11px] font-mono text-slate-400 mb-2">
                  Ou selecione uma sugestão rápida:
                </span>
                <div className="flex flex-wrap gap-2">
                  {ideaSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setProjectIdea(sug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        projectIdea === sug
                          ? "bg-[#E1306C] text-white font-bold shadow-md"
                          : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Objective Options */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase">
                Qual é o principal objetivo desse perfil?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {objectiveOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setObjective(opt.label)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      objective === opt.label
                        ? "bg-gradient-to-r from-[#120924] to-[#1F0D3D] border-[#E1306C] text-white shadow-[0_0_20px_rgba(225,48,108,0.2)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                    }`}
                  >
                    <span className="font-bold text-xs text-white font-display flex items-center justify-between">
                      {opt.label}
                      {objective === opt.label && <CheckCircle size={14} className="text-[#FA26A0]" />}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                disabled={!projectIdea.trim()}
                onClick={handleStartGeneration}
                className={`px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
                  projectIdea.trim()
                    ? "bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] text-white shadow-[0_0_30px_rgba(225,48,108,0.4)] hover:opacity-95"
                    : "bg-white/10 text-slate-500 cursor-not-allowed"
                }`}
              >
                Gerar Estratégia Completa do Zero <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* LOADING / GENERATING ANIMATION */}
        {isGenerating && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-12 rounded-3xl border border-white/20 text-center space-y-6 my-12"
          >
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 border-4 border-[#E1306C] border-t-transparent rounded-full animate-spin"></div>
              <Sparkles size={24} className="text-[#FF5E36] absolute inset-0 m-auto animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-display">
                O Arquiteto de IA está construindo seu Instagram...
              </h3>
              <p className="text-xs font-mono text-[#FA26A0]">
                Mapeando território de nicho • Gerando 20 nomes • Criando 5 bios • Calculando Start Score C.A.G.E.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-2 text-left text-xs font-mono text-slate-400 bg-[#080B14] p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-emerald-400"><Check size={12} /> Analisando ideia do projeto</div>
              <div className="flex items-center gap-2 text-emerald-400"><Check size={12} /> Definindo proposta única de valor</div>
              <div className="flex items-center gap-2 text-[#38BDF8] animate-pulse"><Sparkles size={12} /> Estruturando 10 primeiros conteúdos e calendário de 30 dias</div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
