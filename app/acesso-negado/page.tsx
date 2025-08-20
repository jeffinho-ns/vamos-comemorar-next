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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
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
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-8 text-center">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4"
            >
              <MdLock className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Acesso Negado
            </h1>
            <p className="text-red-100 text-sm">
              Você não tem permissão para acessar esta página
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center mb-6"
            >
              <MdWarning className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Esta área requer permissões especiais que seu usuário não possui.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-700">
                  <MdSecurity className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Redirecionamento automático em {countdown}s
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Botões de ação */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="space-y-3"
            >
              <button
                onClick={handleGoBack}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                <MdArrowBack className="w-5 h-5" />
                Voltar à página anterior
              </button>

              <button
                onClick={handleGoHome}
                className="w-full flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                <MdHome className="w-5 h-5" />
                Ir para o início
              </button>

              <button
                onClick={handleGoLogin}
                className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                <MdLogin className="w-5 h-5" />
                Fazer login novamente
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center mt-6"
        >
          <p className="text-gray-500 text-sm">
            Se você acredita que isso é um erro, entre em contato com o administrador.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
