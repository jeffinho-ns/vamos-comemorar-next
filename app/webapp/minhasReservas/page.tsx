"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image"; // Import necessário para o componente de imagem
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";
import styles from "./minhasReservas.module.scss"; // Estilos específicos da página
import defaultBanner from "@/app/assets/highline/capa-highline.jpeg"; // Imagem padrão do banner

export default function MinhasReservas() {
  const [bannerSrc, setBannerSrc] = useState(defaultBanner.src); // Banner padrão
  const [reservas, setReservas] = useState([]);

  useEffect(() => {
    // Capturando o último banner armazenado
    const storedBanner = localStorage.getItem("lastPageBanner");
    if (storedBanner) {
      setBannerSrc(storedBanner);
    }

    // Capturando as informações da reserva no localStorage
    const storedReservation = JSON.parse(localStorage.getItem("reservation"));

    if (storedReservation) {
      // Preenchendo os dados da reserva com o nome do evento, data e status (substitua conforme necessário)
      const fetchedReservas = [
        {
          id: 1,
          nome: storedReservation.eventName || "Nome do Evento",
          data: storedReservation.date || "Data do Evento",
          status: "Aguardando", // Você pode adicionar lógica para alterar o status conforme necessário
        },
      ];
      setReservas(fetchedReservas);
    }
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
                  src={bannerSrc}
                  alt="Banner"
                  width={150} // Definindo a largura da imagem
                  height={100} // Definindo a altura da imagem
                  className={styles.bannerImage}
                />
              </div>
              <div className={styles.reservaDetails}>
                <h3 className={styles.reservaName}>{reserva.nome}</h3>
                <p className={styles.reservaDate}>Data: {reserva.data}</p>
                <span
                  className={
                    reserva.status === "Aprovada"
                      ? styles.statusAprovada
                      : styles.statusAguardando
                  }
                >
                  {reserva.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button className={styles.novaReservaButton}>Novas Reservas</button>
      </div>
      <Footer />
    </>
  );
}
