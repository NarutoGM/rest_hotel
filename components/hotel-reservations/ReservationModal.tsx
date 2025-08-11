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
  status: boolean;
  images: { id: number; room_id: number; image_url: string; order: number }[];
}

interface HotelReservation {
  id: string;
  roomId: number;
  customer_id: string;
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
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [originalRoomId, setOriginalRoomId] = useState<number>(0);

  const isErrorState = availabilityError === "Error al verificar disponibilidad";

  // Guardar habitación original en modo edición
  useEffect(() => {
    if (isEditing && newReservation.roomId && !originalRoomId) {
      setOriginalRoomId(newReservation.roomId);
    }
  }, [isEditing, newReservation.roomId, originalRoomId]);

  // Verificar disponibilidad
  useEffect(() => {
    if (!isOpen) return;
    
    const checkAvailability = async () => {
      // Validar datos requeridos
      if (!newReservation.checkIn || !newReservation.checkOut || !newReservation.guests) {
        const filteredRooms = rooms.filter(room => room.status && room.capacity >= newReservation.guests);
        setAvailableRooms(filteredRooms);
        return;
      }

      setCheckingAvailability(true);
      setAvailabilityError(null);

      try {
        const response = await fetch('/api/check-availability-hotel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            check_in_date: formatDate(newReservation.checkIn),
            check_out_date: formatDate(newReservation.checkOut),
            occupancy: newReservation.guests,
          }),
        });

        if (!response.ok) throw new Error('Error al verificar disponibilidad');

        const data: AvailabilityResponse = await response.json();

        if (data.success) {
          let transformedRooms = data.data.available_rooms;

          // Incluir habitación original en modo edición
          if (isEditing && originalRoomId) {
            const originalRoom = rooms.find(room => room.id === originalRoomId);
            if (originalRoom && !transformedRooms.find(room => room.id === originalRoomId)) {
              transformedRooms = [
                { ...originalRoom, status: true, room_type: "current" }, // Marcar como habitación actual
                ...transformedRooms
              ];
            } else if (originalRoom) {
              // Si la habitación original está en la lista, marcarla como actual
              transformedRooms = transformedRooms.map(room => 
                room.id === originalRoomId 
                  ? { ...room, room_type: "current" }
                  : room
              );
            }
          }

          setAvailableRooms(transformedRooms);

          // Resetear selección si la habitación actual no está disponible
          if (newReservation.roomId && !transformedRooms.find(room => room.id === newReservation.roomId)) {
            handleInputChange('roomId', 0);
          }
        } else {
          throw new Error(data.message || 'Error al verificar disponibilidad');
        }
      } catch (error) {
        setAvailabilityError(error instanceof Error ? error.message : 'Error desconocido');
        
        let fallbackRooms = rooms.filter(room => room.status && room.capacity >= newReservation.guests);

        // Incluir habitación original en caso de error durante edición
        if (isEditing && originalRoomId) {
          const originalRoom = rooms.find(room => room.id === originalRoomId);
          if (originalRoom && !fallbackRooms.find(room => room.id === originalRoomId)) {
            fallbackRooms = [{ ...originalRoom, room_type: "current" }, ...fallbackRooms];
          } else if (originalRoom) {
            // Marcar la habitación original como actual si ya está en la lista
            fallbackRooms = fallbackRooms.map(room => 
              room.id === originalRoomId 
                ? { ...room, room_type: "current" }
                : room
            );
          }
        }
        
        setAvailableRooms(fallbackRooms);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [
    newReservation.checkIn,
    newReservation.checkOut,
    newReservation.guests,
    isOpen,
    isEditing,
    originalRoomId,
    rooms,
  ]);

  // Reset al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      setOriginalRoomId(0);
      setAvailabilityError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    if (isErrorState) return;
    onReservationChange({ ...newReservation, [field]: value });
  };

  const handleDateChange = (field: "checkIn" | "checkOut", dateString: string) => {
    if (isErrorState || !dateString) return;

    const [year, month, day] = dateString.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);
    if (isNaN(newDate.getTime())) return;

    if (field === "checkIn") onDateChange(newDate);
    handleInputChange(field, newDate);
  };

  const handleGuestsChange = (num: number) => {
    if (isErrorState) return;
    handleInputChange("guests", num);
    setShowCustomGuestsInput(num > 5);
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Calcular precio total
  const calculateTotalPrice = () => {
    if (!newReservation.roomId || !newReservation.checkIn || !newReservation.checkOut) return 0;
    
    const selectedRoom = availableRooms.find(room => room.id === newReservation.roomId);
    if (!selectedRoom) return 0;
    
    const diffTime = Math.abs(newReservation.checkOut.getTime() - newReservation.checkIn.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights * parseFloat(selectedRoom.price_per_night);
  };

  const getRoomStatusText = (room: Room) => {
    if (room.room_type === "current") return "Habitación Actual";
    return "Disponible";
  };

  const getRoomStatusClass = (room: Room) => {
    if (room.room_type === "current") return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  const totalPrice = calculateTotalPrice();
  const nights = newReservation.checkIn && newReservation.checkOut 
    ? Math.ceil(Math.abs(newReservation.checkOut.getTime() - newReservation.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isFormValid = newReservation.guestName && newReservation.guestEmail && 
                     newReservation.phone && newReservation.roomId;

  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl shadow-2xl m-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {isEditing ? "Editar Reserva" : "Nueva Reserva"}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de la Estadía */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-800">Información de la Estadía</h4>
              
              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-In</label>
                  <input
                    type="date"
                    value={formatDate(newReservation.checkIn)}
                    onChange={(e) => handleDateChange("checkIn", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading || isErrorState}
                    min={formatDate(new Date())}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-Out</label>
                  <input
                    type="date"
                    value={formatDate(newReservation.checkOut)}
                    onChange={(e) => handleDateChange("checkOut", e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={loading || isErrorState}
                    min={formatDate(new Date(newReservation.checkIn.getTime() + 24 * 60 * 60 * 1000))}
                  />
                </div>
              </div>

              {/* Número de Huéspedes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Huéspedes</label>
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
                      disabled={loading || isErrorState}
                    >
                      {num}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setShowCustomGuestsInput(true)}
                    className={`px-4 py-2 ${
                      showCustomGuestsInput ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                    } rounded-lg hover:bg-blue-500 hover:text-white transition-colors`}
                    disabled={loading || isErrorState}
                  >
                    Más
                  </Button>
                </div>
                {showCustomGuestsInput && (
                  <input
                    type="number"
                    value={newReservation.guests}
                    onChange={(e) => handleInputChange("guests", parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    min="1"
                    disabled={loading || isErrorState}
                  />
                )}
              </div>

              {/* Estados de disponibilidad */}
              {checkingAvailability && (
                <div className="p-2 bg-blue-100 text-blue-700 rounded text-sm">
                  Verificando disponibilidad...
                </div>
              )}

              {availabilityError && (
                <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
                  {availabilityError}
                </div>
              )}

              {/* Selección de Habitación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Habitación
                  {!checkingAvailability && (
                    <span className="text-xs text-green-600 ml-2">
                      ({availableRooms.length} disponible{availableRooms.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-white p-2 border rounded">
                  {checkingAvailability ? (
                    <p className="text-sm text-gray-500 p-2">Verificando disponibilidad...</p>
                  ) : availableRooms.length > 0 ? (
                    availableRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-2 border rounded text-sm transition-colors ${
                          newReservation.roomId === room.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        } ${isErrorState ? "" : "cursor-pointer"}`}
                        onClick={() => !isErrorState && handleInputChange("roomId", room.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Habitación {room.room_number}</div>
                            <div className="text-xs text-gray-600">
                              {room.room_type !== "current" ? room.room_type : rooms.find(r => r.id === room.id)?.room_type || room.room_type} • {room.capacity} huésped{room.capacity !== 1 ? 'es' : ''} • {room.number_of_beds} cama{room.number_of_beds !== 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {[
                                room.has_wifi && 'WiFi',
                                room.has_air_conditioning && 'A/C',
                                room.has_tv && 'TV',
                                room.has_minibar && 'Minibar',
                                room.has_balcony && 'Balcón'
                              ].filter(Boolean).join(' • ')}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ${room.price_per_night} por noche
                            </div>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${getRoomStatusClass(room)}`}>
                            {getRoomStatusText(room)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-2">
                      No hay habitaciones disponibles para los criterios seleccionados
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Información del Huésped */}
        
          </div>

          {/* Precio Total */}
          <div className="space-y-4">
           

            {/* Resumen de Reserva */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">Habitación:</h4>
              <div className="space-y-2 text-sm">
                <div> {newReservation.roomId ? `Habitación ${availableRooms.find(r => r.id === newReservation.roomId)?.room_number || newReservation.roomId}` : "No seleccionada"}</div>
              </div>
            </div>
                <div className="bg-green-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-800">Información del Huésped</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Huésped *</label>
                <input
                  value={newReservation.guestName}
                  onChange={(e) => handleInputChange("guestName", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ingrese el nombre del huésped"
                  disabled={loading || isErrorState}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newReservation.guestEmail}
                  onChange={(e) => handleInputChange("guestEmail", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ingrese el email del huésped"
                  disabled={loading || isErrorState}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={newReservation.status}
                  onChange={(e) => handleInputChange("status", e.target.value as "confirmed" | "pending" | "cancelled")}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading || isErrorState}
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="cancelled">Cancelado</option>
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
            {loading ? (isEditing ? "Actualizando..." : "Creando...") : (isEditing ? "Actualizar Reserva" : "Crear Reserva")}
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