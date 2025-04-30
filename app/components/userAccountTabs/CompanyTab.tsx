"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function CompanyTab() {
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
      <h2 className="text-xl font-semibold mb-4">Dados da Empresa</h2>
      {user ? (
        <ul className="list-disc pl-5">
          <li>Empresa: {user.empresa}</li>
          <li>CNPJ: {user.cnpj || "Não informado"}</li>
          <li>Endereço: {user.endereco_empresa || "Não informado"}</li>
        </ul>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
}
