"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

type WithPermissionProps = {
  children: ReactNode;
  allowedRoles: string[];
  allowedEmails?: string[];
};

export function WithPermission({ children, allowedRoles, allowedEmails }: WithPermissionProps) {
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

    let userEmail = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userEmail="))
      ?.split("=")[1];
    if (!userEmail && typeof window !== "undefined") {
      userEmail = localStorage.getItem("userEmail") || "";
    }
    const emailDecoded = userEmail ? (() => { try { return decodeURIComponent(userEmail); } catch { return userEmail; } })() : "";
    const emailNormalized = emailDecoded.trim().toLowerCase();

    const roleNorm = (roleDecoded || '').toLowerCase().trim();
    const roleAllowed = !!roleNorm && allowedRoles.some((r) => (r || '').toLowerCase().trim() === roleNorm);
    const emailAllowed =
      !!emailNormalized &&
      Array.isArray(allowedEmails) &&
      allowedEmails.map((e) => String(e).trim().toLowerCase()).includes(emailNormalized);

    if (roleAllowed || emailAllowed) {
      setIsAuthorized(true);
    } else {
      router.replace("/acesso-negado");
    }

    setChecked(true);
  }, [router, allowedRoles, allowedEmails]);

  if (!checked) return null; // Ou um loading se quiser

  return isAuthorized ? <>{children}</> : null;
}
