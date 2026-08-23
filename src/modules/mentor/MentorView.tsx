import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrainCircuit, Send, Bot, User, Sparkles, AlertCircle } from "lucide-react";
import { AnalysisResponse } from "../../types";
import { DigitalTwin, createDefaultDigitalTwin } from "../../core/DigitalTwin";
import { apiFetch } from "../../lib/api-client";

interface MentorViewProps {
  diagnosisResult: AnalysisResponse;
  userName: string;
  digitalTwin?: DigitalTwin | null;
}

export function MentorView({ diagnosisResult, userName, digitalTwin: rawTwin }: MentorViewProps) {
  const digitalTwin = rawTwin || createDefaultDigitalTwin(diagnosisResult, userName);
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "ai",
      text: `Olá, ${userName ? userName.split(" ")[0] : "Criador"}. Analisei seu histórico e percebi que seu Momentum Score está em ${digitalTwin.metrics?.momentumScore || 50}. Seu último gargalo foi em Conversão. Considerando os padrões de crescimento atuais do seu nicho, como posso ajudar você hoje?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isTyping) return;
    
    const userMsg = { id: Date.now().toString(), role: "user", text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput("");
    setIsTyping(true);
    setErrorMessage(null);

    try {
      const data = await apiFetch<{ success: boolean; text: string }>("/api/mentor/chat", {
        method: "POST",
        body: JSON.stringify({
          message: textToSend,
          digitalTwin,
          diagnosisResult,
          history: messages.slice(-6)
        })
      });

      if (data.success && data.text) {
        const aiMsg = { 
          id: (Date.now() + 1).toString(), 
          role: "ai", 
          text: data.text 
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error("Erro ao consultar o mentor.");
      }
    } catch (err: any) {
      console.error("[Mentor Chat Error]", err);
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: `⚠️ Não foi possível obter resposta do Mentor neste momento (${err?.message || "Serviço temporariamente indisponível"}). Tente novamente em instantes.`
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto pb-4"
    >
      <div className="space-y-2 mb-6 shrink-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
          <BrainCircuit size={14} /> AI Coach Engine
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Mentoria Contínua</h1>
        <p className="text-slate-400">Um mentor que nunca esquece seu histórico, guiado pela camada de inteligência individual.</p>
      </div>

      {/* Warning Panel */}
      <div className="mb-4 bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-cyan-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Contexto Carregado:</strong> C.A.G.E Score de {digitalTwin.metrics?.overallScore || 50}/100, pilares editoriais diagnosticados, orientações de voz e gargalos críticos.
          </p>
        </div>
        {diagnosisResult.diagnosis?.intelligence?.positioning && (
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold">
            Clareza: {diagnosisResult.diagnosis.intelligence.positioning.clarityScore}%
          </span>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl flex flex-col overflow-hidden">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-slate-700 text-slate-300" : "bg-violet-600 text-white"}`}>
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-slate-800 text-white rounded-tr-sm" : "bg-slate-950 border border-slate-800 text-slate-300 rounded-tl-sm"}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 max-w-[85%]"
              >
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-violet-600 text-white">
                  <Sparkles size={14} className="animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 rounded-tl-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Consulte a base de dados de inteligência..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-slate-200 text-sm focus:border-violet-500 focus:outline-none transition-colors placeholder:text-slate-500"
              />
              <button 
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                aria-label="Enviar pergunta ao mentor"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-3 px-1 overflow-x-auto pb-1 hide-scrollbar">
             <button disabled={isTyping} onClick={() => handleSend("Quais padrões do meu nicho devo seguir para acelerar o crescimento?")} className="shrink-0 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50">Quais padrões do meu nicho devo seguir?</button>
             <button disabled={isTyping} onClick={() => handleSend("Gere 2 opções de Bio de alta conversão para o meu nicho.")} className="shrink-0 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50">Gerar Bio de Alta Conversão</button>
             <button disabled={isTyping} onClick={() => handleSend("Qual é a ação prioritária para aumentar meu Momentum Score?")} className="shrink-0 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50">Ação de Maior Impacto</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
