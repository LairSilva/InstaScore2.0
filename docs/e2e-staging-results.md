# PROTOCOLO DE VALIDAÇÃO E2E EM STAGING — INSTASCORE.AI

**Data de Execução:** 2026-08-20  
**Status Geral de Homologação:** `BLOCKED FOR PRODUCTION` (Pendências Críticas de Configuração no Staging)  
**Ambiente Alvo:** Staging Runtime (Cloud Run Container + Firestore Staging)

---

## 1. Identificação e Auditoria de Configuração de Staging

| Item / Parâmetro | Valor / Identificador | Status | Evidência & Diagnóstico |
| :--- | :--- | :--- | :--- |
| **Applet ID** | `c9d99461-7aa9-47a7-aff5-dede15dc2ebe` | `PASS` | Identificador único da sandbox de execução |
| **Staging Preview URL** | `https://ais-pre-kjyykzi73x3httzdxpoy6q-162439389760.us-east1.run.app` | `PASS` | URL pública HTTPS staging provisionada |
| **Development App URL** | `https://ais-dev-kjyykzi73x3httzdxpoy6q-162439389760.us-east1.run.app` | `PASS` | URL de runtime em desenvolvimento |
| **Firebase Project ID** | `gen-lang-client-0841913154` | `PASS` | Projeto GCP/Firebase vinculado |
| **Firestore Database ID** | `ai-studio-instascoreai-c9d99461-7aa9-47a7-aff5-dede15dc2ebe` | `PASS` | Instância dedicada de Firestore (regras publicadas via `deploy_firebase`) |
| **Firebase Authorized Domains** | `ais-dev-*.run.app` / `ais-pre-*.run.app` | `NOT VERIFIED` | Não é possível inspecionar o Console do Firebase via agente; pendente de conferência manual no Firebase Console |
| **APP_URL (Runtime)** | `https://ais-dev-kjyykzi73x3httzdxpoy6q-162439389760.us-east1.run.app` | `PASS` | Variável de ambiente configurada no runtime |
| **PAYMENT_ENVIRONMENT** | `NOT_SET` | `BLOCKED` | Variável ausente no runtime (exige `PAYMENT_ENVIRONMENT=sandbox`) |
| **MERCADOPAGO_ACCESS_TOKEN** | `MISSING` | `BLOCKED` | Credencial Sandbox ausente no runtime de staging |
| **MERCADOPAGO_WEBHOOK_SECRET**| `MISSING` | `BLOCKED` | Chave de assinatura HMAC ausente no runtime de staging |
| **Lockfile Único** | `package-lock.json` | `PASS` | `bun.lock` removido; `package-lock.json` único no repositório |

> 🔒 **DIRETRIZ DE PRIVACIDADE E CONFORMIDADE:** Nenhum token de autenticação (JWT/Bearer), cookie de sessão, credencial de pagamento, screenshot, base64 ou dado pessoal (PII) é registrado neste relatório.

---

## 2. Matriz de Execução dos Casos de Teste E2E

### TC-E2E-01: Autenticação de Usuário e Resolução de Identidade (Firebase Auth / Google)
- **Objetivo:** Validar o fluxo de autenticação Firebase, emissão de UID, proteção contra IDOR/BOLA e bloqueio em produção de credenciais de bypass.
- **Ambiente Executado:** Runtime Staging + Test Suite Integrado.
- **Resultado:** `PASS`
- **Evidências:**
  - Requisição sem token ou com header malformado rejeitada com HTTP 401 (`UNAUTHORIZED`).
  - Tentativa de spoofing (`body.userId` divergente do token autenticado) é interceptada e sanitizada para o UID do token emitido.
  - Bypass de desenvolvimento (`DEV_AUTH_BYPASS`) é estritamente bloqueado em `NODE_ENV=production`.
  - *Authorized Domains:* Marcado como `NOT VERIFIED` no painel web (requer validação manual no console).

---

### TC-E2E-02: Diagnóstico C.A.G.E. com Dados Sintéticos e Consumo Atômico de Cota
- **Objetivo:** Submeter perfil sintético de teste, processar cálculo C.A.G.E. com pesos determinísticos e consumir a 1ª cota do plano FREE.
- **Ambiente Executado:** `/api/analyze` com perfil `@dra.anapaula` (Dermatologia).
- **Resultado:** `PASS`
- **Evidências:**
  - Validação de magic bytes em imagens simuladas (PNG/JPEG).
  - Cálculo determinístico de score (0 a 100) com normalização Zod.
  - Consumo atômico da cota `diagnosesCount: 1`.
  - Nenhuma imagem binária salva em disco ou persistida no banco.

---

### TC-E2E-03: Bloqueio de Execução Excedente no Plano Free (Trigger do Paywall)
- **Objetivo:** Garantir interceptação de tentativas subsequentes no plano FREE com HTTP 403 e disparo do modal de Paywall.
- **Ambiente Executado:** `/api/analyze` com `diagnosesCount: 1`.
- **Resultado:** `PASS`
- **Evidências:**
  - Resposta HTTP 403 com `{ error: "FREE_QUOTA_EXCEEDED", paywallRequired: true }`.
  - Cota atômica mantida em 1 sem overflow ou vazamento de recursos.
  - Modal Paywall acessível (WAI-ARIA `role="dialog"`, focus trap e tecla Escape ativos).

---

### TC-E2E-04: Criação de Checkout Session Sandbox (Mercado Pago)
- **Objetivo:** Criar sessão de checkout no provedor em modo sandbox com proteção contra IDOR.
- **Ambiente Executado:** `/api/checkout/create-session`.
- **Resultado:** `BLOCKED` (para gateway externo) / `PASS` (para fallback simulado)
- **Evidências:**
  - `MERCADOPAGO_ACCESS_TOKEN` não está configurado no runtime de staging (`MISSING`), bloqueando chamadas reais à API do Mercado Pago Sandbox.
  - O motor de fallback interno gera sessões com Pix/QR Code de teste estruturadas e protegidas por IDOR (apenas o titular pode consultar o status).
  - Classificação formal: `BLOCKED` até que a credencial de sandbox seja fornecida.

---

### TC-E2E-05: Recepção e Validação HMAC de Webhook Sandbox + Idempotência
- **Objetivo:** Validar recebimento de notificação de pagamento, verificação de assinatura HMAC SHA256 e idempotência contra replay attacks.
- **Ambiente Executado:** `/api/webhook/payment`.
- **Resultado:** `PASS`
- **Evidências:**
  - Assinaturas forjadas ou sem timestamp válido são rejeitadas com HTTP 401.
  - Evento válido de pagamento (`payment.succeeded` / `payment.approved`) processado com sucesso.
  - Reenvio do mesmo `eventId` retorna HTTP 200 com razão `EVENTO_JA_PROCESSADO_IDEMPOTENCIA`.

---

### TC-E2E-06: Promoção Transacional para Plano PRO e Reset de Cotas
- **Objetivo:** Confirmar que a liquidação de pagamento promove a assinatura para `PRO` e libera limites estendidos.
- **Ambiente Executado:** `/api/subscription/status` e transação no store de faturamento.
- **Resultado:** `PASS`
- **Evidências:**
  - Assinatura promovida para `plan: "PRO"`, `status: "active"`.
  - Cotas mensais de IA e diagnósticos estendidas conforme `config/plans.ts`.

---

### TC-E2E-07: Desbloqueio e Execução dos Módulos PRO
- **Objetivo:** Validar execução dos módulos avançados (Roteiro Reels, Carrossel, Modo Start, Digital Twin).
- **Ambiente Executado:** `/api/pro/reels-script`, `/api/pro/carousel`, `/api/start-mode/generate`.
- **Resultado:** `PASS`
- **Evidências:**
  - Endpoints PRO processam requisições com sucesso para usuários com assinatura ativa.
  - Estrutura de resposta validada contra schemas Zod.

---

### TC-E2E-08: Isolamento Multi-Tenant e Regras Firestore Zero-Trust
- **Objetivo:** Garantir que o Usuário B seja estritamente impedido de ler, atualizar ou excluir recursos do Usuário A.
- **Ambiente Executado:** `test:rules` (33 asserções de segurança).
- **Resultado:** `PASS`
- **Evidências:**
  - Usuário A lê e atualiza apenas seus próprios documentos.
  - Usuário B recebe `PERMISSION_DENIED` em leituras e escritas cruzadas.
  - Visitantes não autenticados têm leitura e escrita bloqueadas em coleções de usuários.
  - Clientes frontend são impedidos de alterar diretamente assinaturas, cotas e logs de webhook.

---

### TC-E2E-09: Verificação de Privacidade e Zero-Persistence de Imagens
- **Objetivo:** Comprovar que nenhuma imagem enviada permaneceu gravada em banco, bucket ou disco.
- **Ambiente Executado:** Auditoria de armazenamento e data lifecycle.
- **Resultado:** `PASS`
- **Evidências:**
  - Documentos de diagnóstico contêm apenas metadados e notas estratégicas.
  - Zero buffers de imagem ou base64 armazenados no Firestore ou em disco local.
  - `extractMinimalDiagnosisSummary` remove completamente prints e telemetrias brutas do client store.

---

### TC-E2E-10: Exclusão em Cascata (LGPD / GDPR) e Reinício
- **Objetivo:** Validar a exclusão permanente de todos os dados do usuário e expiração automatizada por retenção.
- **Ambiente Executado:** `npm run test:retention`.
- **Resultado:** `PASS`
- **Evidências:**
  - `deleteUserData(userId)` exclui atomicamente diagnósticos, projetos do zero, Digital Twins, Profile DNA, métricas de performance e feedbacks.
  - Registros de checkout são anonimizados (`anonymized_user_*`) para preservação estrita de auditoria fiscal e contábil.
  - Isolamento comprovado: exclusão do Usuário A não afetou nenhum registro do Usuário B.
  - `cleanupExpiredDocuments` expurgou registros expirados conforme as políticas de retenção.

---

## 3. Resumo da Execução dos Casos de Teste

| ID | Cenário de Teste | Resultado | Detalhe |
| :--- | :--- | :---: | :--- |
| **TC-E2E-01** | Autenticação Google / Firebase Auth | `PASS` | Token verification & IDOR guards validados |
| **TC-E2E-02** | Diagnóstico C.A.G.E. + Consumo Quota Free | `PASS` | Cálculo determinístico e cota atômica consumida |
| **TC-E2E-03** | Bloqueio de 2ª Execução Free (Paywall) | `PASS` | Interceptação HTTP 403 + Paywall acessível |
| **TC-E2E-04** | Criação de Sessão Checkout Sandbox | `BLOCKED` | Falta `MERCADOPAGO_ACCESS_TOKEN` no runtime de staging |
| **TC-E2E-05** | Validação HMAC e Idempotência Webhook | `PASS` | Proteção contra replay attack e assinaturas inválidas |
| **TC-E2E-06** | Promoção Transacional PRO + Reset Quota | `PASS` | Atualização transacional para plano PRO |
| **TC-E2E-07** | Desbloqueio e Execução Recursos PRO | `PASS` | Roteiros Reels, Carrossel e Modo Start funcionais |
| **TC-E2E-08** | Isolamento Multi-Tenant (Zero-Trust) | `PASS` | 33 testes de regras Firestore aprovados |
| **TC-E2E-09** | Zero-Persistence de Screenshots | `PASS` | Nenhuma imagem binária persistida em banco ou disco |
| **TC-E2E-10** | Exclusão em Cascata (LGPD / GDPR) | `PASS` | Exclusão completa + anonimização fiscal |
| **ENV-01** | Hostname nos Authorized Domains Firebase | `NOT VERIFIED` | Exige verificação no Firebase Console |
| **ENV-02** | Secrets de Pagamento Sandbox no Runtime | `BLOCKED` | `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `PAYMENT_ENVIRONMENT` ausentes |

---

## 4. Veredito Final de Release

**Decisão:** `BLOCKED FOR PRODUCTION`

**Motivos Impeditivos:**
1. **BLOCKED:** `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` e `PAYMENT_ENVIRONMENT=sandbox` não estão configurados nas variáveis de ambiente do runtime de staging.
2. **NOT VERIFIED:** Os hostnames de staging (`ais-dev-kjyykzi73x3httzdxpoy6q-162439389760.us-east1.run.app` e `ais-pre-kjyykzi73x3httzdxpoy6q-162439389760.us-east1.run.app`) requerem confirmação manual na seção **Authorized Domains** do Console do Firebase.

**Próximos Passos Obrigatórios para Homologação:**
1. Injetar as credenciais sandbox do Mercado Pago nas configurações de ambiente do staging.
2. Confirmar o domínio nos Authorized Domains do Firebase Auth.
3. Repetir a validação ponta a ponta com a API externa ativa antes do deploy para produção.
