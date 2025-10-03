"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Conversation {
  id: string;
  name: string;
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("chat_conversations");
    if (stored) setConversations(JSON.parse(stored));
    else setConversations([
      { id: "1", name: "Général" },
      { id: "2", name: "Projet M1" },
      { id: "3", name: "Amis" },
    ]);
  }, []);

  useEffect(() => {
    localStorage.setItem("chat_conversations", JSON.stringify(conversations));
  }, [conversations]);

  const addConversation = () => {
    if (!newName.trim()) return;
    setConversations([
      ...conversations,
      { id: Date.now().toString(), name: newName.trim() },
    ]);
    setNewName("");
  };

  const deleteConversation = (id: string) => {
    setConversations(conversations.filter((c) => c.id !== id));
  };

  const startEdit = (id: string, name: string) => {
    setEditId(id);
    setEditName(name);
  };

  const saveEdit = (id: string) => {
    setConversations(conversations.map((c) => c.id === id ? { ...c, name: editName } : c));
    setEditId(null);
    setEditName("");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  return (
    <main className="flex h-screen">
      <aside className="w-64 bg-white border-r p-4 flex flex-col gap-2">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">Conversations</h2>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addConversation();
              }
            }}
            placeholder="Nouvelle conversation"
            className="flex-1 border rounded-lg p-2 text-black"
          />
          <button
            onClick={addConversation}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-semibold"
          >
            +
          </button>
        </div>
        {conversations.map((conv) => (
          <div key={conv.id} className="flex items-center gap-2 group">
            {editId === conv.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 border rounded-lg p-2 text-black"
                />
                <button onClick={() => saveEdit(conv.id)} className="text-green-600 font-bold">✔</button>
                <button onClick={cancelEdit} className="text-gray-400 font-bold">✖</button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/room/${conv.id}`)}
                  className="flex-1 text-left px-4 py-2 rounded-lg hover:bg-indigo-100 transition font-medium text-gray-800"
                >
                  {conv.name}
                </button>
                <button onClick={() => startEdit(conv.id, conv.name)} className="text-yellow-600 font-bold group-hover:opacity-100 opacity-0 transition">✎</button>
                <button onClick={() => deleteConversation(conv.id)} className="text-red-600 font-bold group-hover:opacity-100 opacity-0 transition">🗑</button>
              </>
            )}
          </div>
        ))}
      </aside>
      <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl">
        Sélectionnez une conversation à gauche
      </div>
    </main>
  );
}
