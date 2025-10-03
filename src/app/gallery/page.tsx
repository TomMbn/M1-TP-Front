"use client";

import { useEffect, useState } from "react";

interface Attachment {
  id: number;
  url: string;
}

export default function GalleryPage() {
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
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-indigo-700">Galerie des pièces jointes</h1>
      {attachments.length === 0 ? (
        <p className="text-gray-500">Aucune pièce jointe pour l'instant.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {attachments.map((att) => (
            <img
              key={att.id}
              src={att.url}
              alt="Pièce jointe"
              className="rounded-lg shadow object-cover w-full h-40"
            />
          ))}
        </div>
      )}
    </main>
  );
}
