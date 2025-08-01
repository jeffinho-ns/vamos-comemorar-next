"use client";

import React, { useState } from "react";
import { MdEmail, MdPhone, MdLocationOn, MdAccessTime, MdSend, MdCheckCircle } from "react-icons/md";

export default function Contato() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    assunto: "",
    mensagem: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envio do formulário
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        assunto: "",
        mensagem: ""
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Entre em Contato</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Estamos aqui para ajudar! Entre em contato conosco e responderemos o mais rápido possível
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Envie sua Mensagem</h2>
              
              {isSubmitted ? (
                <div className="text-center py-12">
                  <MdCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Mensagem Enviada!</h3>
                  <p className="text-gray-600">
                    Obrigado por entrar em contato. Responderemos em breve!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assunto *
                      </label>
                      <select
                        name="assunto"
                        value={formData.assunto}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Selecione um assunto</option>
                        <option value="Suporte">Suporte Técnico</option>
                        <option value="Parceria">Parceria Comercial</option>
                        <option value="Sugestao">Sugestão</option>
                        <option value="Reclamacao">Reclamação</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem *
                    </label>
                    <textarea
                      name="mensagem"
                      value={formData.mensagem}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Digite sua mensagem aqui..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <MdSend className="text-xl" />
                        Enviar Mensagem
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Info Cards */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Informações de Contato</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-xl flex-shrink-0">
                      <MdEmail className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">E-mail</h3>
                      <p className="text-gray-600">contato@agilizai.com.br</p>
                      <p className="text-gray-600">suporte@agilizai.com.br</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl flex-shrink-0">
                      <MdPhone className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Telefone</h3>
                      <p className="text-gray-600">+55 11 9999-9999</p>
                      <p className="text-gray-600">+55 11 8888-8888</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl flex-shrink-0">
                      <MdLocationOn className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Endereço</h3>
                      <p className="text-gray-600">
                        R. Heitor de Morais, 87 - Pacaembu<br />
                        São Paulo - SP, 01234-567
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl flex-shrink-0">
                      <MdAccessTime className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Horário de Atendimento</h3>
                      <p className="text-gray-600">Segunda a Sexta: 9h às 18h</p>
                      <p className="text-gray-600">Sábado: 9h às 12h</p>
                      <p className="text-gray-600">Domingo: Fechado</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Contact */}
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Contato Rápido</h3>
                <p className="text-gray-600 mb-6">
                  Para questões urgentes, você pode nos contatar diretamente:
                </p>
                
                <div className="space-y-4">
                  <a
                    href="tel:+551199999999"
                    className="flex items-center space-x-3 p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <div className="bg-green-500 p-2 rounded-lg">
                      <MdPhone className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Ligar Agora</p>
                      <p className="text-sm text-gray-600">+55 11 9999-9999</p>
                    </div>
                  </a>

                  <a
                    href="mailto:contato@agilizai.com.br"
                    className="flex items-center space-x-3 p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <MdEmail className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Enviar E-mail</p>
                      <p className="text-sm text-gray-600">contato@agilizai.com.br</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* FAQ Link */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Perguntas Frequentes</h3>
                <p className="text-gray-600 mb-6">
                  Encontre respostas rápidas para as dúvidas mais comuns
                </p>
                <a
                  href="/faq"
                  className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Ver FAQ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 