"use client";

import React from "react";
import { FiSettings, FiLogOut, FiLock, FiHelpCircle } from "react-icons/fi";
import { FaClipboardList } from "react-icons/fa";

import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";

import "./profile.module.scss";

export default function PerfilMobile() {
  return (
    <>
      <Header />
      <div className="profile-container-mobile">
      
      <div className="flex flex-col items-center bg-white h-auto py-8 overflow-hidden">
      <h6 className="text-base font-semibold self-start mt-4 pl-4">Perfil</h6>
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-2">
            <span className="text-gray-500">Adicionar foto</span>
          </div>
          <h2 className="text-xl font-semibold">Jefferson Lima</h2>
          <p className="text-gray-400">ID : 0000001</p>
        </div>

        <div className="w-full max-w-sm flex-grow flex flex-col">
        <button className="w-2/3 bg-teal-500 text-white py-5 rounded-full mb-4 flex items-center justify-center mx-auto"><svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M0.837402 5.51184C0.837402 2.48122 3.29421 0.0244141 6.32483 0.0244141H19.0325C22.0632 0.0244141 24.52 2.48122 24.52 5.51184V11.8657C24.52 14.8963 22.0632 17.3531 19.0325 17.3531H14.7192L7.39674 23.3026C6.24872 24.2354 4.60733 23.044 5.13832 21.6635L6.79614 17.3531H6.32483C3.29421 17.3531 0.837402 14.8963 0.837402 11.8657V5.51184ZM6.32483 1.75728C4.25124 1.75728 2.57027 3.43826 2.57027 5.51184V11.8657C2.57027 13.9393 4.25124 15.6202 6.32483 15.6202H7.21666C8.23007 15.6202 8.92826 16.6368 8.56447 17.5827L7.1444 21.2749L13.706 15.9436C13.9634 15.7344 14.285 15.6202 14.6166 15.6202H19.0325C21.1061 15.6202 22.7871 13.9393 22.7871 11.8657V5.51184C22.7871 3.43826 21.1061 1.75728 19.0325 1.75728H6.32483Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M6.61368 11.1244C6.61368 10.6459 7.00159 10.2579 7.48011 10.2579H17.8773C18.3559 10.2579 18.7438 10.6459 18.7438 11.1244C18.7438 11.6029 18.3559 11.9908 17.8773 11.9908H7.48011C7.00159 11.9908 6.61368 11.6029 6.61368 11.1244Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M6.61368 7.24436C6.61368 6.76585 7.00159 6.37793 7.48011 6.37793H12.6787C13.1572 6.37793 13.5452 6.76585 13.5452 7.24436C13.5452 7.72288 13.1572 8.1108 12.6787 8.1108H7.48011C7.00159 8.1108 6.61368 7.72288 6.61368 7.24436Z" fill="white"/>
</svg>

         
          </button>

          <button className="w-full flex items-center py-4 border-b border-gray-200">
            <FiSettings className="text-teal-500 text-xl mr-4" />
            <span className="text-lg">Minhas Reservas</span>
            <span className="ml-auto text-gray-400">{">"}</span>
          </button>

          <button className="w-full flex items-center py-4 border-b border-gray-200">
            <FiSettings className="text-teal-500 text-xl mr-4" />
            <span className="text-lg">Configurações</span>
            <span className="ml-auto text-gray-400">{">"}</span>
          </button>

          <button className="w-full flex items-center py-4 border-b border-gray-200">
            <FiLock className="text-teal-500 text-xl mr-4" />
            <span className="text-lg">Trocar senha</span>
            <span className="ml-auto text-gray-400">{">"}</span>
          </button>

          <button className="w-full flex items-center py-4 border-b border-gray-200">
            <FiHelpCircle className="text-teal-500 text-xl mr-4" />
            <span className="text-lg">Ajuda e suporte</span>
            <span className="ml-auto text-gray-400">{">"}</span>
          </button>

          <button className="w-full flex items-center py-4 mt-4">
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