const REMOTE_API_URL = 'https://reservations-uty9.onrender.com/api/hotel-reservations/check-availability';

// POST handler para verificar disponibilidad
export async function POST(request) {
  try {
    const body = await request.json();
    const { check_in_date, check_out_date, occupancy } = body;

    // Validaciones básicas
    if (!check_in_date || !check_out_date || !occupancy) {
      return new Response(
        JSON.stringify({ 
          error: 'Faltan datos requeridos: check_in_date, check_out_date, occupancy' 
        }), 
        { status: 400 }
      );
    }

    // Validar que occupancy sea un número positivo
    if (typeof occupancy !== 'number' || occupancy <= 0) {
      return new Response(
        JSON.stringify({ 
          error: 'La ocupación debe ser un número mayor a 0' 
        }), 
        { status: 400 }
      );
    }

    // Validar formato de fechas
    const checkInDate = new Date(check_in_date);
    const checkOutDate = new Date(check_out_date);
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return new Response(
        JSON.stringify({ 
          error: 'Formato de fecha inválido. Use YYYY-MM-DD' 
        }), 
        { status: 400 }
      );
    }

    if (checkInDate >= checkOutDate) {
      return new Response(
        JSON.stringify({ 
          error: 'La fecha de check-in debe ser anterior a la de check-out' 
        }), 
        { status: 400 }
      );
    }

    // Preparar datos para enviar a la API remota
    const requestData = {
      check_in_date,
      check_out_date,
      occupancy
    };


    // Hacer la petición a la API remota
    const response = await fetch(REMOTE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error en la API remota: ${response.status}`);
    }

    const apiResponse = await response.json();

    // Transformar la respuesta para mantener consistencia con el frontend
    const transformedResponse = {
      success: apiResponse.success,
      message: apiResponse.message,
      data: {
        specific_room_available: apiResponse.data.specific_room_available,
        available_rooms_count: apiResponse.data.available_rooms_count,
        available_rooms: apiResponse.data.available_rooms.map((room) => ({
          id: room.id,
          room_number: room.room_number,
          room_type: room.room_type,
          capacity: room.capacity,
          number_of_beds: room.number_of_beds,
          has_wifi: room.has_wifi,
          has_air_conditioning: room.has_air_conditioning,
          has_tv: room.has_tv,
          has_minibar: room.has_minibar,
          has_balcony: room.has_balcony,
          price_per_night: parseFloat(room.price_per_night).toFixed(2),
          description: room.description,
          created_at: room.created_at,
          updated_at: room.updated_at,
          // Campos adicionales para compatibilidad con el frontend
          images: [], // La API no devuelve imágenes en este endpoint
          status: true // Asumimos que están disponibles si aparecen en la lista
        }))
      }
    };

    return Response.json(transformedResponse);

  } catch (error) {
    console.error('Error en POST /api/check-availability:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Error al verificar disponibilidad', 
        details: error.message 
      }), 
      { status: 500 }
    );
  }
}
