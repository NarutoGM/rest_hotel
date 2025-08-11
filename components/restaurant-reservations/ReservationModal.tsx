"use client";
import type React from "react";
import { MouseEvent, useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { translations } from "../translations/rest_reservation_modal"; // New import

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
    customerId: string;
    guestEmail: string;
    phone: string;
    numberOfPeople: number;
    startTime: Date;
    endTime: Date;
    status: "confirmed" | "pending";
  };
  onClose: () => void;
  onSave: () => void;
  onReservationChange: (reservation: any) => void;
  onDateChange: (newDate: Date) => void;
}

interface AvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    available_tables: {
      id: number;
      table_number: string;
      capacity: number;
      location: string;
      status: string;
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
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [originalTableId, setOriginalTableId] = useState<number>(0);

  // Obtener idioma desde localStorage o usar "es" por defecto
  const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "es" : "es";
  const t = translations[lang as keyof typeof translations] || translations.es;

  const isErrorState = availabilityError === t.availabilityError;

  // Guardar mesa original en modo edición
  useEffect(() => {
    if (isEditing && newReservation.tableId && !originalTableId) {
      setOriginalTableId(newReservation.tableId);
    }
  }, [isEditing, newReservation.tableId, originalTableId]);

  // Verificar disponibilidad
  useEffect(() => {
    if (!isOpen) return;
    
    const checkAvailability = async () => {
      // Validar datos requeridos
      if (!newReservation.startTime || !newReservation.endTime || !newReservation.numberOfPeople) {
        const filteredTables = tables.filter(
          table => table.tableStatus === "available" && table.tableCapacity >= newReservation.numberOfPeople
        );
        setAvailableTables(filteredTables);
        return;
      }

      // Validar mismo día
      const startDate = new Date(newReservation.startTime);
      const endDate = new Date(newReservation.endTime);
      if (startDate.toDateString() !== endDate.toDateString()) {
        const filteredTables = tables.filter(
          table => table.tableStatus === "available" && table.tableCapacity >= newReservation.numberOfPeople
        );
        setAvailableTables(filteredTables);
        return;
      }

      setCheckingAvailability(true);
      setAvailabilityError(null);

      try {
        const response = await fetch("/api/check-availability-rest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservation_date: formatDate(newReservation.startTime),
            start_time: formatTime(newReservation.startTime),
            end_time: formatTime(newReservation.endTime),
            occupancy: newReservation.numberOfPeople,
          }),
        });

        if (!response.ok) throw new Error(t.availabilityError);

        const data: AvailabilityResponse = await response.json();

        if (data.success) {
          let transformedTables: Table[] = data.data.available_tables.map(table => ({
            id: table.id,
            tableNumber: table.table_number,
            tableCapacity: table.capacity,
            tableLocation: table.location,
            tableStatus: table.status,
          }));

          // Incluir mesa original en modo edición
          if (isEditing && originalTableId) {
            const originalTable = tables.find(table => table.id === originalTableId);
            if (originalTable && !transformedTables.find(table => table.id === originalTableId)) {
              transformedTables = [
                { ...originalTable, tableStatus: "current" },
                ...transformedTables
              ];
            }
          }

          setAvailableTables(transformedTables);

          // Resetear selección si la mesa actual no está disponible
          if (newReservation.tableId && !transformedTables.find(table => table.id === newReservation.tableId)) {
            handleInputChange("tableId", 0);
          }
        } else {
          throw new Error(data.message || t.availabilityError);
        }
      } catch (error) {
        setAvailabilityError(error instanceof Error ? error.message : t.availabilityError);
        
        let fallbackTables = tables.filter(
          table => table.tableStatus === "available" && table.tableCapacity >= newReservation.numberOfPeople
        );

        // Incluir mesa original en caso de error durante edición
        if (isEditing && originalTableId) {
          const originalTable = tables.find(table => table.id === originalTableId);
          if (originalTable && !fallbackTables.find(table => table.id === originalTableId)) {
            fallbackTables = [{ ...originalTable, tableStatus: "current" }, ...fallbackTables];
          }
        }
        
        setAvailableTables(fallbackTables);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [
    newReservation.startTime,
    newReservation.endTime,
    newReservation.numberOfPeople,
    isOpen,
    isEditing,
    originalTableId,
    tables,
  ]);

  // Reset al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      setOriginalTableId(0);
      setAvailabilityError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    onReservationChange({ ...newReservation, [field]: value });
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

    onDateChange(newDate);

    const newStartTime = new Date(year, month - 1, day);
    newStartTime.setHours(newReservation.startTime.getHours(), newReservation.startTime.getMinutes(), 0, 0);

    const newEndTime = new Date(year, month - 1, day);
    newEndTime.setHours(newReservation.endTime.getHours(), newReservation.endTime.getMinutes(), 0, 0);

    onReservationChange({ ...newReservation, startTime: newStartTime, endTime: newEndTime });
  };

  const handleNumPeople = (num: number) => {
    handleInputChange("numberOfPeople", num);
    setShowCustomNumInput(num > 5);
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

  const getTableStatusText = (table: Table) => {
    if (table.tableStatus === "current") return t.currentTable;
    return table.tableStatus === "available" ? t.availableTable : t.occupiedTable;
  };

  const getTableStatusClass = (table: Table) => {
    if (table.tableStatus === "current") return "bg-blue-100 text-blue-800";
    return table.tableStatus === "available" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const isFormValid = newReservation.guestName && newReservation.guestEmail && 
                     newReservation.phone && newReservation.tableId;

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl m-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {isEditing ? t.editReservation : t.newReservation}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información de la Reserva */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-800">{t.reservationInfo}</h4>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.reservationDate}</label>
                <input
                  type="date"
                  value={formatDate(newReservation.startTime)}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                  min={formatDate(new Date())}
                />
              </div>

              {/* Horas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.startTime}</label>
                  <input
                    type="time"
                    value={formatTime(newReservation.startTime)}
                    onChange={(e) => handleTimeChange("startTime", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.endTime}</label>
                  <input
                    type="time"
                    value={formatTime(newReservation.endTime)}
                    onChange={(e) => handleTimeChange("endTime", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Número de Personas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.numberOfPeople}</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      onClick={() => handleNumPeople(num)}
                      className={`px-3 py-1 text-sm ${
                        newReservation.numberOfPeople === num && !showCustomNumInput
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-800"
                      } rounded hover:bg-blue-500 hover:text-white transition-colors`}
                      disabled={loading}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setShowCustomNumInput(true)}
                    className={`px-3 py-1 text-sm ${
                      showCustomNumInput ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                    } rounded hover:bg-blue-500 hover:text-white transition-colors`}
                    disabled={loading}
                  >
                    {t.more}
                  </Button>
                </div>
                {showCustomNumInput && (
                  <input
                    type="number"
                    value={newReservation.numberOfPeople}
                    onChange={(e) => handleInputChange("numberOfPeople", parseInt(e.target.value) || 1)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    min="1"
                    disabled={loading}
                  />
                )}
              </div>

              {/* Estados de disponibilidad */}
              {checkingAvailability && (
                <div className="p-2 bg-blue-100 text-blue-700 rounded text-sm">
                  {t.checkingAvailability}
                </div>
              )}

              {availabilityError && (
                <div className="p-2 bg-red-100 text-orange-700 rounded text-sm">
                  {t.availabilityError}
                </div>
              )}

              {/* Selección de Mesa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.selectTable}
                  {!checkingAvailability && (
                    <span className="text-xs text-green-600 ml-2">
                      ({availableTables.length} {availableTables.length === 1 ? t.available : t.availablePlural})
                    </span>
                  )}
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-white p-2 border rounded">
                  {checkingAvailability ? (
                    <p className="text-sm text-gray-500 p-2">{t.checkingAvailability}</p>
                  ) : availableTables.length > 0 ? (
                    availableTables.map((table) => (
                      <div
                        key={table.id}
                        className={`p-2 border rounded text-sm transition-colors ${
                          newReservation.tableId === table.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        } cursor-pointer`}
                        onClick={() => handleInputChange("tableId", table.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{t.tableNumber} {table.tableNumber}</div>
                            <div className="text-xs text-gray-600">{t.capacity}: {table.tableCapacity} {t.people}</div>
                            {table.tableLocation && (
                              <div className="text-xs text-gray-500">{table.tableLocation}</div>
                            )}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${getTableStatusClass(table)}`}>
                            {getTableStatusText(table)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-2">
                      {t.noTablesAvailable}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div><strong>{t.reservedTable}:</strong> {newReservation.tableId ? `${t.tableNumber} ${availableTables.find(t => t.id === newReservation.tableId)?.tableNumber || newReservation.tableId}` : t.notSelected}</div>
            <div className="bg-green-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-800">{t.clientInfo}</h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.clientName}</label>
                <input
                  value={newReservation.guestName}
                  onChange={(e) => handleInputChange("guestName", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={t.placeholderName}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.email}</label>
                <input
                  type="email"
                  value={newReservation.guestEmail}
                  onChange={(e) => handleInputChange("guestEmail", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={t.placeholderEmail}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.phone}</label>
                <input
                  type="tel"
                  value={newReservation.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={t.placeholderPhone}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.status}</label>
                <select
                  value={newReservation.status}
                  onChange={(e) => handleInputChange("status", e.target.value as "confirmed" | "pending")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                >
                  <option value="pending">{t.pending}</option>
                  <option value="confirmed">{t.confirmed}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
          <Button
            onClick={onSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            disabled={loading || isErrorState || !isFormValid}
          >
            {loading ? (isEditing ? t.updating : t.creating) : (isEditing ? t.updateButton : t.saveButton)}
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            disabled={loading}
          >
            {t.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}