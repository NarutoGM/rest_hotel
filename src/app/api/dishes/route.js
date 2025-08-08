import { isBase64, uploadImageToFirebase } from "../../../../lib/firebaseUtils";

const API_BASE_URL = 'https://reservations-uty9.onrender.com/api/menu-items';
const HEADERS = { 'Content-Type': 'application/json' };

// GET /api/dishes
export async function GET() {
  try {
    const res = await fetch(API_BASE_URL, { method: 'GET', headers: HEADERS });
    if (!res.ok) throw new Error(`Error al obtener platos: ${res.status}`);

    const result = await res.json();

    return new Response(JSON.stringify({
      success: true,
      message: result.message || 'Dishes retrieved successfully',
      data: result.data || []
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error en GET /api/dishes:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al leer los platos desde API',
      details: error.message,
      data: [],
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// POST /api/dishes
export async function POST(request) {
  try {
    const body = await request.json();

    const processedImages = await Promise.all(
      body.images.map(async (image, index) => {
        if (isBase64(image.image_url)) {
          const fileName = `image_${body.name}_${index + 1}.jpg`;
          const firebaseUrl = await uploadImageToFirebase(image.image_url, fileName);
          return { image_url: firebaseUrl, order: image.order };
        }
        return image;
      })
    );

    const updatedBody = { ...body, images: processedImages };

    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(updatedBody),
    });

    const result = await res.json();

    return new Response(JSON.stringify(result), {
      status: res.ok ? 201 : res.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en POST /api/dishes:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error al agregar el plato en la API',
      details: error.message,
      data: null,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
