/**
 * ============================================================================
 * INSTASCORE.AI — PRODUCTION TEST SUITE RUNNER
 * ============================================================================
 * Runs:
 * 1. Unit Tests: Methodology (calculateScoring & getPrioritizedActions)
 * 2. Unit Tests: Zod Schemas & Normalizers
 * 3. Unit Tests: Gemini Response Fixtures & Parsers
 * 4. Integration Tests: Centralized Auth Middleware (requireAuth, requireAdmin)
 * 5. Integration Tests: /api/analyze Mock Processing & Score Integration
 * 6. Integration Tests: Plan Quotas & Entitlements
 * 7. Integration Tests: Checkout & Webhook Security
 * 8. Security Rules: Firestore Zero-Trust Matrix (Owner, Other, Anon, Escalation)
 * 9. Component Tests: Onboarding Flow, FileUploader, PaywallModal, Modal A11y
 * ============================================================================
 */

import { runMethodologyUnitTests } from "./unit/methodology.test";
import { runSchemasUnitTests } from "./unit/schemas.test";
import { runGeminiParserUnitTests } from "./unit/gemini-parser.test";
import { runAuthIntegrationTests } from "./integration/auth-middleware.test";
import { runApiAnalyzeIntegrationTests } from "./integration/api-analyze.test";
import { runQuotasIntegrationTests } from "./integration/quotas.test";
import { runCheckoutWebhookIntegrationTests } from "./integration/checkout-webhook.test";
import { runFirestoreRulesTests } from "./rules/firestore-rules.test";
import { runOnboardingComponentTests } from "./components/onboarding.test";
import { runFileUploaderComponentTests } from "./components/file-uploader.test";
import { runPaywallModalComponentTests } from "./components/paywall-modal.test";
import { runModalA11yComponentTests } from "./components/modal-a11y.test";
import { runNavigationDrawerTests } from "./components/navigation-drawer.test";
import { runFloatingMentorTests } from "./components/floating-mentor.test";
import { runV13IntelligenceValidationTests } from "./unit/v13-intelligence-validation.test";
import { runContentAuthIntegrationTests } from "./integration/content-auth.test";

async function runAllSuites() {
  console.log("\n=======================================================");
  console.log("   INSTASCORE.AI — PRODUCTION TEST SUITE EXECUTION     ");
  console.log("=======================================================\n");

  let totalPassed = 0;
  let totalFailed = 0;

  function printResults(suiteName: string, res: { passed: number; failed: number; tests: string[] }) {
    console.log(`\n▶ ${suiteName} (${res.passed} passed, ${res.failed} failed):`);
    for (const line of res.tests) {
      console.log(line);
    }
    totalPassed += res.passed;
    totalFailed += res.failed;
  }

  // 1. Unit Tests
  printResults("1. Unit: Methodology Math Engine", runMethodologyUnitTests());
  printResults("2. Unit: Zod Schemas & Normalization", runSchemasUnitTests());
  printResults("3. Unit: Gemini Response Fixtures & Extraction", runGeminiParserUnitTests());

  // 2. Integration Tests
  printResults("4. Integration: Centralized Auth Middleware", await runAuthIntegrationTests());
  printResults("5. Integration: /api/analyze Mock Processing", await runApiAnalyzeIntegrationTests());
  printResults("6. Integration: Plan Quotas & Entitlements", await runQuotasIntegrationTests());
  printResults("7. Integration: Checkout & Webhook Security", await runCheckoutWebhookIntegrationTests());
  printResults("8. Integration: Content Engine & Content Lab Auth", await runContentAuthIntegrationTests());

  // 3. Firestore Security Rules
  printResults("9. Rules: Firestore Security Matrix", runFirestoreRulesTests());

  // 4. Component Tests
  printResults("10. Component: Onboarding Flow", runOnboardingComponentTests());
  printResults("11. Component: FileUploader & Drag-Drop", runFileUploaderComponentTests());
  printResults("12. Component: PaywallModal", runPaywallModalComponentTests());
  printResults("13. Component: Accessible Modal Infrastructure", runModalA11yComponentTests());
  printResults("14. Component: Navigation Drawer & Responsive Tabs", runNavigationDrawerTests());
  printResults("15. Component: Persistent Floating Mentor Widget", runFloatingMentorTests());

  // 5. V13 Intelligence Evolution QA Suite
  printResults("16. V13 Intelligence: Behavioral & Adversarial QA Suite", runV13IntelligenceValidationTests());

  console.log("\n=======================================================");
  console.log(`SUITE SUMMARY: ${totalPassed} PASSED | ${totalFailed} FAILED`);
  console.log("=======================================================\n");

  if (totalFailed > 0) {
    console.error(`\x1b[31mProduction test suite FAILED with ${totalFailed} errors.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\x1b[32mAll production tests passed with 100% success!\x1b[0m\n`);
    process.exit(0);
  }
}

runAllSuites().catch((err) => {
  console.error("Fatal error during test run:", err);
  process.exit(1);
});
