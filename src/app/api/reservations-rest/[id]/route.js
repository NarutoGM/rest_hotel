const REMOTE_API_URL = 'https://reservations-uty9.onrender.com/api/restaurant-reservations';

// PUT handler (editar)
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log('Cuerpo de la solicitud PUT:', body);
    const { 
      tableId, 
      guestName, 
      guestEmail, 
      phone, 
      reservationDate, 
customerId,
      startTime, 
      endTime, 
      numberOfPeople,
      status
    } = body;


    const transformedReservation = {
      customer_full_name: guestName,
      customer_email: guestEmail,
        customer_id: body.customerId, // ← añadir esto

      customer_phone: phone,
      table_id: tableId,
      reservation_date: reservationDate,
      start_time: startTime.split('T')[1].slice(0, 5),
      end_time: endTime.split('T')[1].slice(0, 5),
      number_of_people: numberOfPeople,
      reservation_status_id: status === 'pending' ? 2 : 1
    };

    const remoteResponse = await fetch(`${REMOTE_API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformedReservation)
    });

    if (!remoteResponse.ok) {
      const errorText = await remoteResponse.text();
      throw new Error(`Error en API remota: ${remoteResponse.status} - ${errorText}`);
    }

    const remoteData = await remoteResponse.json();
    return new Response(JSON.stringify(remoteData), { status: 200 });
  } catch (error) {
    console.error('Error en PUT /api/restaurant-reservations/[id]:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al actualizar la reserva del restaurante', 
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params; // 👈 aquí se espera
    console.log(`Eliminando reserva con ID: ${id}`);

    const remoteResponse = await fetch(`${REMOTE_API_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!remoteResponse.ok) {
      const errorText = await remoteResponse.text();
      throw new Error(`Error en API remota: ${remoteResponse.status} - ${errorText}`);
    }

    return new Response(
      JSON.stringify({ message: 'Reserva eliminada correctamente' }), 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en DELETE /api/restaurant-reservations/[id]:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Error al eliminar la reserva del restaurante', 
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}
