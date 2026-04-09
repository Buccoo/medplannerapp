import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type SubscriptionStatus = "loading" | "grace_period" | "trialing" | "active" | "canceled" | "past_due" | "expired" | "none";

type SubscriptionContextType = {
  status: SubscriptionStatus;
  planType: string | null;
  gracePeriodEndsAt: Date | null;
  trialEndsAt: Date | null;
  isAccessAllowed: boolean;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>("loading");
  const [planType, setPlanType] = useState<string | null>(null);
  const [gracePeriodEndsAt, setGracePeriodEndsAt] = useState<Date | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  const refresh = async () => {
    if (!user) { setStatus("none"); return; }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      // No subscription record — create grace period
      const graceEnd = new Date();
      graceEnd.setHours(graceEnd.getHours() + 24);

      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        status: "grace_period",
        grace_period_ends_at: graceEnd.toISOString(),
      }, { onConflict: "user_id" });

      setStatus("grace_period");
      setGracePeriodEndsAt(graceEnd);
      return;
    }

    setStatus(data.status as SubscriptionStatus);
    setPlanType(data.plan_type);
    setGracePeriodEndsAt(data.grace_period_ends_at ? new Date(data.grace_period_ends_at) : null);
    setTrialEndsAt(data.trial_ends_at ? new Date(data.trial_ends_at) : null);
  };

  useEffect(() => {
    if (user) refresh();
    else setStatus("none");
  }, [user]);

  const now = new Date();
  const isAccessAllowed =
    status === "active" ||
    status === "trialing" ||
    status === "loading" ||
    (status === "grace_period" && gracePeriodEndsAt ? now < gracePeriodEndsAt : false);

  return (
    <SubscriptionContext.Provider value={{ status, planType, gracePeriodEndsAt, trialEndsAt, isAccessAllowed, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
