"use client";

import { useSearchParams } from "next/navigation";
import SettingsTab from "../../components/userAccountTabs/SettingsTab";
import DetailsTab from "../../components/userAccountTabs/DetailsTab";
import CompanyTab from "../../components/userAccountTabs/CompanyTab";
import ProfileTab from "../../components/userAccountTabs/ProfileTab";
import ContactTab from "../../components/userAccountTabs/ContactTab";

import React, { Suspense } from "react";

function ContaUsuarioPageClient() {
  const searchParams = useSearchParams();
  const aba = searchParams.get("aba") || "settings";

  const renderTab = () => {
    switch (aba) {
      case "settings":
        return <SettingsTab />;
      case "details":
        return <DetailsTab />;
      case "company":
        return <CompanyTab />;
      case "profile":
        return <ProfileTab />;
      case "contact":
        return <ContactTab />;
      default:
        return <SettingsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/20 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Minha Conta</h1>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

export default function ContaUsuarioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    }>
      <ContaUsuarioPageClient />
    </Suspense>
  );
}