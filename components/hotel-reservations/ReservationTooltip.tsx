"use client";
import type React from "react";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { Users, Pencil, Trash2 } from "lucide-react";
import { translations } from "../translations/reservation_hotel_toltip"; // New import

// Interfaces ajustadas para coincidir con el componente principal
interface Room {
  id: number;
  room_number: string;
  room_type: string;
  capacity: number;
  number_of_beds: number;
  has_wifi: boolean;
  has_air_conditioning: boolean;
  has_tv: boolean;
  has_minibar: boolean;
  has_balcony: boolean;
  price_per_night: string;
  description: string;
  created_at: string;
  updated_at: string;
  images: { id: number; room_id: number; image_url: string; order: number; created_at: string; updated_at: string }[];
  status: boolean;
}

interface HotelReservation {
  id: string;
  customer_id: string;
  roomId: number;
  guestName: string;
  guestEmail: string;
  guests: number;
  phone: string;
  checkIn: Date;
  checkOut: Date;
  status: "confirmed" | "pending" | "cancelled";
  totalPrice: number;
}

interface ReservationTooltipProps {
  reservation: HotelReservation;
  rooms: Room[];
  handleEditReservation: (reservation: HotelReservation) => void;
  handleDeleteReservation: (id: string) => void;
  loading: boolean;
  leftPercent: number;
  widthPercent: number;
}

export default function ReservationTooltip({
  reservation,
  rooms,
  handleEditReservation,
  handleDeleteReservation,
  loading,
  leftPercent,
  widthPercent,
}: ReservationTooltipProps) {
  // Obtener idioma desde localStorage o usar "es" por defecto
  const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "es" : "es";
  const t = translations[lang as keyof typeof translations] || translations.es;

  const isStriped = reservation.status === "pending";
  
  // Encontrar la habitación correspondiente
  const room = rooms.find((r) => r.id === reservation.roomId);

  // Calcular días de estadía
  const calculateStayDays = () => {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Formatear fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(lang, { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Obtener color de estado
  const getStatusColor = () => {
    switch (reservation.status) {
      case "confirmed":
        return "rgb(34 197 94)"; // green-500
      case "pending":
        return "rgb(234 179 8)"; // yellow-500
      case "cancelled":
        return "rgb(239 68 68)"; // red-500
      default:
        return "rgb(96 165 250)"; // yellow-400
    }
  };

  // Obtener texto de estado
  const getStatusText = () => {
    switch (reservation.status) {
      case "confirmed":
        return t.confirmed;
      case "pending":
        return t.pending;
      case "cancelled":
        return t.cancelled;
      default:
        return t.unknown;
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
            <div className="font-semibold truncate w-full text-center text-[10px] leading-tight">
              {reservation.guestName}
            </div>
            <div className="flex items-center gap-1 text-[9px] mt-1">
              <Users className="w-2.5 h-2.5" />
              {reservation.guests}
            </div>
            {reservation.status === "cancelled" && (
              <div className="text-[8px] opacity-90">{t.cancelledLabel}</div>
            )}
          </div>
        </TooltipTrigger>

        <TooltipContent className="bg-zinc-100 border-2 text-zinc-800 p-4 rounded-lg shadow-xl max-w-xs">
          <div className="space-y-2">
            <div className="border-b border-zinc-300 pb-2">
              <p className="font-bold text-base text-yellow-600">{reservation.guestName}</p>
              <p className="text-xs text-zinc-500">{reservation.guestEmail}</p>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-sm">
                <span className="text-zinc-600">{t.room}:</span> {room?.room_number || t.roomNotFound}
              </p>
              <p className="text-sm">
                <span className="text-zinc-600">{t.type}:</span> {room?.room_type || t.typeNA}
              </p>
              <p className="text-sm">
                <span className="text-zinc-600">{t.guests}:</span> {reservation.guests}
              </p>
              <p className="text-sm">
                <span className="text-zinc-600">{t.phone}:</span> {reservation.phone || t.phoneNotAvailable}
              </p>
            </div>

            <div className="border-t border-zinc-300 pt-2 space-y-1.5">
              <p className="text-sm">
                <span className="text-zinc-600">{t.checkIn}:</span> {formatDate(reservation.checkIn)} {t.checkInTime}
              </p>
              <p className="text-sm">
                <span className="text-zinc-600">{t.checkOut}:</span> {formatDate(reservation.checkOut)} {t.checkOutTime}
              </p>
              <p className="text-sm">
                <span className="text-zinc-600">{t.stayDays}:</span> {calculateStayDays()} {calculateStayDays() === 1 ? t.day : t.days}
              </p>
            </div>

            <div className="border-t border-zinc-300 pt-2">
              <p className="text-sm">
                <span className="text-zinc-600">{t.status}:</span> 
                <span 
                  className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: getStatusColor(), color: 'white' }}
                >
                  {getStatusText()}
                </span>
              </p>
              <p className="text-sm mt-1">
                <span className="text-zinc-600">{t.total}:</span> 
                <span className="text-green-600 font-semibold ml-1">
                  ${typeof reservation.totalPrice === 'number' ? reservation.totalPrice.toFixed(2) : reservation.totalPrice}
                </span>
              </p>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-300">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditReservation(reservation);
                }}
                className="text-xs px-3 py-1.5 h-auto bg-yellow-400 hover:bg-yellow-500 text-white border-0"
                disabled={loading}
              >
                <Pencil className="w-3 h-3 mr-1" /> {t.edit}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(t.deleteConfirm)) {
                    handleDeleteReservation(reservation.id);
                  }
                }}
                className="text-xs px-3 py-1.5 h-auto bg-red-400 hover:bg-red-500 text-white"
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