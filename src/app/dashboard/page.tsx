"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../../../components/ui/sidebar";
import { Separator } from "../../../components/ui/separator";
import { AppSidebar } from "../../../components/app-sidebar";
import RestaurantReservations from "../../../components/restaurant-reservations/restaurant-reservations";
import HotelReservations from "../../../components/hotel-reservations/hotel-reservations";
import TableManagement from "../../../components/table-management";
import RoomManagement from "../../../components/room-management";
import Dishmanagement from "../../../components/dish-management/dish-management";
import { homepageTranslations } from "../../../components/translations/homepage";

export default function HomePage() {
  const [activeView, setActiveView] = useState("restaurant-reservations");
  const [lang, setLang] = useState<"es" | "en" | "fr">("en");

  // Leer idioma desde localStorage al montar
  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang === "es" || savedLang === "en" || savedLang === "fr") {
      setLang(savedLang);
    }
  }, []);

  // Guardar idioma cuando cambia
  const handleLangChange = (value: "es" | "en" | "fr") => {
    setLang(value);
    localStorage.setItem("lang", value);
        window.location.reload(); // 🔄 Recarga para aplicar cambios globales

  };

  const t = homepageTranslations[lang];

  const renderContent = () => {
    switch (activeView) {
      case "restaurant-reservations":
        return <RestaurantReservations />;
      case "hotel-reservations":
        return <HotelReservations />;
      case "table-management":
        return <TableManagement />;
      case "room-management":
        return <RoomManagement />;
      case "dish-management":
        return <Dishmanagement />;
      default:
        return <RestaurantReservations />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} setActiveView={setActiveView} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 bg-white shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />

          {/* Título dinámico con traducción */}
<h1>{t[activeView as keyof typeof t]}</h1>

          {/* Selector de idioma */}
          <select
            value={lang}
            onChange={(e) => handleLangChange(e.target.value as "es" | "en" | "fr")}
            className="border rounded p-1 text-sm"
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
