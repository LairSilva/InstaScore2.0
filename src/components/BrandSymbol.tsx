import React from "react";

interface BrandSymbolProps {
  className?: string;
  size?: number;
  showGlow?: boolean;
}

/**
 * High-fidelity SVG Icon Symbol of InstaScore.ai
 * Features: Glossy dark squircle, white 'I' bar, stylized gradient 'S', camera orbit ring with node,
 * rising bar chart columns, and glowing upward trend line.
 */
export default function BrandSymbol({ className = "", size = 48, showGlow = true }: BrandSymbolProps) {
  const symbolId = React.useId().replace(/:/g, "_");

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {showGlow && (
        <div 
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#FF5E36] via-[#E1306C] to-[#833AB4] opacity-40 blur-md pointer-events-none transform scale-95"
          aria-hidden="true"
        />
      )}
      <svg
        id={`brand-symbol-svg-${symbolId}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 select-none overflow-visible"
      >
        <defs>
          {/* Main Logo Brand Gradient: Orange -> Magenta -> Purple */}
          <linearGradient id={`is-gradient-${symbolId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5E36" />
            <stop offset="45%" stopColor="#E1306C" />
            <stop offset="100%" stopColor="#833AB4" />
          </linearGradient>

          {/* Stroke Glow Gradient */}
          <linearGradient id={`is-stroke-${symbolId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7A00" />
            <stop offset="50%" stopColor="#FA26A0" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Trendline Gradient */}
          <linearGradient id={`is-trend-${symbolId}`} x1="20%" y1="80%" x2="90%" y2="20%">
            <stop offset="0%" stopColor="#FA26A0" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Bar Chart Gradient */}
          <linearGradient id={`is-bar-${symbolId}`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7026ED" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#E1306C" />
            <stop offset="100%" stopColor="#FF5E36" />
          </linearGradient>

          {/* Drop Shadows */}
          <filter id={`glow-filter-${symbolId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle Dark Glossy Container */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="24"
          fill="#0B0716"
          stroke={`url(#is-stroke-${symbolId})`}
          strokeWidth="2.5"
          className="shadow-2xl"
        />

        {/* Subtle Inner Camera Lens Orbit Ring */}
        <path
          d="M 18 50 A 32 32 0 1 1 82 50 A 32 32 0 0 1 18 50"
          stroke={`url(#is-stroke-${symbolId})`}
          strokeWidth="1.8"
          strokeDasharray="120 20"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Orbit Ring Small Node */}
        <circle cx="77" cy="25" r="4" fill="#0B0716" stroke="#FA26A0" strokeWidth="2" />
        <circle cx="77" cy="25" r="1.8" fill="#38BDF8" />

        {/* Central Emblem - Stylized 'I' (White Bar) */}
        <rect
          x="28"
          y="28"
          width="10"
          height="36"
          rx="5"
          fill="#FFFFFF"
          filter={`url(#glow-filter-${symbolId})`}
        />

        {/* Central Emblem - Stylized 'S' (Orange to Magenta to Purple) */}
        <path
          d="M 45 33 C 45 29.5, 62 29.5, 62 36 C 62 42.5, 43 41.5, 43 51 C 43 60.5, 64 60.5, 64 55"
          stroke={`url(#is-gradient-${symbolId})`}
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Rising Bar Chart Columns (Bottom Right) */}
        <rect x="56" y="66" width="3.5" height="8" rx="1.5" fill={`url(#is-bar-${symbolId})`} opacity="0.6" />
        <rect x="62" y="61" width="3.5" height="13" rx="1.5" fill={`url(#is-bar-${symbolId})`} opacity="0.8" />
        <rect x="68" y="55" width="3.5" height="19" rx="1.5" fill={`url(#is-bar-${symbolId})`} />
        <rect x="74" y="48" width="3.5" height="26" rx="1.5" fill={`url(#is-bar-${symbolId})`} />
        <rect x="80" y="40" width="3.5" height="34" rx="1.5" fill={`url(#is-bar-${symbolId})`} />

        {/* Upward Growth Trend Line */}
        <path
          d="M 46 72 L 58 64 L 69 56 L 82 40 L 88 32"
          stroke={`url(#is-trend-${symbolId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Growth Trend Nodes */}
        <circle cx="46" cy="72" r="2.5" fill="#FFFFFF" />
        <circle cx="58" cy="64" r="2.5" fill="#FFFFFF" />
        <circle cx="69" cy="56" r="2.5" fill="#FFFFFF" />
        <circle cx="82" cy="40" r="2.5" fill="#FFFFFF" />

        {/* Arrowhead on Trend Line */}
        <path
          d="M 81 32 H 88 V 39"
          stroke="#38BDF8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Text Logo component: "INSTASCORE.ai"
 */
export function BrandLogoText({ 
  size = "md",
  className = "" 
}: { 
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "text-base",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl",
    xl: "text-3xl sm:text-4xl",
  }[size];

  return (
    <span className={`font-extrabold tracking-tight select-none inline-flex items-center ${sizeClasses} ${className}`}>
      <span className="text-white tracking-wide">INSTA</span>
      <span className="bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#C084FC] bg-clip-text text-transparent font-black ml-[1px]">
        SCORE
      </span>
      <span className="text-[#38BDF8] font-bold text-[0.8em] ml-[1px] leading-none self-baseline">
        .ai
      </span>
    </span>
  );
}

/**
 * Subtitle / Tagline component: "AUDITA • ANALISA • ACELERA"
 */
export function BrandTagline({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[10px] sm:text-xs font-semibold tracking-[0.25em] text-slate-300 uppercase select-none flex items-center justify-center gap-2 ${className}`}>
      <span>AUDITA</span>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E1306C]" />
      <span>ANALISA</span>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#833AB4]" />
      <span>ACELERA</span>
    </p>
  );
}

/**
 * Full Brand Logo (Icon + Text + optional Tagline)
 */
export function BrandLogo({
  iconSize = 40,
  textSize = "md",
  showTagline = false,
  layout = "horizontal",
  className = "",
}: {
  iconSize?: number;
  textSize?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  layout?: "horizontal" | "vertical";
  className?: string;
}) {
  if (layout === "vertical") {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <BrandSymbol size={iconSize} />
        <div className="flex flex-col items-center">
          <BrandLogoText size={textSize} />
          {showTagline && <BrandTagline className="mt-1" />}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <BrandSymbol size={iconSize} />
      <div className="flex flex-col justify-center">
        <BrandLogoText size={textSize} />
        {showTagline && <BrandTagline className="mt-0.5" />}
      </div>
    </div>
  );
}

/**
 * Premium App Icon Card replica matching the user's uploaded logo image
 */
export function BrandAppCard({ className = "" }: { className?: string }) {
  return (
    <div className={`relative p-6 sm:p-8 rounded-3xl bg-[#090513] border border-[#E1306C]/30 shadow-[0_0_50px_rgba(225,48,108,0.25)] flex flex-col items-center justify-center overflow-hidden ${className}`}>
      {/* Background ambient radial glows */}
      <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-[#FF5E36]/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-[#833AB4]/30 blur-2xl pointer-events-none" />
      
      <BrandSymbol size={110} className="mb-5" />
      <BrandLogoText size="lg" />
      <BrandTagline className="mt-2" />
    </div>
  );
}

