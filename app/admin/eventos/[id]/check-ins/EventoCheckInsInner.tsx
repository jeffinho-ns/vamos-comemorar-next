"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const EventoCheckInsInner = dynamic(
  () =>
    import("./EventoCheckInsInner").then((mod) => ({
      default: mod.default as ComponentType,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <p className="text-gray-300 text-lg">Carregando check-ins…</p>
      </div>
    ),
  },
);

export default function EventoCheckInsPage() {
  return <EventoCheckInsInner />;
}
