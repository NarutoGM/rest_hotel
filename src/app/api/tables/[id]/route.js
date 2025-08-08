const API_TABLES_URL = 'https://reservations-uty9.onrender.com/api/restaurant-tables';
const HEADERS = { 'Content-Type': 'application/json' };

// PUT /api/restaurant-tables/[id]
export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const { table_number, capacity, location, status } = await request.json();

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

    const res = await fetch(`${API_TABLES_URL}/${id}`, {
      method: 'PUT',
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
      status: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en PUT /api/restaurant-tables:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al actualizar la mesa',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// DELETE /api/restaurant-tables/[id]
export async function DELETE(_, context) {
  try {
    const { id } = await context.params;

    const res = await fetch(`${API_TABLES_URL}/${id}`, {
      method: 'DELETE',
      headers: HEADERS,
    });

    let result = null;
    const text = await res.text();
    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text };
      }
    } else {
      result = { message: 'Mesa eliminada correctamente' };
    }

    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en DELETE /api/restaurant-tables:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al eliminar la mesa',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}