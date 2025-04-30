"use client";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

export default function ProfileTab() {
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
      <h2 className="text-xl font-semibold mb-4">Meus Dados</h2>
      {user ? (
        <ul className="list-disc pl-5">
          <li>Nome: {user.name}</li>
          <li>Telefone: {user.telefone || "Não informado"}</li>
          <li>Endereço: {user.endereco || "Não informado"}</li>
          <li>Foto de perfil:
            {user.foto_perfil ? (
              <img
                src={`${API_URL}/uploads/${user.foto_perfil}`}
                alt="Foto de perfil"
                className="w-24 h-24 mt-2 rounded-full object-cover border"
              />
            ) : (
              " Não enviada"
            )}
          </li>
        </ul>
      ) : (
        <p>Carregando...</p>
      )}
    </div>
  );
}
