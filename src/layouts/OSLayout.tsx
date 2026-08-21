import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  CreditCard,
  Crown,
  LogOut,
  Check
} from "lucide-react";
import BrandSymbol, { BrandLogo } from "../components/BrandSymbol";
import { useAccessibleModal } from "../hooks/useAccessibleModal";
import {
  NAV_ITEMS,
  STRATEGY_NAV_ITEMS,
  OS_NAV_ITEMS,
  NavItemConfig,
  OsModuleId,
  DashboardSubTab
} from "../config/navigation";
import { NavIcon } from "../components/NavIcon";

interface OSLayoutProps {
  children: React.ReactNode;
  userName: string;
  handle?: string;
  score: number;
  onLogout: () => void;
  activeModule: OsModuleId | string;
  activeSubTab?: DashboardSubTab;
  onNavigate: (module: OsModuleId, subTab?: DashboardSubTab) => void;
  onOpenPrivacy?: () => void;
  onOpenPlan?: () => void;
  isPro?: boolean;
  floatingElement?: React.ReactNode;
}

export function OSLayout({
  children,
  userName,
  handle,
  score,
  onLogout,
  activeModule,
  activeSubTab = "strategy",
  onNavigate,
  onOpenPrivacy,
  onOpenPlan,
  isPro = false,
  floatingElement
}: OSLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Accessible Modal Hook handles Escape key, Focus trapping, body scroll lock and focus restoration
  const { modalRef } = useAccessibleModal({
    isOpen: isMobileMenuOpen,
    onClose: () => setIsMobileMenuOpen(false)
  });

  const handleSelectItem = (item: NavItemConfig) => {
    onNavigate(item.module, item.subTab);
    setIsMobileMenuOpen(false);
  };

  const isItemActive = (item: NavItemConfig) => {
    if (item.module === "dashboard") {
      return activeModule === "dashboard" && activeSubTab === item.subTab;
    }
    return activeModule === item.module;
  };

  const cleanHandle = handle ? `@${handle.replace("@", "")}` : userName.split(" ")[0] || "Perfil";

  return (
    <div className="min-h-screen w-full bg-deep-space bg-tech-grid flex flex-col md:flex-row font-sans text-slate-100 selection:bg-[#E1306C] selection:text-white overflow-x-hidden">
      
      {/* Mobile Top Header (360px - 767px) */}
      <header 
        id="os-mobile-header"
        className="md:hidden sticky top-0 z-40 bg-[#04050A]/95 backdrop-blur-xl border-b border-white/10 px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2 w-full min-w-0"
      >
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink min-w-0">
          <button
            type="button"
            id="btn-open-os-drawer"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-expanded={isMobileMenuOpen}
            aria-haspopup="dialog"
            aria-controls="mobile-os-drawer"
            className="p-2 text-slate-200 hover:text-white rounded-xl bg-white/5 border border-white/10 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0 focus:outline-none"
            aria-label="Abrir menu"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          
          {/* Responsive Brand Logo: symbol only on <390px, full logo with text on >=390px */}
          <div className="flex items-center min-w-0">
            <div className="hidden xs:block">
              <BrandLogo iconSize={26} textSize="sm" />
            </div>
            <div className="xs:hidden">
              <BrandSymbol size={26} />
            </div>
          </div>
        </div>

        {/* Mobile Header Right Actions (Compact & Accessible) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Compact Plano button */}
          {onOpenPlan && (
            <button
              type="button"
              id="btn-header-plan"
              onClick={onOpenPlan}
              aria-label={isPro ? "Ver detalhes do Plano Pro" : "Ver opções do meu plano"}
              className={`text-xs font-semibold px-2.5 py-2 rounded-xl border flex items-center gap-1 transition-all cursor-pointer min-h-[44px] shrink-0 ${
                isPro
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              {isPro ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                  <span className="text-[11px] font-bold font-mono">PRO</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="text-[11px] hidden 2xs:inline">Plano</span>
                </>
              )}
            </button>
          )}

          {/* Compact Privacy button */}
          {onOpenPrivacy && (
            <button
              type="button"
              id="btn-header-privacy"
              onClick={onOpenPrivacy}
              aria-label="Abrir configurações de privacidade e dados"
              className="p-2 text-indigo-300 hover:text-white rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0"
            >
              <ShieldCheck size={18} aria-hidden="true" />
            </button>
          )}

          {/* User Score Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 min-h-[44px] shrink-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF5E36] via-[#E1306C] to-[#833AB4] flex items-center justify-center font-black text-[11px] text-white font-mono shrink-0 shadow-sm">
              {score}
            </div>
            <span className="text-[11px] font-bold text-slate-200 truncate max-w-[55px] xs:max-w-[75px] hidden 2xs:inline">
              {cleanHandle}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer Backdrop & Modal with Full A11y Focus Trap */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 md:hidden touch-none"
              aria-hidden="true"
            />
            <motion.div
              ref={modalRef}
              id="mobile-os-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu principal de navegação"
              tabIndex={-1}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-xs bg-[#080B14] border-r border-white/15 z-50 flex flex-col justify-between p-4 sm:p-5 md:hidden shadow-2xl overflow-y-auto focus:outline-none"
            >
              <div className="space-y-5">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                  <BrandLogo iconSize={30} textSize="sm" showTagline />
                  <button
                    type="button"
                    id="btn-close-os-drawer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Fechar menu"
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                {/* Mobile User Card & Status */}
                <div className="flex items-center gap-3 p-3 rounded-2xl glass-panel border border-white/10 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5E36] via-[#E1306C] to-[#833AB4] flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(225,48,108,0.35)] text-xs shrink-0 font-mono">
                    {score}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <h2 className="font-bold text-xs text-white truncate max-w-[140px] font-display">
                      {cleanHandle}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#FA26A0] font-mono font-semibold block">
                        InstaScore OS v6
                      </span>
                      {isPro && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">
                          PRO
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Section 1: Estratégia & Diagnóstico */}
                <nav className="space-y-1" aria-label="Estratégia e Diagnóstico">
                  <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-3 font-mono">
                    ESTRATÉGIA & DIAGNÓSTICO
                  </h3>
                  {STRATEGY_NAV_ITEMS.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`mobile-nav-${item.id}`}
                        onClick={() => handleSelectItem(item)}
                        aria-label={item.ariaLabel}
                        aria-current={active ? "page" : undefined}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer min-h-[44px] ${
                          active 
                            ? "bg-gradient-to-r from-[#FF5E36]/20 via-[#E1306C]/20 to-[#833AB4]/20 text-white font-bold border-l-4 border-l-[#FA26A0] border-y border-r border-[#E1306C]/40 shadow-[0_0_20px_rgba(225,48,108,0.2)]" 
                            : "text-slate-400 hover:text-white hover:bg-white/5 font-medium border border-transparent"
                        }`}
                      >
                        <span className={active ? "text-[#FF5E36]" : "text-slate-500"}>
                          <NavIcon id={item.id} size={18} />
                        </span>
                        <span className="truncate">{item.label}</span>
                        {active ? (
                          <span className="ml-auto text-[9px] uppercase font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#FA26A0]/20 text-[#FA26A0] border border-[#FA26A0]/30 shrink-0">
                            Ativo
                          </span>
                        ) : item.isPro ? (
                          <span className="ml-auto text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                            PRO
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </nav>

                {/* Mobile Section 2: Sistema Operacional */}
                <nav className="space-y-1" aria-label="Módulos do Sistema Operacional">
                  <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-3 font-mono">
                    SISTEMA OPERACIONAL
                  </h3>
                  {OS_NAV_ITEMS.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        id={`mobile-nav-${item.id}`}
                        onClick={() => handleSelectItem(item)}
                        aria-label={item.ariaLabel}
                        aria-current={active ? "page" : undefined}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer min-h-[44px] ${
                          active 
                            ? "bg-gradient-to-r from-[#FF5E36]/20 via-[#E1306C]/20 to-[#833AB4]/20 text-white font-bold border-l-4 border-l-[#FA26A0] border-y border-r border-[#E1306C]/40 shadow-[0_0_20px_rgba(225,48,108,0.2)]" 
                            : "text-slate-400 hover:text-white hover:bg-white/5 font-medium border border-transparent"
                        }`}
                      >
                        <span className={active ? "text-[#FF5E36]" : "text-slate-500"}>
                          <NavIcon id={item.id} size={18} />
                        </span>
                        <span className="truncate">{item.label}</span>
                        {active && (
                          <span className="ml-auto text-[9px] uppercase font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#FA26A0]/20 text-[#FA26A0] border border-[#FA26A0]/30 shrink-0">
                            Ativo
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Footer Actions */}
              <div className="pt-4 mt-6 border-t border-white/10 space-y-1.5">
                {onOpenPrivacy && (
                  <button
                    type="button"
                    id="btn-drawer-privacy"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenPrivacy();
                    }}
                    aria-label="Abrir privacidade e retenção de dados"
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <ShieldCheck size={16} className="text-indigo-400 shrink-0" aria-hidden="true" />
                    <span>Privacidade e Dados</span>
                  </button>
                )}
                <button 
                  type="button"
                  id="btn-drawer-logout"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  aria-label="Sair do Sistema Operacional e redefinir diagnóstico"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer min-h-[44px]"
                >
                  <LogOut size={16} className="shrink-0" aria-hidden="true" />
                  <span>Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar Navigation (Preserved on Desktop and Tablet) */}
      <aside 
        id="os-desktop-sidebar"
        className="hidden md:flex w-64 glass-panel border-r border-white/10 flex-col justify-between shrink-0 h-screen sticky top-0 z-30 backdrop-blur-2xl"
      >
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto">
          
          {/* Brand Logo Header */}
          <div className="pb-4 border-b border-white/10">
            <BrandLogo iconSize={36} textSize="md" showTagline />
          </div>

          {/* User Mini Profile */}
          <div className="flex items-center gap-3 p-3 rounded-2xl glass-panel border border-white/10 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5E36] via-[#E1306C] to-[#833AB4] flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(225,48,108,0.35)] text-sm shrink-0 font-mono">
              {score}
            </div>
            <div className="overflow-hidden min-w-0">
              <h2 className="font-bold text-xs text-white truncate max-w-[130px] font-display">
                {cleanHandle}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-[#FA26A0] font-mono font-semibold">InstaScore OS v6</span>
                {isPro && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">
                    PRO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Section 1: Estratégia & Diagnóstico */}
          <nav className="space-y-1" aria-label="Estratégia e Diagnóstico">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-3 font-mono">
              ESTRATÉGIA & DIAGNÓSTICO
            </h3>
            {STRATEGY_NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`desktop-nav-${item.id}`}
                  onClick={() => onNavigate(item.module, item.subTab)}
                  aria-label={item.ariaLabel}
                  aria-current={active ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer min-h-[44px] ${
                    active 
                      ? "bg-gradient-to-r from-[#FF5E36]/20 via-[#E1306C]/20 to-[#833AB4]/20 text-white font-bold border-l-4 border-l-[#FA26A0] border-y border-r border-[#E1306C]/40 shadow-[0_0_20px_rgba(225,48,108,0.2)]" 
                      : "text-slate-400 hover:text-white hover:bg-white/5 font-medium border border-transparent"
                  }`}
                >
                  <span className={active ? "text-[#FF5E36]" : "text-slate-500"}>
                    <NavIcon id={item.id} size={18} />
                  </span>
                  <span className="truncate">{item.label}</span>
                  {active ? (
                    <span className="ml-auto text-[9px] uppercase font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#FA26A0]/20 text-[#FA26A0] border border-[#FA26A0]/30 shrink-0">
                      Ativo
                    </span>
                  ) : item.isPro ? (
                    <span className="ml-auto text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      PRO
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Desktop Section 2: Sistema Operacional */}
          <nav className="space-y-1" aria-label="Módulos do Sistema Operacional">
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-3 font-mono">
              SISTEMA OPERACIONAL
            </h3>
            {OS_NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`desktop-nav-${item.id}`}
                  onClick={() => onNavigate(item.module, item.subTab)}
                  aria-label={item.ariaLabel}
                  aria-current={active ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer min-h-[44px] ${
                    active 
                      ? "bg-gradient-to-r from-[#FF5E36]/20 via-[#E1306C]/20 to-[#833AB4]/20 text-white font-bold border-l-4 border-l-[#FA26A0] border-y border-r border-[#E1306C]/40 shadow-[0_0_20px_rgba(225,48,108,0.2)]" 
                      : "text-slate-400 hover:text-white hover:bg-white/5 font-medium border border-transparent"
                  }`}
                >
                  <span className={active ? "text-[#FF5E36]" : "text-slate-500"}>
                    <NavIcon id={item.id} size={18} />
                  </span>
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="ml-auto text-[9px] uppercase font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#FA26A0]/20 text-[#FA26A0] border border-[#FA26A0]/30 shrink-0">
                      Ativo
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 space-y-1.5">
          {onOpenPlan && (
            <button
              type="button"
              id="btn-desktop-plan"
              onClick={onOpenPlan}
              aria-label={isPro ? "Gerenciar Assinatura Pro" : "Ver opções de Planos"}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer min-h-[44px]"
            >
              <Crown size={16} className="text-amber-400 shrink-0" aria-hidden="true" />
              <span>{isPro ? "Plano Pro Ativo" : "Ver Planos & Upgrade"}</span>
            </button>
          )}
          {onOpenPrivacy && (
            <button 
              type="button"
              id="btn-desktop-privacy"
              onClick={onOpenPrivacy}
              aria-label="Abrir configurações de privacidade e dados"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer min-h-[44px]"
            >
              <ShieldCheck size={16} className="text-indigo-400 shrink-0" aria-hidden="true" />
              <span>Privacidade e Dados</span>
            </button>
          )}
          <button 
            type="button"
            id="btn-desktop-logout"
            onClick={onLogout}
            aria-label="Sair do Sistema Operacional e redefinir diagnóstico"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer min-h-[44px]"
          >
            <LogOut size={16} className="shrink-0" aria-hidden="true" />
            <span>Sair do OS</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        id="os-main-content" 
        tabIndex={-1} 
        className="flex-1 md:h-screen overflow-x-hidden overflow-y-auto relative scroll-smooth pb-8 focus:outline-none w-full min-w-0"
      >
        <div className="p-3 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeModule}-${activeSubTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full min-w-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Persistent Viewport Floating Elements Layer */}
      {floatingElement}

    </div>
  );
}
