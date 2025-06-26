import React, { createContext, useContext, useState } from "react";

type Admin = { email: string };
type Credentials = { email: string; password: string };

const ADMIN_CREDENTIALS: Credentials[] = [
  { email: "akhil", password: "admin123" },
  { email: "abhinav", password: "admin" },
  { email: "sowmya", password: "admin123" },
];

type AdminAuthContextType = {
  admin: Admin | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const stored = localStorage.getItem("admin");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email: string, password: string) => {
    const found = ADMIN_CREDENTIALS.find((c) => c.email === email && c.password === password);
    if (found) {
      setAdmin({ email });
      localStorage.setItem("admin", JSON.stringify({ email }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("admin");
  };

  return <AdminAuthContext.Provider value={{ admin, login, logout }}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};
