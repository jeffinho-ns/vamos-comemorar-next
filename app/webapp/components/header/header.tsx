"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdNotifications, MdMenu } from "react-icons/md";
import "./styles.scss";

interface HeaderProps {
  className?: string; // Adicione esta linha para aceitar className
}

const Header: React.FC<HeaderProps> = ({ className }) => {
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
  
    if (homeContainer && barraHeader) { // Verifique se ambos os elementos existem
      if (isNavOpen) {
        homeContainer.classList.add("reduce-scale");
        barraHeader.classList.add("reduce-scale");
      } else {
        homeContainer.classList.remove("reduce-scale");
        barraHeader.classList.remove("reduce-scale");
      }
    }
  }, [isNavOpen]);

  return (
    <header
      className={`fixed w-full mt-4 z-20 transition-all ${
        isScrolled ? "bg-transparent" : "bg-transparent"
      } mobile-only`}
    >
      <div className="barra-header">
        <div className="px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <MdMenu
              className="text-gray-50 text-3xl cursor-pointer"
              onClick={() => setIsNavOpen((prev) => !prev)}
            />
          </div>
          <div className="flex items-center">
            <MdNotifications
              className="text-gray-50 text-3xl cursor-pointer"
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
          <li className=" border-gray-400 my-4 uppercase">
            <Link href="/webapp" className="flex items-center space-x-2"><svg width="21" height="23" viewBox="0 0 21 23" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.3026 21.5412V18.0326C7.3026 17.1371 8.00414 16.411 8.86951 16.411H12.033C12.4486 16.411 12.8472 16.5818 13.141 16.886C13.4349 17.1901 13.6 17.6026 13.6 18.0326V21.5412C13.5974 21.9135 13.7385 22.2716 13.992 22.5359C14.2454 22.8001 14.5904 22.9487 14.9501 22.9487H17.1083C18.1163 22.9514 19.084 22.5389 19.7977 21.8022C20.5114 21.0655 20.9124 20.0652 20.9124 19.022V9.02672C20.9124 8.18404 20.5515 7.38472 19.9269 6.84408L12.5849 0.775519C11.3078 -0.28851 9.47784 -0.254156 8.23882 0.857113L1.06434 6.84408C0.410258 7.36878 0.0193165 8.17048 0 9.02672V19.0118C0 21.1861 1.70313 22.9487 3.80405 22.9487H5.91303C6.66031 22.9487 7.26762 22.3247 7.27303 21.5514L7.3026 21.5412Z" fill="white"/>
</svg><span className="ml-4">Home</span></Link>
          </li>
          <li className=" border-gray-400 my-4 uppercase">
            <Link href="/webapp/minhasReservas" className="flex items-center space-x-2"><svg width="25" height="26" viewBox="0 0 25 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.3014 11.3469C11.551 11.3469 10.9483 11.9716 10.9483 12.7493C10.9483 13.527 11.551 14.1517 12.3014 14.1517C13.0518 14.1517 13.6546 13.527 13.6546 12.7493C13.6546 11.9716 13.0518 11.3469 12.3014 11.3469ZM12.3014 0C5.51104 0 0 5.71168 0 12.7493C0 19.7869 5.51104 25.4986 12.3014 25.4986C19.0918 25.4986 24.6029 19.7869 24.6029 12.7493C24.6029 5.71168 19.0918 0 12.3014 0ZM14.9954 15.5414L4.92057 20.3989L9.60742 9.9572L19.6823 5.09972L14.9954 15.5414Z" fill="white"/>
</svg>
<span className="ml-4">Minhas reservas</span></Link>
          </li>
          <li className=" border-gray-400 my-4 uppercase">
            <Link href="/quem-somos" className="flex items-center space-x-2"><svg width="21" height="26" viewBox="0 0 21 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.8879 21.7822C12.4997 21.8009 13.1004 21.9556 13.6488 22.2355H13.6818C14.1399 22.6229 14.2178 23.3144 13.8579 23.7995C13.2025 24.7715 12.1539 25.3844 11.0075 25.4655C9.82969 25.611 8.64359 25.2731 7.70592 24.5248C7.22369 24.1821 6.9103 23.6401 6.84751 23.0402C6.84751 22.4055 7.41978 22.1109 7.94804 21.9862C8.56676 21.8511 9.19746 21.7828 9.82994 21.7822H11.8879ZM10.5013 0C14.3091 0 18.238 2.85594 18.6452 6.99252C18.7112 7.8425 18.6452 8.72648 18.7112 9.5878C18.9273 10.6985 19.4246 11.7307 20.1529 12.5797C20.6057 13.2775 20.8679 14.0877 20.9123 14.9257V15.1863C20.919 16.317 20.5281 17.412 19.8117 18.269C18.9038 19.2751 17.6718 19.9074 16.3451 20.0482C12.4251 20.5695 8.45635 20.5695 4.5364 20.0482C3.194 19.9181 1.94473 19.2849 1.02571 18.269C0.331803 17.4038 -0.0320737 16.3079 0.00222081 15.1863V14.9257C0.0451683 14.0909 0.299362 13.2821 0.739575 12.5797C1.47107 11.7299 1.97546 10.6989 2.20328 9.5878C2.26931 8.72648 2.20328 7.85384 2.26931 6.99252C2.68751 2.85594 6.53936 0 10.3912 0H10.5013Z" fill="white"/>
</svg>
<span className="ml-4">Notificação</span></Link>
          </li>
          <li className=" border-gray-400 my-4 uppercase">
            <Link href="/webapp/profile" className="flex items-center space-x-2"><svg width="19" height="24" viewBox="0 0 19 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fillRule="evenodd" clipRule="evenodd" d="M14.9907 6.18358C14.9907 9.61604 12.3353 12.3683 9.02105 12.3683C5.70795 12.3683 3.05139 9.61604 3.05139 6.18358C3.05139 2.75111 5.70795 0 9.02105 0C12.3353 0 14.9907 2.75111 14.9907 6.18358ZM9.02105 23.3737C4.12981 23.3737 0 22.5498 0 19.3709C0 16.1909 4.15575 15.3962 9.02105 15.3962C13.9134 15.3962 18.0421 16.2201 18.0421 19.399C18.0421 22.579 13.8863 23.3737 9.02105 23.3737Z" fill="white"/>
</svg>
<span className="ml-4">Perfil</span></Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
