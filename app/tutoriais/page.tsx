"use client";

import React, { useState } from "react";
import { MdPlayCircle, MdAccessTime, MdStar, MdSearch, MdFilterList } from "react-icons/md";

interface Tutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: "Iniciante" | "Intermediário" | "Avançado";
  category: string;
  videoUrl: string;
  thumbnail: string;
  rating: number;
  views: number;
}

const tutorials: Tutorial[] = [
  {
    id: 1,
    title: "Como fazer sua primeira reserva",
    description: "Aprenda o passo a passo completo para fazer sua primeira reserva no Agilizaí App de forma rápida e segura.",
    duration: "3:45",
    difficulty: "Iniciante",
    category: "Reservas",
    videoUrl: "#",
    thumbnail: "🎯",
    rating: 4.8,
    views: 1250
  },
  {
    id: 2,
    title: "Gerenciando suas reservas",
    description: "Descubra como visualizar, editar e cancelar suas reservas de forma fácil e intuitiva.",
    duration: "5:20",
    difficulty: "Iniciante",
    category: "Reservas",
    videoUrl: "#",
    thumbnail: "📋",
    rating: 4.6,
    views: 890
  },
  {
    id: 3,
    title: "Como usar o sistema de avaliações",
    description: "Aprenda a avaliar estabelecimentos e como suas avaliações ajudam outros usuários.",
    duration: "4:15",
    difficulty: "Iniciante",
    category: "Avaliações",
    videoUrl: "#",
    thumbnail: "⭐",
    rating: 4.7,
    views: 720
  },
  {
    id: 4,
    title: "Dicas para reservas em grupo",
    description: "Técnicas e dicas para fazer reservas para grupos grandes e eventos especiais.",
    duration: "6:30",
    difficulty: "Intermediário",
    category: "Reservas",
    videoUrl: "#",
    thumbnail: "👥",
    rating: 4.9,
    views: 650
  },
  {
    id: 5,
    title: "Programa de fidelidade",
    description: "Como acumular pontos e aproveitar os benefícios do nosso programa de fidelidade.",
    duration: "4:50",
    difficulty: "Intermediário",
    category: "Fidelidade",
    videoUrl: "#",
    thumbnail: "🎁",
    rating: 4.5,
    views: 580
  },
  {
    id: 6,
    title: "Configurações da conta",
    description: "Personalize sua conta, configure notificações e gerencie suas preferências.",
    duration: "7:15",
    difficulty: "Intermediário",
    category: "Conta",
    videoUrl: "#",
    thumbnail: "⚙️",
    rating: 4.4,
    views: 420
  },
  {
    id: 7,
    title: "Troubleshooting comum",
    description: "Soluções para problemas frequentes e como obter ajuda quando necessário.",
    duration: "8:45",
    difficulty: "Avançado",
    category: "Suporte",
    videoUrl: "#",
    thumbnail: "🔧",
    rating: 4.6,
    views: 380
  },
  {
    id: 8,
    title: "Dicas de segurança",
    description: "Melhores práticas para manter sua conta segura e proteger suas informações.",
    duration: "5:30",
    difficulty: "Intermediário",
    category: "Segurança",
    videoUrl: "#",
    thumbnail: "🔒",
    rating: 4.8,
    views: 520
  }
];

const categories = ["Todos", "Reservas", "Avaliações", "Fidelidade", "Conta", "Suporte", "Segurança"];
const difficulties = ["Todos", "Iniciante", "Intermediário", "Avançado"];

export default function Tutoriais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Todos");

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || tutorial.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "Todos" || tutorial.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Iniciante": return "bg-green-100 text-green-800";
      case "Intermediário": return "bg-yellow-100 text-yellow-800";
      case "Avançado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tutoriais</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Aprenda a usar o Agilizaí App com nossos tutoriais em vídeo passo a passo
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Search and Filters */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Buscar tutoriais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MdFilterList />
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MdFilterList />
                  Dificuldade
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tutorials Grid */}
        <div className="max-w-6xl mx-auto">
          {filteredTutorials.length === 0 ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Nenhum tutorial encontrado</h3>
              <p className="text-gray-600">Tente ajustar seus filtros de busca</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                    <div className="text-6xl">{tutorial.thumbnail}</div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <MdPlayCircle className="text-white text-4xl" />
                    </div>
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {tutorial.duration}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(tutorial.difficulty)}`}>
                        {tutorial.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <MdStar className="text-sm" />
                        <span className="text-sm text-gray-600">{tutorial.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-yellow-600 transition-colors duration-200">
                      {tutorial.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {tutorial.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {tutorial.views} visualizações
                      </span>
                      <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105">
                        Assistir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Start Guide */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Guia Rápido de Início</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Crie sua conta</h3>
                <p className="text-gray-600 text-sm">
                  Cadastre-se gratuitamente e comece a explorar os estabelecimentos
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Escolha um local</h3>
                <p className="text-gray-600 text-sm">
                  Navegue pelos estabelecimentos e escolha o que mais combina com você
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Faça sua reserva</h3>
                <p className="text-gray-600 text-sm">
                  Selecione data, horário e confirme sua reserva em poucos cliques
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Precisa de mais ajuda?</h2>
            <p className="text-gray-600 mb-6">
              Nossa equipe de suporte está sempre pronta para ajudar você!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/faq"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Ver FAQ
              </a>
              <a
                href="/contato"
                className="bg-white hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg border border-gray-200"
              >
                Fale Conosco
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 