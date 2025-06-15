
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  created_at: string;
};

export function useUser() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up auth change listener, then fetch session & profile
  useEffect(() => {
    // Fix: Correct destructuring Supabase's auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setProfile(null); // Profile will refresh
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => { subscription.unsubscribe(); };
    // eslint-disable-next-line
  }, []);

  const fetchProfile = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) setProfile(data as Profile);
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return { user, profile, session, loading, logout };
}
