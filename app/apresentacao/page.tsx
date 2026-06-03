"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MdPrint,
  MdArrowForward,
  MdCheckCircle,
  MdEmail,
  MdPhone,
  MdShare,
} from "react-icons/md";
import logo from "@/app/assets/logo-agilizai-h.png";
import {
  heroStats,
  valueProps,
  ecosystem,
  establishments,
  modules,
  operationFlow,
  profiles,
  differentiators,
  navSections,
} from "./data/content";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

export default function ApresentacaoPage() {
  const [copied, setCopied] = useState(false);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Agilizaí App — Apresentação",
          text: "Conheça a plataforma completa para gestão de estabelecimentos.",
          url,
        });
        return;
      } catch {
        /* fallback */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      {/* Toolbar fixa */}
      <header className="ap-toolbar ap-no-print">
        <div className="ap-toolbar-inner">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src={logo}
              alt="Agilizaí App"
              width={120}
              height={36}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <nav className="ap-nav-desktop" aria-label="Navegação da apresentação">
            {navSections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="ap-nav-link">
                {s.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Compartilhar link"
            >
              <MdShare size={18} />
              {copied ? "Copiado!" : "Compartilhar"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="ap-btn-print"
              aria-label="Imprimir ou salvar como PDF"
            >
              <MdPrint size={18} />
              <span className="hidden xs:inline">Salvar PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        <nav className="ap-mobile-nav lg:hidden" aria-label="Navegação mobile">
          {navSections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 bg-white/5 whitespace-nowrap"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Hero */}
      <section id="visao" className="ap-hero">
        <div className="ap-hero-bg" />
        <div className="ap-hero-grid" />

        <div className="relative z-10 ap-container text-center">
          <motion.div {...fadeUp}>
            <span className="ap-section-label">Apresentação Comercial 2026</span>
            <h1 className="ap-print-hero-title text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                Agilizaí App
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-4 leading-relaxed">
              A plataforma completa para bares, restaurantes e rooftops operarem
              reservas, eventos, cardápio digital e atendimento — tudo integrado.
            </p>
            <p className="text-base text-orange-400/90 font-medium mb-10">
              Transforme a operação do seu estabelecimento e conquiste mais clientes.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ delay: 0.15 }}
            className="ap-stat-grid max-w-4xl mx-auto mb-10"
          >
            {heroStats.map((stat) => (
              <div key={stat.label} className="ap-stat-card">
                <div className="text-2xl sm:text-3xl font-bold text-orange-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center ap-no-print"
          >
            <a
              href="#modulos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              Ver todos os módulos
              <MdArrowForward size={20} />
            </a>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-zinc-300 border border-white/15 hover:bg-white/5 transition-all"
            >
              <MdPrint size={20} />
              Baixar apresentação em PDF
            </button>
          </motion.div>
        </div>
      </section>

      {/* Proposta de valor */}
      <section className="ap-section">
        <div className="ap-container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="ap-section-label">Por que escolher</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Resultados reais para o seu negócio
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {valueProps.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-orange-500/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold mb-4">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecossistema */}
      <section id="ecossistema" className="ap-section ap-section-alt">
        <div className="ap-container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="ap-section-label">Ecossistema</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Três plataformas, uma operação
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              App mobile, portal web e painel administrativo conectados em tempo real.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {ecosystem.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl overflow-hidden border border-white/8 bg-[#12121a]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className={`${
                      item.fit === "contain" ? "object-contain p-2" : "object-cover object-top"
                    } transition-transform duration-500 group-hover:scale-105`}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/90 text-white">
                    {item.badge}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Parceiros */}
      <section id="parceiros" className="ap-section">
        <div className="ap-container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="ap-section-label">Rede ativa</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Estabelecimentos que já operam conosco
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Solução validada em operação real — pronta para escalar para o seu estabelecimento.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {establishments.map((est, i) => (
              <motion.div
                key={est.name}
                {...fadeUp}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl overflow-hidden border border-white/8 bg-[#12121a] group"
              >
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={est.cover}
                    alt={est.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="400px"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12121a] to-transparent" />
                </div>
                <div className="p-5 flex items-start gap-4">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white shrink-0">
                    <Image
                      src={est.logo}
                      alt={`Logo ${est.name}`}
                      fill
                      className="object-contain p-1"
                      sizes="48px"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{est.name}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{est.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" className="ap-section ap-section-alt ap-print-break">
        <div className="ap-container">
          <motion.div {...fadeUp} className="text-center mb-14">
            <span className="ap-section-label">Raio-X completo</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {modules.length} módulos integrados
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Cada funcionalidade foi pensada para a rotina real de bares, restaurantes e eventos.
            </p>
          </motion.div>

          <div className="space-y-16">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              const reversed = i % 2 === 1;

              return (
                <motion.article
                  key={mod.id}
                  {...fadeUp}
                  className={`ap-module-card grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                    reversed ? "lg:[direction:rtl]" : ""
                  }`}
                >
                  <div className={reversed ? "lg:[direction:ltr]" : ""}>
                    <div className="ap-module-image-wrap shadow-2xl shadow-black/40">
                      <Image
                        src={mod.image}
                        alt={mod.imageAlt}
                        fill
                        className={
                          mod.fit === "contain"
                            ? "object-contain p-3"
                            : "object-cover object-top"
                        }
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        unoptimized
                      />
                    </div>
                  </div>

                  <div className={reversed ? "lg:[direction:ltr]" : ""}>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center`}
                      >
                        <Icon className="text-white text-2xl" />
                      </div>
                      {mod.tag && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-zinc-300">
                          {mod.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-1">{mod.title}</h3>
                    <p className="text-orange-400/90 font-medium mb-4">{mod.subtitle}</p>
                    <p className="text-zinc-400 leading-relaxed mb-6">{mod.description}</p>
                    <ul className="space-y-2.5">
                      {mod.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2.5 text-sm text-zinc-300">
                          <MdCheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fluxo operacional */}
      <section id="operacao" className="ap-section">
        <div className="ap-container">
          <motion.div {...fadeUp} className="text-center mb-14">
            <span className="ap-section-label">Operação do dia</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Do agendamento ao relatório final
            </h2>
          </motion.div>

          <div className="relative">
            <div className="ap-flow-line" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {operationFlow.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    {...fadeUp}
                    transition={{ delay: i * 0.08 }}
                    className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/8"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                        {step.step}
                      </div>
                      <Icon className="text-orange-400 text-2xl" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Perfis */}
      <section id="perfis" className="ap-section ap-section-alt">
        <div className="ap-container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="ap-section-label">Acesso inteligente</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cada perfil vê o que precisa
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {profiles.map((profile, i) => (
              <motion.div
                key={profile.role}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl overflow-hidden border border-white/8 bg-[#12121a]"
              >
                <div className={`h-2 bg-gradient-to-r ${profile.color}`} />
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2">{profile.role}</h3>
                  <p className="text-sm text-zinc-500 mb-4">{profile.description}</p>
                  <ul className="space-y-1.5">
                    {profile.access.map((a) => (
                      <li key={a} className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-orange-500" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section id="diferenciais" className="ap-section">
        <div className="ap-container">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="ap-section-label">Diferenciais</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que somos diferentes
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {differentiators.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  {...fadeUp}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-5 p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                    <Icon className="text-orange-400 text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{item.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA / Contato */}
      <section id="contato" className="ap-section ap-section-alt">
        <div className="ap-container">
          <motion.div
            {...fadeUp}
            className="relative rounded-3xl overflow-hidden border border-orange-500/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-red-600/10 to-transparent" />
            <div className="relative p-8 md:p-14 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para transformar seu estabelecimento?
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                Junte-se à rede de bares e restaurantes que já operam com o Agilizaí App.
                Agende uma demonstração personalizada e veja o sistema funcionando ao vivo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 ap-no-print">
                <Link
                  href="/contato"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg transition-all"
                >
                  <MdEmail size={20} />
                  Falar com nossa equipe
                </Link>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-zinc-200 border border-white/15 hover:bg-white/5 transition-all"
                >
                  <MdPrint size={20} />
                  Exportar apresentação em PDF
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-zinc-500">
                <span className="flex items-center gap-2">
                  <MdEmail className="text-orange-400" />
                  contato@agilizaiapp.com.br
                </span>
                <span className="flex items-center gap-2">
                  <MdPhone className="text-orange-400" />
                  agilizaiapp.com.br
                </span>
              </div>
            </div>
          </motion.div>

          <p className="text-center text-xs text-zinc-600 mt-8 ap-no-print">
            © {new Date().getFullYear()} Agilizaí App — Vamos Comemorar. Apresentação comercial.
          </p>
        </div>
      </section>
    </div>
  );
}
