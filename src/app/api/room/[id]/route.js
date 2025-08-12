import { isBase64, uploadImageToFirebase, deleteImageFromFirebase } from "../../../../../lib/firebaseUtils";

const API_ROOMS_URL = 'https://reservations-uty9.onrender.com/api/rooms';
const HEADERS = { 'Content-Type': 'application/json' };

// PUT /api/room/[id]
export async function PUT(request, context) {
  try {
    const { id } = await context.params;
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
    } = await request.json();

    // 🛡 Validaciones (las dejo igual que las tuyas)
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

    // 1️⃣ Obtener imágenes actuales desde API externa
    const currentRes = await fetch(`${API_ROOMS_URL}/${id}`, { headers: HEADERS });
    const currentData = await currentRes.json();
    const currentImages = currentData?.data?.images || [];

    // 2️⃣ Borrar solo las imágenes que se eliminan o se reemplazan
    const imagesToDelete = currentImages.filter(oldImg => {
      const match = images.find(newImg => newImg.image_url === oldImg.image_url);
      return !match || isBase64(match.image_url); 
    });

    await Promise.all(
      imagesToDelete.map(async img => {
        try {
          await deleteImageFromFirebase(img.image_url);
          console.log(`Imagen eliminada: ${img.image_url}`);
        } catch (err) {
          if (err.code === "storage/object-not-found") {
            console.warn(`Imagen ya no existe en Firebase: ${img.image_url}`);
          } else {
            console.error(`Error al eliminar imagen: ${img.image_url}`, err);
          }
        }
      })
    );

    // 3️⃣ Subir imágenes nuevas (solo las base64)
    const processedImages = await Promise.all(
      images.map(async (image, index) => {
        if (isBase64(image.image_url)) {
          const fileName = `room_${room_number.replace(/\s+/g, '_')}_${index + 1}.jpg`;
          const firebaseUrl = await uploadImageToFirebase(image.image_url, fileName);
          return { image_url: firebaseUrl, order: image.order };
        }
        return image;
      })
    );

    // 4️⃣ Crear body actualizado
    const updatedBody = {
      room_number,
      room_type,
      capacity: Number(capacity),
      number_of_beds: Number(number_of_beds),
      has_wifi,
      has_air_conditioning,
      has_tv,
      has_minibar,
      has_balcony,
      price_per_night: String(price_per_night),
      description: description || '',
      images: processedImages
    };

    // 5️⃣ Enviar actualización a API externa
    const res = await fetch(`${API_ROOMS_URL}/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify(updatedBody),
    });

    const result = await res.json();

    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en PUT /api/room:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al actualizar la habitación',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}


// DELETE /api/room/[id]
export async function DELETE(_, context) {
  try {
    const { id } = await context.params;

    // Eliminar en servidor externo
    const res = await fetch(`${API_ROOMS_URL}/${id}`, {
      method: 'DELETE',
      headers: HEADERS,
    });

    // Manejar posible respuesta vacía
    let result = null;
    const text = await res.text();
    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text };
      }
    } else {
      result = { message: 'Habitación eliminada correctamente' };
    }

    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en DELETE /api/room:', error);
    return new Response(
      JSON.stringify({
        error: 'Error al eliminar la habitación',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}