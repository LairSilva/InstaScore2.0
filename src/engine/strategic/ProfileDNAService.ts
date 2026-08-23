import { ProfileDNA, ContentPillar } from '../../types/strategic-brain';
import { db, auth, ensureAuthUser, handleFirestoreError, OperationType, sanitizeId } from '../../lib/firebase';
import { calculateRetentionUntil, RETENTION_POLICIES } from '../../lib/data-retention-client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LOCAL_STORAGE_PREFIX = 'instascore_profile_dna_';

export class ProfileDNAService {
  /**
   * Retrieves Profile DNA from Firestore or fallback to LocalStorage
   */
  static async getDNA(username: string, userId?: string): Promise<ProfileDNA | null> {
    return this.getProfileDNA(username, userId);
  }

  static async getProfileDNA(username: string, userId?: string): Promise<ProfileDNA | null> {
    const cleanUsername = sanitizeId(username || 'default');
    const localKey = `${LOCAL_STORAGE_PREFIX}${cleanUsername}`;
    const uid = userId || auth.currentUser?.uid;
    
    // 1. Try Firestore if user is authenticated
    if (uid && auth.currentUser) {
      try {
        const docRef = doc(db, 'profile_dna', `dna_${cleanUsername}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as ProfileDNA;
          localStorage.setItem(localKey, JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('[ProfileDNAService] Firestore fetch warning, checking cache:', err);
      }
    }

    // 2. Fallback to LocalStorage
    try {
      const cached = localStorage.getItem(localKey);
      if (cached) {
        return JSON.parse(cached) as ProfileDNA;
      }
    } catch (err) {
      console.warn('[ProfileDNAService] LocalStorage read warning:', err);
    }

    return null;
  }

  /**
   * Saves or updates Profile DNA in Firestore & LocalStorage
   */
  static async saveDNA(dna: Partial<ProfileDNA> & { username: string }, userId?: string): Promise<ProfileDNA> {
    return this.saveProfileDNA(dna, userId);
  }

  static async saveProfileDNA(dna: Partial<ProfileDNA> & { username: string }, userId?: string): Promise<ProfileDNA> {
    const cleanUsername = sanitizeId(dna.username || 'default');
    const uid = userId || auth.currentUser?.uid || 'local_user';
    const docId = `dna_${cleanUsername}`;
    const localKey = `${LOCAL_STORAGE_PREFIX}${cleanUsername}`;

    // Get existing to merge
    const existing = (await this.getProfileDNA(dna.username, uid)) || this.createDefaultDNA(dna.username, uid);

    const updatedDNA: ProfileDNA & { retentionUntil?: number } = {
      ...existing,
      ...dna,
      id: docId,
      userId: uid,
      username: dna.username,
      retentionUntil: calculateRetentionUntil(RETENTION_POLICIES.PROFILE_DNA_DAYS),
      last_updated: new Date().toISOString()
    };

    // Save to LocalStorage immediately
    try {
      localStorage.setItem(localKey, JSON.stringify(updatedDNA));
    } catch (e) {
      console.warn('[ProfileDNAService] LocalStorage write error:', e);
    }

    // Save to Firestore only if user is authenticated with Firebase
    if (auth.currentUser && uid !== 'local_user') {
      try {
        const docRef = doc(db, 'profile_dna', docId);
        await setDoc(docRef, updatedDNA, { merge: true });
      } catch (err) {
        console.warn('[ProfileDNAService] Firestore write warning:', err);
      }
    }

    return updatedDNA;
  }

  /**
   * Creates initial default Profile DNA from diagnosis context and research-informed intelligence
   */
  static createDefaultDNA(username: string, userId: string = 'anonymous', partial?: Partial<ProfileDNA>, diagnosisContext?: any): ProfileDNA {
    const cleanUsername = username || 'usuario';
    const intel = diagnosisContext?.diagnosis?.intelligence || diagnosisContext?.intelligence;
    
    // Map pillars from intelligence if available
    let dynamicPillars: ContentPillar[] | undefined = undefined;
    if (intel?.contentPillars && Array.isArray(intel.contentPillars) && intel.contentPillars.length > 0) {
      dynamicPillars = intel.contentPillars.map((p: any, idx: number) => ({
        id: `pillar_${idx + 1}`,
        name: p.name || `Pilar ${idx + 1}`,
        objective: p.function === 'authority' ? 'Autoridade e Metodologia' : p.function === 'discovery' ? 'Descoberta e Alcance' : p.function === 'conversion' ? 'Conversão e Vendas' : p.function === 'proof' ? 'Prova Social e Casos' : 'Relacionamento',
        target_audience: intel.positioning?.audience || 'Público Qualificado',
        pain_or_problem: p.audienceProblem || 'Falta de clareza prática',
        desire: p.promise || 'Dominar o processo',
        content_type: (p.formats || ['Reel', 'Carrossel']).join(' / '),
        formats: (p.formats || ['reel', 'carousel']).map((f: string) => f.toLowerCase().includes('reel') ? 'reel' : f.toLowerCase().includes('stor') ? 'stories' : 'carousel'),
        example_topics: p.exampleIdeas || ['Ideia prática 1', 'Ideia prática 2'],
        angles: ['contradição', 'erro', 'demonstração']
      }));
    }

    return {
      id: `dna_${sanitizeId(cleanUsername)}`,
      userId,
      account_name: cleanUsername,
      username: cleanUsername,
      niche: partial?.niche || diagnosisContext?.onboarding?.niche || 'Negócios e Serviços',
      subniche: partial?.subniche || diagnosisContext?.onboarding?.subNiche || 'Instagram para Negócios',
      microsegment: partial?.microsegment || 'Consultoria e Vendas Diretas',
      target_audience: partial?.target_audience || intel?.positioning?.audience || 'Clientes qualificados em busca de soluções práticas',
      audience_pain: partial?.audience_pain || 'Tentam crescer e vender sem clareza estratégica nem consistência',
      audience_desire: partial?.audience_desire || 'Atrair clientes previsíveis e construir autoridade sólida',
      transformation: partial?.transformation || 'De perfil estagnado para canal estruturado de vendas e autoridade',
      offer: partial?.offer || 'Serviço Principal / Mentoria / Atendimento',
      positioning: partial?.positioning || intel?.positioning?.promise || 'Especialista focado em resultados tangíveis sem enrolação',
      unique_value_proposition: partial?.unique_value_proposition || intel?.positioning?.differentiation || 'Método direto e prático para transformar atenção em faturamento',
      differentiator: partial?.differentiator || intel?.positioning?.differentiation || 'Abordagem prática baseada em dados e diagnóstico de gargalos reais',
      authority: partial?.authority || 'Experiência prática de campo e método testado',
      personality: partial?.personality || 'Direto, analítico, seguro e acolhedor',
      tone_of_voice: partial?.tone_of_voice || intel?.voiceGuidance?.recommendedVoice || 'Profissional, direto, inspirador e sem jargões desnecessários',
      content_style: partial?.content_style || 'Carrosséis analíticos e Reels com quebra de padrão rápida',
      primary_goal: partial?.primary_goal || 'vendas',
      secondary_goal: partial?.secondary_goal || 'autoridade',
      content_pillars: partial?.content_pillars || dynamicPillars || [
        {
          id: 'pillar_1',
          name: 'Diagnóstico & Desconstrução de Erros',
          objective: 'Descoberta e Quebra de Objeção',
          target_audience: 'Pessoas com gargalos não percebidos',
          pain_or_problem: 'Cometer erros que travam as vendas sem saber',
          desire: 'Descobrir o que corrigir imediatamente',
          content_type: 'Carrossel / Reel',
          formats: ['reel', 'carousel'],
          example_topics: ['3 erros silenciosos que matam sua conversão', 'Por que postar todo dia não está funcionando'],
          angles: ['contradição', 'erro', 'diagnóstico']
        },
        {
          id: 'pillar_2',
          name: 'Método & Bastidor de Execução',
          objective: 'Autoridade e Prova de Competência',
          target_audience: 'Público morno que busca confirmação de expertise',
          pain_or_problem: 'Sensação de que o criador não domina o que fala',
          desire: 'Ver a aplicação prática em casos reais',
          content_type: 'Reel Demonstrativo / Carrossel Tutorial',
          formats: ['reel', 'carousel', 'stories'],
          example_topics: ['Como aplico este processo passo a passo', 'Nos bastidores de uma entrega real'],
          angles: ['demonstração', 'estudo de caso', 'bastidor']
        },
        {
          id: 'pillar_3',
          name: 'Solução Direta & Conversão',
          objective: 'Geração de Leads e Vendas',
          target_audience: 'Público pronto para dar o próximo passo',
          pain_or_problem: 'Não saber exatamente como contratar ou comprar',
          desire: 'Ter acesso à solução completa guiada',
          content_type: 'Stories / Reel com CTA para Direct',
          formats: ['stories', 'reel'],
          example_topics: ['Como funciona nosso acompanhamento', 'Vagas abertas para o próximo ciclo'],
          angles: ['transformação', 'objeção', 'desejo']
        }
      ],
      preferred_formats: partial?.preferred_formats || ['reel', 'carousel', 'stories'],
      brand_keywords: partial?.brand_keywords || ['Clareza', 'Execução', 'Conversão', 'Autoridade'],
      forbidden_topics: partial?.forbidden_topics || ['Dicas rasas de motivação', 'Métricas de vaidade sem foco em vendas'],
      competitors: partial?.competitors || ['Perfis genéricos de conteúdo raso'],
      strategic_opportunities: partial?.strategic_opportunities || ['Explorar o microsegmento com posicionamento cirúrgico'],
      weaknesses: partial?.weaknesses || ['Ganchos iniciais fracos', 'Falta de CTA clara'],
      strengths: partial?.strengths || ['Domínio técnico comprovado'],
      content_distribution: partial?.content_distribution || {
        autoridade: 40,
        descoberta: 25,
        prova: 15,
        relacionamento: 10,
        conversao: 10
      },
      content_dna: {
        distribution: {
          authority: 40,
          discovery: 25,
          conversion: 15,
          connection: 20
        },
        consultative_rationale: 'Perfis de autoridade e serviços devem concentrar 40% em autoridade para validar o ticket e 25% em descoberta para atrair público qualificado constante.'
      },
      clarity_score: partial?.clarity_score || 68,
      last_updated: new Date().toISOString(),
      ...partial
    };
  }
}
