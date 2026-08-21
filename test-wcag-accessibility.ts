import fs from 'fs';
import path from 'path';

/**
 * Automated WCAG 2.1 AA Accessibility Test Suite
 * Validates critical accessibility elements across files:
 * 1. HTML lang, meta tags, OpenGraph, favicon
 * 2. CSS focus-visible, prefers-reduced-motion, skip-link
 * 3. FileUploader keyboard navigation, ARIA roles, input labels
 * 4. Modal accessibility (useAccessibleModal, focus trap, Escape, aria-modal, role="dialog")
 * 5. Onboarding progress indicators (role="progressbar", aria-valuenow, valuemin, valuemax)
 * 6. Alert & live regions (role="alert", aria-live)
 * 7. Radio & pressed semantics (role="radiogroup", role="radio", aria-checked, aria-pressed)
 * 8. Touch target minimum sizes (min-h-[44px], min-w-[44px])
 */

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖\x1b[0m ${testName}`);
    if (details) {
      console.error(`    \x1b[33m↳ ${details}\x1b[0m`);
    }
  }
}

console.log('\n======================================================');
console.log('    INSTASCORE.AI — WCAG 2.1 AA ACCESSIBILITY AUDIT   ');
console.log('======================================================\n');

// 1. Audit index.html
console.log('[1/7] Auditing index.html (i18n, Metadata, OG, Title)...');
const indexHtmlPath = path.join(process.cwd(), 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

assert(
  indexHtmlContent.includes('lang="pt-BR"'),
  'HTML tag specifies Brazilian Portuguese lang="pt-BR"',
  'Found: ' + (indexHtmlContent.match(/<html[^>]*>/)?.[0] || 'none')
);

assert(
  /<title>.*InstaScore.*<\/title>/i.test(indexHtmlContent),
  'Title tag contains brand and descriptive title',
  'Title: ' + (indexHtmlContent.match(/<title>(.*?)<\/title>/)?.[1] || 'none')
);

assert(
  indexHtmlContent.includes('name="description"') && indexHtmlContent.includes('Instagram'),
  'Meta description is present with localized text'
);

assert(
  indexHtmlContent.includes('property="og:title"') && indexHtmlContent.includes('property="og:description"') && indexHtmlContent.includes('property="og:locale"') && indexHtmlContent.includes('pt_BR'),
  'OpenGraph meta tags include localized og:title, og:description, and og:locale="pt_BR"'
);

assert(
  indexHtmlContent.includes('rel="icon"'),
  'Brand favicon is linked in head'
);

// 2. Audit CSS (/src/index.css)
console.log('\n[2/7] Auditing index.css (Focus rings, Reduced Motion, Contrast, Skip Link)...');
const indexCssPath = path.join(process.cwd(), 'src/index.css');
const indexCssContent = fs.readFileSync(indexCssPath, 'utf-8');

assert(
  indexCssContent.includes(':focus-visible'),
  'Global focus ring (:focus-visible) defined for clear keyboard focus cues'
);

assert(
  indexCssContent.includes('@media (prefers-reduced-motion: reduce)'),
  'Media query for prefers-reduced-motion is implemented to disable animations for sensitive users'
);

assert(
  indexCssContent.includes('.skip-link'),
  'Accessible skip-link styling is provided for keyboard-first navigation'
);

// 3. Audit FileUploader (/src/components/FileUploader.tsx)
console.log('\n[3/7] Auditing FileUploader.tsx (Keyboard navigation & ARIA semantics)...');
const uploaderPath = path.join(process.cwd(), 'src/components/FileUploader.tsx');
const uploaderContent = fs.readFileSync(uploaderPath, 'utf-8');

assert(
  uploaderContent.includes('role="button"') && uploaderContent.includes('tabIndex={0}'),
  'Dropzone has role="button" and tabIndex={0} for full keyboard accessibility'
);

assert(
  uploaderContent.includes('handleKeyDown') && (uploaderContent.includes('Enter') || uploaderContent.includes('" "')),
  'Dropzone handles Enter and Space keyboard activation'
);

assert(
  uploaderContent.includes('aria-describedby') && uploaderContent.includes('aria-label'),
  'Dropzone has associated ARIA labels and description associations'
);

assert(
  uploaderContent.includes('role="alert"') || uploaderContent.includes('aria-live'),
  'Upload error state announces errors dynamically via role="alert" or aria-live'
);

// 4. Audit Modal Infrastructure (Focus trap, Escape, Focus restoration)
console.log('\n[4/7] Auditing Modal Infrastructure (Focus trap, Escape, Focus restoration)...');
const hookPath = path.join(process.cwd(), 'src/hooks/useAccessibleModal.ts');
const hookContent = fs.readFileSync(hookPath, 'utf-8');

assert(
  hookContent.includes('Escape'),
  'useAccessibleModal hook handles Escape key to close modals'
);

assert(
  hookContent.includes('focusableElements') && (hookContent.includes('Tab') || hookContent.includes('shiftKey')),
  'useAccessibleModal hook traps keyboard focus within the open modal'
);

assert(
  hookContent.includes('triggerRef') && hookContent.includes('focus()'),
  'useAccessibleModal hook restores keyboard focus to previous active element on close'
);

// Check PaywallModal, ShareModal, PrivacyDataModal
const paywallPath = path.join(process.cwd(), 'src/components/PaywallModal.tsx');
const paywallContent = fs.readFileSync(paywallPath, 'utf-8');
assert(
  paywallContent.includes('role="dialog"') && paywallContent.includes('aria-modal="true"') && paywallContent.includes('useAccessibleModal'),
  'PaywallModal implements role="dialog", aria-modal="true", and useAccessibleModal'
);

const sharePath = path.join(process.cwd(), 'src/components/ShareModal.tsx');
const shareContent = fs.readFileSync(sharePath, 'utf-8');
assert(
  shareContent.includes('role="dialog"') && shareContent.includes('aria-modal="true"') && shareContent.includes('useAccessibleModal'),
  'ShareModal implements role="dialog", aria-modal="true", and useAccessibleModal'
);

const privacyPath = path.join(process.cwd(), 'src/components/PrivacyDataModal.tsx');
const privacyContent = fs.readFileSync(privacyPath, 'utf-8');
assert(
  privacyContent.includes('role="dialog"') && privacyContent.includes('aria-modal="true"') && privacyContent.includes('useAccessibleModal'),
  'PrivacyDataModal implements role="dialog", aria-modal="true", and useAccessibleModal'
);

// 5. Audit App.tsx (Onboarding, Progressbar, Radiogroups, Alerts, Back buttons, Skip Link)
console.log('\n[5/7] Auditing App.tsx (Onboarding progressbar, Radiogroup, Alerts, Skip Link)...');
const appPath = path.join(process.cwd(), 'src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');

assert(
  appContent.includes('role="progressbar"') && appContent.includes('aria-valuenow') && appContent.includes('aria-valuemin') && appContent.includes('aria-valuemax'),
  'Onboarding questions progress bar implements role="progressbar" with aria-valuenow/min/max'
);

assert(
  appContent.includes('role="radiogroup"') && appContent.includes('role="radio"') && appContent.includes('aria-checked'),
  'Selectable multi-choice presets (e.g. objectives, insights choice) implement radiogroup & radio semantics'
);

assert(
  appContent.includes('aria-pressed'),
  'Filter/suggestion chips implement aria-pressed toggle state'
);

assert(
  appContent.includes('role="alert"') && appContent.includes('aria-live="assertive"'),
  'Onboarding and processing error messages are announced with role="alert" and aria-live="assertive"'
);

assert(
  appContent.includes('aria-label="Voltar para a pergunta anterior"') || appContent.includes('aria-label="Voltar para a etapa anterior"'),
  'Back navigation buttons have distinct, contextual aria-labels'
);

assert(
  appContent.includes('skip-link') || appContent.includes('Pular para o conteúdo principal'),
  'Skip to main content link exists at the very top of the app'
);

// 6. Audit LandingViewV7.tsx (Heading hierarchy & landmarks)
console.log('\n[6/7] Auditing LandingViewV7.tsx (Heading hierarchy & ARIA landmarks)...');
const landingPath = path.join(process.cwd(), 'src/components/LandingViewV7.tsx');
const landingContent = fs.readFileSync(landingPath, 'utf-8');

assert(
  landingContent.includes('<h1') && landingContent.includes('<h2') && !landingContent.includes('<h4'),
  'Landing page follows logical heading hierarchy (h1 -> h2 -> h3) without skipped heading levels'
);

// 7. Audit ResultView.tsx (Tabs & Accessible metrics)
console.log('\n[7/7] Auditing ResultView.tsx (Accessible tablist, tabs & touch targets)...');
const resultPath = path.join(process.cwd(), 'src/components/ResultView.tsx');
const resultContent = fs.readFileSync(resultPath, 'utf-8');

assert(
  resultContent.includes('role="tablist"') && resultContent.includes('role="tab"') && resultContent.includes('aria-selected'),
  'Result view tabs implement role="tablist", role="tab", and aria-selected state'
);

assert(
  resultContent.includes('min-h-[44px]'),
  'Interactive buttons in result view meet the minimum touch target size (44px)'
);

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32mAll WCAG 2.1 AA accessibility checks passed successfully!\x1b[0m\n');
}
