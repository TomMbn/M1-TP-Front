"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Attachment {
  id: number;
  url: string;
}

export default function GalleryPage() {
  const router = useRouter();
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem("chat_attachments");
      if (stored) setAttachments(JSON.parse(stored));
    };
    window.addEventListener("storage", handleStorage);
    handleStorage();
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white drop-shadow-md">Galerie</h1>
          <button
            onClick={() => router.push("/")}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl backdrop-blur-md transition"
          >
            ← Retour
          </button>
        </header>

        {attachments.length === 0 ? (
          <div className="text-center py-20 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/10">
            <p className="text-white/60 text-lg">Aucune photo pour l'instant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {attachments.map((att) => (
              <img
                key={att.id}
                src={att.url}
                alt="Pièce jointe"
                className="rounded-2xl shadow-lg object-cover w-full h-40 transition-transform hover:scale-105 border border-white/20"
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
