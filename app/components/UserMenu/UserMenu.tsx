"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  MdLogout,
  MdSettings,
  MdInfo,
  MdBusiness,
  MdPerson,
  MdEmail,
  MdArrowDropDown,
} from "react-icons/md";
import { useRouter } from "next/navigation";

// URL padrão para o caso de não haver foto
const DEFAULT_AVATAR_URL = "https://via.placeholder.com/150";

// Helper para obter a URL correta da imagem de perfil
const getProfileImageUrl = (fotoPerfil?: string | null, fotoPerfilUrl?: string | null): string => {
  // Priorizar foto_perfil_url se existir e for uma URL válida
  if (fotoPerfilUrl && (fotoPerfilUrl.startsWith('http://') || fotoPerfilUrl.startsWith('https://'))) {
    return fotoPerfilUrl;
  }
  
  // Se foto_perfil for uma URL completa (Firebase Storage), usar diretamente
  if (fotoPerfil && (fotoPerfil.startsWith('http://') || fotoPerfil.startsWith('https://'))) {
    return fotoPerfil;
  }
  
  // Se for blob URL (preview temporário), usar diretamente
  if (fotoPerfil && fotoPerfil.startsWith('blob:')) {
    return fotoPerfil;
  }
  
  // Se não for URL completa, retornar placeholder (não usar URLs legadas do FTP)
  return DEFAULT_AVATAR_URL;
};

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("authToken");
      if (!token || !API_URL) {
        setUser(null);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          console.error("Erro ao buscar usuário:", res.status);
          setUser(null);
        }
      } catch (err) {
        console.error("Erro ao buscar usuário:", err);
        setUser(null);
      }
    };

    fetchUser();
  }, [API_URL]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  const handleNavigation = (aba: string) => {
    setUserMenuOpen(false);
    router.push(`/admin/contausuariopage?aba=${aba}`);
  };

  if (!user) {
    return (
      <div className="w-9 h-9 rounded-full bg-gray-400 animate-pulse"></div>
    );
  }

  // Obtém a URL correta da imagem (Firebase Storage ou placeholder)
  const userProfileImageUrl = getProfileImageUrl(user?.foto_perfil, user?.foto_perfil_url);
  const hasImage = userProfileImageUrl !== DEFAULT_AVATAR_URL && (user?.foto_perfil || user?.foto_perfil_url);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
      >
        {hasImage ? (
          <Image
            src={userProfileImageUrl}
            alt="Avatar"
            width={36}
            height={36}
            className="rounded-full object-cover w-9 h-9"
            unoptimized={userProfileImageUrl.startsWith('blob:')}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <MdPerson className="text-white text-xl" />
          </div>
        )}

        <div className="flex flex-col items-start text-left min-w-[100px]">
          <span className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">
            {user?.name || "Usuário"}
          </span>
          <span className="text-xs text-gray-500 truncate max-w-[150px]">
            {user?.empresa || user?.role || "Usuário"}
          </span>
        </div>

        <MdArrowDropDown className="text-gray-500 flex-shrink-0" />
      </button>

      {userMenuOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg py-2 z-50">
          <ul className="text-sm text-gray-700">
            <li
              onClick={() => handleNavigation("settings")}
              className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
            >
              <MdSettings /> Configurações
            </li>
            <li
              onClick={() => handleNavigation("details")}
              className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
            >
              <MdInfo /> Detalhes da conta
            </li>
            <li
              onClick={() => handleNavigation("company")}
              className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
            >
              <MdBusiness /> Dados da empresa
            </li>
            <li
              onClick={() => handleNavigation("profile")}
              className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
            >
              <MdPerson /> Meus dados
            </li>
            <li
              onClick={() => handleNavigation("contact")}
              className="px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
            >
              <MdEmail /> Contato
            </li>
          </ul>
          <div className="border-t my-2"></div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 w-full text-left flex items-center gap-2 text-red-500 hover:bg-gray-100"
          >
            <MdLogout /> Logout
          </button>
        </div>
      )}
    </div>
  );
}