"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { ChatSocketContext } from "../context/ChatSocketProvider";
import { API_BASE_URL } from "../utils/constants";
import { formatRoomName } from "../utils/helpers";

type UserProfile = {
  pseudo: string;
  photo?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<{ name: string; clients: Record<string, any> }[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const chat = useContext(ChatSocketContext);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));

        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
        };

        battery.addEventListener("levelchange", updateBattery);
        return () => {
          battery.removeEventListener("levelchange", updateBattery);
        };
      }).catch((e: any) => console.warn("Battery init error", e));
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("chat_user");
    if (stored) {
      setProfile(JSON.parse(stored));
    }
  }, []);

  const joinRoom = async (roomName: string) => {
    if (!profile) {
      router.push("/create-profile");
      return;
    }

    try {
      await chat.joinRoom(profile.pseudo, roomName);
      router.push(`/room/${encodeURIComponent(roomName)}`);
    } catch (e) {
      console.error("Failed to join room", e);
      alert("Impossible de rejoindre la salle.");
    }
  };

  const createRoom = async () => {
    if (!profile) {
      router.push("/create-profile");
      return;
    }
    const name = window.prompt("Nom de la nouvelle salle :", "");
    if (!name || !name.trim()) return;
    const roomName = name.trim();
    try {
      await chat.joinRoom(profile.pseudo, roomName);
      router.push(`/room/${encodeURIComponent(roomName)}`);
    } catch (e) {
      console.error("Failed to create/join room", e);
      alert("Impossible de créer la salle.");
    }
  };



  useEffect(() => {
    const fetchRooms = async () => {
      setRoomsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/socketio/api/rooms`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch rooms");
        const json = await res.json();
        if (json.success && json.data) {
          const data = json.data;
          const list = Object.keys(data).map((roomName) => ({
            name: roomName,
            clients: data[roomName]?.clients || {},
          }));
          setRooms(list);
        } else {
          console.warn("Rooms API did not return expected data", json);
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 text-white p-6">
      <div className="mb-8 drop-shadow-2xl hover:scale-105 transition transform duration-500">
        <img src="/logo.svg" alt="Chat PWA Logo" className="w-32 h-32 object-cover rounded-[2.5rem] shadow-2xl" />
      </div>

      {batteryLevel !== null && (
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-medium border border-white/30 shadow-sm" title="Niveau de batterie">
          🔋 {batteryLevel}%
        </div>
      )}

      {profile ? (
        <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
          <div className="flex flex-col items-center w-full">
            {profile.photo && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-1 rounded-full shadow-lg mb-4">
                <img
                  src={profile.photo}
                  alt={profile.pseudo}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white"
                />
              </div>
            )}
            <p className="text-2xl font-bold mb-1 mt-2">{profile.pseudo}</p>
          </div>
          <div className="flex flex-row gap-4 w-full justify-center mt-4">
            <button
              onClick={() => router.push("/create-profile")}
              className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 border border-white/10 rounded-xl text-white font-semibold shadow-lg transition transform hover:scale-105"
            >
              Profil
            </button>
            <button
              onClick={createRoom}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 rounded-xl text-white font-semibold shadow-lg transition transform hover:scale-105"
            >
              Créer une salle
            </button>
            <button
              onClick={() => router.push("/gallery")}
              className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 border border-white/10 rounded-xl text-white font-semibold shadow-lg transition transform hover:scale-105"
            >
              Galerie
            </button>
          </div>

          {/* Rooms list fetched from API */}
          <div className="mt-6 w-full">
            <h2 className="text-lg font-semibold mb-2">Salles disponibles</h2>

            <input
              type="text"
              placeholder="Rechercher une salle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 mb-4 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder-white/60 transition"
            />

            {roomsLoading ? (
              <p className="text-sm text-white/60 text-center animate-pulse">Chargement des salles...</p>
            ) : rooms.length === 0 ? (
              <p className="text-sm text-white/60 text-center">Aucune salle trouvée.</p>
            ) : (
              <div className="flex flex-col gap-3 w-full max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {rooms
                  .filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((r) => (
                    <button
                      key={r.name}
                      onClick={() => joinRoom(r.name)}
                      className="w-full text-left px-5 py-3 bg-white/5 hover:bg-white/20 border border-white/10 rounded-xl transition group"
                    >
                      <div className="flex justify-between items-center">
                        {(() => {
                          const { short, full } = formatRoomName(r.name, 42);
                          return <span className="font-medium text-white group-hover:text-pink-200 transition" title={full}>{short}</span>;
                        })()}
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/90">{Object.keys(r.clients).length} 👤</span>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => router.push("/create-profile")}
          className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-full shadow-2xl hover:bg-gray-100 transition transform hover:scale-105"
        >
          Créer mon profil
        </button>
      )}
    </main>
  );
}
