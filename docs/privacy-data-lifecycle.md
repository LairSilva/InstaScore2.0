# Política de Ciclo de Vida e Privacidade de Dados — InstaScore.ai

## 1. Dados Recebidos
O InstaScore.ai coleta e processa exclusivamente as informações fornecidas voluntariamente pelo usuário para a geração dos diagnósticos e gerenciamento de sua conta:
- **Identificação e Perfil:** Nome ou forma de tratamento preferida, nicho de atuação, subnicho, objetivo no Instagram e descrição do público-alvo.
- **Identificador Público:** `@handle` ou nome de usuário da conta a ser analisada.
- **Capturas de Tela (Screenshots):** Imagens do perfil (topo da bio, grade de posts e opcionalmente post de maior relevância).
- **Dados de Conta e Pagamento:** E-mail autenticado (Firebase Auth / Google Sign-In) e dados transacionais para emissão e conciliação de planos de assinatura (gerenciados por gateways de pagamento homologados como Mercado Pago; dados de cartão nunca trafegam em nossos servidores).
- **Feedbacks:** Avaliações de utilidade e comentários enviados pelo usuário.

---

## 2. Finalidade e Necessidade dos Dados
Cada informação coletada possui justificativa operacional estrita:
- **Diagnóstico Multimodal e Algorítmico (C.A.G.E.):** As capturas de tela e dados de nicho/objetivo alimentam o motor de inteligência artificial e a engine matemática para auditar Clareza, Autoridade, Gancho e Encantamento.
- **Personalização Estratégica (DNA e Digital Twin):** Os dados de perfil permitem calibrar o modelo para sugerir ganchos, bios anti-clichê, roteiros de Reels e planos de conteúdo contextualizados.
- **Gestão de Quotas e Assinaturas:** O identificador único do usuário (`userId` / UID) assegura a aplicação correta dos limites do plano (FREE / PRO) e previne abusos.

---

## 3. Política de Armazenamento e Retenção

| Categoria de Dado | Onde é Armazenado | Tempo de Retenção | Política de Descarte |
| :--- | :--- | :--- | :--- |
| **Capturas de Tela (Screenshots)** | **Não persistidas (Apenas Memória RAM Efêmera)** | **0 segundos após a resposta da API** | **Descarte Imediato:** As imagens enviadas via upload são processadas temporariamente em memória estritamente durante a requisição de diagnóstico da IA e imediatamente liberadas/coletadas pelo garbage collector. Nenhuma imagem é gravada em disco, banco de dados ou armazenamento em nuvem (S3/Cloud Storage). |
| **Diagnósticos e Projetos Salvos** | Firestore (Coleções isoladas por UID) | Enquanto a conta do usuário estiver ativa | Exclusão pelo próprio usuário na interface ou sob solicitação. |
| **DNA de Perfil & Digital Twin** | Firestore (Coleção protegida por UID) | Enquanto a conta do usuário estiver ativa | Sobrescrito em novas análises ou excluído pelo usuário. |
| **Status de Assinatura & Quotas** | Firestore / Banco de Dados Server-Side | Duração da vigência da assinatura + período legal de retenção fiscal | Anonimizado ou excluído após encerramento da conta. |
| **Métricas de Observabilidade (Logs de IA)** | Banco de Dados Server-Side (sem PII) | 90 dias | Rotacionado automaticamente. |

---

## 4. Política de Zero-Persistência de Screenshots
O InstaScore adota por padrão o princípio de **Zero-Persistence** para arquivos de mídia:
- **Não salvamos, não catalogamos e não compartilhamos capturas de tela** enviadas para auditoria.
- O processamento visual ocorre exclusivamente no escopo da sessão em tempo de execução (`in-memory transit`).
- Não é permitida a retenção permanente de capturas de tela sem consentimento prévio, destacado e com finalidade explícita.

---

## 5. Como o Usuário Solicita Exclusão de Dados
O usuário é o proprietário integral dos seus dados e pode exercer seus direitos a qualquer momento:
1. **Exclusão Direta:** O usuário pode apagar diagnósticos individuais, projetos e registros salvos diretamente através das ações disponíveis no painel da aplicação.
2. **Exclusão Total da Conta e Dados:** Para solicitar a remoção completa de todos os dados cadastrais, histórico e registros associados ao seu UID, o usuário pode:
   - Enviar solicitação para o e-mail de privacidade: **`privacidade@instascore.ai`** ou **`suporte@instascore.ai`** informando seu e-mail de cadastro.
   - O processo de exclusão é realizado em até **48 horas úteis**, removendo todos os registros das coleções `diagnoses`, `start_projects`, `digital_twins`, `profile_dna`, `performance_memory`, `subscriptions` e `usage`.

---

## 6. Segurança e Isolamento de Acesso
- Todos os documentos salvos no banco de dados Firestore são protegidos por regras **Zero-Trust ABAC**, impedindo que qualquer usuário leia, modifique ou exclua documentos de terceiros.
- Rotas administrativas (`/api/admin/*`, `/api/feedback/list`) são estritamente restritas a administradores verificados com credenciais no backend e bloqueadas contra acesso não autorizado (HTTP 401/403).
