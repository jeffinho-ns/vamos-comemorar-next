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

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("authToken");
      if (!token || !API_URL) return;

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
        }
      } catch (err) {
        console.error("Erro ao buscar usuário:", err);
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
    router.push(`/admin/ContaUsuarioPage?aba=${aba}`);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
      >
        {user?.foto_perfil ? (
          <Image
            src={`${API_URL}/uploads/${user.foto_perfil}`}
            alt="Avatar"
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
        )}

        <div className="hidden sm:flex flex-col items-start text-left">
          <span className="text-sm font-semibold text-gray-800">
            {user?.name || "Usuário"}
          </span>
          <span className="text-xs text-gray-500">{user?.empresa || "Empresa"}</span>
        </div>

        <MdArrowDropDown className="text-gray-500" />
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
