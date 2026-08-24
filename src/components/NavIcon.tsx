import React from "react";
import {
  Compass,
  Sparkles,
  BarChart3,
  Zap,
  Cpu,
  Globe,
  Rocket,
  BrainCircuit,
  History,
  TrendingUp
} from "lucide-react";

interface NavIconProps {
  id: string;
  className?: string;
  size?: number;
}

export function NavIcon({ id, className, size = 18 }: NavIconProps) {
  switch (id) {
    case "content_engine":
      return <Sparkles size={size} className={className} aria-hidden="true" />;
    case "content_library":
      return <History size={size} className={className} aria-hidden="true" />;
    case "strategy":
      return <Compass size={size} className={className} aria-hidden="true" />;
    case "content_lab":
      return <Sparkles size={size} className={className} aria-hidden="true" />;
    case "audit":
      return <BarChart3 size={size} className={className} aria-hidden="true" />;
    case "pro_tools":
      return <Zap size={size} className={className} aria-hidden="true" />;
    case "twin":
      return <Cpu size={size} className={className} aria-hidden="true" />;
    case "benchmark":
      return <Globe size={size} className={className} aria-hidden="true" />;
    case "growth":
      return <Rocket size={size} className={className} aria-hidden="true" />;
    case "simulator":
      return <TrendingUp size={size} className={className} aria-hidden="true" />;
    case "mentor":
      return <BrainCircuit size={size} className={className} aria-hidden="true" />;
    case "history":
      return <History size={size} className={className} aria-hidden="true" />;
    default:
      return <Sparkles size={size} className={className} aria-hidden="true" />;
  }
}
