"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Protected({ children }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

export function RoleGuard({ roles, children }) {
  const { isAuthenticated, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
    else if (!hasRole(roles)) router.replace("/dashboard");
  }, [isAuthenticated, hasRole, roles, router]);

  if (!isAuthenticated || !hasRole(roles)) return null;
  return <>{children}</>;
}



