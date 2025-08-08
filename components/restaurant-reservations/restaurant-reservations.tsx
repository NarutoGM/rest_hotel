"use client";
import type React from "react";
import { useState, useEffect, useRef, MouseEvent } from "react";
import { Button } from "../../components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import ReservationModal from "./ReservationModal";
import ReservationTooltip from "./ReservationTooltip";

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

// Props opcionales o vacíos
interface RestaurantReservationsProps {
  initialDate?: Date;
}

const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 7am a 7pm (13 horas)
const MIN_HOUR = 7;
const HOUR_WIDTH_PX = 130;

export default function RestaurantReservations({
  initialDate = new Date(),
}: RestaurantReservationsProps = {}) {
  // Estado interno para manejar las reservas
  const [reservations, setReservations] = useState<RestaurantReservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentTimeLinePosition, setCurrentTimeLinePosition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date(initialDate));
  const [newReservation, setNewReservation] = useState<{
    tableId: string;
    customerName: string;
    num: number;
    startTime: Date;
    endTime: Date;
    phone: string;
    status: "confirmed" | "pending";
  }>({
    tableId: "",
    customerName: "",
    num: 1,
    startTime: new Date(currentDate),
    endTime: new Date(currentDate),
    phone: "",
    status: "pending",
  });
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/tables");
        if (!response.ok) throw new Error("Error al cargar las mesas");
        const data = await response.json();
        setTables(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

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
    setNewReservation({
      tableId: reservation.tableId,
      customerName: reservation.customerName,
      num: reservation.num,
      startTime: new Date(reservation.startTime),
      endTime: new Date(reservation.endTime),
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

    const startTime = new Date(currentDate);
    startTime.setHours(clickedHour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(clickedHour + 1, 0, 0, 0);

    setNewReservation({
      tableId: table.id,
      customerName: "",
      num: table.capacityMin,
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
    const startTime = new Date(currentDate);
    startTime.setHours(7, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(8, 0, 0, 0);

    setNewReservation({
      tableId: tables.length > 0 ? tables[0].id : "",
      customerName: "",
      num: 1,
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
    if (newReservation.customerName.trim() === "") {
      alert("El nombre del cliente no puede estar vacío.");
      return;
    }
    if (newReservation.num <= 0) {
      alert("Número de personas inválido.");
      return;
    }

    const selectedTable = tables.find((t) => t.id === newReservation.tableId);
    if (selectedTable && newReservation.num > selectedTable.capacityMax) {
      alert(`El número de personas excede la capacidad máxima de la mesa (${selectedTable.capacityMax}).`);
      return;
    }

    setLoading(true);
    try {
      if (isEditing && editingReservationId) {
        const response = await fetch(`/api/reservations-rest/${editingReservationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId: newReservation.tableId,
            customerName: newReservation.customerName,
            num: newReservation.num,
            phone: newReservation.phone,
            startTime: newReservation.startTime.toISOString(),
            endTime: newReservation.endTime.toISOString(),
            status: newReservation.status,
          }),
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
                  startTime: new Date(updatedRes.startTime),
                  endTime: new Date(updatedRes.endTime),
                }
              : res
          )
        );
      } else {
        const response = await fetch("/api/reservations-rest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId: newReservation.tableId,
            customerName: newReservation.customerName,
            num: newReservation.num,
            phone: newReservation.phone,
            startTime: newReservation.startTime.toISOString(),
            endTime: newReservation.endTime.toISOString(),
            status: newReservation.status,
          }),
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
            startTime: new Date(newRes.startTime),
            endTime: new Date(newRes.endTime),
          },
        ]);
      }

      setIsModalOpen(false);
      resetModalState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const resetModalState = () => {
    setNewReservation({
      tableId: "",
      customerName: "",
      num: 1,
      startTime: new Date(currentDate),
      endTime: new Date(currentDate),
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
      setCurrentDate(new Date(newDate));
    }
  };

  const handlePreviousDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(currentDate.getDate() - 1);
    setCurrentDate(prevDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDay);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day); // mes empieza en 0
    handleDateChange(newDate);
  };

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/reservations-rest");
        if (!response.ok) throw new Error("Error al cargar las reservas");
        const data = await response.json();
        setReservations(
          data.map((res: any) => ({
            ...res,
            startTime: new Date(res.startTime),
            endTime: new Date(res.endTime),
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [currentDate]);

  const filteredReservations = reservations.filter(
    (res) => res.startTime.toDateString() === currentDate.toDateString()
  );

  // Format date for display and input
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

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
            value={formatDate(currentDate)}
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
              style={{ left: `calc(150px + ${(currentTimeLinePosition / HOUR_WIDTH_PX) * (100 / HOURS.length)}%)` }}
            />
          )}

          {tables.map((table) => (
            <div key={table.id} className="border-b last:border-b-0 grid grid-cols-[150px_1fr]">
              <div className="p-3 border-r bg-gray-50 flex flex-col justify-center">
                <div className="font-medium text-sm">{table.name}</div>
                <div className="text-xs text-gray-600">
                  {table.capacityMin}-{table.capacityMax} personas
                </div>
                {table.area && (
                  <div className="text-xs text-gray-500">{table.area}</div>
                )}
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
                        reservation={reservation}
                        tables={tables}
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