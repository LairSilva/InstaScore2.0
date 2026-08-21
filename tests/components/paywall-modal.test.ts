import fs from 'fs';
import path from 'path';

export function runPaywallModalComponentTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Component:PaywallModal] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Component:PaywallModal] ${name} -> ${err.message}`);
    }
  }

  const paywallPath = path.join(process.cwd(), 'src/components/PaywallModal.tsx');
  const paywallContent = fs.readFileSync(paywallPath, 'utf-8');

  // 1. Modal ARIA semantics
  test("PaywallModal implements role='dialog', aria-modal='true', and accessible labeling", () => {
    if (!paywallContent.includes('role="dialog"') || !paywallContent.includes('aria-modal="true"')) {
      throw new Error("PaywallModal missing role='dialog' or aria-modal='true'");
    }
    if (!paywallContent.includes('aria-labelledby=') || !paywallContent.includes('aria-describedby=')) {
      throw new Error("PaywallModal missing aria-labelledby or aria-describedby");
    }
  });

  // 2. Focus trap and Escape hook integration
  test("PaywallModal integrates useAccessibleModal for focus trapping and escape closing", () => {
    if (!paywallContent.includes('useAccessibleModal')) {
      throw new Error("PaywallModal does not implement useAccessibleModal hook");
    }
  });

  // 3. Billing cycle toggle accessibility
  test("PaywallModal cycle switch implements role='radiogroup' and aria-checked states", () => {
    if (!paywallContent.includes('role="radiogroup"') || !paywallContent.includes('role="radio"')) {
      throw new Error("Billing cycle switch does not use radiogroup semantics");
    }
    if (!paywallContent.includes('aria-checked={cycle ===')) {
      throw new Error("Missing aria-checked state on billing cycle radios");
    }
  });

  // 4. Payment method selector
  test("Payment method selector supports Pix and Credit Card options with clear labels", () => {
    if (!paywallContent.includes("'pix'") || !paywallContent.includes("'card'")) {
      throw new Error("Missing Pix or Card payment method states");
    }
    if (!paywallContent.includes('aria-label="Fechar modal de assinatura"')) {
      throw new Error("Missing accessible close button label");
    }
  });

  return { passed, failed, tests: logs };
}
