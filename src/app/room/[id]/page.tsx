"use client";

import { useParams } from "next/navigation";
import { useState, useRef, useEffect, useContext } from "react";
import Toast from "../../components/Toast";
import { ChatSocketContext } from "../../../context/ChatSocketProvider";

interface Message {
  id: string;
  text: string;
  attachment?: string;
  sender: "me" | "other";
  pseudo?: string;
  categorie?: string;
  timestamp: string;
  optimistic?: boolean;
}

const conversationNames: Record<string, string> = {
  "1": "Général",
  "2": "Projet M1",
  "3": "Amis",
};

export default function RoomPage() {
  const { id } = useParams();
  const genId = () => {
    try {
      // @ts-ignore
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    } catch (e) {}
    return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  };
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const chat = useContext(ChatSocketContext);

  // read local profile to determine own pseudo
  const [localPseudo, setLocalPseudo] = useState<string | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chat_user");
      if (stored) setLocalPseudo(JSON.parse(stored).pseudo ?? null);
    } catch (e) {
      setLocalPseudo(null);
    }
  }, []);

  // subscribe to incoming chat messages
  useEffect(() => {
    const roomName = id as string;
    if (!roomName) return;

    let unsubFn: any = null;

    (async () => {
      try {
        // try to auto-join the room so the server will emit past messages
        const stored = localStorage.getItem("chat_user");
        const pseudo = stored ? JSON.parse(stored).pseudo : undefined;
        if (pseudo) {
          try {
            // only join if not already in room
            if ((chat as any)?.currentRoom !== roomName) {
              await (chat as any)?.joinRoom?.(pseudo, roomName);
            }
          } catch (e) {
            console.warn("Auto-join failed", e);
          }
        }

        // now load buffered messages that arrived during join
        try {
          const buffered = (chat as any)?.getBufferedMessages?.(roomName) ?? [];
          if (Array.isArray(buffered) && buffered.length) {
            const prepared = buffered.map((msg: any) => {
              const content = msg.content ?? "";
              const pseudo = msg.pseudo ?? "";
              const date = msg.dateEmis ? new Date(msg.dateEmis) : new Date();
              const text = typeof content === "string" ? content : JSON.stringify(content);
              return {
                id: genId(),
                text,
                attachment: msg.categorie === "NEW_IMAGE" ? content : undefined,
                sender: pseudo === localPseudo ? "me" : "other",
                pseudo,
                categorie: msg.categorie,
                timestamp: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              } as Message;
            });
            setMessages((prev) => [...prev, ...prepared]);
          }
        } catch (e) {
          console.error("failed to load buffered messages", e);
        }

        const onChatMsg = (msg: any) => {
          try {
            if ((msg as any)?.roomName && (msg as any).roomName !== roomName) return; // ignore other rooms
            const content = msg.content ?? "";
            const pseudo = msg.pseudo ?? "";
            const date = msg.dateEmis ? new Date(msg.dateEmis) : new Date();
            const text = typeof content === "string" ? content : JSON.stringify(content);

            setMessages((prev) => {
              // try to find an optimistic message matching this one (same text and sender me)
              const optimisticIndex = prev.findIndex((m) => m.optimistic && m.sender === "me" && m.text === text);
              const serverMsg: Message = {
                id: genId(),
                text,
                attachment: msg.categorie === "NEW_IMAGE" ? content : undefined,
                sender: pseudo === localPseudo ? "me" : "other",
                pseudo,
                categorie: msg.categorie,
                timestamp: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              };
              if (optimisticIndex !== -1) {
                // replace optimistic with server message
                const copy = [...prev];
                copy[optimisticIndex] = serverMsg;
                return copy;
              }
              return [...prev, serverMsg];
            });
          } catch (e) {
            console.error("failed to handle chat-msg", e, msg);
          }
        };

        unsubFn = (chat as any)?.subscribeMessages?.(roomName, onChatMsg);
      } catch (e) {
        console.error("message subscription setup failed", e);
      }
    })();

    return () => {
      if (typeof unsubFn === "function") unsubFn();
    };
  }, [chat, id, localPseudo]);

  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const handleSend = () => {
    if (!input && !file) return;

    const content = input || "";
    // optimistically add
    const tempId = genId();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: content,
        attachment: file,
        sender: "me",
        pseudo: localPseudo ?? "Moi",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        optimistic: true,
      },
    ]);

    // emit via provider
    try {
      (chat as any)?.sendMessage(content, id as string);
    } catch (e) {
      console.error("sendMessage error", e);
    }

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

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      alert("Impossible d'accéder à la caméra.");
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
    setStream(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 240, 240);
        const dataUrl = canvasRef.current.toDataURL("image/png");
        setFile(dataUrl);
        setPreview(dataUrl);
        setShowToast(true);
        closeCamera();
      }
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
            msg.categorie === "INFO" ? (
              <div key={msg.id} className="w-full text-center text-sm text-gray-600">{msg.text}</div>
            ) : (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs p-3 rounded-2xl shadow ${msg.sender === "me" ? "bg-indigo-500 text-white" : "bg-white text-gray-800"}`}>
                  <div className="text-xs font-semibold mb-1 opacity-80">{msg.pseudo ?? (msg.sender === "me" ? "Moi" : "Inconnu")}</div>
                  <div>{msg.text}</div>
                  {msg.attachment && (
                    <img src={msg.attachment} alt="attachment" className="mt-2 max-h-32 rounded-lg" />
                  )}
                  <div className="text-xs text-right mt-1 opacity-60">{msg.timestamp}</div>
                </div>
              </div>
            )
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
        <button
          type="button"
          onClick={openCamera}
          className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 ml-1"
        >
          📷
        </button>
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg flex flex-col items-center gap-2">
              <video ref={videoRef} width={240} height={240} autoPlay className="rounded-lg border" />
              <canvas ref={canvasRef} width={240} height={240} style={{ display: "none" }} />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={capturePhoto} className="bg-green-600 text-white px-3 py-1 rounded-lg">Capturer</button>
                <button type="button" onClick={closeCamera} className="bg-gray-400 text-white px-3 py-1 rounded-lg">Annuler</button>
              </div>
            </div>
          </div>
        )}
        {preview && (
          <div className="flex items-center gap-2 mx-2">
            <img src={preview} alt="Aperçu pièce jointe" className="w-16 h-16 object-cover rounded-lg border" />
            <button
              type="button"
              onClick={() => { setFile(undefined); setPreview(undefined); }}
              className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700"
              title="Supprimer la photo"
            >
              ✕
            </button>
          </div>
        )}
        <button onClick={handleSend} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">Envoyer</button>
      </footer>
      <Toast message="Photo prise avec succès !" show={showToast} onClose={() => setShowToast(false)} />
    </main>
  );
}
