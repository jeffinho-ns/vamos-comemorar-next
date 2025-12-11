import React from "react";

import Image from "next/image";
import SafeImage from "../components/SafeImage";
import Header from "../components/header/header"
import Footer from "../components/footer/footer"

import Image1 from "../assets/quemsomos/quemsomos.png"
import Image2 from "../assets/quemsomos/02.png"
import Image3 from "../assets/quemsomos/03.png"
import Image4 from "../assets/quemsomos/04.png"


export default function About() {
  return (
    <div>
      {/* Banner */}
      <section className="relative h-[600px]"><div className="texto">QUEM SOMOS</div>
        <SafeImage
          src={Image1} 
          alt="Banner Quem Somos" 
          fill
          sizes="100vw"
          className="w-full h-auto object-cover" 
          priority
        />
      </section>

      {/* Introdução */}
      <section className="relative bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna de Texto */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold mb-4">
                Para muito além
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                de facilitar sua reserva, a <span className="text-orange-600 font-bold">Agilizaiapp</span> ainda oferece os melhores locais da cidade para que sua celebração seja inesquecível, tudo de forma rápida e prática!
              </p>
              <p className="text-lg text-gray-700 mb-10">
                Bem-vindo à Agilizaiapp! Fique à vontade, a casa (e a comemoração) é sua!
              </p>
            </div>

            {/* Coluna de Imagens */}
            <div className="flex justify-center">
              <div className="relative w-[280px] h-[280px] mx-2">
                <SafeImage src={Image2} alt="Descrição da imagem 2" fill sizes="280px" className="rounded-lg shadow-lg object-cover" />
              </div>
              <div className="relative w-[280px] h-[280px] mx-2">
                <SafeImage src={Image3} alt="Descrição da imagem 3" fill sizes="280px" className="rounded-lg shadow-lg object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios para o Estabelecimento */}
      <section className="bg-purple-900 py-16 text-white">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-8">benefícios para o estabelecimento</h2>
            <ul className="space-y-6 text-lg">
              <li>Serviços de captação de clientes com o objetivo de promover o local e aumentar o número de clientes.</li>
              <li>Suporte 24 horas da Agilizaiapp para o cliente final, facilitando o serviço de concierge do próprio bar.</li>
              <li>Diminuição de custos com marketing e ativações.</li>
              <li>Qualidade no atendimento ao cliente final.</li>
            </ul>
          </div>
          <div className="relative w-full h-[400px] bg-gray-200"></div>
        </div>
      </section>

      {/* Requisitos para Parcerias */}
      <section className="bg-blue-900 py-16 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">O que eu preciso para meu bar estar na <span className="text-orange-500">Agilizaiapp?</span></h2>
          <p className="text-lg mb-8">
            Entrar em contato pelo nosso email <a href="mailto:contato@vamoscomemorar.com.br" className="text-orange-400 underline">contato@agilizaiapp.com.br</a>, onde vamos pedir os dados e fazer o cadastro do bar e de um responsável para acessar o sistema.
          </p>
          <p className="text-lg mb-8">
            Após o bar estar cadastrado o bar tem a opção de atualizar semanalmente a agenda inserindo atrações e promoções.
          </p>
          <p className="text-lg">
            Celular, tablet ou computador no estabelecimento para acesso ao sistema e check-in de convidados.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-white py-16 text-center">
        <div className="container mx-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-900">CONHEÇA MAIS SOBRE O PROGRAMA DE PARCEIROS DA VAMOS</h2>
          <p className="mb-8">
            Envie um e-mail para <a href="mailto:contato@vamoscomemorar.com.br" className="text-blue-500">contato@vamoscomemorar.com.br</a> e faça parte desta mudança!
          </p>
          <button className="px-8 py-4 bg-blue-600 text-white rounded-md">SEJA UM PARCEIRO</button>
        </div>
      </section>

      {/* Logos de Parceiros */}
      <footer className="bg-gray-100 py-8 text-center">
        <div className="container mx-auto">
          <h3 className="text-sm text-gray-600 mb-4">Alguns dos nossos parceiros</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Espaços para logos */}
            <div className="w-full h-[80px] bg-gray-200"></div>
            <div className="w-full h-[80px] bg-gray-200"></div>
            <div className="w-full h-[80px] bg-gray-200"></div>
            <div className="w-full h-[80px] bg-gray-200"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
