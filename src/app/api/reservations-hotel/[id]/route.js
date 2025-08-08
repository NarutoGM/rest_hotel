const REMOTE_API_URL = 'https://reservations-uty9.onrender.com/api/hotel-reservations';




// PUT handler para actualizar reservas
export async function PUT(request, { params }) {
  try {
    const { id } = await params;  // <-- await aquí
    const body = await request.json();
    console.log('Datos recibidos para actualizar reserva:', body);

    const { roomId, guestName, guestEmail, guests, phone, checkIn, checkOut, status, totalPrice, customerId } = body;

    if (!roomId || !guestName || !guestEmail || !phone || !guests || !checkIn || !checkOut || !customerId) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos' }), 
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

    const reservationData = {
      customer_id: customerId,  // <-- clave para la API remota
      customer_full_name: guestName.trim(),
      customer_email: guestEmail.trim(),
      customer_phone: phone.trim(),
      room_id: roomId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      reservation_status_id: getStatusId(status),
      total_amount: totalPrice || 0
    };

    console.log('Actualizando reserva en la API remota:', reservationData);

    const response = await fetch(`${REMOTE_API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de la API remota:', errorData);
      throw new Error(errorData.message || `Error en la API remota: ${response.status}`);
    }

    const apiResponse = await response.json();

    const transformedReservation = {
      id: apiResponse.data.id.toString(),
      roomId: apiResponse.data.room_id,
      guestName: apiResponse.data.customer.full_name,
      guestEmail: apiResponse.data.customer.email,
      guests: guests,
      phone: apiResponse.data.customer.phone,
      checkIn: apiResponse.data.check_in_date,
      checkOut: apiResponse.data.check_out_date,
      status: getStatusFromId(apiResponse.data.reservation_status_id),
      totalPrice: parseFloat(apiResponse.data.total_amount),
    };

    return new Response(JSON.stringify(transformedReservation), { status: 200 });

  } catch (error) {
    console.error('Error en PUT /api/reservations-hotel:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al actualizar la reserva', 
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}


// DELETE handler
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const response = await fetch(`${REMOTE_API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error en la API remota: ${response.status}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error en DELETE /api/reservations-hotel:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al eliminar la reserva', 
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