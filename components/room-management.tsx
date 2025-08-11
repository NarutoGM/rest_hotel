"use client";
import type React from "react";
import { useState, useEffect, MouseEvent } from "react";
import { translations } from "../components/translations/room_management"; // New import

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  number_of_beds: number;
  has_wifi: boolean;
  has_air_conditioning: boolean;
  has_tv: boolean;
  has_minibar: boolean;
  has_balcony: boolean;
  price_per_night: string;
  description: string;
  images: { id: number; room_id: number; image_url: string; order: number; created_at: string; updated_at: string }[];
}

export default function RoomManagement() {
  // Obtener idioma desde localStorage o usar "es" por defecto
  const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "es" : "es";
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState("Estándar");
  const [newRoomCapacity, setNewRoomCapacity] = useState<number | "">(2);
  const [newRoomBeds, setNewRoomBeds] = useState<number | "">(1);
  const [newRoomWifi, setNewRoomWifi] = useState<boolean>(true);
  const [newRoomAirConditioning, setNewRoomAirConditioning] = useState<boolean>(true);
  const [newRoomTv, setNewRoomTv] = useState<boolean>(true);
  const [newRoomMinibar, setNewRoomMinibar] = useState<boolean>(true);
  const [newRoomBalcony, setNewRoomBalcony] = useState<boolean>(true);
  const [newRoomPrice, setNewRoomPrice] = useState<number | "">(100);
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomImages, setNewRoomImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/room");
      if (!response.ok) throw new Error(t.errorLoadingRooms);
      const data = await response.json();
      console.log("Datos de habitaciones recibidos:", data);
      setRooms(data.data || []); // Set rooms to data.data, default to empty array if undefined
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUnknown);
      setRooms([]); // Ensure rooms is an array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (newRoomNumber.trim() === "") {
      alert(t.roomNumberEmpty);
      return;
    }
    if (newRoomType.trim() === "") {
      alert(t.roomTypeEmpty);
      return;
    }
    if (!newRoomCapacity || newRoomCapacity <= 0) {
      alert(t.invalidCapacity);
      return;
    }
    if (!newRoomBeds || newRoomBeds <= 0) {
      alert(t.invalidBeds);
      return;
    }
    if (!newRoomPrice || newRoomPrice <= 0) {
      alert(t.invalidPrice);
      return;
    }
    if (newRoomImages.length === 0) {
      alert(t.noImages);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        room_number: newRoomNumber,
        room_type: newRoomType,
        capacity: Number(newRoomCapacity),
        number_of_beds: Number(newRoomBeds),
        has_wifi: newRoomWifi,
        has_air_conditioning: newRoomAirConditioning,
        has_tv: newRoomTv,
        has_minibar: newRoomMinibar,
        has_balcony: newRoomBalcony,
        price_per_night: Number(newRoomPrice).toFixed(2),
        description: newRoomDescription,
        images: newRoomImages.map((url, index) => ({
          image_url: url,
          order: index + 1,
        })),
      };

      if (editingRoomId) {
        const response = await fetch(`/api/room/${editingRoomId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(t.errorUpdatingRoom);
        await fetchRooms();
        setEditingRoomId(null);
      } else {
        const response = await fetch("/api/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(t.errorAddingRoom);
        await fetchRooms();
      }
      setNewRoomNumber("");
      setNewRoomType("");
      setNewRoomCapacity(2);
      setNewRoomBeds(1);
      setNewRoomWifi(true);
      setNewRoomAirConditioning(true);
      setNewRoomTv(true);
      setNewRoomMinibar(true);
      setNewRoomBalcony(true);
      setNewRoomPrice(100);
      setNewRoomDescription("");
      setNewRoomImages([]);
      setNewImageUrl("");
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorUnknown);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoom = (room: Room) => {
    setNewRoomNumber(room.room_number);
    setNewRoomType(room.room_type);
    setNewRoomCapacity(room.capacity);
    setNewRoomBeds(room.number_of_beds);
    setNewRoomWifi(room.has_wifi);
    setNewRoomAirConditioning(room.has_air_conditioning);
    setNewRoomTv(room.has_tv);
    setNewRoomMinibar(room.has_minibar);
    setNewRoomBalcony(room.has_balcony);
    setNewRoomPrice(parseFloat(room.price_per_night));
    setNewRoomDescription(room.description);
    setNewRoomImages(room.images.map((img) => img.image_url));
    setNewImageUrl("");
    setEditingRoomId(room.id);
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm(t.deleteConfirm)) {
      setLoading(true);
      try {
        const response = await fetch(`/api/room/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error(t.errorDeletingRoom);
        await fetchRooms();
      } catch (err) {
        setError(err instanceof Error ? err.message : t.errorUnknown);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoomId(null);
    setNewRoomNumber("");
    setNewRoomType("Estándar");
    setNewRoomCapacity(2);
    setNewRoomBeds(1);
    setNewRoomWifi(true);
    setNewRoomAirConditioning(true);
    setNewRoomTv(true);
    setNewRoomMinibar(true);
    setNewRoomBalcony(true);
    setNewRoomPrice(100);
    setNewRoomDescription("");
    setNewRoomImages([]);
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
        setNewRoomImages((prev) => [...prev, ...results]);
      });
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim() && !newRoomImages.includes(newImageUrl)) {
      setNewRoomImages((prev) => [...prev, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setNewRoomImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-red-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
                🏨 {t.roomManagement}
              </h1>
              <p className="text-gray-600 mt-2">{t.manageRooms}</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
              disabled={loading}
            >
              ✨ {t.addRoom}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-md border border-yellow-100">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <span className="text-yellow-600 text-xl">🛏️</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">{t.totalRooms}</p>
                  <p className="text-2xl font-bold text-gray-800">{rooms.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-green-100">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">{t.averagePrice}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${rooms.length > 0 ? (rooms.reduce((acc, room) => acc + parseFloat(room.price_per_night), 0) / rooms.length).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-purple-600 text-xl">📷</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-600 text-sm">{t.totalImages}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {rooms.reduce((acc, room) => acc + room.images.length, 0)}
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
            {t.loading}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gray-100">
                {room.images.length > 0 ? (
                  <div className="relative h-full">
                    <img
                      src={room.images[0].image_url}
                      alt={room.room_number}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                    />
                    {room.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-sm">
                        +{room.images.length - 1} {t.moreImages}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400 text-4xl">🛏️</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                    {room.room_number}
                  </h3>
                  <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold ml-2 whitespace-nowrap">
                    ${parseFloat(room.price_per_night).toFixed(2)}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-2">
                  <span className="font-medium">{t.type}:</span>{" "}
                  {t[room.room_type.toLowerCase() as keyof typeof t] || room.room_type}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <span className="font-medium">{t.capacity}:</span> {room.capacity} {t.people}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <span className="font-medium">{t.numberOfBeds}:</span> {room.number_of_beds} {t.beds}
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  <span className="font-medium">{t.amenities}:</span>{" "}
                  {[
                    room.has_wifi && t.wifi,
                    room.has_air_conditioning && t.airConditioning,
                    room.has_tv && t.tv,
                    room.has_minibar && t.minibar,
                    room.has_balcony && t.balcony,
                  ].filter(Boolean).join(", ") || t.none}
                </p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  <span className="font-medium">{t.description}:</span>{" "}
                  {room.description || t.noDescription}
                </p>

                {room.images.length > 1 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {room.images.slice(1, 4).map((image, index) => (
                      <img
                        key={index}
                        src={image.image_url}
                        alt={`${room.room_number} ${index + 2}`}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                        onError={(e) => (e.currentTarget.src = "/placeholder-image.jpg")}
                      />
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditRoom(room)}
                    className="flex-1 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition disabled:opacity-50 font-medium"
                    disabled={loading}
                  >
                    ✏️ {t.edit}
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50 font-medium"
                    disabled={loading}
                  >
                    🗑️ {t.delete}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && !loading && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🛏️</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t.noRoomsRegistered}</h3>
            <p className="text-gray-500 mb-6">{t.startAddingRoom}</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-red-600 transition-all duration-200"
            >
              ✨ {t.addFirstRoom}
            </button>
          </div>
        )}

        {isModalOpen && (
          <div
            className="fixed inset-0 border bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
          >
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {editingRoomId ? `✏️ ${t.editRoom}` : `✨ ${t.addNewRoom}`}
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
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🏷️ {t.roomNumber}
                      </label>
                      <input
                        value={newRoomNumber}
                        onChange={(e) => setNewRoomNumber(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                        placeholder={t.placeholderRoomNumber}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🛋️ {t.type}
                      </label>
                      <select
                        value={newRoomType}
                        onChange={(e) => setNewRoomType(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                        disabled={loading}
                      >
                        <option value="Estándar">{t.standard}</option>
                        <option value="Suite">{t.suite}</option>
                        <option value="Deluxe">{t.deluxe}</option>
                        <option value="Familiar">{t.family}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        👥 {t.capacity}
                      </label>
                      <input
                        type="number"
                        value={newRoomCapacity}
                        onChange={(e) => setNewRoomCapacity(Number(e.target.value) || 0)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                        min="1"
                        placeholder={t.placeholderCapacity}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🛏️ {t.numberOfBeds}
                      </label>
                      <input
                        type="number"
                        value={newRoomBeds}
                        onChange={(e) => setNewRoomBeds(Number(e.target.value) || 0)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                        min="1"
                        placeholder={t.placeholderBeds}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        💰 {t.pricePerNight}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="number"
                          value={newRoomPrice}
                          onChange={(e) => setNewRoomPrice(Number(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                          min="0"
                          step="0.01"
                          placeholder={t.placeholderPrice}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📝 {t.description}
                      </label>
                      <textarea
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100 transition"
                        placeholder={t.placeholderDescription}
                        disabled={loading}
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ⚙️ {t.amenities}
                      </label>
                      <div className="flex space-x-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newRoomWifi}
                            onChange={(e) => setNewRoomWifi(e.target.checked)}
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 rounded disabled:bg-gray-100"
                            disabled={loading}
                          />
                          <label className="ml-2 text-sm text-gray-600">{t.wifi}</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newRoomAirConditioning}
                            onChange={(e) => setNewRoomAirConditioning(e.target.checked)}
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 rounded disabled:bg-gray-100"
                            disabled={loading}
                          />
                          <label className="ml-2 text-sm text-gray-600">{t.airConditioning}</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newRoomTv}
                            onChange={(e) => setNewRoomTv(e.target.checked)}
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 rounded disabled:bg-gray-100"
                            disabled={loading}
                          />
                          <label className="ml-2 text-sm text-gray-600">{t.tv}</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newRoomMinibar}
                            onChange={(e) => setNewRoomMinibar(e.target.checked)}
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 rounded disabled:bg-gray-100"
                            disabled={loading}
                          />
                          <label className="ml-2 text-sm text-gray-600">{t.minibar}</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newRoomBalcony}
                            onChange={(e) => setNewRoomBalcony(e.target.checked)}
                            className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 rounded disabled:bg-gray-100"
                            disabled={loading}
                          />
                          <label className="ml-2 text-sm text-gray-600">{t.balcony}</label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📷 {t.imageManagement}
                      </label>
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-600 mb-3">{t.addFromUrl}</h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none disabled:bg-gray-100"
                            placeholder={t.placeholderImageUrl}
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
                        <h4 className="text-sm font-medium text-gray-600 mb-3">{t.uploadFromDevice}</h4>
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
                          {t.addedImages} ({newRoomImages.length})
                        </h4>
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {newRoomImages.map((image, index) => (
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
                          {newRoomImages.length === 0 && (
                            <div className="col-span-2 text-center py-8 text-gray-400">
                              <span className="text-4xl mb-2 block">📷</span>
                              <p className="text-sm">{t.noImagesAdded}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleAddRoom}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:from-yellow-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {t.processing}
                      </div>
                    ) : (
                      <>{editingRoomId ? `💾 ${t.saveChanges}` : `✨ ${t.addRoom}`}</>
                    )}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    ❌ {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}