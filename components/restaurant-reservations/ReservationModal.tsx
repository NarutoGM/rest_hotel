"use client";
import type React from "react";
import { MouseEvent, useState } from "react";
import { Button } from "../../components/ui/button";

interface Table {
  id: string;
  name: string;
  capacityMin: number;
  capacityMax: number;
  area: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  tables: Table[];
  newReservation: {
    tableId: string;
    customerName: string;
    phone: string;
    num: number;
    startTime: Date;
    endTime: Date;
    status: "confirmed" | "pending";
  };
  onClose: () => void;
  onSave: () => void;
  onReservationChange: (reservation: {
    tableId: string;
    customerName: string;
    phone: string;
    num: number;
    startTime: Date;
    endTime: Date;
    status: "confirmed" | "pending";
  }) => void;
  onDateChange: (newDate: Date) => void; // Added prop
}

export default function ReservationModal({
  isOpen,
  isEditing,
  loading,
  tables,
  newReservation,
  onClose,
  onSave,
  onReservationChange,
  onDateChange, // Destructure new prop
}: ReservationModalProps) {
  const [showCustomNumInput, setShowCustomNumInput] = useState(false);

  if (!isOpen) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    onReservationChange({
      ...newReservation,
      [field]: value,
    });
  };

  const handleTimeChange = (field: "startTime" | "endTime", timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;
    const newTime = new Date(newReservation[field]);
    newTime.setHours(hours, minutes, 0, 0);
    handleInputChange(field, newTime);
  };

  const handleDateChange = (dateString: string) => {
    if (!dateString) return;

    const [year, month, day] = dateString.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);

    if (isNaN(newDate.getTime())) return;

    // Update parent component's currentDate
    onDateChange(newDate);

    const currentStartTime = new Date(newReservation.startTime);
    const currentEndTime = new Date(newReservation.endTime);

    const newStartTime = new Date(year, month - 1, day);
    newStartTime.setHours(
      currentStartTime.getHours(),
      currentStartTime.getMinutes(),
      0,
      0
    );

    const newEndTime = new Date(year, month - 1, day);
    newEndTime.setHours(
      currentEndTime.getHours(),
      currentEndTime.getMinutes(),
      0,
      0
    );

    onReservationChange({
      ...newReservation,
      startTime: newStartTime,
      endTime: newEndTime,
    });
  };

  const handleNumPeople = (num: number) => {
    handleInputChange("num", num);
    setShowCustomNumInput(num > 5);
  };

  const availableTables = tables.filter(
    (table) =>
      table.capacityMin <= newReservation.num &&
      table.capacityMax >= newReservation.num
  );

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  return (
    <div
      className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl m-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {isEditing ? "Editar Reserva" : "Nueva Reserva"}
        </h3>

        <div className="space-y-4">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={formatDate(newReservation.startTime)}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
          </div>

          {/* Número de Personas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Personas
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <Button
                  key={num}
                  onClick={() => handleNumPeople(num)}
                  className={`px-4 py-2 ${
                    newReservation.num === num && !showCustomNumInput
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  } rounded-lg hover:bg-blue-500 hover:text-white transition-colors`}
                  disabled={loading}
                >
                  {num}
                </Button>
              ))}
              <Button
                onClick={() => setShowCustomNumInput(true)}
                className={`px-4 py-2 ${
                  showCustomNumInput
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                } rounded-lg hover:bg-blue-500 hover:text-white transition-colors`}
                disabled={loading}
              >
                Más
              </Button>
            </div>
            {showCustomNumInput && (
              <input
                type="number"
                value={newReservation.num}
                onChange={(e) =>
                  handleInputChange("num", Number.parseInt(e.target.value) || 1)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                min="1"
                disabled={loading}
              />
            )}
          </div>

          {/* Mesa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mesa
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTables.length > 0 ? (
                availableTables.map((table) => (
                  <Button
                    key={table.id}
                    onClick={() => handleInputChange("tableId", table.id)}
                    className={`px-4 py-2 ${
                      newReservation.tableId === table.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    } rounded-lg hover:bg-blue-500 hover:text-white transition-colors`}
                    disabled={loading}
                  >
                    {table.name} ({table.capacityMin}-{table.capacityMax})
                  </Button>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No hay mesas disponibles para {newReservation.num} personas
                </p>
              )}
            </div>
          </div>

          {/* Nombre del Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Cliente
            </label>
            <input
              value={newReservation.customerName}
              onChange={(e) => handleInputChange("customerName", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ingrese el nombre del cliente"
              disabled={loading}
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={newReservation.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ingrese el número de teléfono"
              disabled={loading}
            />
          </div>

          {/* Hora de Inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de Inicio
            </label>
            <input
              type="time"
              value={formatTime(newReservation.startTime)}
              onChange={(e) => handleTimeChange("startTime", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
          </div>

          {/* Hora de Fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora de Fin
            </label>
            <input
              type="time"
              value={formatTime(newReservation.endTime)}
              onChange={(e) => handleTimeChange("endTime", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={newReservation.status}
              onChange={(e) =>
                handleInputChange("status", e.target.value as "confirmed" | "pending")
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            >
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmado</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onSave}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={loading}
            >
              {loading
                ? isEditing
                  ? "Actualizando..."
                  : "Creando..."
                : isEditing
                ? "Actualizar Reserva"
                : "Crear Reserva"}
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}