import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AppRole = "customer" | "vendor" | "partner" | "admin";
export type Profile = { name: string; role: AppRole; email: string | null };
type AuthContextValue = { user: User | null; session: Session | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async (nextSession: Session | null) => {
      setSession(nextSession);
      if (!nextSession) { setProfile(null); setLoading(false); return; }
      const { data } = await supabase.from("users").select("name, role, email").eq("auth_id", nextSession.user.id).maybeSingle();
      setProfile(data ? { name: data.name ?? "User", role: data.role as AppRole, email: data.email } : null);
      setLoading(false);
    };
    void supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { void loadProfile(nextSession); });
    return () => listener.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user: session?.user ?? null, session, profile, loading, signOut: async () => { await supabase.auth.signOut(); } }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
