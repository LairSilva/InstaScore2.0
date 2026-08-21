import fs from 'fs';
import path from 'path';

export function runOnboardingComponentTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Component:Onboarding] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Component:Onboarding] ${name} -> ${err.message}`);
    }
  }

  const appPath = path.join(process.cwd(), 'src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  // 1. Progressbar semantics in onboarding
  test("Onboarding view renders an accessible progressbar with aria-valuenow and aria-valuemax", () => {
    if (!appContent.includes('role="progressbar"')) {
      throw new Error("Missing role='progressbar' in onboarding questions");
    }
    if (!appContent.includes('aria-valuenow={onboardingStep}') || !appContent.includes('aria-valuemax={10}')) {
      throw new Error("Missing aria-valuenow or aria-valuemax={10} in onboarding progressbar");
    }
  });

  // 2. Radio group selection for presets
  test("Preset question options implement role='radiogroup' and role='radio' semantics", () => {
    if (!appContent.includes('role="radiogroup"') || !appContent.includes('role="radio"')) {
      throw new Error("Missing radiogroup or radio ARIA roles in question options");
    }
    if (!appContent.includes('aria-checked=')) {
      throw new Error("Missing aria-checked state in radio options");
    }
  });

  // 3. Step bounds and navigation controls
  test("Onboarding handles next and back navigation safely with contextual aria-labels", () => {
    if (!appContent.includes('handleNextStep') || !appContent.includes('handleBackStep')) {
      throw new Error("Missing navigation handlers for onboarding flow");
    }
    if (!appContent.includes('aria-label="Voltar para a pergunta anterior"')) {
      throw new Error("Missing accessible back navigation button label");
    }
  });

  // 4. Form validation announcement
  test("Validation errors during onboarding are announced via role='alert' and aria-live='assertive'", () => {
    if (!appContent.includes('role="alert"') || !appContent.includes('aria-live="assertive"')) {
      throw new Error("Missing live region for announcing validation errors");
    }
  });

  return { passed, failed, tests: logs };
}
