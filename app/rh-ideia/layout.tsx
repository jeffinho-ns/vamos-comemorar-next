"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken") || localStorage.getItem("token") || null;
}

export default function RhIdeiaStaffLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}
