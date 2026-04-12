import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type SubscriptionStatus = "loading" | "grace_period" | "trialing" | "active" | "canceled" | "past_due" | "expired" | "none";

type SubscriptionContextType = {
  status: SubscriptionStatus;
  planType: string | null;
  gracePeriodEndsAt: Date | null;
  trialEndsAt: Date | null;
  isAccessAllowed: boolean;
  canEdit: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  checkout: (plan: "mensile" | "annuale") => Promise<void>;
};

const PRICES = {
  mensile: "price_1TKN0dLh7Ovc8cezbBgKd2CV",
  annuale: "price_1TKN0eLh7Ovc8cezyshTMSbs",
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>("loading");
  const [planType, setPlanType] = useState<string | null>(null);
  const [gracePeriodEndsAt, setGracePeriodEndsAt] = useState<Date | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus("none");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setStatus(data.status as SubscriptionStatus);
      setPlanType(data.plan_type || null);
      setGracePeriodEndsAt(data.grace_period_ends_at ? new Date(data.grace_period_ends_at) : null);
      setTrialEndsAt(data.trial_ends_at ? new Date(data.trial_ends_at) : null);
    } catch (err) {
      console.error("Subscription check failed:", err);
      setStatus("none");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const checkout = useCallback(async (plan: "mensile" | "annuale") => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId: PRICES[plan], planType: plan },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, []);

  useEffect(() => {
    if (user) {
      refresh();
      // Auto-refresh every 60s
      const interval = setInterval(refresh, 60_000);
      return () => clearInterval(interval);
    } else {
      setStatus("none");
      setIsLoading(false);
    }
  }, [user, refresh]);

  const now = new Date();
  const isAccessAllowed =
    status === "active" ||
    status === "trialing" ||
    status === "loading" ||
    (status === "grace_period" && gracePeriodEndsAt ? now < gracePeriodEndsAt : false);

  return (
    <SubscriptionContext.Provider value={{ status, planType, gracePeriodEndsAt, trialEndsAt, isAccessAllowed, isLoading, refresh, checkout }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
