"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

type WithPermissionProps = {
  children: ReactNode;
  allowedRoles: string[];
};

export function WithPermission({ children, allowedRoles }: WithPermissionProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let role = document.cookie
      .split("; ")
      .find((row) => row.startsWith("role="))
      ?.split("=")[1];
    if (!role && typeof window !== "undefined") {
      role = localStorage.getItem("role") || "";
    }
    const roleDecoded = role ? (() => { try { return decodeURIComponent(role); } catch { return role; } })() : "";

    if (roleDecoded && allowedRoles.includes(roleDecoded)) {
      setIsAuthorized(true);
    } else {
      router.replace("/acesso-negado");
    }

    setChecked(true);
  }, [router, allowedRoles]);

  if (!checked) return null; // Ou um loading se quiser

  return isAuthorized ? <>{children}</> : null;
}
