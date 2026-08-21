import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Download, 
  Trash2, 
  Lock, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  HardDrive,
  FileJson,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { RETENTION_POLICIES } from '../lib/data-retention-client';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

interface PrivacyDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onDataDeleted?: () => void;
}

export default function PrivacyDataModal({
  isOpen,
  onClose,
  userId,
  onDataDeleted
}: PrivacyDataModalProps) {
  const [activeTab, setActiveTab] = useState<'policy' | 'manage' | 'storage'>('policy');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const { modalRef } = useAccessibleModal({
    isOpen,
    onClose,
  });

  // Opt-in for full local caching (Default: false = only minimal summary is kept)
  const [optInFullStorage, setOptInFullStorage] = useState<boolean>(() => {
    try {
      return localStorage.getItem('instascore_opt_in_full_storage') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleOptIn = (enabled: boolean) => {
    setOptInFullStorage(enabled);
    try {
      if (enabled) {
        localStorage.setItem('instascore_opt_in_full_storage', 'true');
      } else {
        localStorage.removeItem('instascore_opt_in_full_storage');
        // Remove full diagnosis from local storage if disabled
        localStorage.removeItem('instascore_last_diagnosis');
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setErrorText(null);
    try {
      const res = await fetch('/api/user/export-data', {
        headers: {
          'x-user-id': userId || 'anonymous'
        }
      });
      if (!res.ok) {
        throw new Error(`Falha na exportação (HTTP ${res.status})`);
      }
      const data = await res.json();
      
      // Trigger client-side JSON download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `instascore-meus-dados-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      setErrorText(err.message || 'Falha ao exportar dados.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'EXCLUIR') {
      setErrorText('Digite "EXCLUIR" em maiúsculas para confirmar.');
      return;
    }

    setIsDeleting(true);
    setErrorText(null);
    try {
      const res = await fetch('/api/user/delete-data', {
        method: 'DELETE',
        headers: {
          'x-user-id': userId || 'anonymous'
        }
      });
      if (!res.ok) {
        throw new Error(`Falha ao excluir dados (HTTP ${res.status})`);
      }
      const data = await res.json();

      // Clear local storage items
      try {
        localStorage.removeItem('instascore_diagnosis_summary');
        localStorage.removeItem('instascore_last_diagnosis');
        localStorage.removeItem('instascore_last_start_result');
        localStorage.removeItem('instascore_last_user_name');
        localStorage.removeItem('instascore_last_handle');
      } catch {
        // ignore
      }

      setDeleteSuccess(true);
      setDeleteMessage(data.legalRetentionNotice || 'Todos os seus dados foram excluídos com sucesso.');
      if (onDataDeleted) {
        onDataDeleted();
      }
    } catch (err: any) {
      setErrorText(err.message || 'Falha ao excluir dados.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        aria-describedby="privacy-modal-desc"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-[#090D1A] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden font-sans text-slate-100 focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="text-lg font-bold text-white font-display">
                Minimização & Retenção de Dados
              </h2>
              <p id="privacy-modal-desc" className="text-xs text-slate-400 font-normal">
                Transparência técnica, controle total e segurança zero-persistence.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Fechar modal de privacidade e dados"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div role="tablist" aria-label="Seções de privacidade" className="flex items-center gap-2 pt-4 pb-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'policy'}
            onClick={() => setActiveTab('policy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
              activeTab === 'policy'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 bg-white/5'
            }`}
          >
            Política & Imagens
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'storage'}
            onClick={() => setActiveTab('storage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
              activeTab === 'storage'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 bg-white/5'
            }`}
          >
            Armazenamento Local
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manage'}
            onClick={() => setActiveTab('manage')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
              activeTab === 'manage'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 bg-white/5'
            }`}
          >
            Exportar & Excluir
          </button>
        </div>

        {/* Content Tabs */}
        <div className="mt-4 space-y-4 text-xs leading-relaxed text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === 'policy' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <EyeOff size={18} />
                  <span>Princípio de Zero-Persistência de Imagens</span>
                </div>
                <p className="text-slate-300">
                  As capturas de tela (prints) enviadas para análise são processadas <strong>temporariamente em memória RAM volátil</strong> exclusivamente durante o ciclo de execução da auditoria. Elas <strong>nunca são gravadas em disco, bancos de dados ou logs</strong> e são descartadas imediatamente após a geração do resultado.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                  <Clock size={14} className="text-indigo-400" />
                  Prazos de Retenção de Documentos (retentionUntil)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-300">Diagnósticos e Projetos</span>
                    <span className="font-mono text-indigo-400 font-bold">{RETENTION_POLICIES.DIAGNOSIS_DAYS} dias</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-300">Digital Twin & Profile DNA</span>
                    <span className="font-mono text-indigo-400 font-bold">{RETENTION_POLICIES.DIGITAL_TWIN_DAYS} dias</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-300">Logs de Observabilidade AI</span>
                    <span className="font-mono text-indigo-400 font-bold">{RETENTION_POLICIES.AI_LOGS_DAYS} dias</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                    <span className="text-slate-300">Feedbacks de Soluções</span>
                    <span className="font-mono text-indigo-400 font-bold">{RETENTION_POLICIES.FEEDBACK_DAYS} dias</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  * Documentos com prazo expirado são eliminados periodicamente pelo serviço automatizado de purga.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-slate-400">
                <span className="font-bold text-slate-200">Aviso:</span> Este painel descreve a arquitetura técnica de segurança implementada na aplicação. As diretrizes jurídicas e termos de uso formais estão sujeitos à revisão jurídica independente.
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <HardDrive size={18} className="text-indigo-400" />
                  <span>Minimização de Armazenamento no Navegador</span>
                </div>
                <p className="text-slate-300">
                  Por padrão, o InstaScore <strong>não salva o diagnóstico completo no armazenamento local (localStorage)</strong> do seu navegador. Apenas um resumo mínimo contendo sua nota, nicho e principal plano de ação é mantido para referência rápida.
                </p>

                <div className="pt-2 border-t border-white/10">
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-black/40 border border-white/5 cursor-pointer hover:bg-black/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={optInFullStorage}
                      onChange={(e) => handleToggleOptIn(e.target.checked)}
                      className="mt-0.5 accent-indigo-500 rounded cursor-pointer min-w-[18px] min-h-[18px]"
                    />
                    <div className="space-y-0.5">
                      <span className="font-semibold text-white text-xs block">
                        Permitir armazenamento local completo (Opt-in Offline)
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Permite salvar todos os detalhes dos critérios no seu navegador para navegação offline. Se desmarcado, apenas o resumo mínimo é armazenado.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-5 animate-fade-in">
              {/* Export Section */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <FileJson size={18} className="text-indigo-400" />
                    <span>Exportar Meus Dados (Portabilidade)</span>
                  </div>
                </div>
                <p className="text-slate-300">
                  Baixe uma cópia estruturada em JSON de todos os seus diagnósticos, Digital Twins, Profile DNA, métricas de performance e configurações vinculadas ao seu usuário.
                </p>

                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer min-h-[44px] shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Download size={16} />
                  {isExporting ? 'Gerando arquivo JSON...' : 'Exportar Dados (.json)'}
                </button>

                {exportSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle size={15} />
                    Download iniciado com sucesso!
                  </div>
                )}
              </div>

              {/* Deletion Section */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                  <Trash2 size={18} />
                  <span>Exclusão Total e Permanente (Direito ao Esquecimento)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Esta ação excluirá permanentemente todos os seus diagnósticos, Digital Twins, Profile DNA, métricas e histórico associados. Registros estritamente fiscais e contábeis de faturamento serão anonimizados para cumprimento legal.
                </p>

                {!deleteSuccess ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Digite <strong className="text-rose-400">EXCLUIR</strong> para confirmar a exclusão:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="EXCLUIR"
                        className="w-full max-w-xs px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleDeleteAllData}
                      disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'EXCLUIR'}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer min-h-[44px] shadow-lg shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                      {isDeleting ? 'Excluindo registros...' : 'Excluir Todos os Meus Dados'}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle size={16} />
                      <span>Exclusão Concluída</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{deleteMessage}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {errorText && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorText}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors min-h-[44px] cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
