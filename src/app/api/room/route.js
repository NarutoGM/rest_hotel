import { isBase64, uploadImageToFirebase } from "../../../../lib/firebaseUtils";

const API_ROOMS_URL = 'https://reservations-uty9.onrender.com/api/rooms';
const HEADERS = { 'Content-Type': 'application/json' };

// GET igual, solo fetch a API externa
export async function GET() {
  try {
    const res = await fetch(API_ROOMS_URL, { method: 'GET', headers: HEADERS });
    if (!res.ok) throw new Error(`Error al obtener habitaciones: ${res.status}`);

    const rooms = await res.json();
    return new Response(JSON.stringify(rooms), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error en GET /api/room:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al leer las habitaciones',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// POST con subida a Firebase de imágenes base64
export async function POST(request) {
  try {
    const body = await request.json();

    // Validaciones para todos los campos
    const {
      room_number,
      room_type,
      capacity,
      number_of_beds,
      has_wifi,
      has_air_conditioning,
      has_tv,
      has_minibar,
      has_balcony,
      price_per_night,
      description,
      images
    } = body;

    if (!room_number || room_number.trim() === '') {
      return new Response(JSON.stringify({ error: 'El número de la habitación es obligatorio' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!room_type || room_type.trim() === '') {
      return new Response(JSON.stringify({ error: 'El tipo de habitación es obligatorio' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!capacity || capacity <= 0) {
      return new Response(JSON.stringify({ error: 'La capacidad debe ser mayor a 0' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!number_of_beds || number_of_beds <= 0) {
      return new Response(JSON.stringify({ error: 'El número de camas debe ser mayor a 0' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (typeof has_wifi !== 'boolean') {
      return new Response(JSON.stringify({ error: 'El campo WiFi debe ser un valor booleano' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (typeof has_air_conditioning !== 'boolean') {
      return new Response(JSON.stringify({ error: 'El campo aire acondicionado debe ser un valor booleano' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (typeof has_tv !== 'boolean') {
      return new Response(JSON.stringify({ error: 'El campo TV debe ser un valor booleano' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (typeof has_minibar !== 'boolean') {
      return new Response(JSON.stringify({ error: 'El campo minibar debe ser un valor booleano' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (typeof has_balcony !== 'boolean') {
      return new Response(JSON.stringify({ error: 'El campo balcón debe ser un valor booleano' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!price_per_night || Number(price_per_night) <= 0) {
      return new Response(JSON.stringify({ error: 'El precio por noche debe ser mayor a 0' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: 'Debe proporcionar al menos una imagen' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Procesar imágenes base64 para subir a Firebase
    const processedImages = await Promise.all(
      images.map(async (image, index) => {
        if (isBase64(image.image_url)) {
          const fileName = `room_${room_number.replace(/\s+/g, '_')}_${index + 1}.jpg`;
          const firebaseUrl = await uploadImageToFirebase(image.image_url, fileName);
          return { image_url: firebaseUrl, order: image.order };
        }
        return image; // ya es un objeto con image_url y order
      })
    );

    // Crear body actualizado con URLs de Firebase
    const updatedBody = {
      room_number,
      room_type,
      capacity,
      number_of_beds,
      has_wifi,
      has_air_conditioning,
      has_tv,
      has_minibar,
      has_balcony,
      price_per_night: String(price_per_night), // Asegurar que sea string
      description: description || '',
      images: processedImages
    };

    // Enviar a API externa
    const res = await fetch(API_ROOMS_URL, {
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
    console.error('Error en POST /api/room:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al agregar la habitación',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
