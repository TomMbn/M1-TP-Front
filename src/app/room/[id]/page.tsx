"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

interface Message {
  id: number;
  text: string;
  attachment?: string;
  sender: "me" | "other";
  timestamp: string;
}

const conversationNames: Record<string, string> = {
  "1": "Général",
  "2": "Projet M1",
  "3": "Amis",
};

export default function RoomPage() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);

  const handleSend = () => {
    if (!input && !file) return;
    setMessages([
      ...messages,
      {
        id: Date.now(),
        text: input,
        attachment: file,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInput("");
    setFile(undefined);
    setPreview(undefined);
    // Ajout à la galerie
    if (file) {
      const stored = localStorage.getItem("chat_attachments");
      const attachments = stored ? JSON.parse(stored) : [];
      attachments.push({ id: Date.now(), url: file });
      localStorage.setItem("chat_attachments", JSON.stringify(attachments));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFile(reader.result as string);
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(f);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="flex flex-col h-screen bg-gray-100">
      <header className="bg-indigo-600 text-white p-4 text-xl font-bold">
        {conversationNames[id as string] || "Conversation"}
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center">Aucun message pour l'instant.</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs p-3 rounded-2xl shadow ${msg.sender === "me" ? "bg-indigo-500 text-white" : "bg-white text-gray-800"}`}>
                <div>{msg.text}</div>
                {msg.attachment && (
                  <img src={msg.attachment} alt="attachment" className="mt-2 max-h-32 rounded-lg" />
                )}
                <div className="text-xs text-right mt-1 opacity-60">{msg.timestamp}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <footer className="p-4 bg-white flex gap-2 items-center border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          className="flex-1 text-black border rounded-lg p-2"
        />
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-input" />
        <label htmlFor="file-input" className="bg-gray-200 px-3 py-2 rounded-lg cursor-pointer">📎</label>
        {preview && (
          <img src={preview} alt="Aperçu pièce jointe" className="w-16 h-16 object-cover rounded-lg border mx-2" />
        )}
        <button onClick={handleSend} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">Envoyer</button>
      </footer>
    </main>
  );
}
