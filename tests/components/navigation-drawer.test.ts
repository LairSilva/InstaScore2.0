import fs from 'fs';
import path from 'path';
import { NAV_ITEMS, STRATEGY_NAV_ITEMS, OS_NAV_ITEMS } from '../../src/config/navigation';

export function runNavigationDrawerTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Component:NavDrawer] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Component:NavDrawer] ${name} -> ${err.message}`);
    }
  }

  const osLayoutPath = path.join(process.cwd(), 'src/layouts/OSLayout.tsx');
  const osLayoutCode = fs.readFileSync(osLayoutPath, 'utf-8');

  const resultViewPath = path.join(process.cwd(), 'src/components/ResultView.tsx');
  const resultViewCode = fs.readFileSync(resultViewPath, 'utf-8');

  // 1. Centralized navigation configuration verification
  test("Centralized navigation defines all required strategic and OS modules with labels and a11y labels", () => {
    const requiredLabels = [
      "Sua Estratégia & DNA",
      "Content Lab",
      "Diagnóstico & C.A.G.E.",
      "Central PRO",
      "Digital Twin",
      "Global Benchmark",
      "Growth Center",
      "Simulador AI"
    ];

    for (const label of requiredLabels) {
      const item = NAV_ITEMS.find(n => n.label === label || n.label.startsWith(label));
      if (!item) {
        throw new Error(`Missing required navigation item: ${label}`);
      }
      if (!item.ariaLabel) {
        throw new Error(`Missing ariaLabel for navigation item: ${label}`);
      }
    }
  });

  // 2. Mobile hamburger button accessibility
  test("Mobile header contains accessible hamburger button with aria-label='Abrir menu' and touch target >= 44px", () => {
    if (!osLayoutCode.includes('id="btn-open-os-drawer"')) {
      throw new Error("Missing btn-open-os-drawer in OSLayout");
    }
    if (!osLayoutCode.includes('aria-label="Abrir menu"')) {
      throw new Error("Missing aria-label='Abrir menu' on hamburger button");
    }
    if (!osLayoutCode.includes('min-h-[44px]') || !osLayoutCode.includes('min-w-[44px]')) {
      throw new Error("Hamburger button does not enforce min 44px touch target");
    }
    if (!osLayoutCode.includes('aria-controls="mobile-os-drawer"')) {
      throw new Error("Hamburger button missing aria-controls='mobile-os-drawer'");
    }
  });

  // 3. Mobile drawer modal accessibility
  test("Mobile drawer implements role='dialog', aria-modal='true', and integrates useAccessibleModal", () => {
    if (!osLayoutCode.includes('id="mobile-os-drawer"')) {
      throw new Error("Missing id='mobile-os-drawer' in OSLayout");
    }
    if (!osLayoutCode.includes('role="dialog"') || !osLayoutCode.includes('aria-modal="true"')) {
      throw new Error("Mobile drawer missing role='dialog' or aria-modal='true'");
    }
    if (!osLayoutCode.includes('useAccessibleModal')) {
      throw new Error("Mobile drawer does not integrate useAccessibleModal for focus trapping");
    }
    if (!osLayoutCode.includes('aria-label="Fechar menu"')) {
      throw new Error("Missing close button with aria-label='Fechar menu'");
    }
  });

  // 4. Mobile drawer items completeness & active state
  test("Mobile drawer renders all 10 required items (Strategy, Content Lab, C.A.G.E., Central PRO, Twin, Benchmark, Growth, Simulator, Privacy, Logout)", () => {
    if (!osLayoutCode.includes('NAV_AREAS') && (!osLayoutCode.includes('STRATEGY_NAV_ITEMS') || !osLayoutCode.includes('OS_NAV_ITEMS'))) {
      throw new Error("OSLayout does not iterate over standardized NAV_AREAS or STRATEGY_NAV_ITEMS and OS_NAV_ITEMS");
    }
    if (!osLayoutCode.includes('btn-drawer-privacy') || !osLayoutCode.includes('btn-drawer-logout')) {
      throw new Error("Mobile drawer missing Privacy or Logout action items");
    }
    if (!osLayoutCode.includes('aria-current={active ? "page" : undefined}')) {
      throw new Error("Nav items do not communicate active state via aria-current='page'");
    }
  });

  // 5. ResultView hides horizontal tabs on mobile while preserving them on desktop
  test("ResultView hides horizontal tabs on mobile (<768px) and displays them on desktop (md:block / md:flex)", () => {
    if (!resultViewCode.includes('hidden md:block') && !resultViewCode.includes('hidden md:flex')) {
      throw new Error("ResultView does not hide the horizontal tab list on mobile screens (<768px)");
    }
    if (!resultViewCode.includes('btn_share_result_card') || !resultViewCode.includes('btn_redo_analysis')) {
      throw new Error("ResultView missing primary Share or Redo action buttons");
    }
  });

  return { passed, failed, tests: logs };
}
