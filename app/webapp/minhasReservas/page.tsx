"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link"; // Importe o Link
import Header from "../components/headerNotificatioin/headerNotification";
import Footer from "../components/footer/footer";
import styles from "./minhasReservas.module.scss";
import defaultBanner from "@/app/assets/highline/capa-highline.jpeg";

// Define a interface para a reserva
interface Reserva {
  id: number;
  nome: string;
  data: string;
  status: string;
}

export default function MinhasReservas() {
  const [bannerSrc, setBannerSrc] = useState(defaultBanner.src);
  const [reservas, setReservas] = useState<Reserva[]>([]); // Especifica o tipo do estado

  useEffect(() => {
    const storedBanner = localStorage.getItem("lastPageBanner");
    if (storedBanner) {
      setBannerSrc(storedBanner);
    }

    // Recupera as reservas existentes do localStorage
    const storedReservationsJSON = localStorage.getItem("reservationsList");
    const storedReservations: Reserva[] = storedReservationsJSON ? JSON.parse(storedReservationsJSON) : [];

    const storedReservationJSON = localStorage.getItem("reservation");
    const storedReservation = storedReservationJSON ? JSON.parse(storedReservationJSON) : null;

    if (storedReservation) {
      // Verifica se a nova reserva já existe na lista com base no nome e data
      const alreadyExists = storedReservations.some(
        (reserva: Reserva) => // Define o tipo de 'reserva'
          reserva.nome === storedReservation.eventName &&
          reserva.data === storedReservation.date
      );

      if (!alreadyExists) {
        // Cria a nova reserva
        const newReservation: Reserva = { // Define o tipo do objeto nova reserva
          id: storedReservations.length + 1, // Incrementa o ID
          nome: storedReservation.eventName || "Nome do Evento",
          data: storedReservation.date || "Data do Evento",
          status: "Aguardando",
        };

        // Adiciona a nova reserva à lista de reservas armazenadas
        const updatedReservations = [...storedReservations, newReservation];

        // Atualiza o localStorage com a nova lista de reservas
        localStorage.setItem("reservationsList", JSON.stringify(updatedReservations));

        // Atualiza o estado com a lista atualizada de reservas
        setReservas(updatedReservations);
      } else {
       
        setReservas(storedReservations);
      }
    } else {
      
      setReservas(storedReservations);
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
                  width={150}
                  height={100}
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
