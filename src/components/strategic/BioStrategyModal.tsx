import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Copy, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  Zap, 
  ArrowRight,
  Sliders
} from 'lucide-react';
import { ProfileDNA, BioStrategyReport, BioStrategyOption } from '../../types/strategic-brain';
import { apiFetch } from '../../lib/api-client';

interface BioStrategyModalProps {
  dna: ProfileDNA;
  isOpen: boolean;
  onClose: () => void;
  onApplyBio: (bioText: string) => void;
}

export const BioStrategyModal: React.FC<BioStrategyModalProps> = ({
  dna,
  isOpen,
  onClose,
  onApplyBio
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<BioStrategyReport | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<BioStrategyOption | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateBio = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiFetch<{ success: boolean; report: BioStrategyReport }>('/api/strategic/bio', {
        method: 'POST',
        body: JSON.stringify({
          dna,
          currentBio: dna.unique_value_proposition || ''
        })
      });

      if (data.success && data.report) {
        setReport(data.report);
        if (data.report.options && data.report.options.length > 0) {
          setSelectedOption(data.report.options[0]);
        }
      } else {
        throw new Error('Erro ao gerar estratégias de bio.');
      }
    } catch (err: any) {
      console.error('Bio Strategy fetch error:', err);
      setErrorMessage(err?.message || 'Erro ao gerar estratégias de bio com IA.');
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" />
            Bio Strategy Engine • Anti-Clichê
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Reconstrução Estratégica da Bio
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Geração de 3 versões de alto impacto sem clichês vazios (Autoridade, Conversão, Personalidade).
          </p>
        </div>

        {/* Action button if not generated yet */}
        {!report && !isLoading && (
          <div className="bg-[#0b0f19] border border-white/10 rounded-xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <Sliders className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Pronto para otimizar sua Bio?</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                A IA analisará o microsegmento <strong className="text-gray-200">{dna.microsegment || dna.niche}</strong> e gerará opções focadas em autoridade e conversão.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateBio}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 transition-all transform active:scale-95 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Gerar 3 Versões Estratégicas
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-400">
              Avaliando clareza, transformação, diferenciação e aplicando regras anti-clichê...
            </p>
          </div>
        )}

        {/* Report Content */}
        {report && (
          <div className="space-y-6">
            {/* Version Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {report.options.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-all text-center ${
                    selectedOption?.type === opt.type
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  }`}
                >
                  <div className="capitalize">{opt.type === 'authority' ? '1. Autoridade' : opt.type === 'conversion' ? '2. Conversão' : '3. Personalidade'}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{opt.type === 'authority' ? 'Credenciais & Método' : opt.type === 'conversion' ? 'Vendas & CTA' : 'Conexão & Diferenciação'}</div>
                </button>
              ))}
            </div>

            {/* Selected Bio Preview Card */}
            {selectedOption && (
              <div className="bg-[#0b0f19] border border-white/15 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    {selectedOption.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedOption.bio_lines.join('\n'), selectedOption.type)}
                      className="text-xs bg-white/10 hover:bg-white/20 text-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === selectedOption.type ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copiar Bio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyBio(selectedOption.bio_lines.join('\n'));
                        onClose();
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Aplicar no Perfil
                    </button>
                  </div>
                </div>

                {/* Bio Mock Visual Display */}
                <div className="bg-[#121826] border border-white/10 rounded-xl p-4 text-sm text-gray-100 font-sans leading-relaxed whitespace-pre-line select-all">
                  {selectedOption.bio_lines.join('\n')}
                </div>

                {/* Strategic Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1">
                    <strong className="text-indigo-300 block">🎯 Por que Funciona:</strong>
                    <p className="text-gray-300 text-[11px]">{selectedOption.why_it_works}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1">
                    <strong className="text-emerald-300 block">🚀 Objetivo Estratégico:</strong>
                    <p className="text-gray-300 text-[11px]">{selectedOption.strategic_goal}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1">
                    <strong className="text-amber-300 block">✨ Ponto Mais Forte:</strong>
                    <p className="text-gray-300 text-[11px]">{selectedOption.strong_point}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-1">
                    <strong className="text-rose-300 block">⚠️ Ponto de Atenção:</strong>
                    <p className="text-gray-300 text-[11px]">{selectedOption.limitation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Anti-Cliche Notes */}
            {report.anti_cliche_notes && report.anti_cliche_notes.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-300 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  Filtro Anti-Clichê Aplicado:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200">
                  {report.anti_cliche_notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regenerate Action */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleGenerateBio}
                disabled={isLoading}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Gerar novas variações
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
