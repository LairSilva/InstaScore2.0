/**
 * Native Canvas-based Share Card Generator for InstaScore.ai.
 * Renders a highly polished 1080x1080px sharing graphic client-side without external dependencies.
 */

export function generateShareCard(
  userName: string,
  handle: string,
  score: number,
  targetScore: number,
  strongestCategory: string
): Promise<string> {
  return new Promise((resolve) => {
    // Create a 1080x1080 high-res canvas
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve("");
      return;
    }

    // --- 1. Background Gradient (Glossy midnight violet to deep dark purple) ---
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, "#06030D"); // Deep obsidian midnight
    bgGrad.addColorStop(0.5, "#120924"); // Rich dark violet
    bgGrad.addColorStop(1, "#1E0D33"); // Glossy magenta-violet dark canvas
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // --- 2. Ambient Radial Glows Matching Brand Palette ---
    // Top-left Orange Glow
    const glowOrange = ctx.createRadialGradient(200, 200, 20, 200, 200, 450);
    glowOrange.addColorStop(0, "rgba(255, 94, 54, 0.15)");
    glowOrange.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowOrange;
    ctx.beginPath();
    ctx.arc(200, 200, 450, 0, Math.PI * 2);
    ctx.fill();

    // Bottom-right Purple/Magenta Glow
    const glowMagenta = ctx.createRadialGradient(880, 880, 20, 880, 880, 450);
    glowMagenta.addColorStop(0, "rgba(225, 48, 108, 0.18)");
    glowMagenta.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glowMagenta;
    ctx.beginPath();
    ctx.arc(880, 880, 450, 0, Math.PI * 2);
    ctx.fill();

    // Subtle background concentric circles
    ctx.strokeStyle = "rgba(225, 48, 108, 0.05)";
    ctx.lineWidth = 2;
    for (let r = 200; r <= 800; r += 150) {
      ctx.beginPath();
      ctx.arc(540, 540, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // --- 3. App Header & Brand Emblem ---
    const cx = 540;
    
    // Draw Squircle Emblem Logo Header
    ctx.save();
    ctx.translate(cx, 110);

    // Logo Card Shadow
    ctx.shadowColor = "#E1306C";
    ctx.shadowBlur = 25;

    // Squircle background
    ctx.fillStyle = "#0B0716";
    ctx.strokeStyle = "#FA26A0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-40, -40, 80, 80, 20);
    ctx.fill();
    ctx.stroke();

    // White 'I' bar
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(-20, -20, 9, 32, 4.5);
    ctx.fill();

    // Gradient 'S'
    const logoSGrad = ctx.createLinearGradient(-10, -20, 20, 20);
    logoSGrad.addColorStop(0, "#FF5E36");
    logoSGrad.addColorStop(0.5, "#E1306C");
    logoSGrad.addColorStop(1, "#833AB4");
    ctx.strokeStyle = logoSGrad;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, -14);
    ctx.bezierCurveTo(16, -14, 16, -4, -2, 2);
    ctx.bezierCurveTo(-18, 8, -18, 18, 16, 18);
    ctx.stroke();

    ctx.restore();

    // Draw Brand Text: "INSTASCORE.ai"
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "black 42px 'Plus Jakarta Sans', system-ui, sans-serif";
    
    // Measure INSTA, SCORE, .ai text widths for gradient calculation
    const textInsta = "INSTA";
    const textScore = "SCORE";
    const textAi = ".ai";

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 42px sans-serif";
    const wInsta = ctx.measureText(textInsta).width;
    const wScore = ctx.measureText(textScore).width;
    const wAi = ctx.measureText(textAi).width;
    const totalW = wInsta + wScore + wAi;
    
    let startX = 540 - (totalW / 2);

    // Render "INSTA"
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(textInsta, startX, 195);

    // Render "SCORE" in gradient
    startX += wInsta;
    const scoreTextGrad = ctx.createLinearGradient(startX, 195, startX + wScore, 195);
    scoreTextGrad.addColorStop(0, "#FF5E36");
    scoreTextGrad.addColorStop(0.5, "#E1306C");
    scoreTextGrad.addColorStop(1, "#C084FC");
    ctx.fillStyle = scoreTextGrad;
    ctx.fillText(textScore, startX, 195);

    // Render ".ai" in cyan
    startX += wScore;
    ctx.fillStyle = "#38BDF8";
    ctx.fillText(textAi, startX, 195);

    // Tagline: AUDITA • ANALISA • ACELERA
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
    ctx.font = "bold 15px sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("AUDITA • ANALISA • ACELERA", 540, 235);

    // --- 4. Central Score Gauge ---
    const cy = 520;
    const radius = 180;

    // Background track arc
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 24;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI * 0.8, Math.PI * 2.2);
    ctx.stroke();

    // Active score brand gradient arc (Orange -> Magenta -> Purple)
    const activeGrad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    activeGrad.addColorStop(0, "#FF5E36"); // Warm Orange
    activeGrad.addColorStop(0.45, "#E1306C"); // Magenta Pink
    activeGrad.addColorStop(1, "#833AB4"); // Rich Violet
    ctx.strokeStyle = activeGrad;
    ctx.lineWidth = 24;
    ctx.save();
    ctx.shadowColor = "#E1306C";
    ctx.shadowBlur = 25;

    const startAngle = Math.PI * 0.8;
    const scorePercentage = score / 100;
    const endAngle = startAngle + scorePercentage * (Math.PI * 1.4);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();

    // Target Score Arc
    if (targetScore > score) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.5)"; // Cyan target line
      ctx.lineWidth = 12;
      ctx.setLineDash([8, 8]);
      const targetPercentage = targetScore / 100;
      const targetEndAngle = startAngle + targetPercentage * (Math.PI * 1.4);

      ctx.beginPath();
      ctx.arc(cx, cy, radius + 22, endAngle + 0.05, targetEndAngle);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Score Text Inside Gauge
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "black 110px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(`${score}`, cx, cy - 10);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("/ 100", cx, cy + 50);

    ctx.fillStyle = "#FA26A0";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("SCORE ESTRUTURAL", cx, cy + 90);

    // --- 5. User Profile Card ---
    const cardY = 740;
    const cardW = 860;
    const cardH = 210;
    const cardX = cx - cardW / 2;

    // Card background with brand glassmorphism
    ctx.fillStyle = "rgba(18, 10, 33, 0.85)";
    ctx.strokeStyle = "rgba(225, 48, 108, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.stroke();

    // User Handle & Name
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(handle ? `@${handle.replace("@", "")}` : userName, cardX + 40, cardY + 65);

    ctx.fillStyle = "rgba(226, 232, 240, 0.7)";
    ctx.font = "22px sans-serif";
    ctx.fillText(`Ponto Forte: ${strongestCategory}`, cardX + 40, cardY + 110);

    // Target Projection Badge
    if (targetScore > score) {
      const badgeW = 280;
      const badgeH = 70;
      const badgeX = cardX + cardW - badgeW - 40;
      const badgeY = cardY + (cardH - badgeH) / 2;

      ctx.fillStyle = "rgba(225, 48, 108, 0.15)";
      ctx.strokeStyle = "rgba(225, 48, 108, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#FF5E36";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("SIMULAÇÃO C.A.G.E.", badgeX + badgeW / 2, badgeY + 28);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(`Alvo: ${targetScore}/100`, badgeX + badgeW / 2, badgeY + 55);
    }

    // --- 6. Footer ---
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Diagnóstico estrutural C.A.G.E. • InstaScore.ai", cx, 995);

    ctx.fillStyle = "rgba(226, 232, 240, 0.45)";
    ctx.font = "14px sans-serif";
    ctx.fillText("Simulação matemática de conformidade metodológica. Sem garantia de alcance ou vendas.", cx, 1025);

    // Return data URL
    resolve(canvas.toDataURL("image/png"));
  });
}

