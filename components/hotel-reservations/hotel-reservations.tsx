"use client";
import type React from "react";
import { useState, useEffect, useRef, MouseEvent } from "react";
import { Button } from "../../components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import ReservationTooltip from "../../components/hotel-reservations/ReservationTooltip";
import ReservationModal from "../../components/hotel-reservations/ReservationModal";
import { translations } from "../translations/reservation_hotel_core"; // New import

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
  status: boolean; // Computed or assumed field
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

interface HotelReservationsProps {
  initialStartDate?: Date;
}

// Función helper para manejar fechas UTC correctamente
const parseUTCDateOnly = (dateString: string | Date) => {
  // Si ya es un objeto Date, extraer los componentes
  if (dateString instanceof Date) {
    return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate());
  }
  
  // Si la fecha viene en formato ISO con Z, extraemos solo la parte de fecha
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  // Crear fecha local sin conversión de zona horaria
  return new Date(year, month - 1, day);
};

// Función para comparar solo fechas (sin hora)
const isSameDate = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Generar 14 días a partir de la fecha inicial (2 semanas)
const generateDaysArray = (startDate: Date, numDays: number = 14) => {
  const days = [];
  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push(date);
  }
  return days;
};

const DAY_WIDTH_PX = 120;

export default function HotelReservations({
  initialStartDate = new Date(),
}: HotelReservationsProps = {}) {
  // Obtener idioma desde localStorage o usar "es" por defecto
  const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "en" : "en";
  const t = translations[lang as keyof typeof translations] || translations.es;

  // Estado interno para manejar las reservas
  const [reservations, setReservations] = useState<HotelReservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStartDate, setCurrentStartDate] = useState(new Date(initialStartDate));
  const [days, setDays] = useState<Date[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newReservation, setNewReservation] = useState<HotelReservation>({
    id: "",
    roomId: 0,
    guestName: "",
    guestEmail: "",
    customer_id: "ss",
    guests: 1,
    phone: "",
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 día después por defecto
    status: "pending",
    totalPrice: 0,
  });
  const timelineRef = useRef<HTMLDivElement>(null);

  // Actualizar días cuando cambia la fecha de inicio
  useEffect(() => {
    setDays(generateDaysArray(currentStartDate));
  }, [currentStartDate]);

  // Cargar habitaciones desde la API
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/room");
        if (!response.ok) throw new Error(t.errorLoadingRooms);
        const data = await response.json();
        console.log("Rooms data:", data);
        // Mapear los datos de la API al formato del componente
        const formattedRooms = data.data.map((room: any) => ({
          ...room,
          price_per_night: parseFloat(room.price_per_night).toFixed(2), // Asegurar formato numérico
          status: true, // Asumimos que todas las habitaciones están disponibles si no hay campo
        }));
        setRooms(formattedRooms);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorUnknown);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Definición fuera del useEffect para poder reutilizarla
  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reservations-hotel");
      if (!response.ok) throw new Error(t.errorLoadingReservations);
      const data = await response.json();
      console.log("Reservations data:", data);
      
      // CAMBIO AQUÍ: usar parseUTCDateOnly
      const formattedData = data.map((res: HotelReservation) => ({
        ...res,
        checkIn: parseUTCDateOnly(res.checkIn),
        checkOut: parseUTCDateOnly(res.checkOut),
      }));
      
      setReservations(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUnknown);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [currentStartDate]);

  // Funciones para manejar el modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setNewReservation({
      id: "",
      roomId: 0,
      guestName: "",
      guestEmail: "",
      customer_id: "",
      guests: 1,
      phone: "",
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "pending",
      totalPrice: 0,
    });
  };

  const handleSaveReservation = async () => {
    setLoading(true);
    try {
      const room = rooms.find((r) => r.id === newReservation.roomId);
      if (!room) throw new Error(t.errorSavingReservation);

      // Calcular el número de noches
      const diffTime = Math.abs(newReservation.checkOut.getTime() - newReservation.checkIn.getTime());
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalPrice = nights * parseFloat(room.price_per_night);

      const reservationToSave = {
        ...newReservation,
        totalPrice,
      };

      const url = isEditing
        ? `/api/reservations-hotel/${newReservation.id}`
        : "/api/reservations-hotel";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationToSave),
      });

      if (!response.ok) throw new Error(t.errorSavingReservation);

      const savedReservation = await response.json();
      
      // CAMBIO AQUÍ: usar parseUTCDateOnly
      if (isEditing) {
        setReservations(
          reservations.map((res) =>
            res.id === savedReservation.id ? { 
              ...savedReservation, 
              checkIn: parseUTCDateOnly(savedReservation.checkIn), 
              checkOut: parseUTCDateOnly(savedReservation.checkOut) 
            } : res
          )
        );
      } else {
        setReservations([
          ...reservations, 
          { 
            ...savedReservation, 
            checkIn: parseUTCDateOnly(savedReservation.checkIn), 
            checkOut: parseUTCDateOnly(savedReservation.checkOut) 
          }
        ]);
      }

      handleCloseModal();
      fetchReservations(); // Refrescar reservas después de guardar
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUnknown);
    } finally {
      setLoading(false);
    }
  };

  const handleReservationChange = (reservation: HotelReservation) => {
    setNewReservation(reservation);
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentStartDate(newDate);
  };

  // Funciones para editar y eliminar reservas
  const handleEditReservation = (reservation: HotelReservation) => {
    console.log("Editando reserva:", reservation);
    setNewReservation({
      ...reservation,
      checkIn: parseUTCDateOnly(reservation.checkIn),
      checkOut: parseUTCDateOnly(reservation.checkOut),
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteReservation = async (reservationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reservations-hotel/${reservationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t.errorDeletingReservation);
      setReservations(reservations.filter((res) => res.id !== reservationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUnknown);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (e: MouseEvent<HTMLDivElement>, room: Room) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const cellWidth = rect.width / days.length;
    const dayIndex = Math.floor(x / cellWidth);
    const clickedDate = days[dayIndex];

    if (clickedDate) {
      setNewReservation({
        ...newReservation,
        roomId: room.id,
        checkIn: new Date(clickedDate),
        checkOut: new Date(clickedDate.getTime() + 24 * 60 * 60 * 1000),
      });
      setIsEditing(false);
      setIsModalOpen(true);
    }
  };

  const handleNewReservationClick = () => {
    setNewReservation({
      id: "",
      roomId: rooms.length > 0 ? rooms[0].id : 0,
      guestName: "",
      customer_id: "",
      guestEmail: "",
      guests: 1,
      phone: "",
      checkIn: new Date(currentStartDate),
      checkOut: new Date(currentStartDate.getTime() + 24 * 60 * 60 * 1000),
      status: "pending",
      totalPrice: 0,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handlePreviousWeek = () => {
    const prevWeek = new Date(currentStartDate);
    prevWeek.setDate(currentStartDate.getDate() - 7);
    setCurrentStartDate(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentStartDate);
    nextWeek.setDate(currentStartDate.getDate() + 7);
    setCurrentStartDate(nextWeek);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    setCurrentStartDate(newDate);
  };

  // Filtrar reservas que están en el rango de días visible
  const filteredReservations = reservations.filter((res) => {
    const checkIn = res.checkIn;
    const checkOut = res.checkOut;
    const startRange = days[0];
    const endRange = days[days.length - 1];
    
    return (
      (checkIn >= startRange && checkIn <= endRange) ||
      (checkOut >= startRange && checkOut <= endRange) ||
      (checkIn < startRange && checkOut > endRange)
    );
  });

  // Formatear fecha para display e input
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString(lang, {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString(lang, { weekday: 'short' });
  };

  return (
    <div className="p-2 sm:p-4 border rounded-lg bg-white">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg shadow text-sm">
          {error}
        </div>
      )}
      {loading && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg shadow text-sm">
          {t.loading}
        </div>
      )}

      {/* Header responsive */}
      <div className="mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-2 ">
            <Button
              onClick={handleNewReservationClick}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2 sm:px-4 sm:w-auto justify-center"
              disabled={loading || rooms.length === 0}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t.newReservation}</span>
              <span className="sm:hidden">{t.newReservationShort}</span>
            </Button>
            <Button
              onClick={handlePreviousWeek}
              className="bg-gray-200 text-zinc-800 hover:bg-gray-300 text-xs sm:text-sm px-2 sm:px-4"
              disabled={loading}
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t.previousWeek}</span>
              <span className="sm:hidden">{t.previousWeekShort}</span>
            </Button>
            <input
              type="date"
              value={formatDate(currentStartDate)}
              onChange={handleDatePickerChange}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm flex-1 sm:flex-none"
              disabled={loading}
            />
            <Button
              onClick={handleNextWeek}
              className="bg-gray-200 text-zinc-800 hover:bg-gray-300 text-xs sm:text-sm px-2 sm:px-4"
              disabled={loading}
            >
              <span className="hidden sm:inline">{t.nextWeek}</span>
              <span className="sm:hidden">{t.nextWeekShort}</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header con días */}
            <div className="bg-gray-100 border-b grid" style={{ gridTemplateColumns: '200px 1fr' }}>
              <div className="p-2 sm:p-3 font-semibold border-r bg-gray-100 flex items-center justify-center text-xs sm:text-sm">
                {t.room}
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                {days.map((day, index) => (
                  <div
                    key={index}
                    className="p-1 sm:p-2 text-center font-semibold border-r last:border-r-0 bg-gray-100 flex flex-col items-center justify-center"
                  >
                    <div className="text-xs text-zinc-500">{getDayName(day)}</div>
                    <div className="text-xs sm:text-sm">{formatDisplayDate(day)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filas de habitaciones */}
            <div className="relative">
              {rooms.map((room) => (
                <div key={room.id} className="border-b last:border-b-0 grid" style={{ gridTemplateColumns: '200px 1fr' }}>
                  <div className="p-2 sm:p-3 border-r bg-gray-50 flex flex-col justify-center">
                    <div className="font-medium text-xs sm:text-sm">{room.room_number}</div>
                    <div className="text-xs text-zinc-600">
                      {room.room_type} • {room.capacity} {room.capacity === 1 ? t.guest : t.guests} • {room.number_of_beds} {room.number_of_beds === 1 ? t.bed : t.beds}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      ${room.price_per_night}{t.perNight}
                    </div>
                    <div className="text-xs text-zinc-600 hidden sm:block">
                      {room.has_wifi && `${t.wifi} • `}
                      {room.has_air_conditioning && `${t.airConditioning} • `}
                      {room.has_tv && `${t.tv} • `}
                      {room.has_minibar && `${t.minibar} • `}
                      {room.has_balcony && t.balcony}
                    </div>
                    <div className={`text-xs ${room.status ? 'text-green-500' : 'text-red-500'}`}>
                      {room.status ? t.available : t.outOfService}
                    </div>
                  </div>

                  <div
                    ref={timelineRef}
                    className="relative cursor-pointer"
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: `repeat(${days.length}, 1fr)` 
                    }}
                    onClick={(e) => handleRoomClick(e, room)}
                  >
                    {days.map((day, index) => (
                      <div
                        key={index}
                        className="border-r last:border-r-0 h-16 sm:h-20 hover:bg-blue-50 transition-colors flex items-center justify-center"
                      >
                        {/* Aquí irán las reservas cuando implementemos el tooltip */}
                      </div>
                    ))}

                    {filteredReservations
                      .filter((res) => res.roomId === room.id)
                      .map((reservation) => {
                        // CAMBIO AQUÍ: usar isSameDate para comparar fechas
                        const checkInDay = days.findIndex(day =>
                          isSameDate(day, reservation.checkIn)
                        );
                        const checkOutDay = days.findIndex(day =>
                          isSameDate(day, reservation.checkOut)
                        );

                        // Si la reserva está completamente fuera del rango visible, no la mostramos
                        if (checkInDay === -1 && checkOutDay === -1) {
                          // Verificar si la reserva abarca todo el rango visible
                          const firstDay = days[0];
                          const lastDay = days[days.length - 1];
                          const reservaSpansRange = reservation.checkIn < firstDay && reservation.checkOut > lastDay;
                          if (!reservaSpansRange) return null;
                        }

                        // Asegurar que los índices estén dentro del rango visible
                        const startIndex = Math.max(0, checkInDay >= 0 ? checkInDay : 0);
                        const endIndex = Math.min(days.length - 1, checkOutDay >= 0 ? checkOutDay : days.length - 1);

                        // Ajuste visual: comenzar desde la mitad de la celda si el check-in está en rango
                        const startOffset = checkInDay >= 0 ? 0.5 : 0;

                        // Ajuste visual: terminar en la mitad de la celda si el check-out está en rango
                        const endOffset = checkOutDay >= 0 && checkOutDay < days.length ? 0.5 : 0;

                        // Calcular posición izquierda y ancho en porcentaje
                        const leftPercent = ((startIndex + startOffset) / days.length) * 100;
                        const widthPercent = ((endIndex - startIndex + endOffset - startOffset) / days.length) * 100;

                        // Asegurar un ancho mínimo para que se vea en la UI
                        const minWidthPercent = (0.5 / days.length) * 100;
                        const finalWidthPercent = Math.max(widthPercent, minWidthPercent);

                        return (
                          <ReservationTooltip
                            key={reservation.id}
                            reservation={reservation}
                            rooms={rooms}
                            handleEditReservation={handleEditReservation}
                            handleDeleteReservation={handleDeleteReservation}
                            loading={loading}
                            leftPercent={leftPercent}
                            widthPercent={finalWidthPercent}
                          />
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ReservationModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        loading={loading}
        rooms={rooms}
        newReservation={newReservation}
        onClose={handleCloseModal}
        onSave={handleSaveReservation}
        onReservationChange={handleReservationChange}
        onDateChange={handleDateChange}
      />
    </div>
  );
}