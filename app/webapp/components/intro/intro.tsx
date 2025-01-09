"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import imgBanner from "@/app/assets/intro.png";
import logoWhite from "@/app/assets/logo_white.png";
import { useRouter } from "next/navigation";
import IphoneX1 from "@/app/assets/intro/📱iPhoneX-1.png";
import IphoneX2 from "@/app/assets/intro/📱iPhoneX-2.png";
import IphoneX3 from "@/app/assets/intro/📱iPhoneX-3.png";

interface IntroProps {
  className?: string; // Permite passar className como prop
}

const Intro: React.FC<IntroProps> = ({ className }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      router.push("/webapp");
    } else {
      setTimeout(() => setCurrentPage(2), 3000);
    }
  }, [router]);

  const handleNavigation = (direction: "next" | "skip") => {
    if (direction === "next") {
      setCurrentPage((prev) => Math.min(prev + 1, 4));
    }
    if (direction === "skip" || currentPage === 4) {
      router.push("/login");
    }
  };

  return (
    <div className={className}>
    <div className="relative w-full h-screen flex justify-center items-center bg-black">
      <Image
        src={imgBanner}
        alt="Banner"
        fill
        className="absolute inset-0 object-cover"
        priority
      />

      {currentPage === 1 && (
        <div className="absolute flex justify-center items-center w-full h-full">
          <Image
            src={logoWhite}
            alt="Logo"
            className="w-40 sm:w-60 animate-intro"
          />
        </div>
      )}

      {currentPage === 2 && (
        <div className="relative flex flex-col items-center text-center px-6 py-12 w-full h-full bg-gradient-to-b from-black to-gray-900">
          <Image
            src={IphoneX1}
            alt="iPhoneX-1"
            className="w-80 mb-6 drop-shadow-lg animate-fade-in-behind"
          />
          <h1 className="text-white text-4xl font-bold mb-4">
            Explore Upcoming and Nearby Events
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
            Discover exciting events happening near you! Find the best shows,
            activities, and experiences to enjoy with friends and family.
          </p>
          <div className="flex space-x-4">
            <button
              className="bg-blue-500 text-white px-8 py-4 rounded-full shadow-lg hover:bg-blue-600 transition"
              onClick={() => handleNavigation("next")}
            >
              Learn More
            </button>
            <button
              className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-black transition"
              onClick={() => handleNavigation("skip")}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {currentPage === 3 && (
        <div className="relative flex flex-col items-center text-center px-6 py-12 w-full h-full bg-gradient-to-b from-gray-800 to-black">
          <Image
            src={IphoneX2}
            alt="iPhoneX-2"
            className="w-80 mb-6 drop-shadow-lg animate-fade-in-behind"
          />
          <h1 className="text-white text-4xl font-bold mb-4">
            We Have Modern Events Calendar Feature
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
            Stay organized and never miss an event again! Our modern event
            calendar lets you track your activities and even sync them with your
            phone.
          </p>
          <div className="flex space-x-4">
            <button
              className="bg-blue-500 text-white px-8 py-4 rounded-full shadow-lg hover:bg-blue-600 transition"
              onClick={() => handleNavigation("next")}
            >
              Explore Calendar
            </button>
            <button
              className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-black transition"
              onClick={() => handleNavigation("skip")}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {currentPage === 4 && (
        <div className="relative flex flex-col items-center text-center px-6 py-12 w-full h-full bg-gradient-to-b from-black to-gray-800">
          <Image
            src={IphoneX3}
            alt="iPhoneX-3"
            className="w-80 mb-6 drop-shadow-lg animate-fade-in-behind"
          />
          <h1 className="text-white text-4xl font-bold mb-4">
            Discover Events Nearby Using Our Map
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
            Use our interactive map to find events and activities happening near
            you, from concerts to outdoor adventures.
          </p>
          <div className="flex space-x-4">
            <button
              className="bg-blue-500 text-white px-8 py-4 rounded-full shadow-lg hover:bg-blue-600 transition"
              onClick={() => handleNavigation("next")}
            >
              Start Exploring
            </button>
            <button
              className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-black transition"
              onClick={() => handleNavigation("skip")}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Intro;
