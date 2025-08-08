"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../../../components/ui/sidebar";
import { Separator } from "../../../components/ui/separator";
import { AppSidebar } from "../../../components/app-sidebar";
import RestaurantReservations from "../../../components/restaurant-reservations/restaurant-reservations";

import HotelReservations from "../../../components/hotel-reservations/hotel-reservations";
import TableManagement from "../../../components/table-management";
import RoomManagement from "../../../components/room-management";
import Dishmanagement from "../../../components/dish-management/dish-management";

export default function HomePage() {
  const [activeView, setActiveView] = useState("hotel-reservations");

 
  const renderContent = () => {
    switch (activeView) {
      case "restaurant-reservations":
        return (
          <RestaurantReservations/>
        );
      case "hotel-reservations":
        return (
          <HotelReservations/>
        );
      case "table-management":
        return <TableManagement />;
      case "room-management":
        return <RoomManagement/>;
      case "dish-management":
       return <Dishmanagement/>;
      default:
        return (
          <RestaurantReservations/>

        );
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} setActiveView={setActiveView} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-bold">
            {activeView === "restaurant-reservations" && "Reservas de Restaurante"}
            {activeView === "hotel-reservations" && "Reservas de Hotel"}
            {activeView === "table-management" && "Gestión de Mesas"}
            {activeView === "room-management" && "Gestión de Habitaciones"}
          </h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
