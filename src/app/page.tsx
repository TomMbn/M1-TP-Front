"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UserProfile = {
  pseudo: string;
  photo?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("chat_user");
    if (stored) {
      setProfile(JSON.parse(stored));
    }
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
              onClick={() => router.push("/conversations")}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 rounded-lg text-white font-semibold shadow transition"
            >
              Conversations
            </button>
            <button
              onClick={() => router.push("/gallery")}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg text-white font-semibold shadow transition"
            >
              Galerie
            </button>
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
