"use client";
import type React from "react";
import { useState, useEffect, MouseEvent } from "react";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: number; // Added category_id
  images: string[]; // Array of URLs or base64 strings for dish images
}

interface Category {
  id: number;
  name: string;
}

export default function DishManagement() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // State for categories
  const [newDishName, setNewDishName] = useState("");
  const [newDishDescription, setNewDishDescription] = useState("");
  const [newDishPrice, setNewDishPrice] = useState<number | "">(0);
  const [newDishCategoryId, setNewDishCategoryId] = useState<number | "">(""); // State for category_id
  const [newDishImages, setNewDishImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDishes();
    fetchCategories(); // Fetch categories on mount
  }, []);

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dishes");
      if (!response.ok) throw new Error(`Error al cargar los platos: ${response.status}`);
      const { success, message, data } = await response.json();
      if (!success) throw new Error(message || "Error al obtener los platos");

      const transformedDishes: Dish[] = data.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        description: item.description || "",
        price: item.price,
        category_id: item.category_id, // Include category_id
        images: item.images.map((img: any) => img.image_url),
      }));

      setDishes(transformedDishes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error(`Error al cargar las categorías: ${response.status}`);
      const { success, message, data } = await response.json();
      if (!success) throw new Error(message || "Error al obtener las categorías");

      setCategories(data.map((item: any) => ({
        id: item.id,
        name: item.name,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDish = async () => {
    if (newDishName.trim() === "") {
      alert("El nombre del plato no puede estar vacío.");
      return;
    }
    if (!newDishPrice || newDishPrice <= 0) {
      alert("Por favor, ingrese un precio válido mayor a 0.");
      return;
    }
    if (!newDishCategoryId) {
      alert("Por favor, seleccione una categoría.");
      return;
    }
    if (newDishImages.length === 0) {
      alert("Debe proporcionar al menos una imagen para el plato.");
      return;
    }

    setLoading(true);
    try {
      const imagesPayload = newDishImages.map((url, index) => ({
        image_url: url,
        order: index + 1,
      }));

      const payload = {
        name: newDishName,
        description: newDishDescription,
        price: Number(newDishPrice),
        category_id: Number(newDishCategoryId), // Use category_id instead of category
        images: imagesPayload,
      };
      console.log("Payload to send:", payload);
      if (editingDishId) {
        const response = await fetch(`/api/dishes/${editingDishId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const { message } = await response.json();
          throw new Error(message || "Error al actualizar el plato");
        }
      } else {
        const response = await fetch("/api/dishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const { message } = await response.json();
          throw new Error(message || "Error al agregar el plato");
        }
      }
      await fetchDishes();
      setEditingDishId(null);
      setNewDishName("");
      setNewDishDescription("");
      setNewDishPrice(0);
      setNewDishCategoryId(""); // Reset category
      setNewDishImages([]);
      setNewImageUrl("");
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleEditDish = (dish: Dish) => {
    setNewDishName(dish.name);
    setNewDishDescription(dish.description);
    setNewDishPrice(dish.price);
    setNewDishCategoryId(dish.category_id); // Set category_id
    setNewDishImages(dish.images);
    setNewImageUrl("");
    setEditingDishId(dish.id);
    setIsModalOpen(true);
  };

  const handleDeleteDish = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este plato?")) {
      setLoading(true);
      try {
        const response = await fetch(`/api/dishes/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Error al eliminar el plato");
        await fetchDishes();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDishId(null);
    setNewDishName("");
    setNewDishDescription("");
    setNewDishPrice(0);
    setNewDishCategoryId(""); // Reset category
    setNewDishImages([]);
    setNewImageUrl("");
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      Promise.all(
        fileArray.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      ).then((results) => {
        setNewDishImages((prev) => [...prev, ...results]);
      });
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim() && !newDishImages.includes(newImageUrl)) {
      setNewDishImages((prev) => [...prev, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setNewDishImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
                🍽️ Gestión de Platos
              </h1>
              <p className="text-gray-600 mt-2">Administra tu menú de forma fácil y visual</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              disabled={loading}
            >
              ✨ Agregar Plato
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-yellow-100">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <span className="text-yellow-600 text-xl">🍕</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Platos</p>
                  <p className="text-2xl font-bold text-gray-800">{dishes.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-green-100">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">💰</span>
                </div>
     




     
<div className="ml-4">
  <p className="text-gray-600 text-sm">Precio Promedio</p>
  <p className="text-2xl font-bold text-gray-800">
    {dishes.length > 0
      ? `$${(
          dishes.reduce((acc, dish) => {
            // Intentamos convertir a número siempre
            const priceNum = Number(dish.price);
            console.log('Precio actual:', dish.price, '=> convertido a:', priceNum);
            // Si no es un número válido, sumamos 0 para no romper
            return acc + (isNaN(priceNum) ? 0 : priceNum);
          }, 0) / dishes.length
        ).toFixed(2)}`
      : '$0.00'}
  </p>
</div>






              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-blue-600 text-xl">📷</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Imágenes</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {dishes.reduce((acc, dish) => acc + dish.images.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm flex items-center">
            <span className="text-red-500 mr-3">❌</span>
            {error}
          </div>
        )}
        {loading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl shadow-sm flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            Cargando...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dishes.map((dish) => (
            <div key={dish.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative h-48 bg-gray-100">
                {dish.images.length > 0 ? (
                  <div className="relative h-full">
                    <img
                      src={dish.images[0]}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                    />
                    {dish.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-sm">
                        +{dish.images.length - 1} más
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400 text-4xl">🍽️</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{dish.name}</h3>
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold ml-2 whitespace-nowrap">
                    ${dish.price}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {dish.description || "Sin descripción"}
                </p>

                {dish.images.length > 1 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {dish.images.slice(1, 4).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${dish.name} ${index + 2}`}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                        onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                      />
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditDish(dish)}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 font-medium"
                    disabled={loading}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteDish(dish.id)}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50 font-medium"
                    disabled={loading}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {dishes.length === 0 && !loading && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🍽️</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay platos registrados</h3>
            <p className="text-gray-500 mb-6">¡Comienza agregando tu primer plato al menú!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-red-600 transition-all duration-200"
            >
              ✨ Agregar Primer Plato
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 border bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingDishId ? "✏️ Editar Plato" : "✨ Agregar Nuevo Plato"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
                  disabled={loading}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏷️ Nombre del plato
                    </label>
                    <input
                      value={newDishName}
                      onChange={(e) => setNewDishName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                      placeholder="Ej: Pizza Margherita"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📝 Descripción
                    </label>
                    <textarea
                      value={newDishDescription}
                      onChange={(e) => setNewDishDescription(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                      placeholder="Ej: Pizza con tomate, mozzarella y albahaca fresca"
                      rows={4}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📋 Categoría
                    </label>
                    <select
                      value={newDishCategoryId}
                      onChange={(e) => setNewDishCategoryId(Number(e.target.value) || "")}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                      disabled={loading}
                    >
                      <option value="">Seleccione una categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      💰 Precio
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        value={newDishPrice}
                        onChange={(e) => setNewDishPrice(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                        min="0"
                        step="0.01"
                        placeholder="12.99"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📷 Gestión de Imágenes
                    </label>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Agregar desde URL</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100"
                          placeholder="https://ejemplo.com/imagen.jpg"
                          disabled={loading}
                        />
                        <button
                          onClick={handleAddImageUrl}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:bg-green-300 font-medium"
                          disabled={loading || !newImageUrl.trim()}
                        >
                          ➕
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Subir desde dispositivo</h4>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-3">
                        Imágenes agregadas ({newDishImages.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {newDishImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Imagen ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                              onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                            />
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition opacity-0 group-hover:opacity-100 text-xs"
                              disabled={loading}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {newDishImages.length === 0 && (
                          <div className="col-span-2 text-center py-8 text-gray-400">
                            <span className="text-4xl mb-2 block">📷</span>
                            <p className="text-sm">No hay imágenes agregadas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleAddDish}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    <>{editingDishId ? "💾 Guardar Cambios" : "✨ Agregar Plato"}</>
                  )}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}