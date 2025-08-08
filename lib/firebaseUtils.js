import { storage } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Verifica si un string es base64
export const isBase64 = (str) => {
  return /^data:image\/[a-z]+;base64,/.test(str);
};

// Obtiene el tipo MIME real
const getMimeType = (base64String) => {
  const match = base64String.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : "image/jpeg";
};

// Limpia el base64 (quita el encabezado)
const cleanBase64 = (base64String) => {
  return base64String.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
};

// Sube imagen base64 a Firebase y retorna la URL
export const uploadImageToFirebase = async (base64, fileName) => {
  try {
    const mimeType = getMimeType(base64);
    const extension = mimeType.split("/")[1];
    const finalFileName = fileName.replace(/\.[^/.]+$/, `.${extension}`);

    const storageRef = ref(storage, `dishes/${Date.now()}_${finalFileName}`);
    const buffer = Buffer.from(cleanBase64(base64), "base64");

    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error("La imagen supera el límite de 10MB permitido por Firebase.");
    }

    await uploadBytes(storageRef, buffer, { contentType: mimeType });
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Firebase error details:", error);
    throw new Error(`Error uploading image to Firebase: ${error.message}`);
  }
};

// Elimina una imagen de Firebase dado su URL pública
export const deleteImageFromFirebase = async (imageUrl) => {
  try {
    // Extraer solo la ruta del archivo en el bucket
    const fullPath = decodeURIComponent(imageUrl.split("/o/")[1].split("?")[0]);
    const imgRef = ref(storage, fullPath);

    await deleteObject(imgRef);
    console.log(`Imagen eliminada de Firebase: ${fullPath}`);
  } catch (error) {
    if (error.code === "storage/object-not-found") {
      console.warn(`Imagen ya no existe en Firebase: ${imageUrl}`);
    } else {
      console.warn(`No se pudo eliminar imagen: ${imageUrl}`, error);
    }
  }
};
