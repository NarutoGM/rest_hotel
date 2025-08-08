"use client";
import type React from "react";
import { useState, useEffect, MouseEvent } from "react";

interface Table {
  id: string;
  table_number: string;
  capacity: number;
  location: string;
  status: string;
}

export default function TableManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState<number | "">(2);
  const [newTableLocation, setNewTableLocation] = useState("Garden");
  const [newTableIsAvailable, setNewTableIsAvailable] = useState<boolean>(true);
  const [newTableStatus, setNewTableStatus] = useState("available");
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tables");
      if (!response.ok) throw new Error("Error al cargar las mesas");
      const data = await response.json();
      setTables(data.data || []); // Use data.data, default to empty array
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setTables([]); // Ensure tables is an array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    if (newTableNumber.trim() === "") {
      alert("El número de la mesa no puede estar vacío.");
      return;
    }
    if (!newTableCapacity || newTableCapacity <= 0) {
      alert("Por favor, ingrese una capacidad válida mayor a 0.");
      return;
    }
    if (newTableLocation.trim() === "") {
      alert("La ubicación de la mesa no puede estar vacía.");
      return;
    }
    if (newTableStatus.trim() === "") {
      alert("El estado de la mesa no puede estar vacío.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        table_number: newTableNumber,
        capacity: Number(newTableCapacity),
        location: newTableLocation,
        status: newTableStatus,
      };

      if (editingTableId) {
        const response = await fetch(`/api/tables/${editingTableId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Error al actualizar la mesa");
        await fetchTables();
        setEditingTableId(null);
      } else {
        const response = await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Error al agregar la mesa");
        await fetchTables();
      }
      setNewTableNumber("");
      setNewTableCapacity(2);
      setNewTableLocation("Garden");
      setNewTableIsAvailable(true);
      setNewTableStatus("available");
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTable = (table: Table) => {
    setNewTableNumber(table.table_number);
    setNewTableCapacity(table.capacity);
    setNewTableLocation(table.location);
    setNewTableStatus(table.status);
    setEditingTableId(table.id);
    setIsModalOpen(true);
  };

  const handleDeleteTable = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta mesa?")) {
      setLoading(true);
      try {
        const response = await fetch(`/api/tables/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Error al eliminar la mesa");
        await fetchTables();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTableId(null);
    setNewTableNumber("");
    setNewTableCapacity(2);
    setNewTableLocation("Garden");
    setNewTableIsAvailable(true);
    setNewTableStatus("available");
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-red-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
                🍽️ Gestión de Mesas
              </h1>
              <p className="text-gray-600 mt-2">Administra las mesas de tu establecimiento de forma fácil y visual</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              disabled={loading}
            >
              ✨ Agregar Mesa
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-yellow-100">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <span className="text-yellow-600 text-xl">🍽️</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Total Mesas</p>
                  <p className="text-2xl font-bold text-gray-800">{tables.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-green-100">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Capacidad Promedio</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {tables.length > 0
                      ? (tables.reduce((acc, table) => acc + table.capacity, 0) / tables.length).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-purple-600 text-xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">Mesas Disponibles</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {tables.filter((table) => table.status).length}
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
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl shadow-sm flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
            Cargando...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-4xl">🍽️</span>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{table.table_number}</h3>
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold ml-2 whitespace-nowrap">
                    {table.capacity} pers.
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  <span className="font-medium">Ubicación:</span> {table.location}
                </p>
            
                <p className="text-gray-600 text-sm mb-4">
                  <span className="font-medium">Estado:</span> {table.status}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTable(table)}
                    className="flex-1 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition disabled:opacity-50 font-medium"
                    disabled={loading}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
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

        {tables.length === 0 && !loading && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🍽️</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay mesas registradas</h3>
            <p className="text-gray-500 mb-6">¡Comienza agregando tu primera mesa!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-red-600 transition-all duration-200"
            >
              ✨ Agregar Primera Mesa
            </button>
          </div>
        )}

        {isModalOpen && (
          <div
            className="fixed inset-0 border bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
          >
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {editingTableId ? "✏️ Editar Mesa" : "✨ Agregar Nueva Mesa"}
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

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🏷️ Número de la mesa
                  </label>
                  <input
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                    placeholder="Ej: 1"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👥 Capacidad
                  </label>
                  <input
                    type="number"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(Number(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                    min="1"
                    placeholder="Ej: 4"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📍 Ubicación
                  </label>
                  <select
                    value={newTableLocation}
                    onChange={(e) => setNewTableLocation(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                    disabled={loading}
                  >
                    <option value="Garden">Jardín</option>
                    <option value="Terrace">Terraza</option>
                    <option value="Indoor">Interior</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔄 Estado
                  </label>
                  <select
                    value={newTableStatus}
                    onChange={(e) => setNewTableStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                    disabled={loading}
                  >
                    <option value="available">Disponible</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="reserved">Reservada</option>
                  </select>
                </div>
              </div>

              <div className="p-6 flex gap-4 border-t border-gray-200">
                <button
                  onClick={handleAddTable}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    <>{editingTableId ? "💾 Guardar Cambios" : "✨ Agregar Mesa"}</>
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
        )}
      </div>
    </div>
  );
}