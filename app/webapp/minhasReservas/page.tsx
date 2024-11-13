"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";
import styles from "./minhasReservas.module.scss";
import defaultBanner from "@/app/assets/highline/capa-highline.jpeg";

interface Reserva {
  id: number;
  casa_do_evento: string;
  data_do_evento: string;
  imagem_do_evento: string;
  status: string;
}

export default function MinhasReservas() {
  const [bannerSrc, setBannerSrc] = useState(defaultBanner.src);
  const [reservas, setReservas] = useState<Reserva[]>([]);

  useEffect(() => {
    const storedBanner = localStorage.getItem("lastPageBanner");
    if (storedBanner) {
      setBannerSrc(storedBanner);
    }

    const fetchReservas = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/reservas");
        if (response.ok) {
          const data = await response.json();

          // Mapeia as reservas para incluir a URL completa da imagem
          const reservasComImagemCompleta = data.map((reserva: Reserva) => ({
            ...reserva,
            imagem_do_evento: reserva.imagem_do_evento
              ? `http://localhost:5001/uploads/events/${reserva.imagem_do_evento}`
              : bannerSrc, // Usa o banner padrão se a imagem não estiver disponível
          }));

          setReservas(reservasComImagemCompleta);
        } else {
          console.error("Erro ao buscar reservas:", response.statusText);
        }
      } catch (error) {
        console.error("Erro ao buscar reservas:", error);
      }
    };

    fetchReservas();
  }, []);

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h2 className={styles.title}>Reservas</h2>
        <div className={styles.reservasList}>
          {reservas.map((reserva) => (
            <div key={reserva.id} className={styles.reservaItem}>
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
