const REMOTE_API_URL = 'https://reservations-uty9.onrender.com/api/restaurant-reservations/check-availability';

// POST handler para verificar disponibilidad de mesas
export async function POST(request) {
  try {
    const body = await request.json();
    const { reservation_date, start_time, end_time, occupancy } = body;

    // Validaciones básicas
    if (!reservation_date || !start_time || !end_time || !occupancy) {
      return new Response(
        JSON.stringify({
          error: 'Faltan datos requeridos: reservation_date, start_time, end_time, occupancy'
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

    // Validar formato de fecha
    const reservationDateObj = new Date(reservation_date);
    if (isNaN(reservationDateObj.getTime())) {
      return new Response(
        JSON.stringify({
          error: 'Formato de fecha inválido. Use YYYY-MM-DD'
        }),
        { status: 400 }
      );
    }

    // Validar formato de horas (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return new Response(
        JSON.stringify({
          error: 'Formato de hora inválido. Use HH:mm'
        }),
        { status: 400 }
      );
    }

    // Validar que start_time sea menor que end_time
    const startMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
    const endMinutes = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
    if (startMinutes >= endMinutes) {
      return new Response(
        JSON.stringify({
          error: 'La hora de inicio debe ser anterior a la hora de fin'
        }),
        { status: 400 }
      );
    }

    // Preparar datos para enviar a la API remota
    const requestData = {
      reservation_date,
      start_time,
      end_time,
      occupancy
    };
    console.log('Datos enviados a la API remota:', requestData);
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
    specific_table_available: apiResponse.data.specific_table_available,
    available_tables_count: apiResponse.data.available_tables_count,
    available_tables: (apiResponse.data.available_tables || [])
      .filter(table => table.status === 'available')
      .map(table => ({
        id: table.id,
        table_number: table.table_number,
        capacity: table.capacity,
        location: table.location,
        status: table.status,
        created_at: table.created_at,
        updated_at: table.updated_at,
        images: []
      }))
  }
};

    return Response.json(transformedResponse);

  } catch (error) {
    console.error('Error en POST /api/check-restaurant-availability:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al verificar disponibilidad de mesas',
        details: error.message
      }),
      { status: 500 }
    );
  }
}
