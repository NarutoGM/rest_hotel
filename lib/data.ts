interface Table {
  id: string
  name: string
  capacityMin: number
  capacityMax: number
  area: string
}

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

export const mockTables: Table[] = [
  { id: "T1", name: "T1", capacityMin: 2, capacityMax: 4, area: "Terraza" },
  { id: "T2", name: "T2", capacityMin: 2, capacityMax: 4, area: "Terraza" },
  { id: "T3", name: "T3", capacityMin: 2, capacityMax: 4, area: "Terraza" },
  { id: "T4", name: "T4", capacityMin: 2, capacityMax: 4, area: "Terraza" },
  { id: "T5", name: "T5", capacityMin: 2, capacityMax: 4, area: "Terraza" },
  { id: "T6", name: "T6", capacityMin: 4, capacityMax: 6, area: "Interior" },
  { id: "T7", name: "T7", capacityMin: 6, capacityMax: 8, area: "Interior" },
]

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

export const mockRestaurantReservations: RestaurantReservation[] = [
  {
    id: "res-1",
    tableId: "T1",
    customerName: "Andres",
    adults: 2,
    startTime: new Date(today.setHours(12, 0, 0, 0)),
    endTime: new Date(today.setHours(14, 0, 0, 0)),
    status: "confirmed",
  },
  {
    id: "res-2",
    tableId: "T2",
    customerName: "Javier",
    adults: 2,
    startTime: new Date(today.setHours(13, 0, 0, 0)),
    endTime: new Date(today.setHours(14, 30, 0, 0)),
    status: "confirmed",
  },
  {
    id: "res-3",
    tableId: "T3",
    customerName: "Iria",
    adults: 2,
    startTime: new Date(today.setHours(14, 0, 0, 0)),
    endTime: new Date(today.setHours(15, 30, 0, 0)),
    status: "confirmed",
  },
  {
    id: "res-4",
    tableId: "T4",
    customerName: "Marti",
    adults: 2,
    startTime: new Date(today.setHours(15, 30, 0, 0)),
    endTime: new Date(today.setHours(17, 0, 0, 0)),
    status: "pending", // Example of a pending reservation
  },
  {
    id: "res-5",
    tableId: "T1",
    customerName: "Alma",
    adults: 2,
    startTime: new Date(today.setHours(14, 30, 0, 0)),
    endTime: new Date(today.setHours(16, 30, 0, 0)),
    status: "pending", // Example of a pending reservation
  },
  {
    id: "res-6",
    tableId: "T6",
    customerName: "Carlos",
    adults: 5,
    startTime: new Date(today.setHours(19, 0, 0, 0)),
    endTime: new Date(today.setHours(21, 0, 0, 0)),
    status: "confirmed",
  },
]

export const mockRooms: Room[] = [
  { id: "R101", name: "Habitación 101", type: "Estándar", capacity: 2, pricePerNight: 100 },
  { id: "R102", name: "Habitación 102", type: "Estándar", capacity: 2, pricePerNight: 100 },
  { id: "R201", name: "Habitación 201", type: "Suite", capacity: 4, pricePerNight: 250 },
  { id: "R202", name: "Habitación 202", type: "Suite", capacity: 4, pricePerNight: 250 },
  { id: "R301", name: "Habitación 301", type: "Deluxe", capacity: 3, pricePerNight: 180 },
]

export const mockHotelReservations: HotelReservation[] = [
  {
    id: "hres-1",
    roomId: "R101",
    customerName: "Familia Garcia",
    checkInDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    checkOutDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
    status: "confirmed",
  },
  {
    id: "hres-2",
    roomId: "R201",
    customerName: "Sr. Lopez",
    checkInDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
    checkOutDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    status: "confirmed",
  },
  {
    id: "hres-3",
    roomId: "R102",
    customerName: "Pareja Perez",
    checkInDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
    checkOutDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
    status: "pending",
  },
]
