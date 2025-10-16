"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";
import styles from "./minhasReservas.module.scss";
import defaultBanner from "@/app/assets/highline/capa-highline.jpeg";
import { useRouter } from "next/navigation"; // Alteração aqui para o useRouter correto

interface Reserva {
  id: number;
  casa_do_evento: string;
  data_do_evento: string;
  imagem_do_evento: string;
  status: string;
  user_id: number; // Inclua o campo user_id na interface para o filtro
}

export default function MinhasReservas() {
  const [bannerSrc, setBannerSrc] = useState(defaultBanner.src);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_LOCAL;
  const BASE_IMAGE_URL = 'https://grupoideiaum.com.br/cardapio-agilizaiapp/';
  const router = useRouter(); // Usando useRouter da 'next/navigation'

  useEffect(() => {
    const storedBanner = localStorage.getItem("lastPageBanner");
    if (storedBanner) {
      setBannerSrc(storedBanner);
    }
  
    const fetchReservas = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reservas`);
        if (response.ok) {
          const data = await response.json();
  
          const userId = localStorage.getItem("userId");
  
          const reservasDoUsuario = data
            .filter((reserva: Reserva) => reserva.user_id === Number(userId))
            .map((reserva: Reserva) => ({
              ...reserva,
              imagem_do_evento: reserva.imagem_do_evento
                ? `${BASE_IMAGE_URL}${reserva.imagem_do_evento}`
                : bannerSrc,
            }));
  
          setReservas(reservasDoUsuario);
        } else {
          console.error("Erro ao buscar reservas:", response.statusText);
        }
      } catch (error) {
        console.error("Erro ao buscar reservas:", error);
      }
    };
  
    fetchReservas();
  }, [API_URL, bannerSrc]); // Adicione as dependências aqui
  

  const handleReservaClick = (reserva: Reserva) => {
    if (reserva.status === "Aprovado") {
      router.push(`/webapp/confirmation?id=${reserva.id}`); // Certificando-se de que o id é passado na URL
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h2 className={styles.title}>Reservas</h2>
        <div className={styles.reservasList}>
          {reservas.map((reserva) => (
            <div
              key={reserva.id}
              className={styles.reservaItem}
              onClick={() => handleReservaClick(reserva)}
              style={{ cursor: reserva.status === "Aprovado" ? "pointer" : "default" }}
            >
              <div className={styles.bannerContainer}>
                <Image
                  src={reserva.imagem_do_evento}
                  alt="Banner do Evento"
                  width={150}
                  height={100}
                  className={styles.bannerImage}
                />
              </div>
              <div className={styles.reservaDetails}>
                <h3 className={styles.reservaName}>{reserva.casa_do_evento}</h3>
                <p className={styles.reservaDate}>Data: {reserva.data_do_evento}</p>
                <span
                  className={
                    reserva.status === "Aprovado"
                      ? styles.statusAprovada
                      : reserva.status === "Cancelado"
                      ? styles.statusCancelado
                      : styles.statusAguardando
                  }
                >
                  {reserva.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="button-new">
          <Link href="/" passHref>
            <span className={styles.novaReservaButton}>Novas Reservas</span>
          </Link>
        </div>
      </div>

      <div className={styles.footerContainer}>
        <Footer />
      </div>
    </>
  );
}
