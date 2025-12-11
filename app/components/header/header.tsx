"use client";

import { useState, useEffect } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { MdPerson, MdMenu, MdClose } from "react-icons/md";
// REMOVIDO: import logoWhite from "@/app/assets/logo-agilizai-h.png"; // ✅ A imagem agora virá via prop
import "./styles.scss";

// ✅ ADICIONADO: Defina a interface para receber a imagem estática
interface HeaderProps {
  logo: StaticImageData;
}

// ✅ MODIFICADO: O componente agora aceita a prop 'logo'
const Header: React.FC<HeaderProps> = ({ logo }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, []);

  const handleMouseEnter = () => {
    if (dropdownTimeout) clearTimeout(dropdownTimeout);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);

    setDropdownTimeout(timeout);
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="px-8 py-4 container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href="/"
            className="transition-transform duration-200 hover:scale-105"
          >
            <Image
              src={logo} // Usando a logo passada como prop
              alt="Logo Agilizai"
              width={160}
              height={60}
              className="w-32 md:w-40"
              priority // Essencial para carregamento imediato (acima da dobra)
            />
          </Link>
          <div className="hidden md:flex items-center ml-10 space-x-8">
            <Link
              href="/quem-somos"
              className="text-white/90 hover:text-yellow-400 transition-colors duration-200 font-medium"
            >
              Quem somos
            </Link>
            <Link
              href="/parceiros"
              className="text-white/90 hover:text-yellow-400 transition-colors duration-200 font-medium"
            >
              Seja parceiro
            </Link>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          {isLoggedIn ? (
            <>
              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg">
                  <MdPerson className="text-white text-xl" />
                </div>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/20 overflow-hidden">
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-yellow-100 transition-all duration-200"
                      >
                        <MdPerson className="mr-3 text-yellow-600" />
                        Página do usuário
                      </Link>
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200"
                      >
                        <svg
                          className="w-5 h-5 mr-3 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Dashboard
                      </Link>
                      <Link
                        href="/minhas-reservas"
                        className="flex items-center px-4 py-3 text-gray-800 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all duration-200"
                      >
                        <svg
                          className="w-5 h-5 mr-3 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Minhas reservas
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-white/90 hover:text-yellow-400 transition-colors duration-200 font-medium"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 px-6 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Registrar
              </Link>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <a
              href="#"
              className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FaFacebookF className="text-white text-lg" />
            </a>
            <a
              href="#"
              className="bg-gradient-to-r from-pink-600 to-purple-600 p-3 rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FaInstagram className="text-white text-lg" />
            </a>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center space-x-4">
          {isLoggedIn ? (
            <div
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl cursor-pointer">
                <MdPerson className="text-white text-xl" />
              </div>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200/20">
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="block px-4 py-3 text-gray-800 hover:bg-yellow-50 transition-colors"
                    >
                      Página do usuário
                    </Link>
                    <Link
                      href="/admin"
                      className="block px-4 py-3 text-gray-800 hover:bg-blue-50 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/minhas-reservas"
                      className="block px-4 py-3 text-gray-800 hover:bg-green-50 transition-colors"
                    >
                      Minhas reservas
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl"
            >
              <MdPerson className="text-white text-xl" />
            </Link>
          )}

          <button
            className="text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => setIsNavOpen(!isNavOpen)}
          >
            {isNavOpen ? (
              <MdClose className="text-2xl" />
            ) : (
              <MdMenu className="text-2xl" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isNavOpen && (
        <div className="md:hidden bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-sm border-t border-gray-700/50">
          <div className="px-8 py-6 space-y-4">
            <Link
              href="/quem-somos"
              className="block text-white/90 hover:text-yellow-400 transition-colors py-2"
              onClick={() => setIsNavOpen(false)}
            >
              Quem somos
            </Link>
            <Link
              href="/parceiros"
              className="block text-white/90 hover:text-yellow-400 transition-colors py-2"
              onClick={() => setIsNavOpen(false)}
            >
              Seja parceiro
            </Link>
            {!isLoggedIn && (
              <div className="pt-4 border-t border-gray-700/50">
                <Link
                  href="/register"
                  className="block bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 px-6 py-3 rounded-xl font-semibold text-center"
                  onClick={() => setIsNavOpen(false)}
                >
                  Registrar
                </Link>
              </div>
            )}
            <div className="flex justify-center space-x-4 pt-4">
              <a
                href="#"
                className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-xl"
              >
                <FaFacebookF className="text-white" />
              </a>
              <a
                href="#"
                className="bg-gradient-to-r from-pink-600 to-purple-600 p-3 rounded-xl"
              >
                <FaInstagram className="text-white" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
