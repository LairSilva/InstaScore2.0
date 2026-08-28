/**
 * INSTASCORE OS V14 — CONTENT VISUAL RENDERER
 * High-Resolution (1080x1350 4:5 / 1080x1080 1:1) Native Canvas Composition Engine
 * Produces publication-ready visual assets for Instagram Carousels and Static Posts.
 */

import {
  VisualThemeId,
  VisualThemeConfig,
  ProductionSlide,
  StaticPostProductionOutput,
  CarouselProductionOutput
} from "../../types/content-production";

export const VISUAL_THEMES: Record<VisualThemeId, VisualThemeConfig> = {
  dark_editorial: {
    id: "dark_editorial",
    name: "Dark Editorial",
    badge: "Refinado & Premium",
    description: "Fundo obsidiana com degradê violeta profundo, tipografia nobre e acentos âmbar.",
    bgGradient: ["#07040D", "#110924", "#180D30"],
    primaryText: "#FFFFFF",
    secondaryText: "#C4B5FD",
    accentColor: "#F59E0B",
    accentGradient: ["#F59E0B", "#EF4444"],
    cardBg: "rgba(25, 16, 48, 0.7)",
    cardBorder: "rgba(245, 158, 11, 0.25)",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    badgeText: "#FBBF24",
    highlightBg: "rgba(245, 158, 11, 0.12)",
    glowColor1: "rgba(245, 158, 11, 0.15)",
    glowColor2: "rgba(139, 92, 246, 0.2)",
    fontDisplay: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  },
  tech_noir: {
    id: "tech_noir",
    name: "Tech Noir",
    badge: "Alta Tecnologia & Autoridade",
    description: "Estética cibernética com azuis elétricos, tags limpas e alto contraste analítico.",
    bgGradient: ["#030712", "#0B152B", "#0F172A"],
    primaryText: "#FFFFFF",
    secondaryText: "#94A3B8",
    accentColor: "#06B6D4",
    accentGradient: ["#06B6D4", "#3B82F6"],
    cardBg: "rgba(15, 23, 42, 0.8)",
    cardBorder: "rgba(6, 182, 212, 0.3)",
    badgeBg: "rgba(6, 182, 212, 0.15)",
    badgeText: "#22D3EE",
    highlightBg: "rgba(6, 182, 212, 0.1)",
    glowColor1: "rgba(6, 182, 212, 0.18)",
    glowColor2: "rgba(59, 130, 246, 0.18)",
    fontDisplay: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  },
  gradient_aurora: {
    id: "gradient_aurora",
    name: "Gradient Aurora",
    badge: "Moderno & Viral",
    description: "Degradê suave magenta e violeta com cartões translúcidos e foco visual dinâmico.",
    bgGradient: ["#0D0221", "#1E0B38", "#2F0E40"],
    primaryText: "#FFFFFF",
    secondaryText: "#E9D5FF",
    accentColor: "#EC4899",
    accentGradient: ["#EC4899", "#8B5CF6"],
    cardBg: "rgba(35, 15, 65, 0.75)",
    cardBorder: "rgba(236, 72, 153, 0.3)",
    badgeBg: "rgba(236, 72, 153, 0.2)",
    badgeText: "#F472B6",
    highlightBg: "rgba(236, 72, 153, 0.12)",
    glowColor1: "rgba(236, 72, 153, 0.2)",
    glowColor2: "rgba(139, 92, 246, 0.25)",
    fontDisplay: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  },
  clean_minimal: {
    id: "clean_minimal",
    name: "Clean Minimal",
    badge: "Clareza & Foco Direto",
    description: "Design minimalista com fundo neutro sofisticado e tipografia de alto impacto.",
    bgGradient: ["#0F172A", "#1E293B", "#0F172A"],
    primaryText: "#F8FAFC",
    secondaryText: "#94A3B8",
    accentColor: "#38BDF8",
    accentGradient: ["#38BDF8", "#818CF8"],
    cardBg: "rgba(30, 41, 59, 0.7)",
    cardBorder: "rgba(148, 163, 184, 0.2)",
    badgeBg: "rgba(56, 189, 248, 0.15)",
    badgeText: "#38BDF8",
    highlightBg: "rgba(56, 189, 248, 0.08)",
    glowColor1: "rgba(56, 189, 248, 0.12)",
    glowColor2: "rgba(129, 140, 248, 0.12)",
    fontDisplay: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  },
  bold_contrast: {
    id: "bold_contrast",
    name: "Bold Contrast",
    badge: "Energia & Destaque",
    description: "Contraste extremo com amarelo elétrico e esmeralda sobre base escura sólida.",
    bgGradient: ["#050505", "#0F141C", "#080B10"],
    primaryText: "#FFFFFF",
    secondaryText: "#9CA3AF",
    accentColor: "#10B981",
    accentGradient: ["#10B981", "#F59E0B"],
    cardBg: "rgba(18, 24, 34, 0.85)",
    cardBorder: "rgba(16, 185, 129, 0.35)",
    badgeBg: "rgba(16, 185, 129, 0.18)",
    badgeText: "#34D399",
    highlightBg: "rgba(16, 185, 129, 0.12)",
    glowColor1: "rgba(16, 185, 129, 0.18)",
    glowColor2: "rgba(245, 158, 11, 0.15)",
    fontDisplay: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  },
  creator_vibrant: {
    id: "creator_vibrant",
    name: "Creator Vibrant",
    badge: "Instagram Native",
    description: "Paleta quente nativa do Instagram com degradê rosa-laranja e alta expressividade.",
    bgGradient: ["#0A0314", "#1F0829", "#15041F"],
    primaryText: "#FFFFFF",
    secondaryText: "#FBCFE8",
    accentColor: "#FF5E36",
    accentGradient: ["#FF5E36", "#E1306C"],
    cardBg: "rgba(40, 10, 50, 0.7)",
    cardBorder: "rgba(255, 94, 54, 0.3)",
    badgeBg: "rgba(255, 94, 54, 0.18)",
    badgeText: "#FFA07A",
    highlightBg: "rgba(225, 48, 108, 0.12)",
    glowColor1: "rgba(255, 94, 54, 0.2)",
    glowColor2: "rgba(225, 48, 108, 0.22)",
    fontDisplay: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  }
};

export interface RenderCanvasOptions {
  width?: number; // default 1080
  height?: number; // default 1350 (4:5 portrait)
  themeId?: VisualThemeId;
  handle?: string;
  totalSlides?: number;
  quality?: number; // 0.95
}

/**
 * Text wrapping helper on Canvas context
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Render a single Carousel Slide onto a publication-ready Canvas (1080x1350)
 */
export function renderCarouselSlideToDataUrl(
  slide: ProductionSlide,
  options: RenderCanvasOptions = {}
): string {
  if (typeof document === "undefined") {
    return "";
  }

  const width = options.width || 1080;
  const height = options.height || 1350;
  const theme = VISUAL_THEMES[options.themeId || "dark_editorial"] || VISUAL_THEMES.dark_editorial;
  const handle = options.handle ? (options.handle.startsWith("@") ? options.handle : `@${options.handle}`) : "@instascore.ai";
  const totalSlides = options.totalSlides || 7;
  const slideNum = slide.slideNumber || 1;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. BACKGROUND GRADIENT
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, theme.bgGradient[0]);
  bgGrad.addColorStop(0.5, theme.bgGradient[1]);
  bgGrad.addColorStop(1, theme.bgGradient[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. AMBIENT GLOWS & MESH
  const glow1 = ctx.createRadialGradient(250, 250, 40, 250, 250, 600);
  glow1.addColorStop(0, theme.glowColor1);
  glow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow1;
  ctx.beginPath();
  ctx.arc(250, 250, 600, 0, Math.PI * 2);
  ctx.fill();

  const glow2 = ctx.createRadialGradient(width - 250, height - 300, 40, width - 250, height - 300, 650);
  glow2.addColorStop(0, theme.glowColor2);
  glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2;
  ctx.beginPath();
  ctx.arc(width - 250, height - 300, 650, 0, Math.PI * 2);
  ctx.fill();

  // Subtle geometric grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  for (let x = 80; x < width; x += 160) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 80; y < height; y += 160) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. SAFE AREA CONSTANTS
  const marginX = 90;
  const contentWidth = width - marginX * 2;
  const topBarY = 110;

  // 4. HEADER: BRAND HANDLE + SLIDE PROGRESS INDICATOR
  // Left: Handle Badge
  ctx.save();
  ctx.fillStyle = theme.badgeBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(marginX, topBarY - 30, 260, 46, 23);
  ctx.fill();
  ctx.stroke();

  // Handle Text
  ctx.font = `600 20px ${theme.fontBody}`;
  ctx.fillStyle = theme.badgeText;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(handle, marginX + 22, topBarY - 7);
  ctx.restore();

  // Right: Slide Indicator (e.g. SLIDE 01 / 07)
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(width - marginX - 180, topBarY - 30, 180, 46, 23);
  ctx.fill();
  ctx.stroke();

  ctx.font = `700 18px ${theme.fontBody}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const slidePadded = String(slideNum).padStart(2, "0");
  const totalPadded = String(totalSlides).padStart(2, "0");
  ctx.fillText(`SLIDE ${slidePadded} / ${totalPadded}`, width - marginX - 90, topBarY - 7);
  ctx.restore();

  // 5. PROGRESS BAR ACROSS TOP
  const progressRatio = slideNum / totalSlides;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.roundRect(marginX, topBarY + 36, contentWidth, 4, 2);
  ctx.fill();

  const activeGrad = ctx.createLinearGradient(marginX, 0, marginX + contentWidth * progressRatio, 0);
  activeGrad.addColorStop(0, theme.accentGradient[0]);
  activeGrad.addColorStop(1, theme.accentGradient[1]);
  ctx.fillStyle = activeGrad;
  ctx.beginPath();
  ctx.roundRect(marginX, topBarY + 36, contentWidth * progressRatio, 4, 2);
  ctx.fill();
  ctx.restore();

  // 6. ROLE TAG BADGE (e.g. [ O DIAGNÓSTICO ], [ O MÉTODO ])
  const roleY = topBarY + 80;
  ctx.save();
  const roleText = slide.roleLabel ? slide.roleLabel.toUpperCase() : `[ ETAPA ${slideNum} ]`;
  ctx.font = `800 18px ${theme.fontBody}`;
  const roleMetrics = ctx.measureText(roleText);
  const roleBadgeWidth = roleMetrics.width + 36;

  ctx.fillStyle = theme.badgeBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(marginX, roleY, roleBadgeWidth, 38, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme.badgeText;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(roleText, marginX + 18, roleY + 19);
  ctx.restore();

  // 7. SLIDE CONTENT RENDERING BY ROLE
  const isCover = slideNum === 1 || slide.role === "hook";
  const isCta = slideNum === totalSlides || slide.role === "cta";

  if (isCover) {
    // --- COVER SLIDE ---
    const headlineY = roleY + 85;
    ctx.save();
    ctx.font = `800 64px ${theme.fontDisplay}`;
    ctx.fillStyle = theme.primaryText;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const headlineLines = wrapText(ctx, slide.headline, contentWidth);
    let currentY = headlineY;
    for (const line of headlineLines) {
      ctx.fillText(line, marginX, currentY);
      currentY += 78;
    }

    // Gradient Accent Underline on Title
    const titleLineGrad = ctx.createLinearGradient(marginX, 0, marginX + 320, 0);
    titleLineGrad.addColorStop(0, theme.accentGradient[0]);
    titleLineGrad.addColorStop(1, theme.accentGradient[1]);
    ctx.fillStyle = titleLineGrad;
    ctx.beginPath();
    ctx.roundRect(marginX, currentY + 12, 180, 8, 4);
    ctx.fill();

    // Body Card / Context Callout
    currentY += 50;
    if (slide.body) {
      const cardHeight = Math.min(380, height - currentY - 220);
      ctx.fillStyle = theme.cardBg;
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(marginX, currentY, contentWidth, cardHeight, 24);
      ctx.fill();
      ctx.stroke();

      // Card Header
      ctx.fillStyle = theme.accentColor;
      ctx.font = `700 20px ${theme.fontBody}`;
      ctx.fillText("ESTRATÉGIA & CONTEXTO", marginX + 40, currentY + 40);

      // Card Body
      ctx.font = `400 28px ${theme.fontBody}`;
      ctx.fillStyle = theme.secondaryText;
      const bodyLines = wrapText(ctx, slide.body, contentWidth - 80);
      let cardTextY = currentY + 80;
      for (const bLine of bodyLines.slice(0, 5)) {
        ctx.fillText(bLine, marginX + 40, cardTextY);
        cardTextY += 44;
      }
    }
    ctx.restore();

    // Footer: Swipe Callout
    const footerY = height - 120;
    ctx.save();
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(marginX, footerY - 20, contentWidth, 70, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = `700 24px ${theme.fontBody}`;
    ctx.fillStyle = theme.primaryText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ARRASTE PARA O LADO  →", width / 2, footerY + 15);
    ctx.restore();

  } else if (isCta) {
    // --- CTA FINAL SLIDE ---
    const headlineY = roleY + 70;
    ctx.save();
    ctx.font = `800 52px ${theme.fontDisplay}`;
    ctx.fillStyle = theme.primaryText;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const headlineLines = wrapText(ctx, slide.headline, contentWidth);
    let currentY = headlineY;
    for (const line of headlineLines) {
      ctx.fillText(line, marginX, currentY);
      currentY += 66;
    }

    currentY += 30;

    // CTA Feature Box
    const boxHeight = 440;
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(marginX, currentY, contentWidth, boxHeight, 28);
    ctx.fill();
    ctx.stroke();

    // Glow effect inside card
    const cardGlow = ctx.createRadialGradient(
      width / 2,
      currentY + 120,
      10,
      width / 2,
      currentY + 120,
      350
    );
    cardGlow.addColorStop(0, theme.glowColor1);
    cardGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cardGlow;
    ctx.beginPath();
    ctx.roundRect(marginX + 2, currentY + 2, contentWidth - 4, boxHeight - 4, 26);
    ctx.fill();

    // CTA Label
    ctx.font = `800 22px ${theme.fontBody}`;
    ctx.fillStyle = theme.accentColor;
    ctx.textAlign = "center";
    ctx.fillText("SUA PRÓXIMA AÇÃO ESTRATÉGICA", width / 2, currentY + 55);

    // CTA Body
    ctx.font = `600 32px ${theme.fontBody}`;
    ctx.fillStyle = theme.primaryText;
    const bodyLines = wrapText(ctx, slide.body, contentWidth - 80);
    let ctaTextY = currentY + 110;
    for (const bLine of bodyLines.slice(0, 4)) {
      ctx.fillText(bLine, width / 2, ctaTextY);
      ctaTextY += 46;
    }

    // CTA Action Button Mockup
    const btnY = currentY + boxHeight - 110;
    const btnGrad = ctx.createLinearGradient(marginX + 60, 0, width - marginX - 60, 0);
    btnGrad.addColorStop(0, theme.accentGradient[0]);
    btnGrad.addColorStop(1, theme.accentGradient[1]);
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(marginX + 60, btnY, contentWidth - 120, 68, 20);
    ctx.fill();

    ctx.font = `800 24px ${theme.fontBody}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SALVE & COMPARTILHE", width / 2, btnY + 34);
    ctx.restore();

    // Footer profile note
    ctx.save();
    ctx.font = `500 20px ${theme.fontBody}`;
    ctx.fillStyle = theme.secondaryText;
    ctx.textAlign = "center";
    ctx.fillText(`Siga ${handle} para mais estratégias validadas`, width / 2, height - 90);
    ctx.restore();

  } else {
    // --- CONTENT / VALUE SLIDE (INSIGHT, METHOD, STEP, PROOF) ---
    const headlineY = roleY + 70;
    ctx.save();
    ctx.font = `800 48px ${theme.fontDisplay}`;
    ctx.fillStyle = theme.primaryText;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const headlineLines = wrapText(ctx, slide.headline, contentWidth);
    let currentY = headlineY;
    for (const line of headlineLines) {
      ctx.fillText(line, marginX, currentY);
      currentY += 60;
    }

    currentY += 25;

    // Main Card Container for Value Body
    const cardHeight = Math.min(620, height - currentY - 140);
    ctx.fillStyle = theme.cardBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(marginX, currentY, contentWidth, cardHeight, 26);
    ctx.fill();
    ctx.stroke();

    // Emphasis Pill if present
    let textStartY = currentY + 50;
    if (slide.emphasis) {
      ctx.fillStyle = theme.highlightBg;
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(marginX + 36, textStartY - 10, contentWidth - 72, 60, 14);
      ctx.fill();
      ctx.stroke();

      ctx.font = `700 20px ${theme.fontBody}`;
      ctx.fillStyle = theme.accentColor;
      ctx.fillText(`★ PONTO-CHAVE: ${slide.emphasis}`, marginX + 54, textStartY + 18);
      textStartY += 75;
    }

    // Body Text Lines
    ctx.font = `400 28px ${theme.fontBody}`;
    ctx.fillStyle = theme.secondaryText;
    ctx.textBaseline = "top";
    const bodyLines = wrapText(ctx, slide.body, contentWidth - 80);
    for (const bLine of bodyLines.slice(0, 9)) {
      ctx.fillText(bLine, marginX + 40, textStartY);
      textStartY += 44;
    }

    // Layout Suggestion / Visual Direction hint badge
    if (slide.designIntent) {
      const intentY = currentY + cardHeight - 65;
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.roundRect(marginX + 30, intentY, contentWidth - 60, 42, 10);
      ctx.fill();

      ctx.font = `600 16px ${theme.fontBody}`;
      ctx.fillStyle = theme.accentColor;
      ctx.fillText(`Direção Visual: ${slide.designIntent.substring(0, 65)}...`, marginX + 46, intentY + 26);
    }
    ctx.restore();

    // Subtle bottom page indicator
    ctx.save();
    ctx.font = `600 18px ${theme.fontBody}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.textAlign = "right";
    ctx.fillText(`${slideNum} de ${totalSlides}  →`, width - marginX, height - 90);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText(handle, marginX, height - 90);
    ctx.restore();
  }

  return canvas.toDataURL("image/png", options.quality || 0.95);
}

/**
 * Render a Static Post onto a publication-ready Canvas (1080x1350 / 1080x1080)
 */
export function renderStaticPostToDataUrl(
  post: StaticPostProductionOutput,
  options: RenderCanvasOptions = {}
): string {
  if (typeof document === "undefined") {
    return "";
  }

  const width = options.width || 1080;
  const height = options.height || 1350;
  const theme = VISUAL_THEMES[options.themeId || post.theme || "dark_editorial"] || VISUAL_THEMES.dark_editorial;
  const handle = options.handle ? (options.handle.startsWith("@") ? options.handle : `@${options.handle}`) : "@instascore.ai";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. BACKGROUND GRADIENT
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, theme.bgGradient[0]);
  bgGrad.addColorStop(0.5, theme.bgGradient[1]);
  bgGrad.addColorStop(1, theme.bgGradient[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. RADIAL AMBIENT GLOWS
  const glow1 = ctx.createRadialGradient(width / 2, 350, 40, width / 2, 350, 650);
  glow1.addColorStop(0, theme.glowColor1);
  glow1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow1;
  ctx.beginPath();
  ctx.arc(width / 2, 350, 650, 0, Math.PI * 2);
  ctx.fill();

  const glow2 = ctx.createRadialGradient(width - 200, height - 200, 30, width - 200, height - 200, 500);
  glow2.addColorStop(0, theme.glowColor2);
  glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow2;
  ctx.beginPath();
  ctx.arc(width - 200, height - 200, 500, 0, Math.PI * 2);
  ctx.fill();

  // Subtle geometric grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  for (let x = 90; x < width; x += 150) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // 3. SAFE MARGINS
  const marginX = 90;
  const contentWidth = width - marginX * 2;
  const topBarY = 115;

  // 4. HEADER: PROFILE HANDLE & CATEGORY
  ctx.save();
  ctx.fillStyle = theme.badgeBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(marginX, topBarY - 30, 260, 46, 23);
  ctx.fill();
  ctx.stroke();

  ctx.font = `600 20px ${theme.fontBody}`;
  ctx.fillStyle = theme.badgeText;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(handle, marginX + 22, topBarY - 7);
  ctx.restore();

  // Strategic Pillar Badge (e.g. AUTORIDADE / CONVERSÃO)
  ctx.save();
  const pillarText = post.cagePillar ? post.cagePillar.toUpperCase() : "ESTRATÉGIA";
  ctx.font = `800 18px ${theme.fontBody}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(`PILAR: ${pillarText}`, width - marginX, topBarY - 7);
  ctx.restore();

  // 5. POST HOOK / HEADLINE
  const headlineY = topBarY + 70;
  ctx.save();
  ctx.font = `800 56px ${theme.fontDisplay}`;
  ctx.fillStyle = theme.primaryText;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const headlineLines = wrapText(ctx, post.headline || post.hook || post.title, contentWidth);
  let currentY = headlineY;
  for (const line of headlineLines.slice(0, 4)) {
    ctx.fillText(line, marginX, currentY);
    currentY += 70;
  }

  // Title accent bar
  const titleGrad = ctx.createLinearGradient(marginX, 0, marginX + 280, 0);
  titleGrad.addColorStop(0, theme.accentGradient[0]);
  titleGrad.addColorStop(1, theme.accentGradient[1]);
  ctx.fillStyle = titleGrad;
  ctx.beginPath();
  ctx.roundRect(marginX, currentY + 12, 160, 7, 3.5);
  ctx.fill();

  currentY += 45;

  // 6. MAIN VALUE CARD / INSIGHT
  const cardHeight = Math.min(520, height - currentY - 190);
  ctx.fillStyle = theme.cardBg;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(marginX, currentY, contentWidth, cardHeight, 26);
  ctx.fill();
  ctx.stroke();

  // Inside Card: Core Concept / Body
  ctx.font = `700 22px ${theme.fontBody}`;
  ctx.fillStyle = theme.accentColor;
  ctx.fillText("INSIGHT ESTRATÉGICO", marginX + 40, currentY + 45);

  ctx.font = `400 28px ${theme.fontBody}`;
  ctx.fillStyle = theme.secondaryText;
  const bodyLines = wrapText(ctx, post.bodyCopy || post.concept, contentWidth - 80);
  let bodyY = currentY + 90;
  for (const bLine of bodyLines.slice(0, 6)) {
    ctx.fillText(bLine, marginX + 40, bodyY);
    bodyY += 44;
  }

  // Takeaway box inside card
  if (post.takeaway) {
    const takeY = currentY + cardHeight - 110;
    ctx.fillStyle = theme.highlightBg;
    ctx.strokeStyle = theme.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(marginX + 30, takeY, contentWidth - 60, 75, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = `800 20px ${theme.fontBody}`;
    ctx.fillStyle = theme.accentColor;
    ctx.fillText(`⚡ CONCLUSÃO:`, marginX + 48, takeY + 28);

    ctx.font = `600 20px ${theme.fontBody}`;
    ctx.fillStyle = theme.primaryText;
    ctx.fillText(post.takeaway.substring(0, 52), marginX + 48, takeY + 54);
  }
  ctx.restore();

  // 7. FOOTER CTA STRIP
  const footerY = height - 130;
  ctx.save();
  const ctaGrad = ctx.createLinearGradient(marginX, 0, width - marginX, 0);
  ctaGrad.addColorStop(0, theme.accentGradient[0]);
  ctaGrad.addColorStop(1, theme.accentGradient[1]);
  ctx.fillStyle = ctaGrad;
  ctx.beginPath();
  ctx.roundRect(marginX, footerY, contentWidth, 68, 20);
  ctx.fill();

  ctx.font = `800 22px ${theme.fontBody}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ctaText = post.finalCta ? post.finalCta.substring(0, 48) : "LEIA A LEGENDA & SALVE ESTE POST";
  ctx.fillText(ctaText.toUpperCase(), width / 2, footerY + 34);
  ctx.restore();

  return canvas.toDataURL("image/png", options.quality || 0.95);
}

/**
 * Render all slides of a Carousel in batch
 */
export function renderAllCarouselSlides(
  carousel: CarouselProductionOutput,
  options: RenderCanvasOptions = {}
): string[] {
  if (!carousel || !carousel.slides || carousel.slides.length === 0) return [];
  const themeId = options.themeId || carousel.theme || "dark_editorial";
  const handle = options.handle || carousel.brief?.contentDNA?.handle || "@instascore.ai";
  const totalSlides = carousel.slides.length;

  return carousel.slides.map((slide) =>
    renderCarouselSlideToDataUrl(slide, {
      ...options,
      themeId,
      handle,
      totalSlides
    })
  );
}

/**
 * Trigger client-side download of a single PNG image
 */
export function downloadDataUrlAsPng(dataUrl: string, filename: string): void {
  if (typeof document === "undefined" || !dataUrl) return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download all slides sequentially with a small delay
 */
export async function downloadAllSlidesSequentially(
  dataUrls: string[],
  baseFilename: string
): Promise<void> {
  for (let i = 0; i < dataUrls.length; i++) {
    const num = String(i + 1).padStart(2, "0");
    downloadDataUrlAsPng(dataUrls[i], `${baseFilename}_slide_${num}.png`);
    await new Promise((r) => setTimeout(r, 250));
  }
}
