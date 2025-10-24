"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { ChatSocketContext } from "../context/ChatSocketProvider";

type UserProfile = {
  pseudo: string;
  photo?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<{ name: string; clients: Record<string, any> }[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const chat = useContext(ChatSocketContext);

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

  // helper to decode possibly multi-encoded room names and trim for display
  const formatRoomName = (raw: string, max = 40) => {
    let full = raw;
    try {
      // Iteratively decode until stable or max iterations (handles double/triple encoding)
      let prev = null;
      const maxIterations = 6;
      let i = 0;
      while (i < maxIterations && full !== prev) {
        prev = full;
        try {
          full = decodeURIComponent(full);
        } catch (e) {
          // stop decoding if invalid
          break;
        }
        i++;
      }

      // Replace plus with space (some encodings use + for spaces)
      full = full.replace(/\+/g, " ");

      // Trim surrounding quotes or whitespace
      full = full.trim().replace(/^\"|\"$/g, "");
    } catch (e) {
      // leave raw if decode fails
      full = raw;
    }
    if (full.length <= max) return { short: full, full };
    const short = full.slice(0, max - 1).trim() + "…";
    return { short, full };
  };

  useEffect(() => {
    const fetchRooms = async () => {
      setRoomsLoading(true);
      try {
        const res = await fetch("https://api.tools.gavago.fr/socketio/api/rooms", {
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Bienvenue sur Chat PWA 👋</h1>

      {profile ? (
        <div className="flex flex-col items-center bg-white text-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
          <div className="flex flex-col items-center w-full">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-1 rounded-full shadow-lg mb-4">
              {profile.photo && (
                <img
                  src={profile.photo}
                  alt="Photo de profil"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                />
              )}
            </div>
            <p className="text-2xl font-bold mb-1 mt-2">{profile.pseudo}</p>
            <p className="text-gray-500 mb-4">Bienvenue 👋</p>
          </div>
          <div className="flex flex-row gap-4 w-full justify-center mt-4">
            <button
              onClick={() => router.push("/create-profile")}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold shadow transition"
            >
              Profil
            </button>
            <button
              onClick={createRoom}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 rounded-lg text-white font-semibold shadow transition"
            >
              Créer une salle
            </button>
            <button
              onClick={() => router.push("/gallery")}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg text-white font-semibold shadow transition"
            >
              Galerie
            </button>
          </div>

          {/* Rooms list fetched from API */}
          <div className="mt-6 w-full">
            <h2 className="text-lg font-semibold mb-2">Salles disponibles</h2>
            {roomsLoading ? (
              <p className="text-sm text-gray-500">Chargement des salles...</p>
            ) : rooms.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune salle trouvée.</p>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                {rooms.map((r) => (
                  <button
                    key={r.name}
                    onClick={() => joinRoom(r.name)}
                    className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      {(() => {
                        const { short, full } = formatRoomName(r.name, 42);
                        return <span className="font-medium" title={full}>{short}</span>;
                      })()}
                      <span className="text-sm text-gray-600">{Object.keys(r.clients).length} membres</span>
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
          className="px-6 py-3 bg-white text-indigo-700 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition"
        >
          Créer mon profil
        </button>
      )}
    </main>
  );
}
