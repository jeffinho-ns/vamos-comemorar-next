// app/cardapio/[slug]/layout.tsx
import React from 'react';

export default function SlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}