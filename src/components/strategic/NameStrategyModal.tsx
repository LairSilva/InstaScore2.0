import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Copy, 
  RefreshCw, 
  Award, 
  Star, 
  X, 
  Target,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ProfileDNA, NameRecommendation } from '../../types/strategic-brain';
import { apiFetch } from '../../lib/api-client';

interface NameStrategyModalProps {
  dna: ProfileDNA;
  isOpen: boolean;
  onClose: () => void;
  onApplyName: (name: string, handle: string) => void;
}

export const NameStrategyModal: React.FC<NameStrategyModalProps> = ({
  dna,
  isOpen,
  onClose,
  onApplyName
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<NameRecommendation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateNames = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiFetch<{ success: boolean; recommendations: NameRecommendation[] }>('/api/strategic/naming', {
        method: 'POST',
        body: JSON.stringify({ dna })
      });

      if (data.success && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error('Erro ao gerar estratégias de nomes.');
      }
    } catch (err: any) {
      console.error('Name Strategy fetch error:', err);
      setErrorMessage(err?.message || 'Erro ao gerar estratégias de nomes com IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121826] border border-white/15 rounded-2xl max-w-3xl w-full p-6 sm:p-8 text-white space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" />
            Name Strategy Engine • 5 Categorias
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Estratégia de Nome & Posicionamento
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Geração de opções para <strong>Nome de Exibição</strong> e <strong>@handle</strong> analisadas em 5 dimensões estratégicas.
          </p>
        </div>

        {/* Action Button if empty */}
        {recommendations.length === 0 && !isLoading && (
          <div className="bg-[#0b0f19] border border-white/10 rounded-xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Star className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Descobrir Melhores Nomes Estratégicos</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                A IA analisará o nicho <strong className="text-gray-200">{dna.niche}</strong> e seu diferencial para sugerir nomes Descritivos, de Autoridade, Marca, Conceitual e Diferenciador.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateNames}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-cyan-600/30 inline-flex items-center gap-2 transition-all transform active:scale-95 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Gerar Opções Estratégicas
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">
              Analisando memorabilidade, busca SEO, autoridade e diferenciação competitiva...
            </p>
          </div>
        )}

        {/* Recommendations List */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {recommendations.map((item, idx) => {
                const handle = item.handle_ideas?.[0] || `@${item.suggested_name.toLowerCase().replace(/\s+/g, '')}`;
                return (
                  <div 
                    key={idx} 
                    className="bg-[#0b0f19] border border-white/10 hover:border-cyan-500/40 rounded-xl p-4 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold uppercase">
                          {item.category}
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            {item.suggested_name}
                            <span className="text-xs font-mono text-gray-400">{handle}</span>
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                          <span className="text-[10px] text-gray-500 block">Score Geral</span>
                          <span className="text-xs font-bold text-emerald-400">{item.overall_score}/100</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(`${item.suggested_name} | ${handle}`, `name_${idx}`)}
                          className="text-xs bg-white/10 hover:bg-white/20 text-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors min-h-[36px]"
                        >
                          {copiedId === `name_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copiar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onApplyName(item.suggested_name, handle);
                            onClose();
                          }}
                          className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors min-h-[36px]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Usar
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 bg-white/5 p-2.5 rounded-lg border border-white/5">
                      <strong>Lógica Estratégica:</strong> {item.logic || item.positioning_connection}
                    </p>

                    {/* 4 Score Metrics */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] pt-1">
                      <div className="bg-white/5 p-1.5 rounded border border-white/5">
                        <span className="text-gray-400 block">Memorabilidade</span>
                        <strong className="text-cyan-300">{item.memorability}/100</strong>
                      </div>
                      <div className="bg-white/5 p-1.5 rounded border border-white/5">
                        <span className="text-gray-400 block">Clareza de Nicho</span>
                        <strong className="text-cyan-300">{item.clarity}/100</strong>
                      </div>
                      <div className="bg-white/5 p-1.5 rounded border border-white/5">
                        <span className="text-gray-400 block">Diferenciação</span>
                        <strong className="text-cyan-300">{item.differentiation}/100</strong>
                      </div>
                      <div className="bg-white/5 p-1.5 rounded border border-white/5">
                        <span className="text-gray-400 block">Potencial de Marca</span>
                        <strong className="text-cyan-300">{item.brand_potential}/100</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Regenerate Action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleGenerateNames}
                disabled={isLoading}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Gerar novas opções
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
