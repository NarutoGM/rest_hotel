const REMOTE_API_URL = 'https://reservations-uty9.onrender.com/api/hotel-reservations';

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
      roomId: reservation.room_id,
      customerId: reservation.customer.id, // ← AGREGADO
      guestName: reservation.customer.full_name,
      guestEmail: reservation.customer.email, // ← AGREGADO
      guests: reservation.room.capacity, // O podrías agregar un campo guests en la API
      phone: reservation.customer.phone,
      checkIn: reservation.check_in_date,
      checkOut: reservation.check_out_date,
      status: getStatusFromId(reservation.reservation_status_id),
      totalPrice: parseFloat(reservation.total_amount),
    }));

    return Response.json(transformedReservations);
  } catch (error) {
    console.error('Error en GET /api/reservations-hotel:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al obtener las reservas', 
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request) {
  try {
    const body = await request.json();
    const { roomId, guestName, guestEmail, guests, phone, checkIn, checkOut, status, totalPrice } = body;

    // Validaciones del frontend
    if (!roomId || !guestName || !guestEmail || !phone || !guests || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos (roomId, guestName, guestEmail, phone, guests, checkIn, checkOut)' }), 
        { status: 400 }
      );
    }

    if (guests <= 0) {
      return new Response(
        JSON.stringify({ error: 'El número de huéspedes debe ser mayor a 0' }), 
        { status: 400 }
      );
    }

    if (!['confirmed', 'pending', 'cancelled'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Estado inválido' }), 
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }), 
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkInDate >= checkOutDate) {
      return new Response(
        JSON.stringify({ error: 'La fecha de check-in debe ser anterior a la de check-out' }), 
        { status: 400 }
      );
    }

    // Transformar los datos al formato que espera la API remota
    const reservationData = {
      customer_full_name: guestName.trim(),
      customer_email: guestEmail.trim(),
      customer_phone: phone.trim(),
      room_id: roomId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      reservation_status_id: getStatusId(status),
      total_amount: totalPrice || 0
    };

    console.log('Enviando datos a la API remota:', reservationData);

    const response = await fetch(REMOTE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservationData),
    });

    console.log('Response status:', response.status);
    
    // Log de la respuesta completa para debug
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { message: responseText };
      }
      console.error('Error de la API remota:', errorData);
      throw new Error(errorData.message || `Error en la API remota: ${response.status}`);
    }

    let apiResponse;
    try {
      apiResponse = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing JSON response:', responseText);
      throw new Error('Respuesta inválida de la API remota');
    }
    console.log('Respuesta de la API remota:', apiResponse);
    
    // Transformar la respuesta de la API al formato del frontend
    const transformedReservation = {
      id: apiResponse.data.id.toString(),
      roomId: apiResponse.data.room_id,
      guestName: apiResponse.data.customer.full_name,
      guestEmail: apiResponse.data.customer.email, // ← AGREGADO
      guests: guests, // Mantener el valor del frontend
      phone: apiResponse.data.customer.phone,
      checkIn: apiResponse.data.check_in_date,
      checkOut: apiResponse.data.check_out_date,
      status: getStatusFromId(apiResponse.data.reservation_status_id),
      totalPrice: parseFloat(apiResponse.data.total_amount),
    };

    return new Response(JSON.stringify(transformedReservation), { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/reservations-hotel:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al crear la reserva', 
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}
// Funciones helper para convertir entre IDs de estado y strings
function getStatusFromId(statusId) {
  const statusMap = {
    1: 'confirmed',
    2: 'pending',
    3: 'cancelled'
  };
  return statusMap[statusId] || 'pending';
}

function getStatusId(status) {
  const statusMap = {
    'confirmed': 1,
    'pending': 2,
    'cancelled': 3
  };
  return statusMap[status] || 2;
}