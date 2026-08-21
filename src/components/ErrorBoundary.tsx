import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary Caught Error]", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div 
          className="w-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-slate-950/60 border border-rose-900/30 rounded-3xl animate-fade-in my-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-950/50 border border-rose-800/40 text-rose-400 flex items-center justify-center mb-4">
            <AlertCircle size={28} />
          </div>

          <h3 className="text-lg font-bold text-white mb-2 font-display">
            {this.props.fallbackTitle || "Não foi possível carregar este módulo"}
          </h3>

          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message?.includes("Failed to fetch dynamically imported module")
              ? "Uma nova versão do sistema foi disponibilizada. Por favor, recarregue a página para atualizar os recursos."
              : (this.state.error?.message || "Ocorreu uma instabilidade temporária ao renderizar o componente.")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              <RefreshCw size={14} /> Tentar Novamente
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer min-h-[44px]"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
