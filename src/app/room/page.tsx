"use client";

import { useState } from "react";

// Message type
interface Message {
  id: number;
  text: string;
  attachment?: string;
  sender: "me" | "other";
  timestamp: string;
}

export default function RoomPage() {
  const [messages, setMessages] = useState<Message[]>([
    // Exemples de messages
    { id: 1, text: "Salut !", sender: "me", timestamp: "10:00" },
    { id: 2, text: "Bonjour !", sender: "other", timestamp: "10:01" },
  ]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<string | undefined>(undefined);

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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setFile(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <main className="flex flex-col h-screen bg-gray-100">
      <header className="bg-indigo-600 text-white p-4 text-xl font-bold">Room</header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs p-3 rounded-2xl shadow ${msg.sender === "me" ? "bg-indigo-500 text-white" : "bg-white text-gray-800"}`}>
              <div>{msg.text}</div>
              {msg.attachment && (
                <img src={msg.attachment} alt="attachment" className="mt-2 max-h-32 rounded-lg" />
              )}
              <div className="text-xs text-right mt-1 opacity-60">{msg.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
      <footer className="p-4 bg-white flex gap-2 items-center border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Votre message..."
          className="flex-1 border rounded-lg p-2"
        />
        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-input" />
        <label htmlFor="file-input" className="bg-gray-200 px-3 py-2 rounded-lg cursor-pointer">📎</label>
        <button onClick={handleSend} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">Envoyer</button>
      </footer>
    </main>
  );
}
