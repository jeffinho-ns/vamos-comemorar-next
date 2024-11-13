"use client";

import React, { useState, useEffect, useCallback } from "react"; 
import { useRouter } from "next/navigation";
import { FiSettings, FiLogOut, FiLock, FiHelpCircle } from "react-icons/fi";
import Link from "next/link";
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";
import Image from "next/image";
import "./profile.module.scss";

interface User {
  id: string; 
  name: string;
  foto_perfil?: string; 
}

export default function PerfilMobile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL_NETWORK || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  const fetchUserData = useCallback(async (token: string) => {
    setLoading(true);
    try {
      console.log("Token usado:", token); 
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        console.error("Erro ao buscar dados do usuário:", response.statusText);
        router.push('/login');
      }
    } catch (error) {
      console.error("Erro ao fazer a requisição:", error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [API_URL, router]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    console.log("Token recuperado:", token); 

    if (!token) {
      router.push('/login');
      return;  // Impede que a página continue sendo renderizada sem o token
    } else {
      fetchUserData(token);
    }
  }, [fetchUserData, router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/bares');
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Header />
      <div className="profile-container-mobile">
        <div className="flex flex-col items-center bg-white min-h-screen py-8 overflow-hidden">
          <h6 className="text-base font-semibold self-start mt-4 pl-4">Perfil</h6>
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-2">
              {user.foto_perfil ? (
                <Image
                src={user.foto_perfil.startsWith("http") 
                  ? user.foto_perfil 
                  : `${API_URL}/uploads/${user.foto_perfil}`}
                width="64"
                height="64"
                alt="Foto de perfil"
                className="rounded-full w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500">Adicionar foto</span>
            )}
            </div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-400">ID : {user.id}</p>
          </div>

          <div className="w-full max-w-sm flex-grow flex flex-col">
            <button className="w-2/3 bg-teal-500 text-white py-5 rounded-full mb-4 flex items-center justify-center mx-auto">
              <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Aqui você pode adicionar um ícone SVG, se desejar */}
              </svg>
            </button>

            <Link href="/webapp/minhasReservas" className="w-full flex items-center py-4 border-b border-gray-200">
              <FiSettings className="text-teal-500 text-xl mr-4" />
              <span className="text-lg">Minhas Reservas</span>
              <span className="ml-auto text-gray-400">{">"}</span>
            </Link>

            <Link href="/webapp/configProfile" className="w-full flex items-center py-4 border-b border-gray-200">
              <FiSettings className="text-teal-500 text-xl mr-4" />
              <span className="text-lg">Configurações</span>
              <span className="ml-auto text-gray-400">{">"}</span>
            </Link>

            <Link href="/trocar-senha" className="w-full flex items-center py-4 border-b border-gray-200">
              <FiLock className="text-teal-500 text-xl mr-4" />
              <span className="text-lg">Trocar senha</span>
              <span className="ml-auto text-gray-400">{">"}</span>
            </Link>

            <Link href="/ajuda" className="w-full flex items-center py-4 border-b border-gray-200">
              <FiHelpCircle className="text-teal-500 text-xl mr-4" />
              <span className="text-lg">Ajuda e suporte</span>
              <span className="ml-auto text-gray-400">{">"}</span>
            </Link>

            <button 
              onClick={handleLogout} 
              className="w-full flex items-center py-4 mt-4"
            >
              <FiLogOut className="text-teal-500 text-xl mr-4" />
              <span className="text-lg">Sair</span>
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
