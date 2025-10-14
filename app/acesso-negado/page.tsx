'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  MdLock, 
  MdSecurity, 
  MdArrowBack, 
  MdHome, 
  MdLogin,
  MdWarning 
} from 'react-icons/md';

export default function AcessoNegado() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        {/* Card Principal */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header com ícone */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 sm:p-8 text-center">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full mb-3 sm:mb-4"
            >
              <MdLock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Acesso Negado
            </h1>
            <p className="text-red-100 text-xs sm:text-sm px-2">
              Você não tem permissão para acessar esta página
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-6 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center mb-6"
            >
              <MdWarning className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">
                Esta área requer permissões especiais que seu usuário não possui.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-red-700">
                  <MdSecurity className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-center">
                    Redirecionamento automático em {countdown}s
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Botões de ação - Layout responsivo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="space-y-3"
            >
              {/* Primeira linha - Botões principais em duas colunas no mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleGoBack}
                  className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                >
                  <MdArrowBack className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Voltar</span>
                </button>

                <button
                  onClick={handleGoHome}
                  className="flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
                >
                  <MdHome className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Início</span>
                </button>
              </div>

              {/* Segunda linha - Botão de login (largura completa) */}
              <button
                onClick={handleGoLogin}
                className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-sm sm:text-base"
              >
                <MdLogin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Fazer login novamente</span>
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-4 sm:mt-6 px-4"
        >
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
            Se você acredita que isso é um erro, entre em contato com o administrador.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
