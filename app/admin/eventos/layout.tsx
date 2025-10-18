"use client";

import { ReactNode } from 'react';

interface EventosLayoutProps {
  children: ReactNode;
}

export default function EventosLayout({ children }: EventosLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}




