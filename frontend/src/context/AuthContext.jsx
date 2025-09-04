"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const AuthContext = createContext(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? window.localStorage.getItem("tc_token") : null;
    const storedUser = typeof window !== "undefined" ? window.localStorage.getItem("tc_user") : null;
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
  }, []);

  const persist = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("tc_token", nextToken);
      window.localStorage.setItem("tc_user", JSON.stringify(nextUser));
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      toast.error(msg?.message || "Login failed");
      throw new Error("Login failed");
    }
    const data = await res.json();
    persist(data.token, data.user);
    toast.success("Logged in");
  }, [persist]);

  const signup = useCallback(async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const msg = await res.json().catch(() => ({}));
      toast.error(msg?.message || "Signup failed");
      throw new Error("Signup failed");
    }
    const data = await res.json();
    persist(data.token, data.user);
    toast.success("Account created");
  }, [persist]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("tc_token");
      window.localStorage.removeItem("tc_user");
    }
  }, []);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr.includes(user.role);
  }, [user]);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    hasRole,
    login,
    signup,
    logout,
  }), [user, token, hasRole, login, signup, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}



