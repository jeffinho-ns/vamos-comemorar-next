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
    const role = document.cookie
      .split("; ")
      .find((row) => row.startsWith("role="))
      ?.split("=")[1];

    if (role && allowedRoles.includes(role)) {
      setIsAuthorized(true);
    } else {
      router.replace("/acesso-negado");
    }

    setChecked(true);
  }, [router, allowedRoles]);

  if (!checked) return null; // Ou um loading se quiser

  return isAuthorized ? <>{children}</> : null;
}
