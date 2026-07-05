"use client";

import { useEffect } from "react";
import { ensureAuthSessionFromStorage } from "../utils/authSession";

/** Sincroniza localStorage → cookies no carregamento (PCs antigos / cookie expirado). */
export default function AuthSessionSync() {
  useEffect(() => {
    ensureAuthSessionFromStorage();
  }, []);
  return null;
}
