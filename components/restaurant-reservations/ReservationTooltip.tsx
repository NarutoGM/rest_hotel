"use client";

import type React from "react";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { Users, Pencil, Trash2 } from "lucide-react";
import { translations } from "../translations/reservation_rest_toltip"; // Updated import

interface Table {
  id: number;
  tableNumber: string;
  tableCapacity: number;
  tableLocation: string;
  tableStatus: string;
}

interface RestaurantReservation {
  id: string;
  customerId: string;
  tableId: number;
  guestName: string;
  guestEmail: string;
  phone: string;
  reservationDate: string;
  startTime: Date;
  endTime: Date;
  numberOfPeople: number;
  status: "confirmed" | "pending" | "cancelled";
  statusColor: string;
  statusDescription: string;
  tableNumber: string;
  tableCapacity: number;
  tableLocation: string;
  tableStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface ReservationTooltipProps {
  reservation: RestaurantReservation;
  tables: Table[];
  handleEditReservation: (reservation: RestaurantReservation) => void;
  handleDeleteReservation: (id: string) => void;
  loading: boolean;
  leftPercent: number;
  widthPercent: number;
}

export default function ReservationTooltip({
  reservation,
  handleEditReservation,
  handleDeleteReservation,
  loading,
  leftPercent,
  widthPercent,
}: ReservationTooltipProps) {
  const isStriped = reservation.status === "pending";

  // Obtener idioma desde localStorage o usar "es" por defecto
  const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "en" : "en";
  const t = translations[lang as keyof typeof translations] || translations.es;

  const getStatusColor = () => {
    switch (reservation.status) {
      case "confirmed":
        return "rgb(34 197 94)"; // verde-500
      case "pending":
        return "rgb(234 179 8)"; // amarillo-500
      case "cancelled":
        return "rgb(239 68 68)"; // rojo-500
      default:
        return "rgb(96 165 250)"; // azul-400
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute top-1 rounded-md flex flex-col items-center justify-center text-white text-xs p-2 overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              height: "calc(100% - 8px)",
              zIndex: 20,
              backgroundColor: getStatusColor(),
              backgroundImage: isStriped
                ? `repeating-linear-gradient(
                    45deg,
                    rgba(255,255,255,0.1),
                    rgba(255,255,255,0.1) 5px,
                    transparent 5px,
                    transparent 10px
                  )`
                : "none",
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="font-semibold truncate w-full text-center">
              {reservation.guestName}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Users className="w-3 h-3" />
              {reservation.numberOfPeople}
            </div>
          </div>
        </TooltipTrigger>

        <TooltipContent className="bg-zinc-100 border-2 text-zinc-800 p-3 rounded-lg shadow-xl">
          <div className="space-y-1">
            <p className="font-bold text-sm text-yellow-600">{reservation.guestName}</p>
            <p className="text-xs text-zinc-600">
              {t.table}: {reservation.tableNumber} - {reservation.tableLocation}
            </p>
            <p className="text-xs text-zinc-500">
              {t.email}: {reservation.guestEmail}
            </p>
            <p className="text-xs text-zinc-600">
              {t.phone}: {reservation.phone}
            </p>
            <p className="text-xs text-zinc-600">
              {t.people}: {reservation.numberOfPeople} / {reservation.tableCapacity}
            </p>
            <p className="text-xs text-zinc-600">
              {t.start}: {reservation.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs text-zinc-600">
              {t.end}: {reservation.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStatusColor() }}
              ></span>
              {reservation.statusDescription}
            </p>
            <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-300">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditReservation(reservation);
                }}
                className="text-xs px-2 py-1 h-auto bg-yellow-400 hover:bg-yellow-500 text-white"
                disabled={loading}
              >
                <Pencil className="w-3 h-3 mr-1" /> {t.edit}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteReservation(reservation.id);
                }}
                className="text-xs px-2 py-1 h-auto bg-red-400 hover:bg-red-500 text-white"
                disabled={loading}
              >
                <Trash2 className="w-3 h-3 mr-1" /> {t.delete}
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
