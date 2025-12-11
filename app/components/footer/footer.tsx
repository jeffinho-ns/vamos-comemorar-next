import React from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";
import { MdLocationOn, MdEmail, MdPhone, MdAccessTime } from "react-icons/md";
import "./style.scss";

// Interface para receber a imagem estática
interface FooterProps {
  logo: StaticImageData;
}

export default function Footer({ logo }: FooterProps) {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Social Media Section */}
      <div className="border-b border-gray-700/50 p-8">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <span className="text-lg font-semibold text-gray-300">
              Siga a gente nas redes sociais!
            </span>
          </div>
          <div className="flex space-x-4">
            <a
              href="#"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FaFacebookF className="text-white text-lg" />
            </a>
            <a
              href="#"
              className="bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 p-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FaTwitter className="text-white text-lg" />
            </a>
            <a
              href="#"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 p-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FaInstagram className="text-white text-lg" />
            </a>
            <a
              href="#"
              className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 p-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FaLinkedin className="text-white text-lg" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <Image
                src={logo}
                alt="Logo Agilizai Footer"
                width={200}
                height={60}
                className="filter"
              />
            </Link>
            <p className="text-gray-300 leading-relaxed">
              A missão da Agilizaí App é facilitar o agendamento de comemorações
              em bares e restaurantes. Nossos usuários encontram os melhores
              locais da cidade e já garantem a reserva online.
            </p>
          </div>

          {/* Sobre Nós */}
          <div className="space-y-6">
            <h6 className="text-xl font-bold text-yellow-400 mb-4">
              Sobre Nós
            </h6>
            <div className="space-y-3">
              <Link
                href="/quem-somos"
                className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
              >
                Quem Somos
              </Link>
              <Link
                href="/nossa-missao"
                className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
              >
                Nossa Missão
              </Link>
              <Link
                href="/faq"
                className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
              >
                FAQ
              </Link>
              <Link
                href="/contato"
                className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
              >
                Contato
              </Link>
            </div>
          </div>

          {/* Suporte */}
          <div className="space-y-6">
            <h6 className="text-xl font-bold text-yellow-400 mb-4">Suporte</h6>
            <div className="space-y-3">
              <Link
                href="/tutoriais"
                className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
              >
                Tutoriais
              </Link>
              <Link
                href="/como-funciona"
                className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
              >
                Como Funciona
              </Link>
              <Link
                href="/termos-de-uso"
                className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
              >
                Termos de Uso
              </Link>
              <Link
                href="/politica-de-privacidade"
                className="block text-gray-300 hover:text-yellow-400 transition-colors duration-200"
              >
                Política de Privacidade
              </Link>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-6">
            <h6 className="text-xl font-bold text-yellow-400 mb-4">Endereço</h6>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-2 rounded-lg mt-1">
                  <MdLocationOn className="text-white text-lg" />
                </div>
                <p className="text-gray-300 leading-relaxed">
                  R. Heitor de Morais, 87 - Pacaembu
                  <br />
                  São Paulo - SP
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg mt-1">
                  <MdEmail className="text-white text-lg" />
                </div>
                <p className="text-gray-300">contato@agilizai.com.br</p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-lg mt-1">
                  <MdPhone className="text-white text-lg" />
                </div>
                <p className="text-gray-300">+ 55 11 9999 9999</p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 rounded-lg mt-1">
                  <MdAccessTime className="text-white text-lg" />
                </div>
                <p className="text-gray-300">
                  Seg - Sex: 9h às 18h
                  <br />
                  Sáb: 9h às 12h
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-gray-800/50 border-t border-gray-700/50 p-6">
        <div className="container mx-auto text-center">
          <span className="text-gray-400">© 2024 Copyright: </span>
          <Link
            className="font-semibold text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
            href="/"
          >
            Agilizaí App
          </Link>
        </div>
      </div>
    </footer>
  );
}
