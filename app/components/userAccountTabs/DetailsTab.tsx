"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function DetailsTab() {
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
      <h2 className="text-xl font-semibold mb-4">Detalhes da Conta</h2>
      {user ? (
        <ul className="list-disc pl-5">
          <li>Nome: {user.name}</li>
          <li>Email: {user.email}</li>
          <li>Data de criação: {new Date(user.created_at).toLocaleDateString()}</li>
          <li>Status: {user.ativo ? "Ativo" : "Inativo"}</li>
        </ul>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
}
