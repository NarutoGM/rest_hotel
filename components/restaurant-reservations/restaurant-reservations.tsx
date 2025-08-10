"use client";
import type React from "react";
import { useState, useEffect, useRef, MouseEvent } from "react";
import { Button } from "../../components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import ReservationModal from "./ReservationModal";
import ReservationTooltip from "./ReservationTooltip";

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

interface RestaurantReservationsProps {
  initialDate?: Date;
}

const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7am a 7pm (13 horas)
const MIN_HOUR = 7;
const HOUR_WIDTH_PX = 130;

// Helper function para mapear status string a ID
const getStatusId = (status: string): number => {
  switch (status) {
    case "pending":
      return 1;
    case "confirmed":
      return 2;
    case "cancelled":
      return 3;
    default:
      return 1;
  }
};

// Helper function to format date in local timezone
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to convert UTC date to local date maintaining the time
const convertUTCToLocal = (utcDateString: string): Date => {
  // Parse the UTC date
  const utcDate = new Date(utcDateString);
  
  // Get the UTC components
  const utcYear = utcDate.getUTCFullYear();
  const utcMonth = utcDate.getUTCMonth();
  const utcDay = utcDate.getUTCDate();
  const utcHours = utcDate.getUTCHours();
  const utcMinutes = utcDate.getUTCMinutes();
  const utcSeconds = utcDate.getUTCSeconds();
  const utcMilliseconds = utcDate.getUTCMilliseconds();
  
  // Create a new date in local timezone with the same time values
  return new Date(utcYear, utcMonth, utcDay, utcHours, utcMinutes, utcSeconds, utcMilliseconds);
};

// Helper function to convert local date to UTC for API calls
const convertLocalToUTC = (localDate: Date): string => {
  const year = localDate.getFullYear();
  const month = localDate.getMonth();
  const day = localDate.getDate();
  const hours = localDate.getHours();
  const minutes = localDate.getMinutes();
  const seconds = localDate.getSeconds();
  const milliseconds = localDate.getMilliseconds();
  
  // Create UTC date with the same time values
  const utcDate = new Date();
  utcDate.setUTCFullYear(year);
  utcDate.setUTCMonth(month);
  utcDate.setUTCDate(day);
  utcDate.setUTCHours(hours);
  utcDate.setUTCMinutes(minutes);
  utcDate.setUTCSeconds(seconds);
  utcDate.setUTCMilliseconds(milliseconds);
  
  return utcDate.toISOString();
};

export default function RestaurantReservations({
  initialDate = new Date(),
}: RestaurantReservationsProps = {}) {
  // Normalize initialDate to local midnight
  const normalizedInitialDate = new Date(
    initialDate.getFullYear(),
    initialDate.getMonth(),
    initialDate.getDate()
  );

  // Estado interno
  const [reservations, setReservations] = useState<RestaurantReservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentTimeLinePosition, setCurrentTimeLinePosition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(normalizedInitialDate);
  const [newReservation, setNewReservation] = useState<{
    tableId: number;
    guestName: string;
    guestEmail: string;
    customerId: string;
    numberOfPeople: number;
    startTime: Date;
    endTime: Date;
    phone: string;
    status: "confirmed" | "pending";
  }>({
    tableId: 0,
    guestName: "",
    guestEmail: "",
    customerId: "",
    numberOfPeople: 1,
    startTime: new Date(normalizedInitialDate),
    endTime: new Date(normalizedInitialDate),
    phone: "",
    status: "pending",
  });
  const timelineRef = useRef<HTMLDivElement>(null);

  // Cargar mesas desde la API
  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/tables");
        if (!response.ok) throw new Error("Error al cargar las mesas");
        const result = await response.json();
        console.log("Datos de mesas:", result);

        const transformedTables = (Array.isArray(result.data) ? result.data : [])
          .filter((table: any) => table.status === "available")
          .map((table: any) => ({
            id: table.id,
            tableNumber: table.table_number || table.name,
            tableCapacity: table.capacity || table.capacityMax,
            tableLocation: table.location || table.area,
            tableStatus: table.status || "available",
          }));

        setTables(transformedTables);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Cargar reservas desde la API
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/reservations-rest");
        if (!response.ok) throw new Error("Error al cargar las reservas");
        const data = await response.json();
        console.log("Datos de reservas originales:", data);
        
        // Transformar las reservas convirtiendo UTC a tiempo local
        const transformedReservations = data
          .map((res: any) => ({
            ...res,
            startTime: convertUTCToLocal(res.startTime),
            endTime: convertUTCToLocal(res.endTime),
          }))
          .filter((res: RestaurantReservation) =>
            res.startTime.toDateString() === currentDate.toDateString()
          );

        console.log("Reservas transformadas:", transformedReservations);
        setReservations(transformedReservations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [currentDate]);

  // Actualizar la línea de tiempo
  useEffect(() => {
    const updateTimeLine = () => {
      if (timelineRef.current) {
        const now = new Date();
        if (
          now.toDateString() === currentDate.toDateString() &&
          now.getHours() >= MIN_HOUR &&
          now.getHours() <= 20 + 1
        ) {
          const currentHour = now.getHours() + now.getMinutes() / 60;
          const offsetHours = currentHour - MIN_HOUR;
          setCurrentTimeLinePosition(offsetHours * HOUR_WIDTH_PX);
        } else {
          setCurrentTimeLinePosition(-1);
        }
      }
    };

    updateTimeLine();
    const interval = setInterval(updateTimeLine, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const handleEditReservation = (reservation: RestaurantReservation) => {
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);
    setNewReservation({
      tableId: reservation.tableId,
      guestName: reservation.guestName,
      customerId: reservation.customerId ,
      guestEmail: reservation.guestEmail,
      numberOfPeople: reservation.numberOfPeople,
      startTime: new Date(
        startTime.getFullYear(),
        startTime.getMonth(),
        startTime.getDate(),
        startTime.getHours(),
        startTime.getMinutes()
      ),
      endTime: new Date(
        endTime.getFullYear(),
        endTime.getMonth(),
        endTime.getDate(),
        endTime.getHours(),
        endTime.getMinutes()
      ),
      phone: reservation.phone,
      status: reservation.status as "confirmed" | "pending",
    });
    setIsEditing(true);
    setEditingReservationId(reservation.id);
    setIsModalOpen(true);
  };

  const handleDeleteReservation = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta reserva?")) {
      setLoading(true);
      try {
        const response = await fetch(`/api/reservations-rest/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Error al eliminar la reserva");

        setReservations((prev) => prev.filter((res) => res.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTableClick = (e: MouseEvent<HTMLDivElement>, table: Table) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const cellWidth = rect.width / HOURS.length;
    const hourIndex = Math.floor(x / cellWidth);
    const clickedHour = MIN_HOUR + hourIndex;

    const startTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      clickedHour,
      0,
      0
    );
    const endTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      clickedHour + 1,
      0,
      0
    );

    setNewReservation({
      tableId: table.id,
      guestName: "",
      customerId: "",
      guestEmail: "",
      numberOfPeople: 1,
      startTime,
      endTime,
      phone: "",
      status: "pending",
    });
    setIsEditing(false);
    setEditingReservationId(null);
    setIsModalOpen(true);
  };

  const handleManualAddReservation = () => {
    const startTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      7,
      0,
      0
    );
    const endTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      8,
      0,
      0
    );

    setNewReservation({
      tableId: tables.length > 0 ? tables[0].id : 0,
      guestName: "",
      guestEmail: "",
      customerId: "",
      numberOfPeople: 1,
      startTime,
      endTime,
      phone: "",
      status: "pending",
    });
    setIsEditing(false);
    setEditingReservationId(null);
    setIsModalOpen(true);
  };

  const handleSaveReservation = async () => {
    if (newReservation.guestName.trim() === "") {
      alert("El nombre del huésped no puede estar vacío.");
      return;
    }
    if (newReservation.guestEmail.trim() === "") {
      alert("El email del huésped no puede estar vacío.");
      return;
    }
    if (newReservation.numberOfPeople <= 0) {
      alert("Número de personas inválido.");
      return;
    }

    const selectedTable = tables.find((t) => t.id === newReservation.tableId);
    if (selectedTable && newReservation.numberOfPeople > selectedTable.tableCapacity) {
      alert(
        `El número de personas excede la capacidad máxima de la mesa (${selectedTable.tableCapacity}).`
      );
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        tableId: newReservation.tableId,
        guestName: newReservation.guestName,
        guestEmail: newReservation.guestEmail,
        numberOfPeople: newReservation.numberOfPeople,
        phone: newReservation.phone,
        reservationDate: formatLocalDate(currentDate),
        customerId: newReservation.customerId,
        // Convertir las fechas locales a UTC para la API
        startTime: convertLocalToUTC(newReservation.startTime),
        endTime: convertLocalToUTC(newReservation.endTime),
        status: newReservation.status,
      };

      console.log("Enviando reserva con fechas UTC:", {
        startTime: requestBody.startTime,
        endTime: requestBody.endTime,
        originalLocal: {
          startTime: newReservation.startTime,
          endTime: newReservation.endTime
        }
      });

      if (isEditing && editingReservationId) {
        const response = await fetch(`/api/reservations-rest/${editingReservationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al actualizar la reserva");
        }

        const updatedRes = await response.json();
        setReservations((prev) =>
          prev.map((res) =>
            res.id === editingReservationId
              ? {
                  ...updatedRes,
                  startTime: convertUTCToLocal(updatedRes.startTime),
                  endTime: convertUTCToLocal(updatedRes.endTime),
                }
              : res
          )
        );
      } else {
        const response = await fetch("/api/reservations-rest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al agregar la reserva");
        }

        const newRes = await response.json();
        setReservations((prev) => [
          ...prev,
          {
            ...newRes,
            startTime: convertUTCToLocal(newRes.startTime),
            endTime: convertUTCToLocal(newRes.endTime),
          },
        ]);
      }

      setIsModalOpen(false);
      resetModalState();

      // Recargar reservas
      const response = await fetch("/api/reservations-rest");
      if (response.ok) {
        const data = await response.json();
        const transformedReservations = data
          .map((res: any) => ({
            ...res,
            startTime: convertUTCToLocal(res.startTime),
            endTime: convertUTCToLocal(res.endTime),
          }))
          .filter((res: RestaurantReservation) =>
            res.startTime.toDateString() === currentDate.toDateString()
          );
        setReservations(transformedReservations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const resetModalState = () => {
    const startTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      7,
      0,
      0
    );
    const endTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      8,
      0,
      0
    );
    setNewReservation({
      tableId: 0,
      guestName: "",
      customerId: "",
      guestEmail: "",
      numberOfPeople: 1,
      startTime,
      endTime,
      phone: "",
      status: "pending",
    });
    setIsEditing(false);
    setEditingReservationId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetModalState();
  };

  const handleReservationChange = (updatedReservation: typeof newReservation) => {
    setNewReservation(updatedReservation);
  };

  const handleDateChange = (newDate: Date) => {
    if (!isNaN(newDate.getTime())) {
      const normalizedDate = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate()
      );
      setCurrentDate(normalizedDate);
      // Update newReservation startTime and endTime to match new date
      const startTime = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        newReservation.startTime.getHours(),
        newReservation.startTime.getMinutes()
      );
      const endTime = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        newReservation.endTime.getHours(),
        newReservation.endTime.getMinutes()
      );
      setNewReservation({
        ...newReservation,
        startTime,
        endTime,
      });
    }
  };

  const handlePreviousDay = () => {
    const prevDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - 1
    );
    setCurrentDate(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1
    );
    setCurrentDate(nextDay);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split("-").map(Number);
    const newDate = new Date(year, month - 1, day);
    handleDateChange(newDate);
  };

  const filteredReservations = reservations.filter(
    (res) => res.startTime.toDateString() === currentDate.toDateString()
  );

  return (
    <div className="p-4 border rounded-lg bg-white">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg shadow">
          {error}
        </div>
      )}
      {loading && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg shadow">
          Cargando...
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePreviousDay}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4" />
            Día Anterior
          </Button>
          <input
            type="date"
            value={formatLocalDate(currentDate)}
            onChange={handleDatePickerChange}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
          />
          <Button
            onClick={handleNextDay}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
            disabled={loading}
          >
            Día Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          onClick={handleManualAddReservation}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          disabled={loading || tables.length === 0}
        >
          <Plus className="w-4 h-4" />
          Agregar Reserva
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b grid grid-cols-[150px_1fr]">
          <div className="p-3 font-semibold border-r bg-gray-100 flex items-center justify-center">
            Mesa
          </div>
          <div className="grid grid-cols-13">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="p-3 text-center font-semibold border-r last:border-r-0 bg-gray-100 flex items-center justify-center"
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          {currentTimeLinePosition !== -1 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
              style={{
                left: `calc(150px + ${(currentTimeLinePosition / HOUR_WIDTH_PX) * (100 / HOURS.length)}%)`,
              }}
            />
          )}

          {tables.map((table) => (
            <div key={table.id} className="border-b last:border-b-0 grid grid-cols-[150px_1fr]">
              <div className="p-3 border-r bg-gray-50 flex flex-col justify-center">
                <div className="font-medium text-sm">Mesa {table.tableNumber}</div>
                <div className="text-xs text-gray-600">
                  Hasta {table.tableCapacity} personas
                </div>
                {table.tableLocation && (
                  <div className="text-xs text-gray-500">{table.tableLocation}</div>
                )}
                <div
                  className={`text-xs ${
                    table.tableStatus === "available" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {table.tableStatus === "available" ? "Disponible" : "No disponible"}
                </div>
              </div>

              <div
                ref={timelineRef}
                className="relative grid grid-cols-13 cursor-pointer"
                onClick={(e) => handleTableClick(e, table)}
              >
                {HOURS.map((hour, index) => (
                  <div
                    key={hour}
                    className="border-r last:border-r-0 h-20 hover:bg-gray-50 transition-colors"
                  />
                ))}

                {filteredReservations
                  .filter((res) => res.tableId === table.id)
                  .map((reservation) => {
                    const startHour = reservation.startTime.getHours() + reservation.startTime.getMinutes() / 60;
                    const endHour = reservation.endTime.getHours() + reservation.endTime.getMinutes() / 60;
                    const leftPercent = ((startHour - MIN_HOUR) / HOURS.length) * 100;
                    const widthPercent = ((endHour - startHour) / HOURS.length) * 100;

                    return (
                      <ReservationTooltip
                        key={reservation.id}
                        tables={tables}
                        reservation={reservation}
                        handleEditReservation={handleEditReservation}
                        handleDeleteReservation={handleDeleteReservation}
                        loading={loading}
                        leftPercent={leftPercent}
                        widthPercent={widthPercent}
                      />
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ReservationModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        loading={loading}
        tables={tables}
        newReservation={newReservation}
        onClose={handleCloseModal}
        onSave={handleSaveReservation}
        onReservationChange={handleReservationChange}
        onDateChange={handleDateChange}
      />
    </div>
  );
}