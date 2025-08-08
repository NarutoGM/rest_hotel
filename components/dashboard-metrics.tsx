"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { UtensilsCrossed, Hotel, Bed } from "lucide-react"

interface RestaurantReservation {
  id: string
  tableId: string
  customerName: string
  adults: number
  startTime: Date
  endTime: Date
  status: "confirmed" | "pending"
}

interface Room {
  id: string
  name: string
  type: string
  capacity: number
  pricePerNight: number
}

interface HotelReservation {
  id: string
  roomId: string
  customerName: string
  checkInDate: Date
  checkOutDate: Date
  status: "confirmed" | "pending"
}

interface DashboardMetricsProps {
  activeView: string
  tables: any[]
  rooms: Room[]
  restaurantReservations: RestaurantReservation[]
  hotelReservations: HotelReservation[]
  currentRestaurantDate: Date
  currentHotelStartDate: Date
}

const NUM_DAYS_DISPLAYED = 7 // Matches the constant in hotel-reservations.tsx

export default function DashboardMetrics({
  activeView,
  tables,
  rooms,
  restaurantReservations,
  hotelReservations,
  currentRestaurantDate,
  currentHotelStartDate,
}: DashboardMetricsProps) {
  // Metrics for Restaurant Reservations
  const now = new Date()
  const todayActual = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Filter reservations that are active RIGHT NOW on the actual current day
  const currentlyActiveRestaurantReservations = restaurantReservations.filter((res) => {
    const resStartDay = new Date(res.startTime.getFullYear(), res.startTime.getMonth(), res.startTime.getDate())
    const resEndDay = new Date(res.endTime.getFullYear(), res.endTime.getMonth(), res.endTime.getDate())

    // Check if the reservation is for today (actual current day)
    const isForToday = resStartDay.toDateString() === todayActual.toDateString()

    // Check if the current time falls within the reservation's start and end time
    const isCurrentlyActive = now >= res.startTime && now < res.endTime

    return isForToday && isCurrentlyActive
  })

  const realTimeOccupiedTables = currentlyActiveRestaurantReservations.length
  const realTimeAvailableTables = tables.length - realTimeOccupiedTables

  // Other restaurant metrics (total, confirmed, pending) still based on currentRestaurantDate
  const todayRestaurantReservations = restaurantReservations.filter(
    (res) => res.startTime.toDateString() === currentRestaurantDate.toDateString(),
  )
  const confirmedRestaurantReservations = todayRestaurantReservations.filter((res) => res.status === "confirmed").length
  const pendingRestaurantReservations = todayRestaurantReservations.filter((res) => res.status === "pending").length
  const totalRestaurantReservations = todayRestaurantReservations.length

  // Metrics for Hotel Reservations
  const hotelTimelineEndDate = new Date(currentHotelStartDate)
  hotelTimelineEndDate.setDate(currentHotelStartDate.getDate() + NUM_DAYS_DISPLAYED)

  const currentPeriodHotelReservations = hotelReservations.filter((res) => {
    const checkInDay = new Date(res.checkInDate.getFullYear(), res.checkInDate.getMonth(), res.checkInDate.getDate())
    const checkOutDay = new Date(
      res.checkOutDate.getFullYear(),
      res.checkOutDate.getMonth(),
      res.checkOutDate.getDate(),
    )
    const timelineStartDay = new Date(
      currentHotelStartDate.getFullYear(),
      currentHotelStartDate.getMonth(),
      currentHotelStartDate.getDate(),
    )
    const timelineEndDay = new Date(
      hotelTimelineEndDate.getFullYear(),
      hotelTimelineEndDate.getMonth(),
      hotelTimelineEndDate.getDate(),
    )

    // Check if reservation overlaps with the displayed timeline period
    return checkInDay < timelineEndDay && checkOutDay > timelineStartDay
  })

  const confirmedHotelReservations = currentPeriodHotelReservations.filter((res) => res.status === "confirmed").length
  const pendingHotelReservations = currentPeriodHotelReservations.filter((res) => res.status === "pending").length
  const totalHotelReservations = currentPeriodHotelReservations.length
  const availableRooms = rooms.length - totalHotelReservations // Simple availability for the period

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {activeView === "restaurant-reservations" && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas Hoy</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRestaurantReservations}</div>
              <p className="text-xs text-muted-foreground">
                Total para {currentRestaurantDate.toLocaleDateString("es-ES")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedRestaurantReservations}</div>
              <p className="text-xs text-muted-foreground">Reservas confirmadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRestaurantReservations}</div>
              <p className="text-xs text-muted-foreground">Reservas pendientes de confirmación</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mesas Disponibles (Ahora)</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realTimeAvailableTables}</div>
              <p className="text-xs text-muted-foreground">Mesas disponibles en este momento</p>
            </CardContent>
          </Card>
        </>
      )}

      {activeView === "hotel-reservations" && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservas en Periodo</CardTitle>
              <Hotel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHotelReservations}</div>
              <p className="text-xs text-muted-foreground">
                Total para {currentHotelStartDate.toLocaleDateString("es-ES")} -{" "}
                {hotelTimelineEndDate.toLocaleDateString("es-ES")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <Hotel className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedHotelReservations}</div>
              <p className="text-xs text-muted-foreground">Reservas confirmadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Hotel className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingHotelReservations}</div>
              <p className="text-xs text-muted-foreground">Reservas pendientes de confirmación</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Habitaciones Disponibles</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.length - totalHotelReservations}</div>
              <p className="text-xs text-muted-foreground">Habitaciones sin reserva en el periodo</p>
            </CardContent>
          </Card>
        </>
      )}

      {(activeView === "table-management" || activeView === "room-management") && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mesas</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tables.length}</div>
              <p className="text-xs text-muted-foreground">Mesas registradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Habitaciones</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.length}</div>
              <p className="text-xs text-muted-foreground">Habitaciones registradas</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
