"use client";


import Banner from "../components/banner/banner";
import Footer from "../components/footer/footer";
import Header from "../components/header/header";

import Image from "next/image";


export default function About() {
  return (
    <div>
      <Header />
      <Banner
        id="banner"
        className="banner background-gradient h-full relative flex items-center justify-center"
      >
        <div className="overlay background-gradient absolute h-4/5 top-0 right-0 bottom-0 left-0"></div>
        <div className="title-banner absolute flex flex-col items-center md:text-center">
          <Image src="" alt="Logo banner" width={150} height={150} />
          <h1 className="text-3xl	 text-white text-center">
            {/* Teste do banner quem somos aqui */}
          </h1>
        </div>
        <Image
          src=""
          alt="Imagem do banner"
          className="Image-banner object-cover h-full"
        />
      </Banner>
     
     
      <Footer />
    </div>
  );
};
