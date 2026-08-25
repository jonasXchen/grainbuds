"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type LoyaltyContextValue = {
  enabled: boolean;
  user: User | null;
  loading: boolean;
  stamps: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const LoyaltyContext = createContext<LoyaltyContextValue | null>(null);

export function LoyaltyProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => (enabled ? createClient() : null), [enabled]);
  const [user, setUser] = useState<User | null>(null);
  const [stamps, setStamps] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [isOpen, setIsOpen] = useState(false);

  const loadSummary = useCallback(
    async (nextUser: User | null) => {
      setUser(nextUser);
      if (!supabase || !nextUser) {
        setStamps(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc("grainbuds_my_loyalty_summary");
      if (!error && data && typeof data === "object") {
        const summary = data as { stamps?: number | string };
        setStamps(Math.max(0, Number(summary.stamps) || 0));
      }
      setLoading(false);
    },
    [supabase]
  );

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();
    await loadSummary(nextUser);
  }, [loadSummary, supabase]);

  useEffect(() => {
    if (!supabase) return;
    const refreshTimer = window.setTimeout(() => void refresh(), 0);
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Supabase advises keeping the auth callback synchronous. Defer the
      // summary query until its internal auth lock has been released.
      window.setTimeout(() => void loadSummary(session?.user ?? null), 0);
    });
    return () => {
      window.clearTimeout(refreshTimer);
      data.subscription.unsubscribe();
    };
  }, [loadSummary, refresh, supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setStamps(0);
    setIsOpen(false);
  }, [supabase]);

  return (
    <LoyaltyContext.Provider
      value={{
        enabled,
        user,
        loading,
        stamps,
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        refresh,
        signOut,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (!context) throw new Error("useLoyalty must be used inside LoyaltyProvider");
  return context;
}
