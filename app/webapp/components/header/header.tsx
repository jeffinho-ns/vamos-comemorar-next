"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdNotifications, MdMenu } from "react-icons/md";
import "./styles.scss";

const Header: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
    const homeContainer = document.getElementById("home-container");
    const barraHeader = document.querySelector(".barra-header");

    if (isNavOpen) {
      homeContainer.classList.add("reduce-scale");
      barraHeader.classList.add("reduce-scale");
    } else {
      homeContainer.classList.remove("reduce-scale");
      barraHeader.classList.remove("reduce-scale");
    }
  }, [isNavOpen]);

  return (
    <header
      className={`fixed w-full z-10 transition-all ${
        isScrolled ? "bg-blue-800" : "bg-transparent"
      } mobile-only`}
    >
      <div className="barra-header">
        <div className="px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <MdMenu
              className="text-gray-600 text-3xl cursor-pointer"
              onClick={() => setIsNavOpen((prev) => !prev)}
            />
          </div>
          <div className="flex items-center">
            <MdNotifications
              className="text-gray-600 text-3xl cursor-pointer"
              onClick={() => router.push("/notifications")}
            />
          </div>
        </div>
      </div>

      <nav className={isNavOpen ? "showMenuNav" : "hideMenuNav"}>
        <div
          className="CROSS-ICON absolute top-0 right-0 px-8 py-8"
          onClick={() => setIsNavOpen(false)}
        >
          <svg
            className="icon-menu"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <ul className="MENU-LINK-MOBILE-OPEN flex flex-col items-center justify-between">
          <li className="border-b border-gray-400 my-4 uppercase">
            <Link href="/about">Home</Link>
          </li>
          <li className="border-b border-gray-400 my-4 uppercase">
            <Link href="/quem-somos">Minhas reservas</Link>
          </li>
          <li className="border-b border-gray-400 my-4 uppercase">
            <Link href="/quem-somos">Notificação</Link>
          </li>
          <li className="border-b border-gray-400 my-4 uppercase">
            <Link href="/quem-somos">Perfil</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
