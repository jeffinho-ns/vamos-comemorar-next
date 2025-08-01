import React from "react";
import { MdFlag, MdVisibility, MdTrendingUp, MdPeople, MdStar, MdRocket } from "react-icons/md";

export default function NossaMissao() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nossa Missão</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Transformar a forma como as pessoas celebram momentos especiais, 
            conectando sonhos a experiências inesquecíveis
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Missão Principal */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
                              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MdFlag className="text-white text-4xl" />
                </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Nossa Missão</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Facilitar e democratizar o acesso aos melhores estabelecimentos da cidade, 
                proporcionando experiências únicas e memoráveis para cada comemoração.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">O que fazemos</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Conectamos usuários aos melhores bares e restaurantes</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Simplificamos o processo de reservas online</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Garantimos transparência e confiabilidade</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Oferecemos suporte excepcional 24/7</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Como fazemos</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Tecnologia inovadora e intuitiva</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Parcerias estratégicas com estabelecimentos</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Análise contínua de feedback dos usuários</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Melhoria constante da experiência</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Visão */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MdVisibility className="text-white text-4xl" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Nossa Visão</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Ser a plataforma líder em agendamento de comemorações, reconhecida pela 
                excelência, inovação e compromisso com a satisfação total dos usuários.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Objetivos para 2025</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
                  <p className="text-gray-600">Estabelecimentos parceiros</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">50.000+</div>
                  <p className="text-gray-600">Reservas realizadas</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
                  <p className="text-gray-600">Satisfação dos usuários</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Valores */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Nossos Valores Fundamentais</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdPeople className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Foco no Cliente</h3>
              <p className="text-gray-600">
                Colocamos nossos usuários em primeiro lugar, sempre buscando 
                superar suas expectativas e necessidades.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdStar className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Excelência</h3>
              <p className="text-gray-600">
                Buscamos a perfeição em todos os aspectos do nosso serviço, 
                desde a tecnologia até o atendimento.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdRocket className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Inovação</h3>
              <p className="text-gray-600">
                Estamos sempre à frente, desenvolvendo soluções criativas 
                e tecnologias que revolucionam o mercado.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-red-500 to-red-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdTrendingUp className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Crescimento Sustentável</h3>
              <p className="text-gray-600">
                Crescemos de forma responsável, beneficiando todos os 
                stakeholders da nossa comunidade.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdPeople className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Transparência</h3>
              <p className="text-gray-600">
                Mantemos comunicação clara e honesta com nossos usuários, 
                parceiros e colaboradores.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <MdStar className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Paixão</h3>
              <p className="text-gray-600">
                Amamos o que fazemos e essa paixão se reflete em cada 
                interação e experiência que criamos.
              </p>
            </div>
          </div>
        </div>

        {/* Impacto */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Nosso Impacto</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Para os Usuários</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Facilidade e conveniência no agendamento</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Acesso aos melhores estabelecimentos</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Experiências memoráveis e únicas</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-yellow-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Suporte dedicado e personalizado</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-800">Para os Estabelecimentos</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Aumento na visibilidade e alcance</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Gestão eficiente de reservas</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Crescimento sustentável do negócio</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Parceria estratégica de longo prazo</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 