import React from "react";
import Image from "next/image";
import { MdStar, MdPeople, MdTrendingUp, MdSecurity, MdSupport } from "react-icons/md";
import Header from "../components/header/header";
import Footer from "../components/footer/footer";

export default function QuemSomos() {
  return (
    <>
      <Header />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Quem Somos</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Conheça a equipe por trás do Agilizaí App e nossa jornada para revolucionar 
            o agendamento de comemorações
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Nossa História */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Nossa História</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  O Agilizaí App nasceu da necessidade de simplificar e modernizar o processo 
                  de agendamento de comemorações em bares e restaurantes. Fundada em 2024, 
                  nossa plataforma surgiu da visão de conectar pessoas aos melhores 
                  estabelecimentos da cidade de forma rápida e eficiente.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Começamos como uma pequena startup em São Paulo, com a missão de 
                  transformar a experiência de reservas online. Hoje, somos referência 
                  no setor, conectando milhares de usuários aos estabelecimentos mais 
                  renomados da cidade.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Nossa equipe é composta por profissionais apaixonados por tecnologia 
                  e inovação, sempre buscando oferecer a melhor experiência possível 
                  para nossos usuários e parceiros.
                </p>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-8 rounded-2xl text-white text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">+10.000</h3>
                <p className="text-yellow-100">Reservas realizadas</p>
                <div className="text-6xl mb-4 mt-6">🏪</div>
                <h3 className="text-2xl font-bold mb-2">+50</h3>
                <p className="text-yellow-100">Estabelecimentos parceiros</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nossos Valores */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Nossos Valores</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdPeople className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Inovação</h3>
              <p className="text-gray-600">
                Buscamos constantemente novas formas de melhorar a experiência 
                dos nossos usuários através da tecnologia.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdTrendingUp className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Crescimento</h3>
              <p className="text-gray-600">
                Acreditamos no crescimento sustentável e no desenvolvimento 
                contínuo de nossa plataforma e equipe.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdSecurity className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Confiabilidade</h3>
              <p className="text-gray-600">
                Garantimos a segurança e confiabilidade em todas as transações 
                e interações em nossa plataforma.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdSupport className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Suporte</h3>
              <p className="text-gray-600">
                Oferecemos suporte excepcional aos nossos usuários e parceiros, 
                sempre prontos para ajudar.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-red-500 to-red-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdStar className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Qualidade</h3>
              <p className="text-gray-600">
                Comprometimento com a excelência em todos os aspectos do nosso 
                serviço e atendimento.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdPeople className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Comunidade</h3>
              <p className="text-gray-600">
                Construímos uma comunidade forte, conectando pessoas e 
                estabelecimentos de forma significativa.
              </p>
            </div>
          </div>
        </div>

        {/* Nossa Equipe */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Nossa Equipe</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">RC</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Renato Cury</h3>
                <p className="text-yellow-600 font-semibold mb-2">CEO & Fundador</p>
                <p className="text-gray-600">
                  Visionário e empreendedor, lidera nossa missão de revolucionar 
                  o mercado de reservas online.
                </p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">JL</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Jefferson Lima</h3>
                <p className="text-blue-600 font-semibold mb-2">CTO</p>
                <p className="text-gray-600">
                  Especialista em tecnologia, responsável por desenvolver e 
                  manter nossa plataforma inovadora.
                </p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">LC</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Leo Cury</h3>
                <p className="text-green-600 font-semibold mb-2">Head de Marketing</p>
                <p className="text-gray-600">
                  Estratégia e crescimento, conectando nossa marca aos 
                  usuários e estabelecimentos parceiros.
                </p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">CM</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Caroll Moreira</h3>
                <p className="text-purple-600 font-semibold mb-2">Head de Suporte</p>
                <p className="text-gray-600">
                  Garantindo a melhor experiência para nossos usuários 
                  através de um suporte excepcional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
} 