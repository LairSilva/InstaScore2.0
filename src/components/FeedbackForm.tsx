import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Download, CheckCircle } from "lucide-react";
import { FeedbackData } from "../types";

export default function FeedbackForm() {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [mostUseful, setMostUseful] = useState("");
  const [isGeneric, setIsGeneric] = useState("");
  const [wouldApply, setWouldApply] = useState("");
  const [wouldPay, setWouldPay] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedbacksCount, setFeedbacksCount] = useState(0);

  useEffect(() => {
    updateFeedbackCount();
  }, []);

  const updateFeedbackCount = () => {
    const existing = localStorage.getItem("instascore_feedbacks");
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          setFeedbacksCount(parsed.length);
        }
      } catch (e) {
        // ignore
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    const newFeedback: FeedbackData = {
      rating,
      mostUseful: mostUseful.trim() || undefined,
      isGeneric: isGeneric.trim() || undefined,
      wouldApply: wouldApply.trim() || undefined,
      wouldPay: wouldPay.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existing = localStorage.getItem("instascore_feedbacks");
    let feedbackList: FeedbackData[] = [];
    if (existing) {
      try {
        feedbackList = JSON.parse(existing);
        if (!Array.isArray(feedbackList)) {
          feedbackList = [];
        }
      } catch (e) {
        feedbackList = [];
      }
    }

    feedbackList.push(newFeedback);
    localStorage.setItem("instascore_feedbacks", JSON.stringify(feedbackList));
    setSubmitted(true);
    updateFeedbackCount();
  };

  const handleExportJSON = () => {
    const existing = localStorage.getItem("instascore_feedbacks");
    if (!existing) {
      alert("Nenhum feedback registrado ainda para exportar.");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(existing);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `instascore-feedbacks-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      id="feedback-card-container"
      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 flex gap-2">
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono">
          Alpha Test Logs
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-2">
        <MessageSquare className="text-violet-400" size={20} /> Avaliar esta versão Alpha
      </h3>
      <p className="text-xs text-slate-400 mb-6 max-w-xl">
        Seu feedback é fundamental para validarmos a utilidade desse diagnóstico. As informações são guardadas localmente neste navegador.
      </p>

      {submitted ? (
        <div id="feedback-success" className="text-center py-6 space-y-3">
          <div className="inline-flex p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-full text-emerald-400">
            <CheckCircle size={32} />
          </div>
          <h4 className="text-base font-bold text-slate-100">Feedback enviado com sucesso!</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Muito obrigado por ajudar a aprimorar o InstaScore.ai nesta fase Alpha de validação.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setRating(0);
              setMostUseful("");
              setIsGeneric("");
              setWouldApply("");
              setWouldPay("");
            }}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 underline cursor-pointer"
          >
            Enviar outra resposta
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-200">
              O diagnóstico gerado foi útil? <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  id={`feedback-star-${star}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none min-w-[44px] min-h-[44px]"
                  aria-label={`Avaliar com ${star} estrelas`}
                >
                  <Star
                    size={28}
                    className={`transition-colors ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-600 fill-slate-800/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {rating > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-800/60 animate-fade-in">
              {/* Question 1 */}
              <div className="space-y-1">
                <label htmlFor="q-most-useful" className="block text-xs font-semibold text-slate-300">
                  Qual parte ou recomendação do diagnóstico foi mais útil para você?
                </label>
                <textarea
                  id="q-most-useful"
                  rows={2}
                  value={mostUseful}
                  onChange={(e) => setMostUseful(e.target.value)}
                  placeholder="Ex: Alinhamento de SEO no nome ou a clareza da chamada para ação..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Question 2 */}
              <div className="space-y-1">
                <label htmlFor="q-generic" className="block text-xs font-semibold text-slate-300">
                  Alguma recomendação pareceu genérica ou irrelevante para o seu nicho?
                </label>
                <textarea
                  id="q-generic"
                  rows={2}
                  value={isGeneric}
                  onChange={(e) => setIsGeneric(e.target.value)}
                  placeholder="Se sim, conte-nos qual foi para podermos melhorar o modelo estratégico..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Question 3 */}
              <div className="space-y-1">
                <label htmlFor="q-would-apply" className="block text-xs font-semibold text-slate-300">
                  Você pretende aplicar alguma das ações sugeridas (como a ação de amanhã)?
                </label>
                <input
                  type="text"
                  id="q-would-apply"
                  value={wouldApply}
                  onChange={(e) => setWouldApply(e.target.value)}
                  placeholder="Ex: Sim, vou alterar o campo de Nome hoje mesmo."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Question 4 */}
              <div className="space-y-1">
                <label htmlFor="q-would-pay" className="block text-xs font-semibold text-slate-300">
                  Você pagaria por um diagnóstico estratégico ainda mais aprofundado?
                </label>
                <input
                  type="text"
                  id="q-would-pay"
                  value={wouldPay}
                  onChange={(e) => setWouldPay(e.target.value)}
                  placeholder="Ex: Sim, se analisasse também concorrentes ou desse sugestão de posts."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Form Action */}
              <button
                type="submit"
                id="submit-feedback-btn"
                className="w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer min-h-[44px]"
              >
                Enviar Resposta
              </button>
            </div>
          )}
        </form>
      )}

      {/* Internal export controls for testing team */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          Feedbacks coletados localmente: <strong className="text-slate-300">{feedbacksCount}</strong>
        </span>
        {feedbacksCount > 0 && (
          <button
            type="button"
            id="export-feedback-json"
            onClick={handleExportJSON}
            className="text-[11px] font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors cursor-pointer min-h-[44px]"
          >
            <Download size={12} /> Exportar logs (JSON)
          </button>
        )}
      </div>
    </div>
  );
}
