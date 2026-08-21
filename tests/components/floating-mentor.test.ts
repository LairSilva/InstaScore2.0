import fs from 'fs';
import path from 'path';

export function runFloatingMentorTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Component:FloatingMentor] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Component:FloatingMentor] ${name} -> ${err.message}`);
    }
  }

  const widgetPath = path.join(process.cwd(), 'src/components/FloatingMentorWidget.tsx');
  const widgetCode = fs.readFileSync(widgetPath, 'utf-8');

  const osLayoutPath = path.join(process.cwd(), 'src/layouts/OSLayout.tsx');
  const osLayoutCode = fs.readFileSync(osLayoutPath, 'utf-8');

  const appPath = path.join(process.cwd(), 'src/App.tsx');
  const appCode = fs.readFileSync(appPath, 'utf-8');

  // 1. Persistent layer architecture (outside scroll and transform contexts)
  test("OSLayout mounts floatingElement outside <main> and <motion.div> to prevent CSS transform trapping", () => {
    if (!osLayoutCode.includes('{floatingElement}')) {
      throw new Error("OSLayout does not render {floatingElement} slot");
    }
    // Verify {floatingElement} is after </main>
    const mainEndIndex = osLayoutCode.indexOf('</main>');
    const floatingElementIndex = osLayoutCode.indexOf('{floatingElement}');
    if (floatingElementIndex < mainEndIndex) {
      throw new Error("{floatingElement} is rendered inside or before </main>, violating persistent viewport layering");
    }
  });

  // 2. Trigger button positioning and safe-area insets
  test("Floating trigger button has position: fixed, z-index: 40, and respects mobile safe-area insets", () => {
    if (!widgetCode.includes('fixed z-40') || !widgetCode.includes('pointer-events-auto')) {
      throw new Error("Trigger container missing 'fixed z-40 pointer-events-auto'");
    }
    if (!widgetCode.includes('env(safe-area-inset-bottom') || !widgetCode.includes('env(safe-area-inset-right')) {
      throw new Error("Trigger container missing safe-area-inset CSS calculations");
    }
    if (!widgetCode.includes('max(16px')) {
      throw new Error("Trigger container missing minimum 16px bound for safe-area insets");
    }
  });

  // 3. Trigger button semantics and accessibility
  test("Trigger button is a real <button> with id='btn_floating_mentor_open', touch target >= 44px, and aria-label", () => {
    if (!widgetCode.includes('id="btn_floating_mentor_open"')) {
      throw new Error("Missing id='btn_floating_mentor_open' on trigger button");
    }
    if (!widgetCode.includes('aria-label="Abrir Mentor IA"')) {
      throw new Error("Missing aria-label='Abrir Mentor IA' on trigger button");
    }
    if (!widgetCode.includes('min-h-[48px]') || !widgetCode.includes('min-w-[48px]')) {
      throw new Error("Trigger button does not meet minimum 44px touch target requirement");
    }
    if (!widgetCode.includes('focus-visible:ring-2') || !widgetCode.includes('focus-visible:outline-none')) {
      throw new Error("Trigger button missing accessible focus-visible ring styles");
    }
  });

  // 4. Modal dialog accessibility and focus trapping
  test("Mentor chat modal implements role='dialog', aria-modal='true', and integrates useAccessibleModal for focus trap & restore", () => {
    if (!widgetCode.includes('role="dialog"') || !widgetCode.includes('aria-modal="true"')) {
      throw new Error("Mentor modal missing role='dialog' or aria-modal='true'");
    }
    if (!widgetCode.includes('useAccessibleModal')) {
      throw new Error("FloatingMentorWidget does not integrate useAccessibleModal hook");
    }
    if (!widgetCode.includes('aria-labelledby="mentor-dialog-title"')) {
      throw new Error("Mentor modal missing aria-labelledby reference to title");
    }
    if (!widgetCode.includes('id="btn-close-floating-mentor"') || !widgetCode.includes('aria-label="Fechar Mentor IA"')) {
      throw new Error("Missing accessible close button in Mentor modal");
    }
  });

  // 5. Single instance enforcement and empty AI response handling
  test("Single floating instance is rendered only when not in full Mentor tab, and handles empty AI responses cleanly", () => {
    if (!appCode.includes('activeOsModule !== "mentor" ? (')) {
      throw new Error("App.tsx does not condition floating widget rendering to activeOsModule !== 'mentor'");
    }
    if (!widgetCode.includes('Resposta vazia retornada pelo motor de IA') && !widgetCode.includes('Erro ao consultar o mentor')) {
      throw new Error("FloatingMentorWidget does not explicitly guard against empty AI text responses");
    }
  });

  return { passed, failed, tests: logs };
}
