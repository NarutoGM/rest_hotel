"use client";
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

const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i);
const MIN_HOUR = 7;
const HOUR_WIDTH_PX = 130;

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const convertUTCToLocal = (utcDateString: string): Date => {
  const utcDate = new Date(utcDateString);
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    utcDate.getUTCHours(),
    utcDate.getUTCMinutes(),
    utcDate.getUTCSeconds(),
    utcDate.getUTCMilliseconds()
  );
};

const convertLocalToUTC = (localDate: Date): string => {
  const utcDate = new Date();
  utcDate.setUTCFullYear(localDate.getFullYear());
  utcDate.setUTCMonth(localDate.getMonth());
  utcDate.setUTCDate(localDate.getDate());
  utcDate.setUTCHours(localDate.getHours());
  utcDate.setUTCMinutes(localDate.getMinutes());
  utcDate.setUTCSeconds(localDate.getSeconds());
  utcDate.setUTCMilliseconds(localDate.getMilliseconds());
  return utcDate.toISOString();
};

export default function RestaurantReservations({ initialDate = new Date() }: RestaurantReservationsProps = {}) {
  const normalizedInitialDate = new Date(initialDate.getFullYear(), initialDate.getMonth(), initialDate.getDate());
  const [reservations, setReservations] = useState<RestaurantReservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [currentTimeLinePosition, setCurrentTimeLinePosition] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(normalizedInitialDate);
  const [newReservation, setNewReservation] = useState({
    tableId: 0,
    guestName: "",
    guestEmail: "",
    customerId: "",
    numberOfPeople: 1,
    startTime: new Date(normalizedInitialDate),
    endTime: new Date(normalizedInitialDate),
    phone: "",
    status: "pending" as "confirmed" | "pending",
  });
  const timelineRef = useRef<HTMLDivElement>(null);

  const updateTimeLine = () => {
    if (timelineRef.current) {
      const now = new Date();
      if (now.toDateString() === currentDate.toDateString() && now.getHours() >= MIN_HOUR && now.getHours() <= 20) {
        setCurrentTimeLinePosition((now.getHours() + now.getMinutes() / 60 - MIN_HOUR) * HOUR_WIDTH_PX);
      } else {
        setCurrentTimeLinePosition(-1);
      }
    }
  };

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/tables");
        if (!response.ok) throw new Error("Error al cargar las mesas");
        const { data } = await response.json();
        setTables(
          (Array.isArray(data) ? data : [])
            .filter((table: any) => table.status === "available")
            .map((table: any) => ({
              id: table.id,
              tableNumber: table.table_number || table.name,
              tableCapacity: table.capacity || table.capacityMax,
              tableLocation: table.location || table.area,
              tableStatus: table.status || "available",
            }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);


      const fetchReservations = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/reservations-rest");
        if (!response.ok) throw new Error("Error al cargar las reservas");
        const data = await response.json();
        setReservations(
          data
            .map((res: any) => ({
              ...res,
              startTime: convertUTCToLocal(res.startTime),
              endTime: convertUTCToLocal(res.endTime),
            }))
            .filter((res: RestaurantReservation) => res.startTime.toDateString() === currentDate.toDateString())
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    fetchReservations();
  }, [currentDate]);

  useEffect(() => {
    updateTimeLine();
    const interval = setInterval(updateTimeLine, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const handleEditReservation = (reservation: RestaurantReservation) => {
    setNewReservation({
      tableId: reservation.tableId,
      guestName: reservation.guestName,
      customerId: reservation.customerId,
      guestEmail: reservation.guestEmail,
      numberOfPeople: reservation.numberOfPeople,
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
    if (!confirm("¿Estás seguro de que quieres eliminar esta reserva?")) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/reservations-rest/${id}`, { method: "DELETE" });
      fetchReservations();
      if (!response.ok) throw new Error("Error al eliminar la reserva");
      setReservations((prev) => prev.filter((res) => res.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleTableClick = (e: MouseEvent<HTMLDivElement>, table: Table) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickedHour = MIN_HOUR + Math.floor((e.clientX - rect.left) / (rect.width / HOURS.length));
    const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), clickedHour, 0);
    const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), clickedHour + 1, 0);
    setNewReservation({
      tableId: table.id,
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

  const handleManualAddReservation = () => {
    const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 7, 0);
    const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 8, 0);
    setNewReservation({
      tableId: tables[0]?.id || 0,
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
    if (!newReservation.guestName.trim()) return alert("El nombre del huésped no puede estar vacío.");
    if (!newReservation.guestEmail.trim()) return alert("El email del huésped no puede estar vacío.");
    if (newReservation.numberOfPeople <= 0) return alert("Número de personas inválido.");
    const selectedTable = tables.find((t) => t.id === newReservation.tableId);
    if (selectedTable && newReservation.numberOfPeople > selectedTable.tableCapacity)
      return alert(`El número de personas excede la capacidad máxima de la mesa (${selectedTable.tableCapacity}).`);

    setLoading(true);
    try {
      const requestBody = {
        tableId: newReservation.tableId,
        guestName: newReservation.guestName,
        guestEmail: newReservation.guestEmail,
        customerId: newReservation.customerId,
        numberOfPeople: newReservation.numberOfPeople,
        phone: newReservation.phone,
        reservationDate: formatLocalDate(currentDate),
        startTime: convertLocalToUTC(newReservation.startTime),
        endTime: convertLocalToUTC(newReservation.endTime),
        status: newReservation.status,
      };
      const response = await fetch(
        isEditing && editingReservationId ? `/api/reservations-rest/${editingReservationId}` : "/api/reservations-rest",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );
      if (!response.ok) throw new Error((await response.json()).error || `Error al ${isEditing ? "actualizar" : "agregar"} la reserva`);
      const newRes = await response.json();
      setReservations((prev) =>
        isEditing && editingReservationId
          ? prev.map((res) => (res.id === editingReservationId ? { ...newRes, startTime: convertUTCToLocal(newRes.startTime), endTime: convertUTCToLocal(newRes.endTime) } : res))
          : [...prev, { ...newRes, startTime: convertUTCToLocal(newRes.startTime), endTime: convertUTCToLocal(newRes.endTime) }]
      );
      setIsModalOpen(false);
            fetchReservations();

      fetchReservations();
      resetModalState();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const resetModalState = () => {
    const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 7, 0);
    const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 8, 0);
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

  const handleReservationChange = (updatedReservation: typeof newReservation) => setNewReservation(updatedReservation);

  const handleDateChange = (newDate: Date) => {
    if (!isNaN(newDate.getTime())) {
      const normalizedDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      setCurrentDate(normalizedDate);
      setNewReservation({
        ...newReservation,
        startTime: new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), normalizedDate.getDate(), newReservation.startTime.getHours(), newReservation.startTime.getMinutes()),
        endTime: new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), normalizedDate.getDate(), newReservation.endTime.getHours(), newReservation.endTime.getMinutes()),
      });
    }
  };

  const handlePreviousDay = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
  const handleNextDay = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = e.target.value.split("-").map(Number);
    handleDateChange(new Date(year, month - 1, day));
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg shadow">{error}</div>}
      {loading && <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg shadow">Cargando...</div>}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button onClick={handlePreviousDay} className="bg-gray-200 text-gray-800 hover:bg-gray-300" disabled={loading}>
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
          <Button onClick={handleNextDay} className="bg-gray-200 text-gray-800 hover:bg-gray-300" disabled={loading}>
            Día Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={handleManualAddReservation} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white" disabled={loading || !tables.length}>
          <Plus className="w-4 h-4" />
          Agregar Reserva
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b grid grid-cols-[150px_1fr]">
          <div className="p-3 font-semibold border-r bg-gray-100 flex items-center justify-center">Mesa</div>
          <div className="grid grid-cols-13">
            {HOURS.map((hour) => (
              <div key={hour} className="p-3 text-center font-semibold border-r last:border-r-0 bg-gray-100 flex items-center justify-center">
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          {currentTimeLinePosition !== -1 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
              style={{ left: `calc(150px + ${currentTimeLinePosition}px)` }}
            />
          )}
          {tables.map((table) => (
            <div key={table.id} className="border-b last:border-b-0 grid grid-cols-[150px_1fr]">
              <div className="p-3 border-r bg-gray-50 flex flex-col justify-center">
                <div className="font-medium text-sm">Mesa {table.tableNumber}</div>
                <div className="text-xs text-gray-600">Hasta {table.tableCapacity} personas</div>
                {table.tableLocation && <div className="text-xs text-gray-500">{table.tableLocation}</div>}
                <div className={`text-xs ${table.tableStatus === "available" ? "text-green-500" : "text-red-500"}`}>
                  {table.tableStatus === "available" ? "Disponible" : "No disponible"}
                </div>
              </div>
              <div ref={timelineRef} className="relative grid grid-cols-13 cursor-pointer" onClick={(e) => handleTableClick(e, table)}>
                {HOURS.map((hour) => (
                  <div key={hour} className="border-r last:border-r-0 h-20 hover:bg-gray-50 transition-colors" />
                ))}
                {reservations
                  .filter((res) => res.tableId === table.id && res.startTime.toDateString() === currentDate.toDateString())
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