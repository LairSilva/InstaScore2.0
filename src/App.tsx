import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  ShieldCheck,
  Crown,
  CreditCard,
} from "lucide-react";

import BrandSymbol, { BrandLogo } from "./components/BrandSymbol";
import LandingViewV7 from "./components/LandingViewV7";
import { LazyFallback } from "./components/LazyFallback";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { StartModeResult } from "./types/start-mode";
import { initGA, trackPageView } from "./lib/analytics";

import { OnboardingData, AnalysisResponse } from "./types";
import { OsModuleId, DashboardSubTab } from "./config/navigation";
import { DigitalTwin, createDefaultDigitalTwin } from "./core/DigitalTwin";
import { useEntitlements } from "./hooks/useEntitlements";
import { extractMinimalDiagnosisSummary } from "./lib/data-retention-client";
import { auth, getOrEnsureAuthUser, loginWithGoogle } from "./lib/firebase";

// Lazy-loaded routes & secondary components (Code-Splitting for Optimal Performance)
const FileUploader = lazy(() => import("./components/FileUploader"));
const StartModeOnboarding = lazy(() => import("./components/StartModeOnboarding"));
const StartModeResultView = lazy(() => import("./components/StartModeResultView"));
const ResultView = lazy(() => import("./components/ResultView").then(m => ({ default: m.ResultView })));
const OSLayout = lazy(() => import("./layouts/OSLayout").then(m => ({ default: m.OSLayout })));
const GrowthCenterView = lazy(() => import("./modules/growth/GrowthCenterView").then(m => ({ default: m.GrowthCenterView })));
const SimulatorView = lazy(() => import("./modules/simulator/SimulatorView").then(m => ({ default: m.SimulatorView })));
const MentorView = lazy(() => import("./modules/mentor/MentorView").then(m => ({ default: m.MentorView })));
const GlobalBenchmarkView = lazy(() => import("./modules/benchmark/GlobalBenchmarkView").then(m => ({ default: m.GlobalBenchmarkView })));
const DigitalTwinView = lazy(() => import("./modules/twin/DigitalTwinView").then(m => ({ default: m.DigitalTwinView })));
const TimelineView = lazy(() => import("./modules/history/TimelineView").then(m => ({ default: m.TimelineView })));
const ContentEngineView = lazy(() => import("./modules/content/ContentEngineView").then(m => ({ default: m.ContentEngineView })));
const ContentLibraryView = lazy(() => import("./modules/content/ContentLibraryView").then(m => ({ default: m.ContentLibraryView })));
const FloatingMentorWidget = lazy(() => import("./components/FloatingMentorWidget").then(m => ({ default: m.FloatingMentorWidget })));
const PaywallModal = lazy(() => import("./components/PaywallModal"));
const MyPlanView = lazy(() => import("./components/MyPlanView"));
const PrivacyDataModal = lazy(() => import("./components/PrivacyDataModal"));
const ShareModal = lazy(() => import("./components/ShareModal"));

export default function App() {
  // Navigation View State
  const [view, setView] = useState<"landing" | "onboarding" | "processing" | "result" | "start-onboarding" | "start-result" | "my-plan">("landing");

  // Commercial entitlements hook
  const {
    userId,
    isPro,
    planConfig,
    isPaywallOpen,
    paywallReason,
    openPaywall,
    closePaywall,
    refreshStatus
  } = useEntitlements();

  // Start Mode Result Data State
  const [startModeResult, setStartModeResult] = useState<StartModeResult | null>(null);

  // Conversational Onboarding Question Step: 1 to 10
  const [onboardingStep, setOnboardingStep] = useState(1);
  // OS Module and Subtab State
  const [activeOsModule, setActiveOsModule] = useState<OsModuleId>("dashboard");
  const [activeDashboardTab, setActiveDashboardTab] = useState<DashboardSubTab>("strategy");

  const handleOsNavigate = (module: OsModuleId, subTab?: DashboardSubTab) => {
    setActiveOsModule(module);
    if (subTab) {
      setActiveDashboardTab(subTab);
    }
  };

  // Onboarding Data Fields
  const [userName, setUserName] = useState("");
  const [niche, setNiche] = useState("");
  const [objective, setObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [handle, setHandle] = useState("");
  const [print1, setPrint1] = useState<string | undefined>(undefined);
  const [print2, setPrint2] = useState<string | undefined>(undefined);
  const [print3, setPrint3] = useState<string | undefined>(undefined);
  const [wantsPrint3, setWantsPrint3] = useState<boolean | null>(null); // true, false, or null
  const [consent, setConsent] = useState(false);

  // Error States
  const [errorText, setErrorText] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Loading Progression (Processing States)
  const [processingState, setProcessingState] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "uploading" | "analyzing" | "validating" | "success" | "error">("idle");

  // Result Diagnosis State
  const [diagnosisResult, setDiagnosisResult] = useState<AnalysisResponse | null>(null);
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwin | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Synchronous fallback / derived active DigitalTwin to guarantee never null during rendering
  const activeDigitalTwin = React.useMemo(() => {
    if (digitalTwin) return digitalTwin;
    if (diagnosisResult) {
      return createDefaultDigitalTwin(diagnosisResult, userName, handle, niche, objective, targetAudience);
    }
    return null;
  }, [digitalTwin, diagnosisResult, userName, handle, niche, objective, targetAudience]);

  // Modal Share Controller
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [contentEngineOptions, setContentEngineOptions] = useState<any>(null);

  // Interactive UI details (e.g. which category is currently expanded to inspect criteria)
  const [expandedCategory, setExpandedCategory] = useState<string | null>("positioning");

  // Suggestion presets for Nicho / Negócio
  const NICHE_PRESETS = [
    "Estética",
    "Loja de Roupas",
    "Restaurante",
    "Advocacia",
    "Fotografia",
    "Criador de Conteúdo",
    "Dentista",
    "Psicólogo"
  ];

  // Preset Cards for Objectives
  const OBJECTIVE_PRESETS = [
    { title: "Vender produtos", desc: "E-commerce, infoprodutos, catálogo físico ou varejo" },
    { title: "Vender serviços", desc: "Consultorias, mentorias, assessorias, tratamentos ou projetos" },
    { title: "Gerar contatos e oportunidades", desc: "Direcionar leads qualificados para o WhatsApp comercial" },
    { title: "Fortalecer autoridade", desc: "Ganhar relevância, respeito e notoriamente no seu nicho" },
    { title: "Aumentar alcance e reconhecimento", desc: "Ampliar visualizações e ser descoberto por novas pessoas" },
    { title: "Construir comunidade", desc: "Engajar seguidores fieis e criar defensores da marca" },
  ];

  // Active Loading progression logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === "processing") {
      if (analysisStatus === "success") {
        setProcessingProgress(100);
        const timer = setTimeout(() => {
          setView("result");
        }, 1200);
        return () => clearTimeout(timer);
      } else if (analysisStatus === "error") {
        return;
      }

      // Smooth progress rise calibrated to real pipeline stages
      interval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (analysisStatus === "uploading") {
            if (prev < 20) return prev + 2;
          } else if (analysisStatus === "analyzing") {
            // Smoothly move between 20% and 75% during multimodal vision processing
            if (prev < 75) {
              const remaining = 75 - prev;
              const step = Math.max(1, Math.floor(remaining / 14));
              return prev + step;
            }
          } else if (analysisStatus === "validating") {
            // Once server returns payload, advance swiftly from 85% to 95%
            if (prev < 95) {
              const step = Math.max(1, Math.floor((95 - prev) / 4));
              return prev + step;
            }
          } else {
            // General fallback progression
            if (prev < 75) {
              return prev + 1;
            }
          }
          return prev;
        });
      }, 400);
    } else {
      setProcessingProgress(0);
    }
    return () => clearInterval(interval);
  }, [view, analysisStatus]);

  // Sync processingState text with analysisStatus
  useEffect(() => {
    if (view === "processing") {
      switch (analysisStatus) {
        case "uploading":
          setProcessingState("Preparando arquivos e autenticação segura...");
          break;
        case "analyzing":
          setProcessingState("Visão computacional e leitura multimodal do perfil...");
          break;
        case "validating":
          setProcessingState("Calculando dimensão C.A.G.E. e prioridades estratégicas...");
          break;
        case "success":
          setProcessingState("Diagnóstico estrutural concluído com sucesso!");
          break;
        case "error":
          setProcessingState("Não foi possível concluir o diagnóstico.");
          break;
        default:
          setProcessingState("Iniciando auditoria estrutural...");
      }
    }
  }, [view, analysisStatus]);

  // Dynamic document title management across views and sub-routes
  useEffect(() => {
    switch (view) {
      case "landing":
        document.title = "InstaScore.ai — Diagnóstico Estratégico para Instagram";
        break;
      case "onboarding":
        document.title = `InstaScore.ai — Questionário de Diagnóstico (Etapa ${onboardingStep} de 10)`;
        break;
      case "processing":
        document.title = "InstaScore.ai — Processando Diagnóstico...";
        break;
      case "result":
        if (activeOsModule === "dashboard") {
          document.title = `InstaScore.ai — Diagnóstico de ${handle || userName || "Perfil"}`;
        } else if (activeOsModule === "benchmark") {
          document.title = "InstaScore.ai — Benchmark Global & Comparativo";
        } else if (activeOsModule === "twin") {
          document.title = "InstaScore.ai — Digital Twin & Simulação";
        } else if (activeOsModule === "simulator") {
          document.title = "InstaScore.ai — Simulador de Crescimento";
        } else if (activeOsModule === "growth") {
          document.title = "InstaScore.ai — Growth Center & Plano Tático";
        } else if (activeOsModule === "mentor") {
          document.title = "InstaScore.ai — Mentor Estratégico IA";
        } else if (activeOsModule === "history") {
          document.title = "InstaScore.ai — Linha do Tempo & Evolução";
        } else {
          document.title = "InstaScore.ai — Diagnóstico Estratégico";
        }
        break;
      case "start-onboarding":
        document.title = "InstaScore.ai — Criar Estratégia do Zero";
        break;
      case "start-result":
        document.title = "InstaScore.ai — Plano de Lançamento Estratégico";
        break;
      case "my-plan":
        document.title = "InstaScore.ai — Meu Plano & Assinatura";
        break;
      default:
        document.title = "InstaScore.ai — Diagnóstico Estratégico para Instagram";
    }
  }, [view, onboardingStep, activeOsModule, handle, userName]);

  // Handle Demo Mode Trigger
  const handleStartDemo = async () => {
    setIsDemoMode(true);
    setAnalysisStatus("success");
    setErrorText(null);
    try {
      const { DEMO_DIAGNOSIS, DEMO_SCORING } = await import("./data/demo-diagnosis");
      setDiagnosisResult({
        success: true,
        diagnosis: DEMO_DIAGNOSIS,
        scoring: DEMO_SCORING,
      });
      setUserName("Ana Silva");
      setHandle("anasilva.carreira");
      setNiche("Mentoria de Carreira");
      setObjective("Vender serviços");
      setView("result");
    } catch (e) {
      console.error("Failed to load demo diagnosis", e);
    }
  };

  // Start Conversational Onboarding (Mode 1: Existing Profile Audit)
  const handleStartOnboarding = () => {
    setIsDemoMode(false);
    setAnalysisStatus("idle");
    setErrorText(null);
    setOnboardingStep(1);
    setView("onboarding");
  };

  // Start Mode 2: "Começar do Zero" (Start From Scratch)
  const handleStartFromScratch = () => {
    setIsDemoMode(false);
    setErrorText(null);
    setView("start-onboarding");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartModeComplete = (result: StartModeResult) => {
    setStartModeResult(result);
    import("./lib/firebase")
      .then(m => m.saveStartProjectToFirestore(result))
      .catch(err => console.warn('[Firebase] Save start project warning:', err));
    setView("start-result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Conversational Navigation Control
  const handleNextStep = () => {
    setErrorText(null);

    // Validate current step input before moving on
    if (onboardingStep === 2 && !userName.trim()) {
      setErrorText("Por favor, diga como gostaria de ser chamado.");
      return;
    }
    if (onboardingStep === 3 && !niche.trim()) {
      setErrorText("Por favor, insira o seu nicho ou negócio principal.");
      return;
    }
    if (onboardingStep === 4 && !objective) {
      setErrorText("Por favor, selecione o seu principal objetivo estratégico.");
      return;
    }
    if (onboardingStep === 5 && !targetAudience.trim()) {
      setErrorText("Por favor, informe quem é o público que você quer alcançar.");
      return;
    }
    if (onboardingStep === 7 && !print1) {
      setErrorText("A captura da tela inicial (Print 1) é obrigatória para prosseguir.");
      return;
    }
    if (onboardingStep === 8 && !print2) {
      setErrorText("A captura do topo do feed (Print 2) é obrigatória para prosseguir.");
      return;
    }

    // Step routing logic
    if (onboardingStep === 9) {
      // If user selected "Continuar sem Insights" without uploading
      if (wantsPrint3 === null) {
        setErrorText("Por favor, selecione uma das opções acima para continuar.");
        return;
      }
      if (wantsPrint3 === true && !print3) {
        setErrorText("Envie a captura de Insights ou selecione 'Continuar sem Insights'.");
        return;
      }
    }

    setOnboardingStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setErrorText(null);
    if (onboardingStep === 1) {
      setView("landing");
    } else {
      setOnboardingStep((prev) => prev - 1);
    }
  };

  // Submit diagnosis request to Server-side API with safe state orchestration
  const handleGenerateDiagnosis = async () => {
    // Double-click protection: prevent concurrent requests
    const isProcessing = analysisStatus === "analyzing" || analysisStatus === "uploading" || analysisStatus === "validating";
    if (isProcessing) return;

    if (!consent) {
      setErrorText("Você precisa marcar o consentimento de privacidade antes de continuar.");
      return;
    }

    setView("processing");
    setAnalysisStatus("uploading");
    setProcessingProgress(5);
    setProcessingState("Inicializando autenticação segura...");
    setErrorText(null);
    setErrorCode(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000); // 120 seconds timeout for AI multimodal analysis

    try {
      // 1. Ensure Firebase Auth is initialized and user is present
      setProcessingState("Autenticando sessão com o Firebase...");
      let activeUser = await getOrEnsureAuthUser().catch(() => null);

      // If user is not yet authenticated, trigger Google Sign-In to establish session
      if (!activeUser && !auth.currentUser) {
        setProcessingState("Conectando com conta Google para autenticação segura...");
        try {
          activeUser = await loginWithGoogle();
        } catch (authErr: any) {
          console.warn("[Auth] Google sign-in note:", authErr?.message);
        }
      }

      const currentUser = activeUser || auth.currentUser;
      if (!currentUser) {
        setView("onboarding");
        setOnboardingStep(10);
        setAnalysisStatus("idle");
        setErrorText("Autenticação necessária para processar a análise segura. Por favor, conecte-se com sua conta Google para continuar.");
        return;
      }

      // 2. Obtain ID Token
      let idToken = await currentUser.getIdToken();
      if (!idToken) {
        setView("onboarding");
        setOnboardingStep(10);
        setAnalysisStatus("idle");
        setErrorText("Token de autenticação não gerado. Por favor, tente novamente.");
        return;
      }

      const payload: OnboardingData & { userId: string } = {
        userId: currentUser.uid,
        userName,
        niche,
        objective,
        targetAudience,
        handle: handle.trim() || undefined,
        print1: print1!,
        print2: print2!,
        print3: (wantsPrint3 && print3) ? print3 : undefined,
        consent,
      };

      setAnalysisStatus("analyzing");
      setProcessingProgress(20);
      setProcessingState("Visão computacional e leitura multimodal de perfil...");

      // Helper for making the request with the exact required Authorization Bearer header
      const doAnalyzeRequest = async (token: string) => {
        return await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      };

      let response = await doAnalyzeRequest(idToken);

      // 3. Controlled single retry on 401 with refreshed token (no infinite loop)
      if (response.status === 401 && auth.currentUser) {
        try {
          idToken = await auth.currentUser.getIdToken(true);
          response = await doAnalyzeRequest(idToken);
        } catch (refreshErr) {
          console.warn("[Auth] Token refresh retry failed:", refreshErr);
        }
      }

      // Clear the timeout once the response is received
      clearTimeout(timeoutId);

      let data: any = null;
      try {
        const textResponse = await response.text();
        if (textResponse && textResponse.trim()) {
          try {
            data = JSON.parse(textResponse);
          } catch {
            // Text is not JSON, handled gracefully below by HTTP status
          }
        }
      } catch (readErr: any) {
        console.warn("[Analysis] Failed to read response stream:", readErr);
      }

      // 1. Paywall / Quota Exceeded (HTTP 403 or explicit quota payload)
      if (
        response.status === 403 ||
        data?.paywallRequired ||
        data?.error === "FREE_QUOTA_EXCEEDED" ||
        data?.error === "QUOTA_EXCEEDED" ||
        data?.error?.code === "FREE_QUOTA_EXCEEDED" ||
        data?.errorCode === "FREE_QUOTA_EXCEEDED"
      ) {
        setView("onboarding");
        setOnboardingStep(10);
        setAnalysisStatus("idle");
        openPaywall(
          data?.message ||
          data?.error?.message ||
          "Você atingiu o limite de diagnóstico gratuito no plano Free. Faça upgrade para o InstaScore PRO para realizar diagnósticos ilimitados e desbloquear o ecossistema completo."
        );
        return;
      }

      // 2. Authentication failure (HTTP 401)
      if (response.status === 401) {
        setView("onboarding");
        setOnboardingStep(10);
        setAnalysisStatus("idle");
        setErrorText(data?.message || data?.error?.message || "Sua sessão expirou ou não foi validada. Por favor, conecte-se com sua conta Google e tente novamente.");
        return;
      }

      // 3. Payload Too Large (HTTP 413)
      if (response.status === 413) {
        setView("onboarding");
        setOnboardingStep(10);
        setAnalysisStatus("idle");
        setErrorText("As capturas de tela enviadas excederam o tamanho suportado. Tente recortar ou usar capturas com resolução menor.");
        return;
      }

      // 4. Rate limit (HTTP 429)
      if (response.status === 429) {
        setView("onboarding");
        setOnboardingStep(10);
        setAnalysisStatus("idle");
        setErrorText(data?.message || data?.error?.message || "Muitas solicitações enviadas em curto intervalo. Aguarde alguns instantes e tente novamente.");
        return;
      }

      // 5. Server/Pipeline Errors (504, 502, 500, 400)
      if (!response.ok || !data || !data.success) {
        const resolvedCode = data?.error?.code || (typeof data?.error === "string" ? data.error : null) || (response.status === 504 ? "AI_TIMEOUT" : response.status === 502 ? "AI_INVALID_RESPONSE" : response.status === 400 ? "IMAGEM_INVALIDA_OU_INSUFICIENTE" : "ANALYSIS_FAILED");
        const resolvedMsg = data?.error?.message || data?.message || (response.status === 504 ? "A análise demorou além do limite. Tente novamente." : response.status === 502 ? "Resposta inválida ou incompleta dos modelos de IA. Tente novamente." : "Falha na análise estrutural. Sua quota foi preservada. Tente novamente.");

        setErrorCode(resolvedCode);
        setErrorText(resolvedMsg);
        setAnalysisStatus("error");
        return;
      }

      if (!data.diagnosis || !data.scoring) {
        setErrorCode("AI_INVALID_RESPONSE");
        setErrorText("O servidor não retornou um diagnóstico válido.");
        setAnalysisStatus("error");
        return;
      }

      // Signal validating step before transitioning
      setAnalysisStatus("validating");
      setProcessingProgress(85);

      // Store results and set success state. Navigation happens after 100% completion delay
      setDiagnosisResult(data);
      import("./lib/firebase")
        .then(m => m.saveDiagnosisToFirestore(data))
        .catch(err => console.warn('[Firebase] Save diagnosis warning:', err));
      
      // Minimization & zero-persistence: purge base64 screenshots from memory only upon successful result
      setPrint1(undefined);
      setPrint2(undefined);
      setPrint3(undefined);
      
      setAnalysisStatus("success");
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Diagnosis Submission Error:", err);
      
      setAnalysisStatus("error");
      if (err.name === "AbortError" || err.message?.toLowerCase().includes("aborted")) {
        setErrorCode("AI_TIMEOUT");
        setErrorText("A análise demorou além do limite. Tente novamente.");
      } else {
        setErrorCode("ANALYSIS_FAILED");
        setErrorText(err.message || "Erro de conexão com o servidor. Sua quota foi preservada. Tente novamente.");
      }
    }
  };

  // Auto-construct DigitalTwin instance when diagnosisResult is populated
  useEffect(() => {
    if (diagnosisResult && diagnosisResult.scoring) {
      const score = diagnosisResult.scoring.score || 0;
      const cats = diagnosisResult.scoring.categories || {};
      
      const cleanHandle = (handle || "usuario").replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      const twin: DigitalTwin = {
        id: "twin-" + (cleanHandle || "usuario"),
        handle: handle || "usuario",
        identity: {
          niche: niche || "Geral",
          objectives: [objective || "Crescimento"],
          targetAudience: targetAudience || "Geral",
          toneOfVoice: "Profissional Estratégico",
          visualStyle: "Moderno e Elegante",
          brandIdentity: userName || "Perfil Instagram",
        },
        content: {
          currentBio: diagnosisResult.diagnosis?.evaluations?.find(e => e.criterion_id === "positioning.offer_clarity")?.evidence || "Bio em análise",
          currentCta: diagnosisResult.diagnosis?.evaluations?.find(e => e.criterion_id === "conversion.explicit_cta")?.evidence || "CTA em análise",
          bestPostingTimes: ["09:00", "12:30", "18:00", "21:00"],
          postingFrequency: "5x por semana",
          feedStrategyPatterns: ["Carrosséis Educativos", "Post Estático de Prova Social"],
          reelsStrategyPatterns: ["Reels Curtos de Atração", "Vídeos Diretos de Conversão"],
          contentThemes: [niche || "Conteúdo Geral"],
          prohibitedThemes: [],
          preferredFormats: ["carousel", "reel"],
          discoveredPatterns: ["Alta retenção com ganchos diretos na primeira frase"],
        },
        preferences: {
          approvedStrategies: ["Carrossel de autoridade", "Desconstrução de erros"],
          rejectedStrategies: [],
          rejectedFormats: [],
          excludedThemes: [],
          preferredAngles: ["Contrarian / Erros Comuns"],
          userFeedbackNotes: []
        },
        behavior: {
          postingFrequency: "5x por semana",
          formatsUsed: { carousel: 1, reel: 1, post: 0, story: 0 },
          themesUsed: [niche || "Conteúdo Geral"],
          ctasUsed: ["Direct", "Salvamento"],
          hooksUsed: ["O erro invisível que destrói resultados"]
        },
        performance: {
          topPerformingContents: [],
          winningFormats: ["carousel", "reel"],
          winningThemes: [niche || "Conteúdo Geral"],
          winningHooks: [],
          winningCtas: [],
          lowPerformancePatterns: []
        },
        learningInsights: [
          {
            id: `ins-init-app-${Date.now()}`,
            insight: `Foco prioritário em ${cats.authority?.percentage && cats.authority.percentage < 60 ? "Autoridade Técnica" : "Conversão Direta"} derivado da auditoria C.A.G.E.`,
            source: "cage_diagnostic",
            evidence: `Diagnóstico C.A.G.E. com score inicial de ${score}/100.`,
            sampleCount: 1,
            confidence: 85,
            category: "angle",
            lastUpdated: new Date().toISOString()
          }
        ],

        metrics: {

          overallScore: score,
          authorityVelocity: Math.round((cats.authority?.percentage || score) * 0.9),
          growthVelocity: Math.round((cats.seo?.percentage || score) * 0.85),
          conversionVelocity: Math.round((cats.conversion?.percentage || score) * 0.95),
          executionScore: cats.content?.percentage || Math.round(score * 0.95),
          consistencyScore: cats.positioning?.percentage || Math.round(score * 0.9),
          momentumScore: cats.seo?.percentage || Math.round(score * 0.85),
          learningScore: 85,
        },
        historyData: {
          events: [
            { id: "ev-1", title: "Auditoria C.A.G.E. Concluída", date: "Hoje", score: score }
          ],
          evolutionLog: [
            { date: "Diagnóstico", score: score }
          ],
          conversionRate: Number(((cats.conversion?.percentage || 50) * 0.05).toFixed(1)),
        },
        memoryGraphIds: ["mem-1", "mem-2"],
      };
      setDigitalTwin(twin);
      import("./lib/firebase")
        .then(m => m.saveDigitalTwinToFirestore(twin))
        .catch(err => console.warn('[Firebase] Save digital twin warning:', err));
    } else {
      setDigitalTwin(null);
    }
  }, [diagnosisResult, userName, handle, niche, objective, targetAudience]);

  // Initialize Google Analytics & test Firebase connection on idle, and restore saved state if available
  useEffect(() => {
    initGA();
    
    // Idle deferment of secondary connection test
    const timer = setTimeout(() => {
      import("./lib/firebase")
        .then(m => m.testFirebaseConnection())
        .catch(err => console.warn('[Firebase] Connection test warning:', err));
    }, 4000);

    try {
      const savedSummary = localStorage.getItem("instascore_diagnosis_summary");
      const savedDiag = localStorage.getItem("instascore_last_diagnosis");
      const savedStart = localStorage.getItem("instascore_last_start_result");
      const savedUser = localStorage.getItem("instascore_last_user_name");
      const savedHandle = localStorage.getItem("instascore_last_handle");

      if (savedDiag) {
        const parsed = JSON.parse(savedDiag);
        if (parsed?.diagnosis && parsed?.scoring) {
          setDiagnosisResult(parsed);
          if (savedUser) setUserName(savedUser);
          if (savedHandle) setHandle(savedHandle);
          setView("result");
        }
      } else if (savedSummary) {
        // Restore minimal summary state for user reference
        const parsed = JSON.parse(savedSummary);
        if (savedUser) setUserName(savedUser);
        if (savedHandle) setHandle(savedHandle);
      } else if (savedStart) {
        const parsed = JSON.parse(savedStart);
        if (parsed?.startScore) {
          setStartModeResult(parsed);
          setView("start-result");
        }
      }
    } catch (e) {
      console.warn("Failed to restore state from localStorage", e);
    }
  }, []);

  // Save diagnosis to localStorage when updated with data minimization
  useEffect(() => {
    if (diagnosisResult && !isDemoMode) {
      try {
        const isOptInFull = localStorage.getItem("instascore_opt_in_full_storage") === "true";
        if (isOptInFull) {
          localStorage.setItem("instascore_last_diagnosis", JSON.stringify(diagnosisResult));
        } else {
          // Minimization Policy: store only minimal summary in localStorage
          const minimalSummary = extractMinimalDiagnosisSummary(diagnosisResult);
          localStorage.setItem("instascore_diagnosis_summary", JSON.stringify(minimalSummary));
          localStorage.removeItem("instascore_last_diagnosis");
        }
        if (userName) localStorage.setItem("instascore_last_user_name", userName);
        if (handle) localStorage.setItem("instascore_last_handle", handle);
      } catch (e) {
        console.warn("Failed to save diagnosis to localStorage", e);
      }
    }
  }, [diagnosisResult, isDemoMode, userName, handle]);

  // Save start mode result to localStorage when updated
  useEffect(() => {
    if (startModeResult) {
      try {
        localStorage.setItem("instascore_last_start_result", JSON.stringify(startModeResult));
      } catch (e) {
        console.warn("Failed to save start mode result to localStorage", e);
      }
    }
  }, [startModeResult]);

  // Track page view changes in GA
  useEffect(() => {
    trackPageView(`/${view}`, `Screen: ${view}`);
  }, [view]);

  // Reset diagnosis
  const handleReset = () => {
    try {
      localStorage.removeItem("instascore_diagnosis_summary");
      localStorage.removeItem("instascore_last_diagnosis");
      localStorage.removeItem("instascore_last_start_result");
      localStorage.removeItem("instascore_last_user_name");
      localStorage.removeItem("instascore_last_handle");
    } catch (e) {
      // ignore
    }
    setUserName("");
    setNiche("");
    setObjective("");
    setTargetAudience("");
    setHandle("");
    setPrint1(undefined);
    setPrint2(undefined);
    setPrint3(undefined);
    setWantsPrint3(null);
    setConsent(false);
    setErrorText(null);
    setDiagnosisResult(null);
    setStartModeResult(null);
    setAnalysisStatus("idle");
    setIsDemoMode(false);
    setOnboardingStep(1);
    setView("landing");
  };

  // Helper to determine score color tags
  const getScoreInfo = (score: number | null) => {
    if (score === null) return { label: "Sob revisão", colorClass: "text-slate-400 bg-slate-900 border-slate-800" };
    if (score <= 40) return { label: "Crítico", colorClass: "text-rose-400 bg-rose-950/30 border-rose-800/50" };
    if (score <= 70) return { label: "Regular", colorClass: "text-amber-400 bg-amber-950/30 border-amber-800/50" };
    if (score <= 90) return { label: "Bom", colorClass: "text-indigo-400 bg-indigo-950/30 border-indigo-800/50" };
    return { label: "Excelente", colorClass: "text-emerald-400 bg-emerald-950/30 border-emerald-800/50" };
  };

  return (
    <div id="instascore-app-wrapper" className="min-h-screen bg-deep-space bg-tech-grid text-slate-100 flex flex-col justify-between selection:bg-[#E1306C] selection:text-white relative overflow-x-hidden">
      {/* Accessible Skip Link */}
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>
      
      {/* Background Ambient Auroras & Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#833AB4]/20 rounded-full blur-[120px] animate-aurora"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#E1306C]/15 rounded-full blur-[140px] animate-aurora" style={{ animationDelay: '-4s' }}></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#38BDF8]/15 rounded-full blur-[130px] animate-aurora" style={{ animationDelay: '-8s' }}></div>
      </div>

      {/* 1. Header (Universal) */}
      <header id="app-global-header" className="border-b border-white/10 bg-[#04050A]/90 backdrop-blur-2xl sticky top-0 z-40 transition-all w-full">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 min-w-0">
          <div
            onClick={handleReset}
            className="cursor-pointer group active:scale-95 transition-transform shrink min-w-0 flex items-center"
            role="button"
            tabIndex={0}
            aria-label="Ir para a página inicial"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleReset();
              }
            }}
          >
            {/* Responsive Logo: icon only on very small screens (<390px), full on larger */}
            <div className="hidden xs:block">
              <BrandLogo iconSize={32} textSize="sm" />
            </div>
            <div className="xs:hidden">
              <BrandSymbol size={28} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              id="btn-nav-my-plan"
              onClick={() => setView("my-plan")}
              aria-label={isPro ? "Ver detalhes do Plano Pro" : "Ver opções do meu plano"}
              className={`text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                isPro
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                  : "bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {isPro ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                  <span>Pro</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="hidden xs:inline">Meu Plano</span>
                  <span className="xs:hidden">Plano</span>
                </>
              )}
            </button>

            {!isPro && (
              <button
                type="button"
                id="btn-nav-upgrade-pro"
                onClick={() => openPaywall()}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 text-white shadow-sm hover:brightness-110 transition-all cursor-pointer hidden sm:flex items-center gap-1 min-h-[44px]"
              >
                <span>Upgrade Pro</span>
              </button>
            )}

            <button
              type="button"
              id="btn-nav-privacy"
              onClick={() => setIsPrivacyModalOpen(true)}
              aria-label="Abrir configurações de retenção e privacidade de dados"
              className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer min-h-[44px]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Privacidade</span>
            </button>

            {view === "result" && (
              <button
                type="button"
                id="btn-nav-home"
                onClick={handleReset}
                aria-label="Voltar para a página inicial"
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer hidden sm:block min-h-[44px] px-2"
              >
                Início
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Router */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col justify-center relative z-10 focus:outline-none">
        
        {/* VIEW 1: LANDING PAGE V7 */}
        {view === "landing" && (
          <LandingViewV7 
            onStartOnboarding={handleStartOnboarding}
            onStartFromScratch={handleStartFromScratch}
            onStartDemo={handleStartDemo}
          />
        )}

        {/* VIEW 1B: START MODE ONBOARDING ("COMEÇAR DO ZERO") */}
        {view === "start-onboarding" && (
          <ErrorBoundary fallbackTitle="Erro ao carregar Onboarding Start Mode">
            <Suspense fallback={<LazyFallback message="Preparando modo Começar do Zero..." />}>
              <StartModeOnboarding 
                onComplete={handleStartModeComplete}
                onCancel={handleReset}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* VIEW 1C: START MODE RESULT ("SEU INSTAGRAM COMEÇA AQUI") */}
        {view === "start-result" && startModeResult && (
          <ErrorBoundary fallbackTitle="Erro ao carregar Estratégia Inicial">
            <Suspense fallback={<LazyFallback message="Carregando Plano de Lançamento..." />}>
              <StartModeResultView 
                data={startModeResult}
                onRestart={handleReset}
                onSwitchToAuditMode={handleStartOnboarding}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* VIEW 2: CONVERSATIONAL ONBOARDING */}
        {view === "onboarding" && (
          <div id="onboarding-container" className="max-w-2xl w-full mx-auto animate-fade-in bg-slate-900/20 border border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 relative">
            
            {/* Steps Progress Indicator */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium select-none">
              <button
                type="button"
                onClick={handleBackStep}
                aria-label="Voltar para a pergunta anterior"
                className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer min-h-[44px]"
              >
                <ArrowLeft size={14} aria-hidden="true" /> <span>Voltar</span>
              </button>
              <span>Pergunta {onboardingStep} de 10</span>
              <div 
                role="progressbar"
                aria-valuenow={onboardingStep}
                aria-valuemin={1}
                aria-valuemax={10}
                aria-label={`Progresso do questionário: Pergunta ${onboardingStep} de 10`}
                className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden"
              >
                <div
                  className="bg-violet-500 h-full transition-all duration-300"
                  style={{ width: `${(onboardingStep / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-2">
              {/* STEP 1: Welcome Greeting */}
              {onboardingStep === 1 && (
                <div id="onboard-step-1" className="space-y-6 text-center py-4">
                  <div className="mx-auto w-16 h-16 bg-violet-950/40 rounded-2xl flex items-center justify-center border border-violet-800/20">
                    <BrandSymbol size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Bem-vindo ao InstaScore.ai</h2>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md mx-auto">
                      "Olá! Eu sou o Auditor do InstaScore. Vou analisar a estrutura estratégica do seu perfil. Leva poucos minutos. Podemos começar?"
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      id="onboard-start-confirm"
                      onClick={handleNextStep}
                      className="w-full sm:w-auto px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all cursor-pointer min-h-[44px]"
                    >
                      Sim, vamos começar
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Name Input */}
              {onboardingStep === 2 && (
                <div id="onboard-step-2" className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Como você gostaria de ser chamado?</h2>
                  <input
                    type="text"
                    id="input-username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Seu nome ou como prefere ser chamado"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-base"
                  />
                  <p className="text-xs text-slate-500">Usaremos seu nome apenas para personalizar o cabeçalho do relatório.</p>
                </div>
              )}

              {/* STEP 3: Niche Selection */}
              {onboardingStep === 3 && (
                <div id="onboard-step-3" className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Qual é o seu negócio ou nicho?</h2>
                  <input
                    type="text"
                    id="input-niche"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="Ex: Consultor de RH, Estética, Loja de roupas..."
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-base"
                  />
                  
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sugestões comuns:</p>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sugestões de nicho">
                      {NICHE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          aria-pressed={niche === preset}
                          onClick={() => setNiche(preset)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer min-h-[38px] ${
                            niche === preset
                              ? "bg-violet-950 border-violet-500 text-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.15)]"
                              : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Objectives Pills */}
              {onboardingStep === 4 && (
                <div id="onboard-step-4" className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Qual é seu principal objetivo no Instagram?</h2>
                  <div 
                    role="radiogroup" 
                    aria-label="Objetivos principais no Instagram"
                    className="grid grid-cols-1 gap-2.5 max-h-[320px] overflow-y-auto pr-1"
                  >
                    {OBJECTIVE_PRESETS.map((preset) => (
                      <button
                        key={preset.title}
                        type="button"
                        role="radio"
                        aria-checked={objective === preset.title}
                        onClick={() => setObjective(preset.title)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer min-h-[44px] ${
                          objective === preset.title
                            ? "bg-violet-950/40 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900/30"
                        }`}
                      >
                        <h3 className="font-bold text-sm flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full border ${objective === preset.title ? "bg-violet-400 border-violet-400" : "border-slate-600"}`} aria-hidden="true"></span>
                          {preset.title}
                        </h3>
                        <p className="text-xs text-slate-400 ml-5 mt-0.5">{preset.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: Target Audience */}
              {onboardingStep === 5 && (
                <div id="onboard-step-5" className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Quem é o público que você quer alcançar?</h2>
                  <textarea
                    id="input-audience"
                    rows={3}
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Ex: Mulheres de 25 a 45 anos que moram em Porto Alegre e buscam tratamentos estéticos de alta qualidade..."
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-base resize-none"
                  />
                  <p className="text-xs text-slate-500">Quanto mais específico for, mais precisas serão as recomendações da inteligência artificial.</p>
                </div>
              )}

              {/* STEP 6: Handle (Optional) */}
              {onboardingStep === 6 && (
                <div id="onboard-step-6" className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-lg sm:text-xl font-bold text-white">Qual é seu @ do perfil?</h2>
                    <span className="text-xs text-slate-500 font-semibold">(Opcional)</span>
                  </div>
                  <input
                    type="text"
                    id="input-handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Ex: @clinica_estetica"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-base"
                  />
                  
                  <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-900 text-left select-none flex gap-2.5">
                    <Shield className="text-violet-400 shrink-0 mt-0.5" size={16} aria-hidden="true" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <strong className="text-slate-300 font-semibold">Garantia de Privacidade:</strong> Não acessaremos nem solicitaremos a senha da sua conta em hipótese alguma. O @ será usado estritamente para identificar o seu relatório.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 7: Print 1 (Obrigatório) */}
              {onboardingStep === 7 && (
                <div id="onboard-step-7" className="space-y-4">
                  <Suspense fallback={<LazyFallback message="Carregando área de upload do print 1..." minHeight="min-h-[140px]" />}>
                    <FileUploader
                      id="uploader-print1"
                      label="Print 1: Página inicial do perfil"
                      description="Envie uma captura de tela da página inicial do seu perfil, mostrando foto, nome, bio, link principal e destaques."
                      required
                      value={print1}
                      onChange={setPrint1}
                    />
                  </Suspense>
                </div>
              )}

              {/* STEP 8: Print 2 (Obrigatório) */}
              {onboardingStep === 8 && (
                <div id="onboard-step-8" className="space-y-4">
                  <Suspense fallback={<LazyFallback message="Carregando área de upload do print 2..." minHeight="min-h-[140px]" />}>
                    <FileUploader
                      id="uploader-print2"
                      label="Print 2: Topo do feed de publicações"
                      description="Agora envie uma captura de tela mostrando de 6 a 9 posts recentes do seu feed."
                      required
                      value={print2}
                      onChange={setPrint2}
                    />
                  </Suspense>
                </div>
              )}

              {/* STEP 9: Print 3 (Opcional Insights) */}
              {onboardingStep === 9 && (
                <div id="onboard-step-9" className="space-y-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Você gostaria de enviar um print de Insights?</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Você pode incluir uma captura complementar com estatísticas de alcance ou engajamento. Ela será usada como contexto complementar estratégico nesta versão Alpha.
                  </p>

                  <div 
                    role="radiogroup"
                    aria-label="Opção de envio de print de Insights"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={wantsPrint3 === true}
                      onClick={() => setWantsPrint3(true)}
                      className={`p-3 rounded-xl border text-left cursor-pointer min-h-[44px] ${
                        wantsPrint3 === true
                          ? "bg-violet-950/40 border-violet-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900/30"
                      }`}
                    >
                      <h3 className="font-bold text-sm">Sim, enviar Insights</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Adicionar um terceiro print opcional</p>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={wantsPrint3 === false}
                      onClick={() => {
                        setWantsPrint3(false);
                        setPrint3(undefined);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer min-h-[44px] ${
                        wantsPrint3 === false
                          ? "bg-violet-950/40 border-violet-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900/30"
                      }`}
                    >
                      <h3 className="font-bold text-sm font-semibold">Continuar sem Insights</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Seguir com o diagnóstico direto</p>
                    </button>
                  </div>

                  {wantsPrint3 === true && (
                    <div className="animate-fade-in pt-2">
                      <Suspense fallback={<LazyFallback message="Carregando área de upload do print 3..." minHeight="min-h-[140px]" />}>
                        <FileUploader
                          id="uploader-print3"
                          label="Print 3: Insights (Opcional)"
                          description="Envie o print de Insights contendo métricas do seu perfil."
                          value={print3}
                          onChange={setPrint3}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 10: Consent & Terms */}
              {onboardingStep === 10 && (
                <div id="onboard-step-10" className="space-y-6 text-center py-2">
                  <div className="mx-auto w-12 h-12 bg-indigo-950/50 rounded-full flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                    <Shield size={24} aria-hidden="true" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">Privacidade e Termos</h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                      Para realizar o diagnóstico estrutural, seus dados e capturas de tela são processados em memória volátil.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-left max-w-md mx-auto space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <ShieldCheck size={14} aria-hidden="true" />
                      <span>Zero-Persistência de Imagens</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Suas capturas de tela são utilizadas unicamente durante os segundos de análise por IA e <strong>descartadas imediatamente após o processamento</strong>. Elas nunca são gravadas no servidor ou associadas permanentemente ao seu usuário.
                    </p>
                  </div>

                  {/* Consent checkbox */}
                  <label
                    id="consent-wrapper"
                    className="flex items-start gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-900 text-left max-w-md mx-auto cursor-pointer group hover:bg-slate-950 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id="checkbox-consent"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 accent-violet-500 rounded cursor-pointer min-w-[20px] min-h-[20px]"
                    />
                    <span className="text-xs text-slate-300 leading-relaxed select-none">
                      Autorizo o processamento temporário das imagens exclusivamente para gerar este diagnóstico.
                    </span>
                  </label>

                  {/* Auth session status indicator */}
                  <div className="max-w-sm mx-auto">
                    {!auth.currentUser ? (
                      <button
                        type="button"
                        id="btn-google-auth-pre"
                        onClick={async () => {
                          setErrorText(null);
                          try {
                            await loginWithGoogle();
                          } catch (e: any) {
                            console.warn("Google login:", e);
                          }
                        }}
                        className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        Conectar com Google (Opcional)
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Sessão ativa: <strong className="text-slate-300">{auth.currentUser.email || auth.currentUser.displayName || "Google"}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 max-w-sm mx-auto">
                    <button
                      type="button"
                      id="submit-diagnosis-request"
                      disabled={!consent}
                      onClick={handleGenerateDiagnosis}
                      className={`w-full px-6 py-3.5 rounded-xl font-bold transition-all text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                        consent
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-900/20 hover:scale-[1.01]"
                          : "bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed"
                      }`}
                    >
                      Gerar meu Diagnóstico Estrutural 🚀
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error notifications */}
            {errorText && (
              <div id="onboarding-error-box" role="alert" aria-live="assertive" className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{errorText}</span>
              </div>
            )}

            {/* General conversational buttons bottom drawer */}
            {onboardingStep > 1 && onboardingStep < 10 && (
              <div className="pt-4 border-t border-slate-900/60 flex justify-between">
                <button
                  type="button"
                  id="onboard-back-arrow"
                  onClick={handleBackStep}
                  aria-label="Voltar para a pergunta anterior"
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer min-h-[44px]"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  id="onboard-next-arrow"
                  onClick={handleNextStep}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer min-h-[44px]"
                >
                  <span>Continuar</span> <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: PROCESSING STATE (Loader or Error) */}
        {view === "processing" && (
          <div className="w-full">
            {analysisStatus === "error" ? (
              <div id="processing-error-container" role="alert" aria-live="assertive" className="max-w-md w-full mx-auto text-center py-10 space-y-6 animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-950/50 border border-rose-800/50 text-rose-500 mx-auto">
                  <AlertCircle size={32} aria-hidden="true" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-white">Não conseguimos concluir a análise</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {errorText || "Ocorreu uma instabilidade durante a análise do seu perfil. Seus dados e sua quota foram preservados."}
                  </p>
                  {errorCode && (
                    <div className="inline-block px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-rose-400 font-mono select-all">
                      Código: {errorCode}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateDiagnosis}
                    className="px-6 py-3 rounded-xl font-semibold bg-violet-600 hover:bg-violet-700 active:scale-95 transition-all text-white text-sm cursor-pointer min-h-[44px]"
                  >
                    Tentar novamente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setView("onboarding");
                      setOnboardingStep(10);
                    }}
                    className="px-6 py-3 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-95 transition-all text-slate-300 text-sm cursor-pointer min-h-[44px]"
                  >
                    Voltar e revisar os arquivos
                  </button>
                </div>
              </div>
            ) : (
              <div id="processing-loader-container" role="status" aria-live="polite" className="max-w-xl w-full mx-auto text-center py-8 space-y-8 animate-fade-in">
                
                {/* Score Pulse Orb Loader */}
                <div className="relative inline-flex items-center justify-center mx-auto" aria-hidden="true">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF5E36] via-[#E1306C] to-[#833AB4] blur-2xl opacity-40 animate-pulse"></div>
                  <div className="w-28 h-28 rounded-full border-4 border-white/10 border-t-[#FF5E36] border-r-[#E1306C] border-b-[#833AB4] animate-spin"></div>
                  <div className="absolute">
                    <BrandSymbol size={52} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-extrabold text-white font-display tracking-tight">Processando Inteligência de Perfil</h2>
                  
                  {/* Progress bar container */}
                  <div 
                    role="progressbar"
                    aria-valuenow={processingProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progresso da análise estrutural: ${processingProgress}%`}
                    className="w-full bg-[#0D1222] h-3 rounded-full overflow-hidden border border-white/15 max-w-sm mx-auto shadow-inner relative"
                  >
                    <div
                      className="bg-gradient-to-r from-[#FF5E36] via-[#E1306C] to-[#833AB4] h-full transition-all duration-300 shadow-[0_0_15px_rgba(225,48,108,0.6)]"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-[#FA26A0] block font-mono font-bold tracking-widest">{processingProgress}% CONCLUÍDO</span>
                </div>

                {/* AI Interactive Terminal Checklist */}
                <div className="glass-panel rounded-2xl p-6 text-left space-y-3 font-mono text-xs shadow-2xl border border-white/10 max-w-lg mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-slate-400 font-bold text-[10px] tracking-widest uppercase">
                    <span>InstaScore AI Engine v6</span>
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      PROCESSANDO
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className={`flex items-center gap-3 transition-all ${processingProgress >= 20 ? "text-emerald-400 font-medium" : "text-[#FF5E36] font-bold"}`}>
                      {processingProgress >= 20 ? (
                        <CheckCircle size={15} className="shrink-0 text-emerald-400" />
                      ) : (
                        <RefreshCw size={15} className="animate-spin text-[#FF5E36] shrink-0" />
                      )}
                      <span>Validação de capturas e sessão segura</span>
                    </div>

                    <div className={`flex items-center gap-3 transition-all ${processingProgress >= 80 ? "text-emerald-400 font-medium" : processingProgress >= 20 ? "text-[#E1306C] font-bold" : "text-slate-500"}`}>
                      {processingProgress >= 80 ? (
                        <CheckCircle size={15} className="shrink-0 text-emerald-400" />
                      ) : processingProgress >= 20 ? (
                        <RefreshCw size={15} className="animate-spin text-[#E1306C] shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"></div>
                      )}
                      <span>Visão computacional e leitura multimodal de perfil</span>
                    </div>

                    <div className={`flex items-center gap-3 transition-all ${processingProgress >= 90 ? "text-emerald-400 font-medium" : processingProgress >= 80 ? "text-[#FA26A0] font-bold" : "text-slate-500"}`}>
                      {processingProgress >= 90 ? (
                        <CheckCircle size={15} className="shrink-0 text-emerald-400" />
                      ) : processingProgress >= 80 ? (
                        <RefreshCw size={15} className="animate-spin text-[#FA26A0] shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"></div>
                      )}
                      <span>Cálculo determinístico das 25 métricas C.A.G.E.</span>
                    </div>

                    <div className={`flex items-center gap-3 transition-all ${processingProgress >= 100 ? "text-emerald-400 font-medium" : processingProgress >= 90 ? "text-[#C084FC] font-bold" : "text-slate-500"}`}>
                      {processingProgress >= 100 ? (
                        <CheckCircle size={15} className="shrink-0 text-emerald-400" />
                      ) : processingProgress >= 90 ? (
                        <RefreshCw size={15} className="animate-spin text-[#C084FC] shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"></div>
                      )}
                      <span>Mapeamento de prioridades e plano estratégico do OS</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Sua auditoria estrutural está sendo construída em tempo real. O resultado será exibido em instantes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: OS VIEW */}
        {view === "result" && diagnosisResult && (
          <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto overflow-x-hidden md:overflow-hidden">
            <ErrorBoundary fallbackTitle="Erro ao carregar Sistema Operacional">
              <Suspense fallback={<LazyFallback message="Carregando Sistema Operacional..." minHeight="min-h-screen" />}>
                <OSLayout
                  userName={userName}
                  handle={handle}
                  score={diagnosisResult.scoring.score || 0}
                  onLogout={handleReset}
                  activeModule={activeOsModule}
                  activeSubTab={activeDashboardTab}
                  onNavigate={handleOsNavigate}
                  onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
                  onOpenPlan={() => setView("my-plan")}
                  isPro={isPro}
                  floatingElement={
                    activeOsModule !== "mentor" ? (
                      <Suspense fallback={null}>
                        <FloatingMentorWidget
                          diagnosisResult={diagnosisResult}
                          digitalTwin={activeDigitalTwin}
                          userName={userName}
                          onOpenFullMentor={() => setActiveOsModule("mentor")}
                        />
                      </Suspense>
                    ) : null
                  }
                >
                  {activeOsModule === "dashboard" && (
                    <ErrorBoundary fallbackTitle="Erro ao carregar Painel de Diagnóstico">
                      <Suspense fallback={<LazyFallback message="Carregando Auditoria C.A.G.E...." />}>
                        <ResultView 
                          digitalTwin={activeDigitalTwin}
                          diagnosisResult={diagnosisResult}
                          isDemoMode={isDemoMode}
                          userName={userName}
                          niche={niche}
                          handle={handle}
                          onReset={handleReset}
                          onShare={() => setIsShareModalOpen(true)}
                          activeTab={activeDashboardTab}
                          onTabChange={setActiveDashboardTab}
                          onNavigateToContentEngine={(opts) => {
                            setContentEngineOptions(opts || null);
                            handleOsNavigate("content_engine");
                          }}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {activeOsModule === "benchmark" && (
                    <ErrorBoundary fallbackTitle="Erro ao carregar Benchmark">
                      <Suspense fallback={<LazyFallback message="Carregando Inteligência de Benchmark..." />}>
                        <GlobalBenchmarkView
                          digitalTwin={activeDigitalTwin}
                          onNavigateToGrowth={() => setActiveOsModule("growth")}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {activeOsModule === "twin" && (
                    <ErrorBoundary fallbackTitle="Erro ao carregar Digital Twin">
                      <Suspense fallback={<LazyFallback message="Carregando Digital Twin..." />}>
                        <DigitalTwinView
                          digitalTwin={activeDigitalTwin}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {activeOsModule === "simulator" && (
                    <ErrorBoundary fallbackTitle="Erro ao carregar Simulador">
                      <Suspense fallback={<LazyFallback message="Carregando Simulador de Cenários..." />}>
                        <SimulatorView 
                          digitalTwin={activeDigitalTwin}
                          diagnosisResult={diagnosisResult}
                          currentScore={diagnosisResult.scoring.score || 0}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {activeOsModule === "growth" && (
                    <ErrorBoundary fallbackTitle="Erro ao carregar Growth Center">
                      <Suspense fallback={<LazyFallback message="Carregando Growth Center..." />}>
                        <GrowthCenterView 
                          diagnosisResult={diagnosisResult} 
                          digitalTwin={activeDigitalTwin}
                          userName={userName}
                          handle={handle}
                          niche={niche}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {activeOsModule === "mentor" && (
                    <ErrorBoundary fallbackTitle="Erro ao carregar Mentor IA">
                      <Suspense fallback={<LazyFallback message="Conectando com Mentor Estratégico..." />}>
                        <MentorView 
                          digitalTwin={activeDigitalTwin}
                          diagnosisResult={diagnosisResult}
                          userName={userName}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {activeOsModule === "history" && (
                    <ErrorBoundary fallbackTitle="Erro ao carregar Linha do Tempo">
                      <Suspense fallback={<LazyFallback message="Carregando Histórico e Evolução..." />}>
                        <TimelineView 
                          digitalTwin={activeDigitalTwin}
                          diagnosisResult={diagnosisResult}
                          currentScore={diagnosisResult.scoring.score || 0}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {activeOsModule === "content_engine" && (
                    <ErrorBoundary fallbackTitle="Erro ao carregar InstaScore Content Engine">
                      <Suspense fallback={<LazyFallback message="Inicializando Content Engine C.A.G.E...." />}>
                        <ContentEngineView 
                          diagnosisResult={diagnosisResult}
                          startModeResult={startModeResult}
                          digitalTwin={activeDigitalTwin}
                          isPro={isPro}
                          initialOptions={contentEngineOptions}
                          onOpenPaywall={(reason) => openPaywall(reason)}
                          onNavigateToLibrary={() => handleOsNavigate("content_library")}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                  {activeOsModule === "content_library" && (
                    <ErrorBoundary fallbackTitle="Erro ao carregar Biblioteca de Conteúdo">
                      <Suspense fallback={<LazyFallback message="Carregando Biblioteca de Conteúdo..." />}>
                        <ContentLibraryView 
                          isPro={isPro}
                          onNavigateToCreate={() => handleOsNavigate("content_engine")}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                </OSLayout>
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {/* VIEW 5: MY PLAN VIEW */}
        {view === "my-plan" && (
          <ErrorBoundary fallbackTitle="Erro ao carregar Gerenciamento de Plano">
            <Suspense fallback={<LazyFallback message="Carregando Assinatura e Cotas..." />}>
              <MyPlanView
                onOpenPaywall={() => openPaywall()}
                onBack={() => {
                  if (diagnosisResult) {
                    setView("result");
                  } else {
                    setView("landing");
                  }
                }}
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      {/* Paywall Modal */}
      {isPaywallOpen && (
        <ErrorBoundary fallbackTitle="Erro ao carregar modal de planos">
          <Suspense fallback={null}>
            <PaywallModal
              isOpen={isPaywallOpen}
              onClose={closePaywall}
              userId={userId}
              reason={paywallReason}
              onSuccess={() => {
                refreshStatus();
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Privacy, Minimization & Data Retention Modal */}
      {isPrivacyModalOpen && (
        <ErrorBoundary fallbackTitle="Erro ao abrir modal de privacidade">
          <Suspense fallback={null}>
            <PrivacyDataModal
              isOpen={isPrivacyModalOpen}
              onClose={() => setIsPrivacyModalOpen(false)}
              userId={userId}
              onDataDeleted={handleReset}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Social Share Modal (1080x1080 canvas generated only when opened) */}
      {isShareModalOpen && diagnosisResult && (
        <ErrorBoundary fallbackTitle="Erro ao gerar cartão de compartilhamento">
          <Suspense fallback={null}>
            <ShareModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              userName={userName || handle || "Perfil Instagram"}
              handle={handle}
              score={diagnosisResult.scoring?.score || 0}
              targetScore={diagnosisResult.scoring?.targetScore || diagnosisResult.scoring?.score || 0}
              strongestCategory={diagnosisResult.scoring?.strongestCategory?.name || "Posicionamento"}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* 3. Footer (Universal) */}
      <footer id="app-global-footer" className="border-t border-slate-900/60 py-6 bg-slate-950 text-center select-none">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="text-slate-500">&copy; 2026 InstaScore.ai. Todos os direitos reservados.</span>
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck size={14} />
              Privacidade & Retenção de Dados
            </button>
          </div>
          <p className="text-[10px] text-slate-600 leading-relaxed max-w-xl mx-auto">
            O InstaScore.ai é um auditor estrutural independente e não possui vínculo, patrocínio ou afiliação oficial com o Instagram, Meta Inc. ou suas subsidiárias. Imagens são processadas temporariamente em memória e nunca salvas.
          </p>
        </div>
      </footer>
    </div>
  );
}
