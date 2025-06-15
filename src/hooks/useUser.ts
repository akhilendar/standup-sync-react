
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

/** Profile fields from Supabase (matches DB) */
export type Profile = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatar_url: string | null;
  created_at: string;
};

export function useUser() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setProfile(null);
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

  /** Update profile (name and/or avatar) */
  const updateProfile = async ({ name, avatar_url }: { name?: string; avatar_url?: string }) => {
    if (!user) return;
    setLoading(true);
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    const { error, data } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .maybeSingle();
    if (!error && data) setProfile(data as Profile);
    setLoading(false);
    return { error };
  };

  /** Upload avatar to the avatars bucket and return public URL */
  const uploadAvatar = async (file: File) => {
    if (!user) return { error: "Not logged in" };
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600"
    });
    if (error) return { error: error.message };

    // Get public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data?.publicUrl || null;
    return { publicUrl };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return { user, profile, session, loading, logout, updateProfile, uploadAvatar, fetchProfile };
}
