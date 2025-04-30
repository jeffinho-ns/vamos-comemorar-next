"use client";
import { useSearchParams } from "next/navigation";
import SettingsTab from "../../components/userAccountTabs/SettingsTab";
import DetailsTab from "../../components/userAccountTabs/DetailsTab";
import CompanyTab from "../../components/userAccountTabs/CompanyTab";
import ProfileTab from "../../components/userAccountTabs/ProfileTab";
import ContactTab from "../../components/userAccountTabs/ContactTab";

export default function ContaUsuarioPage() {
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
    <div className="max-w-4xl mx-auto mt-8 p-4 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">Minha Conta</h1>
      {renderTab()}
    </div>
  );
}
