import fs from 'fs';
import path from 'path';

export function runFileUploaderComponentTests(): { passed: number; failed: number; tests: string[] } {
  let passed = 0;
  let failed = 0;
  const logs: string[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      logs.push(`  \x1b[32m✔\x1b[0m [Component:FileUploader] ${name}`);
    } catch (err: any) {
      failed++;
      logs.push(`  \x1b[31m✖\x1b[0m [Component:FileUploader] ${name} -> ${err.message}`);
    }
  }

  const uploaderPath = path.join(process.cwd(), 'src/components/FileUploader.tsx');
  const uploaderContent = fs.readFileSync(uploaderPath, 'utf-8');

  // 1. Dropzone keyboard interaction
  test("FileUploader dropzone has role='button' and tabIndex={0} for full keyboard focusability", () => {
    if (!uploaderContent.includes('role="button"') || !uploaderContent.includes('tabIndex={0}')) {
      throw new Error("FileUploader dropzone is not keyboard focusable");
    }
    if (!uploaderContent.includes('e.key === "Enter"') || !uploaderContent.includes('e.key === " "')) {
      throw new Error("FileUploader dropzone does not handle Enter or Space keydown events");
    }
  });

  // 2. ARIA descriptions and labels
  test("FileUploader specifies aria-label and aria-describedby for assistive tech", () => {
    if (!uploaderContent.includes('aria-label=') || !uploaderContent.includes('aria-describedby=')) {
      throw new Error("Missing aria-label or aria-describedby in FileUploader");
    }
  });

  // 3. Dynamic error announcement
  test("FileUploader displays upload validation errors in a live region (role='alert')", () => {
    if (!uploaderContent.includes('role="alert"') || !uploaderContent.includes('aria-live=')) {
      throw new Error("Upload errors are not announced in a live region");
    }
  });

  // 4. File remove button accessibility
  test("File preview removal buttons have clear accessible labels", () => {
    if (!uploaderContent.includes('aria-label={`Remover arquivo de ${label}`}') && !uploaderContent.includes('aria-label={`Substituir arquivo de ${label}`}')) {
      throw new Error("Missing descriptive aria-label on file removal or replace buttons");
    }
  });

  return { passed, failed, tests: logs };
}
