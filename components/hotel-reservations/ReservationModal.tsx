"use client";
import type React from "react";
import { MouseEvent, useState, useEffect } from "react";
import { Button } from "../../components/ui/button";

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
  roomId: number;
  customer_id: string; // Agregado para vincular con el cliente
  guestName: string;
  guestEmail: string;
  guests: number;
  phone: string;
  checkIn: Date;
  checkOut: Date;
  status: "confirmed" | "pending" | "cancelled";
  totalPrice: number;
}

interface ReservationModalProps {
  isOpen: boolean;
  isEditing: boolean;
  loading: boolean;
  rooms: Room[];
  newReservation: HotelReservation;
  onClose: () => void;
  onSave: () => void;
  onReservationChange: (reservation: HotelReservation) => void;
  onDateChange: (newDate: Date) => void;
}

interface AvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    specific_room_available: boolean | null;
    available_rooms_count: number;
    available_rooms: Room[];
  };
}

export default function ReservationModal({
  isOpen,
  isEditing,
  loading,
  rooms,
  newReservation,
  onClose,
  onSave,
  onReservationChange,
  onDateChange,
}: ReservationModalProps) {
  const [showCustomGuestsInput, setShowCustomGuestsInput] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Verificar disponibilidad cuando cambien las fechas o el número de huéspedes
  useEffect(() => {
    if (!isOpen) return;
    
    const checkAvailability = async () => {
      // Solo verificar si tenemos fechas válidas y huéspedes
      if (!newReservation.checkIn || !newReservation.checkOut || !newReservation.guests) {
        setAvailableRooms(rooms.filter(room => room.status && room.capacity >= newReservation.guests));
        return;
      }

      // No verificar disponibilidad si estamos editando (mantener habitación original)
      if (isEditing) {
        setAvailableRooms(rooms.filter(room => room.status));
        setAvailabilityChecked(true);
        return;
      }

      setCheckingAvailability(true);
      setAvailabilityError(null);

      try {
        const checkInDate = formatDate(newReservation.checkIn);
        const checkOutDate = formatDate(newReservation.checkOut);
        
        const response = await fetch('/api/check-availability-hotel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            occupancy: newReservation.guests,
          }),
        });
        if (!response.ok) {
          throw new Error('Error al verificar disponibilidad');
        }

        const data: AvailabilityResponse = await response.json();
        console.log('Availability response:', data);
        if (data.success) {
          setAvailableRooms(data.data.available_rooms);
          setAvailabilityChecked(true);
          
          // Si la habitación seleccionada ya no está disponible, resetear selección
          if (newReservation.roomId && !data.data.available_rooms.find(room => room.id === newReservation.roomId)) {
            handleInputChange('roomId', 0);
          }
        } else {
          throw new Error(data.message || 'Error al verificar disponibilidad');
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailabilityError(error instanceof Error ? error.message : 'Error desconocido');
        // En caso de error, mostrar todas las habitaciones que cumplan capacidad básica
        setAvailableRooms(rooms.filter(room => room.status && room.capacity >= newReservation.guests));
      } finally {
        setCheckingAvailability(false);
      }
    };

    // Debounce la verificación para evitar muchas llamadas
    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [newReservation.checkIn, newReservation.checkOut, newReservation.guests, isOpen, isEditing, rooms]);

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

  const handleDateChange = (field: "checkIn" | "checkOut", dateString: string) => {
    if (!dateString) return;
    const [year, month, day] = dateString.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);
    if (isNaN(newDate.getTime())) return;

    if (field === "checkIn") {
      onDateChange(newDate);
    }

    handleInputChange(field, newDate);
    setAvailabilityChecked(false); // Resetear estado para nueva verificación
  };

  const handleGuestsChange = (num: number) => {
    handleInputChange("guests", num);
    setShowCustomGuestsInput(num > 5);
    setAvailabilityChecked(false); // Resetear estado para nueva verificación
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Calcular precio total estimado
  const calculateTotalPrice = () => {
    if (!newReservation.roomId || !newReservation.checkIn || !newReservation.checkOut) return 0;
    
    const selectedRoom = availableRooms.find(room => room.id === newReservation.roomId);
    if (!selectedRoom) return 0;
    
    const diffTime = Math.abs(newReservation.checkOut.getTime() - newReservation.checkIn.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights * parseFloat(selectedRoom.price_per_night);
  };

  const totalPrice = calculateTotalPrice();

  return (
    <div
      className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-2xl m-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {isEditing ? "Editar Reserva" : "Nueva Reserva"}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda - Información de Fechas y Huéspedes */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Información de la Estadía</h4>
              
              {/* Check-In Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Check-In
                </label>
                <input
                  type="date"
                  value={formatDate(newReservation.checkIn)}
                  onChange={(e) => handleDateChange("checkIn", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                  min={formatDate(new Date())} // No permitir fechas pasadas
                />
              </div>

              {/* Check-Out Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Check-Out
                </label>
                <input
                  type="date"
                  value={formatDate(newReservation.checkOut)}
                  onChange={(e) => handleDateChange("checkOut", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                  min={formatDate(new Date(newReservation.checkIn.getTime() + 24 * 60 * 60 * 1000))} // Mínimo un día después del check-in
                />
              </div>

              {/* Número de Huéspedes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Huéspedes
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      onClick={() => handleGuestsChange(num)}
                      className={`px-4 py-2 ${
                        newReservation.guests === num && !showCustomGuestsInput
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-800"
                      } rounded-lg hover:bg-blue-500 hover:text-white transition-colors`}
                      disabled={loading}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setShowCustomGuestsInput(true)}
                    className={`px-4 py-2 ${
                      showCustomGuestsInput
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    } rounded-lg hover:bg-blue-500 hover:text-white transition-colors`}
                    disabled={loading}
                  >
                    Más
                  </Button>
                </div>
                {showCustomGuestsInput && (
                  <input
                    type="number"
                    value={newReservation.guests}
                    onChange={(e) =>
                      handleInputChange("guests", Number.parseInt(e.target.value) || 1)
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    min="1"
                    disabled={loading}
                  />
                )}
              </div>
            </div>

            {/* Información del Huésped */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Información del Huésped</h4>
              
              {/* Nombre del Huésped */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Huésped *
                </label>
                <input
                  value={newReservation.guestName}
                  onChange={(e) => handleInputChange("guestName", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ingrese el nombre del huésped"
                  disabled={loading}
                  required
                />
              </div>

              {/* Email del Huésped */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newReservation.guestEmail}
                  onChange={(e) => handleInputChange("guestEmail", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ingrese el email del huésped"
                  disabled={loading}
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
                  disabled={loading}
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
                    handleInputChange("status", e.target.value as "confirmed" | "pending" | "cancelled")
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading}
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Habitaciones y Precio */}
          <div className="space-y-4">
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

            {/* Habitación */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Habitación
                {availabilityChecked && !checkingAvailability && (
                  <span className="text-xs text-green-600 ml-2">
                    ({availableRooms.length} disponible{availableRooms.length !== 1 ? 's' : ''})
                  </span>
                )}
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {checkingAvailability ? (
                  <p className="text-sm text-gray-500 p-2">Verificando disponibilidad...</p>
                ) : availableRooms.length > 0 ? (
                  availableRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        newReservation.roomId === room.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                      onClick={() => handleInputChange("roomId", room.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{room.room_number}</div>
                          <div className="text-xs text-gray-600">
                            {room.room_type} • {room.capacity} huésped{room.capacity !== 1 ? 'es' : ''} • {room.number_of_beds} cama{room.number_of_beds !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {room.has_wifi && 'WiFi • '}
                            {room.has_air_conditioning && 'A/C • '}
                            {room.has_tv && 'TV • '}
                            {room.has_minibar && 'Minibar • '}
                            {room.has_balcony && 'Balcón'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            ${room.price_per_night}
                          </div>
                          <div className="text-xs text-gray-500">por noche</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 p-2">
                    No hay habitaciones disponibles para las fechas y número de huéspedes seleccionados
                  </p>
                )}
              </div>
            </div>

            {/* Precio Total */}
            {totalPrice > 0 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-sm text-gray-700 mb-1">Precio Total Estimado</div>
                  <div className="text-2xl font-bold text-green-600">${totalPrice.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">
                    {Math.ceil(Math.abs(newReservation.checkOut.getTime() - newReservation.checkIn.getTime()) / (1000 * 60 * 60 * 24))} noche{Math.ceil(Math.abs(newReservation.checkOut.getTime() - newReservation.checkIn.getTime()) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
          <Button
            onClick={onSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            disabled={loading || !newReservation.guestName || !newReservation.guestEmail || !newReservation.phone || !newReservation.roomId}
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