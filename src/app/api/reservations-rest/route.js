const REMOTE_API_URL = 'https://reservations-uty9.onrender.com/api/restaurant-reservations';

// GET handler
export async function GET() {
  try {
    const response = await fetch(REMOTE_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error en la API remota: ${response.status}`);
    }

    const apiData = await response.json();
    
    // Transformar los datos de la API remota al formato que espera el frontend
    const transformedReservations = apiData.data.map((reservation) => ({
      id: reservation.id.toString(),
      customerId: reservation.customer_id,
      tableId: reservation.table_id,
      guestName: reservation.customer.full_name,
      guestEmail: reservation.customer.email,
      phone: reservation.customer.phone,
      reservationDate: reservation.reservation_date,
      startTime: reservation.start_time,
      endTime: reservation.end_time,
      numberOfPeople: reservation.number_of_people,
      status: reservation.status.name, // 'pending', 'confirmed', 'cancelled'
      statusColor: reservation.status.color,
      statusDescription: reservation.status.description,
      // Información de la mesa
      tableNumber: reservation.table.table_number,
      tableCapacity: reservation.table.capacity,
      tableLocation: reservation.table.location,
      tableStatus: reservation.table.status,
      createdAt: reservation.created_at,
      updatedAt: reservation.updated_at
    }));

    return Response.json(transformedReservations);
  } catch (error) {
    console.error('Error en GET /api/restaurant-reservations:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al obtener las reservas del restaurante', 
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}

// POST handler
// POST handler

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      tableId, 
      guestName, 
      guestEmail, 
      phone, 
      reservationDate, 
      startTime, 
      endTime, 
      numberOfPeople,
      status = 'pending'
    } = body;

    console.log('Datos recibidos en POST /api/restaurant-reservations:', body);

    // Transformar datos
    const transformedReservation = {
      customer_full_name: guestName,
      customer_email: guestEmail,
      customer_phone: phone,
      table_id: tableId,
      reservation_date: reservationDate,
      start_time: startTime.split('T')[1].slice(0, 5),
      end_time: endTime.split('T')[1].slice(0, 5),
      number_of_people: numberOfPeople,
      reservation_status_id: status === 'pending' ? 2 : 1
    };

    // Enviar datos a la API remota
    const remoteResponse = await fetch(REMOTE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformedReservation)
    });

    if (!remoteResponse.ok) {
      const errorText = await remoteResponse.text();
      throw new Error(`Error en API remota: ${remoteResponse.status} - ${errorText}`);
    }

    const remoteData = await remoteResponse.json();

    return new Response(JSON.stringify(remoteData), { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/restaurant-reservations:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al crear la reserva del restaurante', 
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}
