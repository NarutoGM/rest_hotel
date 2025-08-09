"use client";
import type React from "react";
import { MouseEvent, useState, useEffect } from "react";
import { Button } from "../../components/ui/button";

interface Table {
  id: number;
  tableNumber: string;
  tableCapacity: number;
  tableLocation: string;
  tableStatus: string;
}

interface ReservationModalProps {
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  tables: Table[];
  newReservation: {
    tableId: number;
    guestName: string;
    customerId: string; // Added customerId
    guestEmail: string;
    phone: string;
    numberOfPeople: number;
    startTime: Date;
    endTime: Date;
    status: "confirmed" | "pending";
  };
  onClose: () => void;
  onSave: () => void;
  onReservationChange: (reservation: {
    tableId: number;
    guestName: string;
    customerId: string; // Added customerId
    guestEmail: string;
    phone: string;
    numberOfPeople: number;
    startTime: Date;
    endTime: Date;
    status: "confirmed" | "pending";
  }) => void;
  onDateChange: (newDate: Date) => void;
}

interface AvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    specific_table_available: boolean | null;
    available_tables_count: number;
    available_tables: {
      id: number;
      table_number: string;
      capacity: number;
      location: string;
      status: string;
      created_at: string;
      updated_at: string;
    }[];
  };
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
  onDateChange,
}: ReservationModalProps) {
  const [showCustomNumInput, setShowCustomNumInput] = useState(false);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Check if the specific error is present to disable modifications
  const isErrorState = availabilityError === "Error al verificar disponibilidad";

  // Verificar disponibilidad cuando cambien la fecha, horas o número de personas
  useEffect(() => {
    if (!isOpen) return;
    console.log(newReservation);
    const checkAvailability = async () => {
      // Solo verificar si tenemos fecha, horas y número de personas válidos
      if (
        !newReservation.startTime ||
        !newReservation.endTime ||
        !newReservation.numberOfPeople
      ) {
        setAvailableTables(
          tables.filter(
            (table) =>
              table.tableStatus === "available" &&
              table.tableCapacity >= newReservation.numberOfPeople
          )
        );
        return;
      }

      // No verificar disponibilidad si estamos editando (mantener mesa original)
      if (isEditing) {
        setAvailableTables(tables.filter((table) => table.tableStatus === "available"));
        setAvailabilityChecked(true);
        return;
      }

      // Verificar que las horas sean del mismo día
      const startDate = new Date(newReservation.startTime);
      const endDate = new Date(newReservation.endTime);
      if (startDate.toDateString() !== endDate.toDateString()) {
        setAvailableTables(
          tables.filter(
            (table) =>
              table.tableStatus === "available" &&
              table.tableCapacity >= newReservation.numberOfPeople
          )
        );
        return;
      }

      setCheckingAvailability(true);
      setAvailabilityError(null);

      try {
        const reservationDate = formatDate(newReservation.startTime);
        const startTime = formatTime(newReservation.startTime);
        const endTime = formatTime(newReservation.endTime);

        const response = await fetch("/api/check-availability-rest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservation_date: reservationDate,
            start_time: startTime,
            end_time: endTime,
            occupancy: newReservation.numberOfPeople,
          }),
        });

        if (!response.ok) {
          throw new Error("Error al verificar disponibilidad");
        }

        const data: AvailabilityResponse = await response.json();
        console.log("Availability response:", data);

        if (data.success) {
          // Transformar las mesas de la API al formato del frontend
          const transformedTables: Table[] = data.data.available_tables.map((table) => ({
            id: table.id,
            tableNumber: table.table_number,
            tableCapacity: table.capacity,
            tableLocation: table.location,
            tableStatus: table.status,
          }));

          setAvailableTables(transformedTables);
          setAvailabilityChecked(true);

          // Si la mesa seleccionada ya no está disponible, resetear selección
          if (
            newReservation.tableId &&
            !transformedTables.find((table) => table.id === newReservation.tableId)
          ) {
            handleInputChange("tableId", 0);
          }
        } else {
          throw new Error(data.message || "Error al verificar disponibilidad");
        }
      } catch (error) {
        console.error("Error checking availability:", error);
        setAvailabilityError(error instanceof Error ? error.message : "Error desconocido");
        // En caso de error, mostrar todas las mesas que cumplan capacidad básica
        setAvailableTables(
          tables.filter(
            (table) =>
              table.tableStatus === "available" &&
              table.tableCapacity >= newReservation.numberOfPeople
          )
        );
      } finally {
        setCheckingAvailability(false);
      }
    };

    // Debounce la verificación para evitar muchas llamadas
    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [
    newReservation.startTime,
    newReservation.endTime,
    newReservation.numberOfPeople,
    isOpen,
    isEditing,
    tables,
  ]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    // Prevent changes if in error state
    if (isErrorState) return;
    onReservationChange({
      ...newReservation,
      [field]: value,
    });
  };

  const handleTimeChange = (field: "startTime" | "endTime", timeString: string) => {
    // Prevent changes if in error state
    if (isErrorState) return;
    const [hours, minutes] = timeString.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;
    const newTime = new Date(newReservation[field]);
    newTime.setHours(hours, minutes, 0, 0);
    handleInputChange(field, newTime);
    setAvailabilityChecked(false); // Resetear estado para nueva verificación
  };

  const handleDateChange = (dateString: string) => {
    // Prevent changes if in error state
    if (isErrorState) return;
    if (!dateString) return;

    const [year, month, day] = dateString.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);

    if (isNaN(newDate.getTime())) return;

    // Update parent component's currentDate
    onDateChange(newDate);

    const currentStartTime = new Date(newReservation.startTime);
    const currentEndTime = new Date(newReservation.endTime);

    const newStartTime = new Date(year, month - 1, day);
    newStartTime.setHours(currentStartTime.getHours(), currentStartTime.getMinutes(), 0, 0);

    const newEndTime = new Date(year, month - 1, day);
    newEndTime.setHours(currentEndTime.getHours(), currentEndTime.getMinutes(), 0, 0);

    onReservationChange({
      ...newReservation,
      startTime: newStartTime,
      endTime: newEndTime,
    });

    setAvailabilityChecked(false); // Resetear estado para nueva verificación
  };

  const handleNumPeople = (num: number) => {
    // Prevent changes if in error state
    if (isErrorState) return;
    handleInputChange("numberOfPeople", num);
    setShowCustomNumInput(num > 5);
    setAvailabilityChecked(false); // Resetear estado para nueva verificación
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  return (
    <div
      className="fixed inset-0 border bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl m-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {isEditing ? "Editar Reserva" : "Nueva Reserva"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda - Información Básica */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Información de la Reserva</h4>

              {/* Fecha */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Reserva
                </label>
                <input
                  type="date"
                  value={formatDate(newReservation.startTime)}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading || isErrorState}
                  min={formatDate(new Date())} // No permitir fechas pasadas
                />
              </div>

              {/* Hora de Inicio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={formatTime(newReservation.startTime)}
                  onChange={(e) => handleTimeChange("startTime", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading || isErrorState}
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
                  disabled={loading || isErrorState}
                />
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Información del Cliente</h4>

              {/* Nombre del Cliente */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cliente *
                </label>
                <input
                  value={newReservation.guestName}
                  onChange={(e) => handleInputChange("guestName", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ingrese el nombre del cliente"
                  disabled={loading || isErrorState}
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newReservation.guestEmail}
                  onChange={(e) => handleInputChange("guestEmail", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ingrese el email del cliente"
                  disabled={loading || isErrorState}
                  required
                />
              </div>

              {/* Teléfono */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={newReservation.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ingrese el número de teléfono"
                  disabled={loading || isErrorState}
                  required
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
                  disabled={loading || isErrorState}
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Mesas y Capacidad */}
          <div className="space-y-4">
            {/* Número de Personas */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Número de Personas</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Button
                    key={num}
                    onClick={() => handleNumPeople(num)}
                    className={`px-4 py-2 ${
                      newReservation.numberOfPeople === num && !showCustomNumInput
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    } rounded-lg hover:bg-blue-500 hover:text-white transition-colors`}
                    disabled={loading || isErrorState}
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
                  disabled={loading || isErrorState}
                >
                  Más
                </Button>
              </div>
              {showCustomNumInput && (
                <input
                  type="number"
                  value={newReservation.numberOfPeople}
                  onChange={(e) =>
                    handleInputChange("numberOfPeople", Number.parseInt(e.target.value) || 1)
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  min="1"
                  disabled={loading || isErrorState}
                />
              )}
            </div>

            {/* Estado de verificación de disponibilidad */}
            {checkingAvailability && (
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                Verificando disponibilidad...
              </div>
            )}

            {availabilityError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {availabilityError}
              </div>
            )}

            {/* Selección de Mesa */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Mesa
                {availabilityChecked && !checkingAvailability && (
                  <span className="text-xs text-green-600 ml-2">
                    ({availableTables.length} disponible{availableTables.length !== 1 ? "s" : ""})
                  </span>
                )}
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {checkingAvailability ? (
                  <p className="text-sm text-gray-500 p-2">Verificando disponibilidad...</p>
                ) : availableTables.length > 0 ? (
                  availableTables.map((table) => (
                    <div
                      key={table.id}
                      className={`p-3 border rounded-lg transition-colors ${
                        newReservation.tableId === table.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      } ${isErrorState ? "" : "cursor-pointer"}`}
                      onClick={() => (isErrorState ? null : handleInputChange("tableId", table.id))}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-sm">Mesa {table.tableNumber}</div>
                          <div className="text-xs text-gray-600">
                            Capacidad: {table.tableCapacity} personas
                          </div>
                          {table.tableLocation && (
                            <div className="text-xs text-gray-500">{table.tableLocation}</div>
                          )}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded ${
                            table.tableStatus === "available"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {table.tableStatus === "available" ? "Disponible" : "Ocupada"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 p-2">
                    No hay mesas disponibles para la fecha, hora y número de personas seleccionados
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
          <Button
            onClick={onSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            disabled={
              loading ||
              isErrorState ||
              !newReservation.guestName ||
              !newReservation.guestEmail ||
              !newReservation.phone ||
              !newReservation.tableId
            }
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
  );
}