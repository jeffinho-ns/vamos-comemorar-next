import type { StaticImageData } from "next/image";
import imgBanner from "@/app/assets/highline/capa-highline.jpeg";
import logoNew from "@/app/assets/highline/highlinelogo.png";

export type ReservaVenueVariant = "rooftop" | "pinheiros";

export interface ReservaVenueConfig {
  variant: ReservaVenueVariant;
  name: string;
  slug: string;
  barSlugs: string[];
  reservePath: string;
  cardapioPath: string;
  address: string;
  heroAlt: string;
  aboutTitle: string;
  aboutText: string;
  banner: StaticImageData;
  logo: StaticImageData;
}

export const RESERVA_ROOFTOP_VENUE: ReservaVenueConfig = {
  variant: "rooftop",
  name: "Reserva Rooftop",
  slug: "reserva-rooftop",
  barSlugs: ["reservaroftop", "reserva-rooftop", "reserva_rooftop"],
  reservePath: "/reservar/reserva-rooftop",
  cardapioPath: "/cardapio/reserva-rooftop",
  address:
    "Em frente ao portão 2 - Rua Marc Chagal, Parque, Jardim das Perdizes, São Paulo - SP",
  heroAlt: "Reserva Rooftop",
  aboutTitle: "Sobre o Reserva Rooftop",
  aboutText:
    "No Reserva Rooftop, combinamos gastronomia e uma atmosfera sofisticada com vista privilegiada, criando o cenário perfeito para comemorações, encontros e experiências inesquecíveis.",
  banner: imgBanner,
  logo: logoNew,
};

export const RESERVA_PINHEIROS_VENUE: ReservaVenueConfig = {
  variant: "pinheiros",
  name: "Reserva Pinheiros",
  slug: "reserva-pinheiros",
  barSlugs: ["reserva-pinheiros"],
  reservePath: "/reservar/reserva-pinheiros",
  cardapioPath: "/cardapio/reserva-pinheiros",
  address: "Pinheiros, São Paulo - SP",
  heroAlt: "Reserva Pinheiros",
  aboutTitle: "Sobre o Reserva Pinheiros",
  aboutText:
    "No Reserva Pinheiros, fusionamos sabores excepcionais com uma trilha sonora envolvente — Deck ao ar livre e Salão com mesas, sofás e bar para cada ocasião.",
  banner: imgBanner,
  logo: logoNew,
};
