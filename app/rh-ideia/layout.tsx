"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { iriFetch } from "../lib/rhIdeia/api";
import type { IriPlaybookStatus } from "../lib/rhIdeia/types";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken") || localStorage.getItem("token") || null;
}

export default function RhIdeiaStaffLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    if (pathname?.startsWith("/rh-ideia/manual")) return;
    iriFetch<IriPlaybookStatus>("/playbook/status").then((res) => {
      if (res.success && res.data?.blocked) router.replace("/rh-ideia/manual");
    });
  }, [pathname, router]);

  return <>{children}</>;
}
