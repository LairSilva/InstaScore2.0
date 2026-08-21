import { useState, useEffect, useCallback } from 'react';
import { auth, ensureAuthUser, getAuthIdToken } from '../lib/firebase';
import { PlanType, EntitlementKey, PLANS, PlanConfig } from '../config/plans';

export interface SubscriptionState {
  userId: string;
  plan: PlanType;
  status: string;
  cycle: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export interface UsageState {
  diagnosesCount: number;
  aiGenerationsCount: number;
  dailyGenerationsCount: number;
}

export function useEntitlements() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [planConfig, setPlanConfig] = useState<PlanConfig>(PLANS.FREE);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>('');

  const fetchStatus = useCallback(async () => {
    try {
      const uid = await ensureAuthUser();
      setUserId(uid);
      const token = await getAuthIdToken().catch(() => null);

      const res = await fetch(`/api/subscription/status?userId=${uid}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-user-id': uid
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSubscription(data.subscription);
          setUsage(data.usage);
          setPlanConfig(data.planConfig);
        }
      }
    } catch (err) {
      console.warn('[useEntitlements] Failed to fetch subscription status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    // Listen to Firebase auth changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchStatus();
      }
    });

    return () => unsubscribe();
  }, [fetchStatus]);

  const openPaywall = useCallback((reason?: string) => {
    if (reason) setPaywallReason(reason);
    setIsPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setPaywallReason('');
  }, []);

  const isPro = subscription?.plan === 'PRO' && subscription?.status === 'active';

  const canAccess = useCallback((entitlement: EntitlementKey): boolean => {
    if (isPro) return true;
    return Boolean(PLANS.FREE.entitlements[entitlement]);
  }, [isPro]);

  return {
    loading,
    userId,
    subscription,
    usage,
    planConfig,
    isPro,
    canAccess,
    isPaywallOpen,
    paywallReason,
    openPaywall,
    closePaywall,
    refreshStatus: fetchStatus
  };
}
