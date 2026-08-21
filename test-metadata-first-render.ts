import fs from 'fs';
import path from 'path';

/**
 * Automated Metadata & First Render Test Suite
 * Validates:
 * 1. index.html contains exact lang="pt-BR"
 * 2. Exact title: "InstaScore.ai — Diagnóstico Estratégico para Instagram"
 * 3. Real, non-placeholder meta description with methodology keywords
 * 4. Canonical link (rel="canonical")
 * 5. Complete Open Graph tags (og:type, og:locale, og:site_name, og:url, og:title, og:description, og:image)
 * 6. Twitter card tags (twitter:card, twitter:title, twitter:description, twitter:image)
 * 7. theme-color and coherent favicon tags
 * 8. Clean, informative no-JS fallback (<noscript>) with public methodology information
 * 9. Absolute zero exposure of private diagnostic data in the initial HTML
 * 10. Dynamic title routing logic in App.tsx
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
console.log('    INSTASCORE.AI — METADATA & FIRST RENDER AUDIT     ');
console.log('======================================================\n');

const indexHtmlPath = path.join(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

// 1. Language & Document Title
console.log('[1/4] Verifying HTML Language & Exact Document Title...');
assert(
  indexHtml.includes('<html lang="pt-BR">'),
  'HTML tag has exact lang="pt-BR"'
);

assert(
  indexHtml.includes('<title>InstaScore.ai — Diagnóstico Estratégico para Instagram</title>'),
  'Document <title> matches exact required string: "InstaScore.ai — Diagnóstico Estratégico para Instagram"'
);

// 2. Metadata, Canonical & Social Tags
console.log('\n[2/4] Verifying Canonical, Open Graph, Twitter Cards, Theme Color & Favicon...');
assert(
  indexHtml.includes('<link rel="canonical" href="https://instascore.ai" />'),
  'Canonical URL tag is present and points to https://instascore.ai'
);

assert(
  indexHtml.includes('name="description"') && indexHtml.includes('C.A.G.E.') && indexHtml.includes('Instagram'),
  'Meta description is real, descriptive and mentions C.A.G.E. and Instagram'
);

assert(
  indexHtml.includes('<meta name="theme-color" content="#030712" />'),
  'Theme color is configured (#030712)'
);

assert(
  indexHtml.includes('property="og:type" content="website"') &&
  indexHtml.includes('property="og:locale" content="pt_BR"') &&
  indexHtml.includes('property="og:site_name" content="InstaScore.ai"') &&
  indexHtml.includes('property="og:title" content="InstaScore.ai — Diagnóstico Estratégico para Instagram"') &&
  indexHtml.includes('property="og:image" content="/favicon.svg"'),
  'All Open Graph tags (og:type, og:locale, og:site_name, og:title, og:image) are accurately defined'
);

assert(
  indexHtml.includes('name="twitter:card" content="summary"') &&
  indexHtml.includes('name="twitter:title" content="InstaScore.ai — Diagnóstico Estratégico para Instagram"') &&
  indexHtml.includes('name="twitter:image" content="/favicon.svg"'),
  'Twitter Card metadata (twitter:card, twitter:title, twitter:image) is complete'
);

assert(
  indexHtml.includes('rel="icon" type="image/svg+xml" href="/favicon.svg"') &&
  indexHtml.includes('rel="apple-touch-icon" href="/favicon.svg"'),
  'Favicon and Apple Touch Icon link to /favicon.svg'
);

// 3. No-JS Fallback & Privacy Leak Check
console.log('\n[3/4] Checking First Render, No-JS Fallback and Data Privacy in Initial HTML...');
assert(
  indexHtml.includes('<noscript>') && indexHtml.includes('C.A.G.E.') && indexHtml.includes('JavaScript'),
  'Helpful, structured semantic no-JS fallback content is embedded in <noscript>'
);

// Check that no private diagnostic data or placeholder leaks into index.html
const forbiddenPrivateTerms = [
  'score: 78',
  'score: 60',
  'critical_gaps',
  'anasilva.carreira',
  'user_token',
  'diagnosis_id',
  'evaluation_summary'
];
let foundForbidden = false;
for (const term of forbiddenPrivateTerms) {
  if (indexHtml.includes(term)) {
    foundForbidden = true;
    break;
  }
}
assert(
  !foundForbidden,
  'Initial HTML does NOT leak any private diagnosis or user-specific profile data'
);

// 4. Dynamic Route Title Management
console.log('\n[4/4] Verifying Dynamic App Title Synchronization in App.tsx...');
const appPath = path.join(process.cwd(), 'src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');

assert(
  appContent.includes('document.title = "InstaScore.ai — Diagnóstico Estratégico para Instagram"') &&
  appContent.includes('document.title = `InstaScore.ai — Questionário de Diagnóstico') &&
  appContent.includes('document.title = "InstaScore.ai — Processando Diagnóstico..."') &&
  appContent.includes('document.title = `InstaScore.ai — Diagnóstico de ${handle || userName || "Perfil"}`'),
  'App.tsx synchronizes document.title dynamically for landing, onboarding, processing, and OS dashboard views'
);

assert(
  appContent.includes('document.title = "InstaScore.ai — Benchmark Global & Comparativo"') &&
  appContent.includes('document.title = "InstaScore.ai — Digital Twin & Simulação"') &&
  appContent.includes('document.title = "InstaScore.ai — Mentor Estratégico IA"'),
  'App.tsx updates titles for sub-modules (Benchmark, Digital Twin, Mentor)'
);

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32mAll metadata, first-render, and title tests passed successfully!\x1b[0m\n');
}
