import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, Check, QrCode, CreditCard, X, ArrowRight, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { PLANS } from '../config/plans';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  reason?: string;
  onSuccess: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  userId,
  reason,
  onSuccess
}) => {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCodeText: string;
    qrCodeBase64?: string;
    sessionId: string;
    checkoutUrl?: string;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const { modalRef } = useAccessibleModal({
    isOpen,
    onClose,
  });

  // Status Polling Effect when Pix checkout session is active
  useEffect(() => {
    let intervalId: any;

    if (isOpen && pixData?.sessionId && !isApproved) {
      setCheckingStatus(true);

      const checkPaymentStatus = async () => {
        try {
          const res = await fetch(`/api/checkout/status?sessionId=${pixData.sessionId}&userId=${userId}`, {
            headers: { 'x-user-id': userId }
          });

          if (res.ok) {
            const data = await res.json();
            if (data.isPro || data.status === 'approved') {
              setIsApproved(true);
              clearInterval(intervalId);
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 1500);
            }
          }
        } catch (err) {
          console.warn('[Checkout Status Poll Error]', err);
        }
      };

      // Poll every 3 seconds
      intervalId = setInterval(checkPaymentStatus, 3000);
      checkPaymentStatus(); // Initial call
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, pixData?.sessionId, isApproved, userId, onSuccess, onClose]);

  if (!isOpen) return null;

  const selectedPrice = cycle === 'annual' ? PLANS.PRO.formattedPriceAnnual : PLANS.PRO.formattedPriceMonthly;

  const handleStartCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          userId,
          planId: 'PRO',
          cycle,
          paymentMethod
        })
      });

      const data = await res.json();
      if (data.success) {
        if (paymentMethod === 'pix') {
          setPixData({
            qrCodeText: data.pixQrCodeText,
            qrCodeBase64: data.pixQrCodeBase64,
            sessionId: data.sessionId,
            checkoutUrl: data.checkoutUrl
          });
        } else if (data.checkoutUrl) {
          // Open hosted payment gateway checkout page
          window.open(data.checkoutUrl, '_blank');
          setPixData({
            qrCodeText: 'Checkout de cartão aberto em nova aba',
            sessionId: data.sessionId,
            checkoutUrl: data.checkoutUrl
          });
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyPixKey = () => {
    if (pixData?.qrCodeText) {
      navigator.clipboard.writeText(pixData.qrCodeText);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-modal-title"
        aria-describedby="paywall-modal-desc"
        tabIndex={-1}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden my-8 focus:outline-none"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal de assinatura"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-indigo-400 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-2">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>InstaScore PRO — Checkout Seguro</span>
        </div>

        <h2 id="paywall-modal-title" className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight mb-2">
          Evolua seu Perfil com Inteligência Tática Completa
        </h2>

        {reason && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm flex items-center gap-2" role="note">
            <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{reason}</span>
          </div>
        )}

        <p id="paywall-modal-desc" className="text-slate-400 text-sm mb-6">
          Sua análise identificou oportunidades estratégicas. No plano Pro você libera o plano de ação passo a passo, gerador de roteiros, calendário e diagnósticos ilimitados.
        </p>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6" role="list">
          {[
            'Diagnósticos e auditorias profundas',
            'Plano de crescimento tático C.A.G.E.',
            'Gerador de Roteiros de Reels & Carrosséis',
            'Coleção de Ganchos e Prompts de Alta Conversão',
            'Calendário e Estratégias no Modo Start',
            'Histórico completo de diagnósticos'
          ].map((benefit, idx) => (
            <div key={idx} role="listitem" className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Cycle Toggle */}
        <div 
          role="radiogroup" 
          aria-label="Ciclo de faturamento"
          className="flex items-center justify-center p-1 bg-slate-950 border border-slate-800 rounded-2xl mb-6 max-w-xs mx-auto"
        >
          <button
            type="button"
            role="radio"
            aria-checked={cycle === 'monthly'}
            onClick={() => setCycle('monthly')}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer min-h-[44px] ${
              cycle === 'monthly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={cycle === 'annual'}
            onClick={() => setCycle('annual')}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[44px] ${
              cycle === 'annual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Anual</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
              -16% OFF
            </span>
          </button>
        </div>

        {/* Price Display */}
        <div className="text-center mb-6">
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-50">
            {selectedPrice}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {cycle === 'annual' ? 'Cobrado anualmente (R$ 399,00). Cancele quando quiser.' : 'Cobrança mensal recorrente sem fidelidade. Cancele com 1 clique.'}
          </div>
        </div>

        {/* Payment View */}
        {!pixData ? (
          <div>
            <div 
              role="radiogroup" 
              aria-label="Método de pagamento"
              className="flex items-center gap-3 mb-4"
            >
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === 'pix'}
                onClick={() => setPaymentMethod('pix')}
                className={`flex-1 p-3 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                  paymentMethod === 'pix'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-4 h-4" aria-hidden="true" />
                <span>Pix (Aprovação Instantânea)</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === 'card'}
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 p-3 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                  paymentMethod === 'card'
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4" aria-hidden="true" />
                <span>Cartão de Crédito</span>
              </button>
            </div>

            <button
              onClick={handleStartCheckout}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold text-base shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Gerando checkout seguro...</span>
              ) : (
                <>
                  <span>Desbloquear Acesso Pro Agora</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        ) : isApproved ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-emerald-300">Pagamento Confirmado pelo Banco!</h3>
            <p className="text-xs text-slate-300">Seu plano InstaScore PRO foi ativado com sucesso.</p>
          </div>
        ) : (
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
              <QrCode className="w-4 h-4" />
              <span>Sessão de Pagamento Ativa</span>
            </div>

            {pixData.qrCodeBase64 && (
              <div className="flex justify-center my-2">
                <img 
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                  alt="QR Code Pix" 
                  className="w-40 h-40 rounded-xl border border-slate-800 p-2 bg-white"
                />
              </div>
            )}

            <p className="text-xs text-slate-400">
              Copie o código abaixo ou escaneie o QR Code no app do seu banco para ativar o InstaScore PRO instantaneamente:
            </p>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 break-all select-all max-h-20 overflow-y-auto">
              {pixData.qrCodeText}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={copyPixKey}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
              >
                {copiedPix ? '✅ Código Pix Copiado!' : '📋 Copiar Código Pix'}
              </button>

              {pixData.checkoutUrl && (
                <a
                  href={pixData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Abrir Portal de Pagamento</span>
                </a>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-amber-300/80">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Aguardando confirmação do pagamento via Webhook...</span>
            </div>
          </div>
        )}

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Pagamento processado em ambiente seguro com garantia de estorno em até 7 dias.</span>
        </div>
      </div>
    </div>
  );
};
