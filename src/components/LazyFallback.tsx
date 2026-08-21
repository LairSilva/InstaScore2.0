import React from "react";
import BrandSymbol from "./BrandSymbol";

interface LazyFallbackProps {
  message?: string;
  minHeight?: string;
}

export function LazyFallback({ 
  message = "Carregando módulo inteligente...", 
  minHeight = "min-h-[360px]" 
}: LazyFallbackProps) {
  return (
    <div 
      className={`w-full ${minHeight} flex flex-col items-center justify-center p-8 text-center animate-fade-in`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative inline-flex items-center justify-center mb-5">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF5E36] via-[#E1306C] to-[#833AB4] blur-xl opacity-30 animate-pulse"></div>
        <div className="w-14 h-14 rounded-full border-2 border-white/10 border-t-[#FA26A0] border-r-[#FF5E36] animate-spin"></div>
        <div className="absolute">
          <BrandSymbol size={24} />
        </div>
      </div>
      
      <p className="text-sm font-semibold text-white tracking-wide mb-1 font-display">
        {message}
      </p>
      <p className="text-xs text-slate-400 font-mono">
        Otimizando recursos e preparando interface...
      </p>
    </div>
  );
}

export default LazyFallback;
