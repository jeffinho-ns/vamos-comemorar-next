import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "../components/header/header";  // Substitua pelo caminho correto do componente Header
import Footer from "../components/footer/footer";  // Substitua pelo caminho correto do componente Footer
import Modal from "react-modal";    // Substitua pelo caminho correto do componente Modal
// ... outras importações

const Confirmation = () => {
  // ... lógica e estados do componente

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div id="home-container" className="container-mobile flex-grow">
        <div className={styles.content}>
          <div className={styles.barInfo}>
            <h2 className={styles.title}>Reservas</h2>
            <div className={styles.infoContainer}>
              <div className={styles.leftColumn}>
                <h1 className={styles.barName}>Detalhes da reserva</h1>
                <p className={styles.barDescription}>
                  Sua reserva está aprovada! Basta apresentar o QR code na entrada.
                </p>
              </div>
              <div className={styles.middleColumn}>
                <div className={styles.logoContainer}>
                  <Image src={logoSrc} alt="Logo" width={50} height={50} />
                </div>
              </div>
            </div>

            {/* Exibindo os detalhes da reserva */}
            {reservationData ? (
              <div className="space-y-4">
                {/* Detalhes da reserva */}
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Pessoas</span>
                  <span className="font-bold text-gray-700">{reservationData.guests} Pessoas</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Mesas</span>
                  <span className="font-bold text-gray-700">{reservationData.table}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Data</span>
                  <span className="font-bold text-gray-700">{reservationData.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-300 py-4">
                  <span className="text-gray-500">Evento</span>
                  <span className="font-bold text-gray-700">{reservationData.eventName}</span>
                </div>

                {/* QR Code */}
                <div className="flex justify-center my-8">
                  <Image
                    src="https://via.placeholder.com/150"
                    alt="QR Code"
                    width={150}
                    height={150}
                  />
                </div>

                {/* Botão Cancelar Reserva */}
                <div className="flex justify-center">
                  <button 
                    className="bg-teal-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-teal-700"
                    onClick={handleCancelReservation}
                  >
                    Cancelar Reserva
                  </button>
                </div>
              </div>
            ) : (
              <p>Carregando detalhes da reserva...</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.footerContainer}>
        <Footer />
      </div>
      <Modal
        isOpen={!!expandedImage}
        onRequestClose={closeImage}
        contentLabel="Image Modal"
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        {expandedImage && (
          <Image
            src={expandedImage}
            alt="Expanded"
            layout="fill"
            objectFit="contain"
            className={styles.expandedImage}
          />
        )}
      </Modal>
    </div>
  );
};

export default Confirmation;
