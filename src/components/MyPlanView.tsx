import React, { useState } from 'react';
import { Crown, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, Zap, XCircle } from 'lucide-react';
import { useEntitlements } from '../hooks/useEntitlements';
import { getAuthIdToken } from '../lib/firebase';

interface MyPlanViewProps {
  onOpenPaywall: () => void;
  onBack: () => void;
}

export const MyPlanView: React.FC<MyPlanViewProps> = ({ onOpenPaywall, onBack }) => {
  const { subscription, usage, planConfig, isPro, userId, refreshStatus } = useEntitlements();
  const [canceling, setCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza de que deseja cancelar a renovação automática do seu plano InstaScore PRO?')) {
      return;
    }

    setCanceling(true);
    try {
      const token = await getAuthIdToken().catch(() => null);
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-user-id': userId
        },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      if (data.success) {
        setCancelMessage(data.message);
        await refreshStatus();
      }
    } catch (err) {
      console.error('Failed to cancel:', err);
    } finally {
      setCanceling(false);
    }
  };

  const periodEndDateStr = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')
    : 'N/A';

  const diagnosesUsed = usage?.diagnosesCount || 0;
  const diagnosesMax = planConfig.quotas.maxDiagnosesTotal === -1 
    ? planConfig.quotas.maxDiagnosesPerMonth 
    : planConfig.quotas.maxDiagnosesTotal;

  const usagePct = Math.min(100, Math.round((diagnosesUsed / (diagnosesMax || 1)) * 100));

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 text-slate-100 w-full min-w-0">
      <div className="flex items-center justify-between mb-6 sm:mb-8 min-w-0">
        <div className="min-w-0">
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2 inline-flex items-center gap-1 min-h-[44px]"
          >
            ← Voltar para o Diagnóstico
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-50 flex flex-wrap items-center gap-2 sm:gap-3">
            <span>Gerenciamento de Plano e Assinatura</span>
            {isPro && (
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md shrink-0">
                <Crown className="w-3.5 h-3.5" />
                <span>PRO ATIVO</span>
              </span>
            )}
          </h1>
        </div>
      </div>

      {cancelMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{cancelMessage}</div>
        </div>
      )}

      {/* Main Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Plano Atual</div>
            <div className="text-3xl font-extrabold text-slate-50 flex items-center gap-2">
              {planConfig.name}
              {!isPro && (
                <span className="text-xs font-medium bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">
                  Gratuito
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-lg">
              {planConfig.description}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            {!isPro ? (
              <button
                onClick={onOpenPaywall}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Fazer Upgrade para InstaScore PRO</span>
              </button>
            ) : (
              <div className="text-left md:text-right">
                <div className="text-xs text-slate-400">Status da Assinatura</div>
                <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 md:justify-end">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{subscription?.cancelAtPeriodEnd ? 'Cancelamento Agendado' : 'Ativa & Renovação Automática'}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Vigência válida até: <span className="text-slate-200 font-medium">{periodEndDateStr}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quota Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-300 mb-2">
            <span>Consumo de Diagnósticos no Período</span>
            <span>{diagnosesUsed} de {planConfig.quotas.maxDiagnosesTotal === -1 ? `${planConfig.quotas.maxDiagnosesPerMonth}/mês` : planConfig.quotas.maxDiagnosesTotal} utilizandos</span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usagePct >= 100
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
              }`}
              style={{ width: `${usagePct}%` }}
            />
          </div>

          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Limite Diário de Gerações por IA: {usage?.dailyGenerationsCount || 0} / {planConfig.quotas.maxAiGenerationsPerDay}</span>
            {usagePct >= 100 && !isPro && (
              <span className="text-amber-400 font-medium">Limite atingido no plano Free!</span>
            )}
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mb-8">
        <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-400" />
          <span>Recursos & Entitlements do Seu Plano</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'diagnosticBasic', label: 'Score Geral C.A.G.E. & Diagnóstico Estrutural', requiredPro: false },
            { key: 'diagnosticFull', label: 'Análise Aprofundada dos 25 Critérios da Metodologia', requiredPro: true },
            { key: 'contentAi', label: 'Gerador de Roteiros de Reels, Carrosséis & Hooks', requiredPro: true },
            { key: 'startMode', label: 'Plano de Início do Zero (Start Mode)', requiredPro: false },
            { key: 'reelsGenerator', label: 'Ganchos Visuais e Falados para Alta Retenção', requiredPro: true },
            { key: 'historyFull', label: 'Acesso ao Histórico Ilimitado de Diagnósticos Salvos', requiredPro: true }
          ].map((item, idx) => {
            const hasAccess = isPro || !item.requiredPro;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  hasAccess
                    ? 'bg-slate-950/60 border-emerald-500/20 text-slate-200'
                    : 'bg-slate-950/30 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  {hasAccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-slate-600 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                </div>

                {!hasAccess && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase font-bold shrink-0">
                    Exclusivo Pro
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancellation option for active Pro subscribers */}
      {isPro && !subscription?.cancelAtPeriodEnd && (
        <div className="text-center pt-4">
          <button
            onClick={handleCancelSubscription}
            disabled={canceling}
            className="text-xs text-rose-400 hover:text-rose-300 underline transition-colors disabled:opacity-50"
          >
            {canceling ? 'Processando cancelamento...' : 'Cancelar renovação automática do InstaScore PRO'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MyPlanView;
