"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MdLocationOn, MdInfoOutline, MdEvent } from "react-icons/md";
import Footer from "../components/footer/footer";
import HeaderLike from "../components/headerLike/headerLike";
import imgBanner from "../../assets/highline/capa-highline.jpeg";
import "react-multi-carousel/lib/styles.css";
import styles from "./reservas.module.scss";

import Carousel from "react-multi-carousel";

import ReservationModal from "../../webapp/components/reservationModal/reservationModal";

import logoNew from "@/app/assets/highline/highlinelogo.png";

import Modal from "react-modal";

const responsive = {
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 3,
    slidesToSlide: 3, // Number of slides to scroll on each swipe
  },
  tablet: {
    breakpoint: { max: 1024, min: 464 },
    items: 2,
    slidesToSlide: 2,
  },
  mobile: {
    breakpoint: { max: 464, min: 0 },
    items: 1,
    slidesToSlide: 1,
  },
};

const Justino = () => {
  const [showDescription, setShowDescription] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(imgBanner);

  useEffect(() => {
    const storedImage = localStorage.getItem("selectedEventImage");
    if (storedImage) {
      setSelectedImage(storedImage);
    }
  }, []);

  const toggleContent = (content) => {
    setShowDescription(content === "sobre");
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const openImage = (img) => setExpandedImage(img);
  const closeImage = () => setExpandedImage(null);

  return (
    <>
      <div id="home-container" className={styles.containerMobile}>
        <HeaderLike />
        <div className={styles.bannerContainer}>
          <Image
            src={selectedImage}
            alt="Banner"
            layout="fill"
            className={styles.bannerImage}
          />
        </div>
        <div className={styles.content}>
          <div className={styles.barInfo}>
            <div className={styles.infoContainer}>
              <div className={styles.leftColumn}>
                <h1 className={styles.barName}>Nova Reserva</h1>
                <p className={styles.barDescription}>
                  Agora falta pouco para garantir a sua reserva! Basta preencher
                  os campos abaixo.
                </p>
              </div>
              <div className={styles.middleColumn}>
                <div className={styles.logoContainer}>
                  <Image src={logoNew} alt="Logo" width={50} height={50} />
                </div>
              </div>
            </div>

            <ReservationModal
              isOpen={modalIsOpen}
              onRequestClose={closeModal}
            />
          </div>
        </div>
      </div>
      <Footer />

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
    </>
  );
};

const Section = ({ title, images, openImage }) => {
  return (
    <div className={styles.section}>
      <h2>{title}</h2>
      <Carousel
        responsive={responsive}
        infinite={true}
        autoPlay={true}
        autoPlaySpeed={3000}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className={styles.imageContainer}
            onClick={() => openImage(image)}
          >
            <Image
              src={image}
              alt={`${title} ${index + 1}`}
              className={styles.image}
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default Justino;
