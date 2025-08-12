import { isBase64, uploadImageToFirebase, deleteImageFromFirebase } from "../../../../../lib/firebaseUtils";

const API_BASE_URL = 'https://reservations-uty9.onrender.com/api/menu-items';
const HEADERS = { 'Content-Type': 'application/json' };

// PUT /api/dishes/[id]
export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const { name, description, price, images, category_id } = await request.json();
    console.log("images recibidas:", images);

    // 1️⃣ Obtener imágenes actuales desde la API externa
    const currentRes = await fetch(`${API_BASE_URL}/${id}`, { headers: HEADERS });
    const currentData = await currentRes.json();
    const currentImages = currentData?.data?.images || [];

    // 2️⃣ Determinar cuáles imágenes borrar
    // - Se borra si: ya no está en el nuevo array o si viene en base64 (se reemplazará)
    const imagesToDelete = currentImages.filter(oldImg => {
      const match = images.find(newImg => newImg.image_url === oldImg.image_url);
      return !match || isBase64(match.image_url);
    });

    await Promise.all(
      imagesToDelete.map(img => deleteImageFromFirebase(img.image_url))
    );

    // 3️⃣ Procesar y subir imágenes nuevas si es necesario
    const uploadedImages = await Promise.all(
      (images || []).map(async (img, index) => {
        // Si viene en base64 → subir a Firebase
        if (isBase64(img.image_url)) {
          const fileName = `image_${name}_${index + 1}_${Date.now()}.jpg`;
          const firebaseUrl = await uploadImageToFirebase(img.image_url, fileName);
          return { image_url: firebaseUrl, order: img.order };
        }
        // Si ya es URL → mantener
        return img;
      })
    );

    // 4️⃣ Enviar actualización a la API externa
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({
        name,
        description: description ?? "",
        price: Number(price),
        category_id,
        images: uploadedImages
      })
    });

    const result = await res.json();

    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : res.status,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error en PUT:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}


// DELETE /api/dishes/[id]
export async function DELETE(_, context) {
  try {
    const { id } = await context.params;

    // Obtener plato para borrar imágenes
    const getRes = await fetch(`${API_BASE_URL}/${id}`, { method: 'GET', headers: HEADERS });
    const dish = await getRes.json();

    if (!getRes.ok || !dish?.data) {
      return new Response(JSON.stringify({ error: "Plato no encontrado" }), { status: 404 });
    }

    // Eliminar imágenes de Firebase (ignorar si no existen)
    await Promise.all(
      dish.data.images.map(async img => {
        try {
          await deleteImageFromFirebase(img.image_url);
        } catch (err) {
          if (err.code === "storage/object-not-found") {
            console.warn(`Imagen ya no existe en Firebase: ${img.image_url}`);
          } else {
            console.error(`Error al eliminar imagen: ${img.image_url}`, err);
          }
        }
      })
    );

    // Eliminar en servidor externo
    const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE', headers: HEADERS });

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
      result = { message: "Plato eliminado correctamente" };
    }

    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error en DELETE:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

