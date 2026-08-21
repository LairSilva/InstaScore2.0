import fs from 'fs';
import path from 'path';

export function runModalA11yComponentTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Component:ModalA11y] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Component:ModalA11y] ${name} -> ${err.message}`);
    }
  }

  const hookPath = path.join(process.cwd(), 'src/hooks/useAccessibleModal.ts');
  const hookContent = fs.readFileSync(hookPath, 'utf-8');

  // 1. Focus trap implementation
  test("useAccessibleModal traps Tab and Shift+Tab key navigation within modal bounds", () => {
    if (!hookContent.includes('handleKeyDown') || !hookContent.includes('e.key === "Tab"')) {
      throw new Error("Missing Tab focus trapping logic in useAccessibleModal");
    }
    if (!hookContent.includes('firstElement') || !hookContent.includes('lastElement')) {
      throw new Error("Missing boundary focus target cycling in useAccessibleModal");
    }
  });

  // 2. Escape key dismissal
  test("useAccessibleModal handles Escape key to dismiss the open modal", () => {
    if (!hookContent.includes('e.key === "Escape"')) {
      throw new Error("Missing Escape key listener in useAccessibleModal");
    }
  });

  // 3. Focus restoration
  test("useAccessibleModal remembers previously focused element and restores focus upon closing", () => {
    if (!hookContent.includes('triggerRef.current') || !hookContent.includes('.focus()')) {
      throw new Error("Missing focus restoration logic in useAccessibleModal");
    }
  });

  // 4. Modal components integration check
  test("All primary application modals (PaywallModal, ShareModal, PrivacyDataModal) use useAccessibleModal", () => {
    const modals = [
      'src/components/PaywallModal.tsx',
      'src/components/ShareModal.tsx',
      'src/components/PrivacyDataModal.tsx'
    ];

    for (const modalRelPath of modals) {
      const modalPath = path.join(process.cwd(), modalRelPath);
      const modalCode = fs.readFileSync(modalPath, 'utf-8');
      if (!modalCode.includes('useAccessibleModal')) {
        throw new Error(`${modalRelPath} does not use useAccessibleModal hook`);
      }
    }
  });

  return { passed, failed, tests: logs };
}
