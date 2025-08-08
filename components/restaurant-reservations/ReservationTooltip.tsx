"use client";
import type React from "react";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { Users, Pencil, Trash2 } from "lucide-react";

interface Table {
  id: string;
  name: string;
  capacityMin: number;
  capacityMax: number;
  area: string;
}

interface RestaurantReservation {
  id: string;
  tableId: string;
  customerName: string;
  num: number;
  phone: string;
  startTime: Date;
  endTime: Date;
  status: "confirmed" | "pending" | "cancelled";
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
  tables,
  handleEditReservation,
  handleDeleteReservation,
  loading,
  leftPercent,
  widthPercent,
}: ReservationTooltipProps) {
  const isStriped = reservation.status === "pending";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute top-1 rounded-md flex flex-col items-center justify-center text-white text-xs p-2 overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              height: "calc(100% - 8px)",
              zIndex: 20,
              backgroundColor: isStriped ? "rgb(134 239 172)" : "rgb(96 165 250)",
              backgroundImage: isStriped
                ? `repeating-linear-gradient(
                    45deg,
                    rgba(255,255,255,.1),
                    rgba(255,255,255,.1) 5px,
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
              {reservation.customerName}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Users className="w-3 h-3" />
              {reservation.num}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white p-3 rounded-lg shadow-xl">
          <div className="space-y-1">
            <p className="font-bold text-sm">{reservation.customerName}</p>
            <p className="text-xs">Mesa: {tables.find((t) => t.id === reservation.tableId)?.name}</p>
            <p className="text-xs">Personas: {reservation.num}</p>
            <p className="text-xs">Telefono: {reservation?.phone}</p>
            <p className="text-xs">
              Inicio: {reservation.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs">
              Fin: {reservation.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs">
              Estado: {reservation.status === "confirmed" ? "Confirmado" : reservation.status === "pending" ? "Pendiente" : "Cancelado"}
            </p>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditReservation(reservation);
                }}
                className="text-xs px-2 py-1 h-auto"
                disabled={loading}
              >
                <Pencil className="w-3 h-3 mr-1" /> Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteReservation(reservation.id);
                }}
                className="text-xs px-2 py-1 h-auto"
                disabled={loading}
              >
                <Trash2 className="w-3 h-3 mr-1" /> Eliminar
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}