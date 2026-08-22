import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, Check, QrCode, CreditCard, X, ArrowRight, Lock, Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, LogIn } from 'lucide-react';
import { PLANS } from '../config/plans';
import { useAccessibleModal } from '../hooks/useAccessibleModal';
import { getAuthIdToken, ensureAuthUser, auth, loginWithGoogle, getOrEnsureAuthUser } from '../lib/firebase';
import { apiFetch, ApiError } from '../lib/api-client';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  reason?: string;
  onSuccess: () => void;
}

interface ActiveSessionData {
  sessionId: string;
  paymentMethod: 'pix' | 'card';
  checkoutUrl?: string;
  pixQrCodeText?: string;
  pixQrCodeBase64?: string;
  amount?: number;
  formattedPrice?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  reason,
  onSuccess
}) => {
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const { modalRef } = useAccessibleModal({
    isOpen,
    onClose,
  });

  // Track Firebase Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Status Polling Effect when any checkout session is active
  useEffect(() => {
    let intervalId: any;

    if (isOpen && activeSession?.sessionId && !isApproved) {
      setCheckingStatus(true);

      const checkPaymentStatus = async () => {
        try {
          const data = await apiFetch<{ success: boolean; isPro?: boolean; status?: string }>(
            `/api/checkout/status?sessionId=${activeSession.sessionId}`
          );

          if (data && (data.isPro || data.status === 'approved')) {
            setIsApproved(true);
            if (intervalId) clearInterval(intervalId);
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1500);
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
  }, [isOpen, activeSession?.sessionId, isApproved, onSuccess, onClose]);

  // Reset internal states when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsApproved(false);
      setCopiedPix(false);
      setCurrentUser(auth.currentUser);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPrice = cycle === 'annual' ? PLANS.PRO.formattedPriceAnnual : PLANS.PRO.formattedPriceMonthly;

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setCurrentUser(user);
      }
    } catch (err: any) {
      console.warn('[Login Error]', err);
      setError(err?.message || 'Falha ao conectar com o Google. Tente novamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStartCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Ensure active Firebase session exists before calling API
      let user = auth.currentUser;
      if (!user) {
        user = await getOrEnsureAuthUser();
      }

      if (!user) {
        setError('Conecte-se para continuar');
        setLoading(false);
        return;
      }

      // 2. Retrieve Firebase ID Token
      const token = await user.getIdToken();
      if (!token) {
        throw new Error('Sessão Firebase não disponível. Por favor, conecte-se com sua conta Google para continuar.');
      }

      // 3. Centralized API fetch call with exact Bearer token header and server-side calculation
      const data = await apiFetch<{
        success: boolean;
        sessionId: string;
        checkoutUrl?: string;
        pixQrCodeText?: string;
        pixQrCodeBase64?: string;
        amount?: number;
        formattedPrice?: string;
        message?: string;
        error?: string;
      }>('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: 'PRO',
          cycle,
          paymentMethod,
          userEmail: user.email || undefined
        })
      });

      if (data?.success && data?.sessionId) {
        setActiveSession({
          sessionId: data.sessionId,
          paymentMethod,
          checkoutUrl: data.checkoutUrl,
          pixQrCodeText: data.pixQrCodeText,
          pixQrCodeBase64: data.pixQrCodeBase64,
          amount: data.amount,
          formattedPrice: data.formattedPrice
        });

        // If card checkout URL is returned, attempt opening in a new tab
        if (paymentMethod === 'card' && data.checkoutUrl) {
          try {
            window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
          } catch (e) {
            console.warn('[Checkout Popup Blocked]', e);
          }
        }
      } else {
        const errorMsg = data?.message || data?.error || 'Não foi possível gerar a sessão de pagamento. Tente novamente.';
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error('[Checkout error]', err);
      setError(err?.message || 'Falha de conexão com o servidor de pagamentos.');
    } finally {
      setLoading(false);
    }
  };

  const copyPixKey = () => {
    if (activeSession?.pixQrCodeText) {
      navigator.clipboard.writeText(activeSession.pixQrCodeText);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const handleResetSession = () => {
    setActiveSession(null);
    setError(null);
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

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <span className="font-semibold block">Aviso:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <p id="paywall-modal-desc" className="text-slate-400 text-sm mb-6">
          Sua análise identificou oportunidades estratégicas. No plano Pro você libera o plano de ação passo a passo, gerador de roteiros, calendário e diagnósticos ilimitados.
        </p>

        {/* Benefits Grid */}
        {!activeSession && (
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
        )}

        {/* Cycle Toggle */}
        {!activeSession && (
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
                -27% OFF
              </span>
            </button>
          </div>
        )}

        {/* Price Display */}
        {!activeSession && (
          <div className="text-center mb-6">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-50">
              {selectedPrice}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {cycle === 'annual' ? 'Cobrado anualmente (R$ 349,90). Cancele quando quiser.' : 'Cobrança mensal recorrente sem fidelidade. Cancele com 1 clique.'}
            </div>
          </div>
        )}

        {/* Payment View */}
        {!activeSession ? (
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

            {!currentUser ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-center text-xs text-slate-300">
                  <p>Conecte-se para continuar e vincular sua assinatura com segurança à sua conta.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer min-h-[48px]"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Conectando com o Google...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Conectar com Google para Continuar</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartCheckout}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold text-base shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer min-h-[48px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gerando checkout seguro...</span>
                  </>
                ) : (
                  <>
                    <span>Desbloquear Acesso Pro Agora</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        ) : isApproved ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-emerald-300">Pagamento Confirmado pelo Banco!</h3>
            <p className="text-xs text-slate-300">Seu plano InstaScore PRO foi ativado com sucesso.</p>
          </div>
        ) : activeSession.paymentMethod === 'card' ? (
          /* Card / Checkout Pro UI */
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold">
              <CreditCard className="w-4 h-4" />
              <span>Checkout do Mercado Pago Aberto</span>
            </div>

            <h3 className="text-lg font-bold text-slate-100">
              Conclua seu pagamento com Cartão no Mercado Pago
            </h3>

            <p className="text-xs text-slate-300 max-w-md mx-auto">
              A janela de checkout seguro do Mercado Pago foi aberta. Se ela foi bloqueada pelo navegador, clique no botão abaixo para abrir a página oficial:
            </p>

            {activeSession.checkoutUrl && (
              <div className="py-2">
                <a
                  href={activeSession.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer min-h-[48px]"
                >
                  <span>Ir para o Checkout do Mercado Pago</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-amber-300/90">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
              <span>Aguardando confirmação do pagamento... Seu acesso será liberado automaticamente.</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleResetSession}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[44px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Escolher outro método ou ciclo</span>
              </button>
            </div>
          </div>
        ) : (
          /* Pix UI */
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
              <QrCode className="w-4 h-4" />
              <span>Sessão Pix Ativa</span>
            </div>

            {activeSession.pixQrCodeBase64 && (
              <div className="flex justify-center my-2">
                <img 
                  src={`data:image/png;base64,${activeSession.pixQrCodeBase64}`} 
                  alt="QR Code Pix" 
                  className="w-40 h-40 rounded-xl border border-slate-800 p-2 bg-white"
                />
              </div>
            )}

            <p className="text-xs text-slate-400">
              Copie o código abaixo ou escaneie o QR Code no app do seu banco para ativar o InstaScore PRO instantaneamente:
            </p>

            {activeSession.pixQrCodeText && (
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 break-all select-all max-h-20 overflow-y-auto">
                {activeSession.pixQrCodeText}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {activeSession.pixQrCodeText && (
                <button
                  type="button"
                  onClick={copyPixKey}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer min-h-[44px]"
                >
                  {copiedPix ? '✅ Código Pix Copiado!' : '📋 Copiar Código Pix'}
                </button>
              )}

              {activeSession.checkoutUrl && (
                <a
                  href={activeSession.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <span>Abrir no Mercado Pago</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-amber-300/80">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
              <span>Aguardando confirmação do pagamento via Webhook...</span>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleResetSession}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer min-h-[44px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Escolher outro método ou ciclo</span>
              </button>
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

export default PaywallModal;
