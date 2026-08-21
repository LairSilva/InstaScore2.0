import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BrainCircuit, X, Send, Bot, User, Sparkles, ChevronDown, MessageSquare, Minimize2, Maximize2 } from "lucide-react";
import { AnalysisResponse } from "../types";
import { DigitalTwin } from "../core/DigitalTwin";
import { apiFetch } from "../lib/api-client";
import { useAccessibleModal } from "../hooks/useAccessibleModal";

interface FloatingMentorWidgetProps {
  diagnosisResult: AnalysisResponse;
  digitalTwin?: DigitalTwin | null;
  userName: string;
  onOpenFullMentor?: () => void;
}

export function FloatingMentorWidget({
  diagnosisResult,
  digitalTwin,
  userName,
  onOpenFullMentor
}: FloatingMentorWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "ai"; text: string }>>([
    {
      id: "1",
      role: "ai",
      text: `Olá, ${userName ? userName.split(" ")[0] : "Criador"}! Sou o Mentor Estratégico do seu OS (Score ${digitalTwin?.metrics?.overallScore || diagnosisResult.scoring.score}/100). Em que posso te orientar agora?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Integrated Accessible Modal Hook for focus trapping, body scroll locking, escape key, and trigger focus restoration
  const { modalRef } = useAccessibleModal({
    isOpen,
    onClose: () => setIsOpen(false),
    initialFocusRef: inputRef
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isTyping) return;

    const userMsg = { id: Date.now().toString(), role: "user" as const, text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput("");
    setIsTyping(true);

    try {
      const data = await apiFetch<{ success: boolean; text: string }>("/api/mentor/chat", {
        method: "POST",
        body: JSON.stringify({
          message: textToSend,
          digitalTwin,
          diagnosisResult,
          history: messages.slice(-4)
        })
      });

      if (data.success && data.text && data.text.trim().length > 0) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", text: data.text }]);
      } else {
        throw new Error("Resposta vazia retornada pelo motor de IA.");
      }
    } catch (err: any) {
      console.warn("[Floating Mentor Error]", err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: `Não foi possível obter resposta do Mentor neste momento (${err?.message || "Serviço temporariamente indisponível"}). Tente novamente em instantes.`
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Persistent Viewport Floating Launcher Trigger */}
      {!isOpen && (
        <aside
          aria-label="Mentor IA Flutuante"
          className="fixed z-40 pointer-events-auto select-none print:hidden transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{
            bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            right: 'max(16px, env(safe-area-inset-right, 16px))'
          }}
        >
          <button
            type="button"
            id="btn_floating_mentor_open"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir Mentor IA"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-controls="floating-mentor-dialog"
            className="flex items-center justify-center p-3 sm:px-4 sm:py-3 bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] hover:brightness-110 text-white rounded-full shadow-2xl shadow-[#E1306C]/40 border border-white/20 font-bold text-xs cursor-pointer transition-all active:scale-95 group min-h-[48px] min-w-[48px] focus-visible:ring-2 focus-visible:ring-[#FA26A0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B14] focus-visible:outline-none"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 relative">
              <BrainCircuit size={15} className="text-white" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#E1306C] animate-pulse" aria-hidden="true"></span>
            </div>
            <span className="hidden sm:inline-block font-display ml-2.5 font-semibold text-white tracking-wide">Mentor IA</span>
          </button>
        </aside>
      )}

      {/* Accessible Responsive Floating Chat Dialog */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden touch-none"
              aria-hidden="true"
            />

            {/* Panel Container (Bottom Sheet on Mobile, Floating Panel on Desktop) */}
            <motion.div
              ref={modalRef}
              id="floating-mentor-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mentor-dialog-title"
              tabIndex={-1}
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`fixed z-50 bg-[#080B14] border border-white/15 shadow-2xl flex flex-col overflow-hidden focus:outline-none ${
                /* Mobile: Bottom Sheet with Safe-Area */
                "inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl md:inset-x-auto md:bottom-5 md:right-5 md:w-[380px] md:h-[540px] md:rounded-3xl md:max-h-none"
              }`}
              style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5E36] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white shadow-md shrink-0">
                    <BrainCircuit size={16} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="mentor-dialog-title" className="text-xs font-bold text-white flex items-center gap-1.5 font-display truncate">
                      Mentor Estratégico
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans shrink-0">Online</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">Score {digitalTwin?.metrics?.overallScore || diagnosisResult.scoring.score} • Contexto Ativo</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onOpenFullMentor && (
                    <button
                      type="button"
                      id="btn-expand-floating-mentor"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenFullMentor();
                      }}
                      aria-label="Abrir Mentor IA em tela cheia"
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#FA26A0] focus-visible:outline-none"
                      title="Abrir tela cheia"
                    >
                      <Maximize2 size={14} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    id="btn-close-floating-mentor"
                    onClick={() => setIsOpen(false)}
                    aria-label="Fechar Mentor IA"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#FA26A0] focus-visible:outline-none"
                    title="Fechar"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth text-xs"
                tabIndex={0}
                aria-label="Histórico de mensagens do Mentor"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 max-w-[90%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${msg.role === "user" ? "bg-slate-700 text-white" : "bg-[#E1306C] text-white"}`}>
                      {msg.role === "user" ? <User size={12} aria-hidden="true" /> : <Bot size={12} aria-hidden="true" />}
                    </div>
                    <div
                      className={`p-3 rounded-2xl leading-relaxed ${
                        msg.role === "user"
                          ? "bg-slate-800 text-white rounded-tr-sm"
                          : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm shadow-inner"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-2.5 max-w-[90%]" aria-live="polite" aria-label="Mentor pensando">
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-[#E1306C] text-white">
                      <Sparkles size={12} className="animate-pulse" aria-hidden="true" />
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div 
                className="px-3 py-1.5 bg-slate-950/80 border-t border-white/5 flex gap-1.5 overflow-x-auto hide-scrollbar shrink-0"
                role="group"
                aria-label="Sugestões rápidas"
              >
                <button
                  type="button"
                  disabled={isTyping}
                  onClick={() => handleSend("Como destravar meu score de conversão?")}
                  className="text-[10px] text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FA26A0] focus-visible:outline-none"
                >
                  Destravar Conversão
                </button>
                <button
                  type="button"
                  disabled={isTyping}
                  onClick={() => handleSend("Qual a melhor chamada para o WhatsApp?")}
                  className="text-[10px] text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FA26A0] focus-visible:outline-none"
                >
                  CTA WhatsApp
                </button>
                <button
                  type="button"
                  disabled={isTyping}
                  onClick={() => handleSend("Sugerir gancho para meu próximo Reel")}
                  className="text-[10px] text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#FA26A0] focus-visible:outline-none"
                >
                  Gancho para Reel
                </button>
              </div>

              {/* Input Footer */}
              <div className="p-3 bg-slate-950 border-t border-white/10 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    id="input-floating-mentor-msg"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pergunte ao Mentor IA..."
                    aria-label="Mensagem para o Mentor IA"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#E1306C] focus:ring-1 focus:ring-[#E1306C] transition-colors"
                  />
                  <button
                    type="submit"
                    id="btn-send-floating-mentor"
                    disabled={!input.trim() || isTyping}
                    aria-label="Enviar mensagem ao Mentor IA"
                    className="px-3 py-2.5 bg-gradient-to-r from-[#FF5E36] to-[#E1306C] hover:brightness-110 disabled:opacity-40 text-white rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center justify-center min-w-[40px] min-h-[40px] focus-visible:ring-2 focus-visible:ring-[#FA26A0] focus-visible:outline-none"
                  >
                    <Send size={14} aria-hidden="true" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
