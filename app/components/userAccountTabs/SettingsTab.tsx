"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function SettingsTab() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || !API_URL) return;

    fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setUser)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Configurações</h2>
      {user ? (
        <ul className="list-disc pl-5">
          <li>Idioma: Português (padrão)</li>
          <li>Notificações: Ativadas</li>
          <li>Modo escuro: {user.dark_mode ? "Ativo" : "Desativado"}</li>
        </ul>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
}
