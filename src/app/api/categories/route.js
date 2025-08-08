const API_BASE_URL = 'https://reservations-uty9.onrender.com/api/menu-items';
const HEADERS = {
  'Content-Type': 'application/json',
  // 'Authorization': `Bearer ${tuToken}`, // Descomenta si se requiere token
};


// GET /api/categories → proxy con datos filtrados
export async function GET() {
  try {
    const res = await fetch('https://reservations-uty9.onrender.com/api/categories', {
      method: 'GET',
      headers: HEADERS,
    });

    if (!res.ok) throw new Error(`Error al obtener categorías: ${res.status}`);

    const result = await res.json();

    // Retornamos solo el array de categorías
    return new Response(JSON.stringify({
      success: true,
      message: result.message || 'Categories retrieved successfully',
      data: result.data || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en GET /api/categories:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al leer las categorías desde API',
      details: error.message,
      data: [],
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}