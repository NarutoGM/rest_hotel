const API_TABLES_URL = 'https://reservations-uty9.onrender.com/api/restaurant-tables';
const HEADERS = { 'Content-Type': 'application/json' };

// GET
export async function GET() {
  try {
    const res = await fetch(API_TABLES_URL, { method: 'GET', headers: HEADERS });
    if (!res.ok) throw new Error(`Error al obtener mesas: ${res.status}`);

    const tables = await res.json();

    return new Response(JSON.stringify(tables), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });



  } catch (error) {
    console.error('Error en GET /api/restaurant-tables:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al leer las mesas',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// POST
export async function POST(request) {
  try {
    const body = await request.json();
    const { table_number, capacity, location, status } = body;

    // Validaciones
    if (!table_number || table_number.trim() === '') {
      return new Response(JSON.stringify({ error: 'El número de la mesa es obligatorio' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!capacity || capacity <= 0) {
      return new Response(JSON.stringify({ error: 'La capacidad debe ser mayor a 0' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!location || location.trim() === '') {
      return new Response(JSON.stringify({ error: 'La ubicación es obligatoria' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!status || status.trim() === '') {
      return new Response(JSON.stringify({ error: 'El estado es obligatorio' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
     console.log('Datos recibidos:', { table_number, capacity, location, status });
    const res = await fetch(API_TABLES_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        table_number,
        capacity: Number(capacity),
        location,
        status
      }),
    });

    const result = await res.json();

    return new Response(JSON.stringify(result), {
      status: res.ok ? 201 : res.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en POST /api/restaurant-tables:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al agregar la mesa',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}