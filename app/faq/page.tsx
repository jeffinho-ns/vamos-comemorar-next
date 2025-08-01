"use client";

import React, { useState } from "react";
import { MdExpandMore, MdExpandLess, MdHelp, MdSearch } from "react-icons/md";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    question: "Como faço uma reserva no Agilizaí App?",
    answer: "Fazer uma reserva é muito simples! Basta escolher o estabelecimento desejado, selecionar a data e horário, informar o número de pessoas e confirmar sua reserva. O processo todo leva menos de 2 minutos.",
    category: "Reservas"
  },
  {
    question: "Posso cancelar minha reserva?",
    answer: "Sim! Você pode cancelar sua reserva até 24 horas antes do horário agendado. Para cancelar, acesse sua conta no app e vá até a seção 'Minhas Reservas'.",
    category: "Reservas"
  },
  {
    question: "Há alguma taxa para usar o Agilizaí App?",
    answer: "Não! O uso do Agilizaí App é totalmente gratuito para os usuários. Você paga apenas o valor da reserva diretamente ao estabelecimento.",
    category: "Pagamentos"
  },
  {
    question: "Quais formas de pagamento são aceitas?",
    answer: "Aceitamos cartões de crédito, débito, PIX e dinheiro. Cada estabelecimento pode ter suas próprias opções de pagamento disponíveis.",
    category: "Pagamentos"
  },
  {
    question: "Como funciona o sistema de avaliações?",
    answer: "Após sua visita, você receberá um e-mail solicitando sua avaliação. Sua opinião é muito importante para nós e para outros usuários!",
    category: "Avaliações"
  },
  {
    question: "Posso fazer reservas para grupos grandes?",
    answer: "Sim! Muitos estabelecimentos aceitam reservas para grupos grandes. Recomendamos entrar em contato diretamente com o estabelecimento para grupos com mais de 10 pessoas.",
    category: "Reservas"
  },
  {
    question: "O que acontece se eu chegar atrasado?",
    answer: "Recomendamos chegar no horário agendado. Em caso de atraso, entre em contato com o estabelecimento para informar. A política de tolerância varia de acordo com cada local.",
    category: "Reservas"
  },
  {
    question: "Como posso entrar em contato com o suporte?",
    answer: "Nosso suporte está disponível 24/7 através do chat no app, e-mail (suporte@agilizai.com.br) ou telefone (11 9999-9999).",
    category: "Suporte"
  },
  {
    question: "Posso fazer reservas para o mesmo dia?",
    answer: "Sim! Muitos estabelecimentos aceitam reservas para o mesmo dia, dependendo da disponibilidade. Recomendamos fazer a reserva com pelo menos 2 horas de antecedência.",
    category: "Reservas"
  },
  {
    question: "Como funciona o programa de fidelidade?",
    answer: "Nosso programa de fidelidade oferece pontos a cada reserva realizada. Acumule pontos e troque por descontos e benefícios exclusivos!",
    category: "Fidelidade"
  },
  {
    question: "Posso fazer reservas para eventos especiais?",
    answer: "Sim! Para eventos especiais como aniversários, casamentos ou eventos corporativos, recomendamos entrar em contato diretamente com o estabelecimento para personalizar sua experiência.",
    category: "Eventos"
  },
  {
    question: "Como posso me tornar um estabelecimento parceiro?",
    answer: "Para se tornar um parceiro, entre em contato conosco através do e-mail parcerias@agilizai.com.br ou pelo telefone (11 9999-9999). Nossa equipe comercial entrará em contato para apresentar as vantagens da parceria.",
    category: "Parcerias"
  }
];

const categories = ["Todos", "Reservas", "Pagamentos", "Avaliações", "Suporte", "Fidelidade", "Eventos", "Parcerias"];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleItem = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredFAQ = faqData.filter(item => {
    const matchesCategory = activeCategory === "Todos" || item.category === activeCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Perguntas Frequentes</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre o Agilizaí App
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Buscar perguntas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                    activeCategory === category
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            {filteredFAQ.length === 0 ? (
              <div className="text-center py-12">
                <MdHelp className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">Nenhuma pergunta encontrada</h3>
                <p className="text-gray-500">Tente ajustar sua busca ou categoria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQ.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleItem(index)}
                      className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{item.question}</h3>
                        <span className="text-sm text-yellow-600 font-medium">{item.category}</span>
                      </div>
                      {expandedItems.includes(index) ? (
                        <MdExpandLess className="text-2xl text-gray-400 flex-shrink-0" />
                      ) : (
                        <MdExpandMore className="text-2xl text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedItems.includes(index) && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Não encontrou o que procurava?</h2>
            <p className="text-gray-600 mb-6">
              Nossa equipe de suporte está sempre pronta para ajudar você!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contato"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Fale Conosco
              </a>
              <a
                href="mailto:suporte@agilizai.com.br"
                className="bg-white hover:bg-gray-50 text-gray-800 px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg border border-gray-200"
              >
                Enviar E-mail
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 