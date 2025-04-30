"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function ContactTab() {
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
      <h2 className="text-xl font-semibold mb-4">Contato</h2>
      <p>📬 Se precisar de ajuda, entre em contato com nossa equipe de suporte.</p>
      <ul className="list-disc pl-5 mt-3">
        <li>Email cadastrado: {user?.email}</li>
        <li>WhatsApp: (11) 99999-9999</li>
        <li>Suporte: suporte@empresa.com</li>
        <li>Horário de atendimento: Seg a Sex, 9h às 18h</li>
      </ul>
    </div>
  );
}
