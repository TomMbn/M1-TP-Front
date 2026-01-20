"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useContext } from "react";
import Toast from "../../components/Toast";
import ChatMessageImage from "../../components/ChatMessageImage";
import { ChatSocketContext } from "../../../context/ChatSocketProvider";
import { API_BASE_URL } from "../../../utils/constants";
import { genId, formatRoomName } from "../../../utils/helpers";
import { VALID_POP_SOUND } from "../../../utils/sounds";

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



export default function RoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const [userCount, setUserCount] = useState<number>(0);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Track notification permission state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        new Notification("Notifications activées", {
          body: "Vous recevrez désormais les nouveaux messages !",
        });
      }
    } catch (e) {
      console.error("Error asking notification permission", e);
    }
  };




  // Fetch user count
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/socketio/api/rooms`);
        const json = await res.json();
        if (json.success && json.data && json.data[id as string]) {
          const clients = json.data[id as string].clients || {};
          setUserCount(Object.keys(clients).length);
        }
      } catch (e) {
        console.error("Failed to fetch room info", e);
      }
    };
    fetchRoomInfo();
    // Optional: Poll every 10s to update count
    const interval = setInterval(fetchRoomInfo, 10000);
    return () => clearInterval(interval);
  }, [id]);

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

        // Helper to parse content
        const parseMessage = (msg: any): Message => {
          const content = msg.content ?? "";
          const pseudo = msg.pseudo ?? "";
          const date = msg.dateEmis ? new Date(msg.dateEmis) : new Date();

          let text = typeof content === "string" ? content : JSON.stringify(content);
          let categorie = msg.categorie;
          let attachmentUrl = categorie === "NEW_IMAGE" ? content : undefined;

          try {
            if (typeof content === "string" && content.startsWith("{")) {
              const parsed = JSON.parse(content);
              if ((parsed.type === "LOCATION" || parsed.type === "geo") && parsed.lat && parsed.lng) {
                categorie = "LOCATION";
                text = `${parsed.lat},${parsed.lng}`;
              }
            }
          } catch (e) {
            // ignore JSON parse error
          }

          // Detect raw base64 image
          if (typeof content === "string" && content.startsWith("data:image")) {
            categorie = "NEW_IMAGE";
            text = "";
            attachmentUrl = content;
          }

          // Detect [IMAGE] pattern
          if (typeof content === "string" && content.includes("[IMAGE]")) {
            const match = content.match(/\[IMAGE\]\s+(https?:\/\/\S+)/);
            if (match && match[1]) {
              categorie = "NEW_IMAGE";
              attachmentUrl = match[1];
              text = ""; // Hide the raw text
            }
          }

          // Generate stable ID for deduplication
          // We prioritize msg.id, otherwise we build a hash from immutable props
          const stableId = (msg as any).id ??
            `${date.getTime()}-${pseudo}-${typeof content === 'string' ? content.substring(0, 32) : 'obj'}`;

          return {
            id: stableId, // Use stable ID instead of genId()
            text,
            attachment: attachmentUrl,
            sender: pseudo === localPseudo ? "me" : "other",
            pseudo,
            categorie,
            timestamp: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
        };

        // now load buffered messages that arrived during join
        try {
          const buffered = (chat as any)?.getBufferedMessages?.(roomName) ?? [];
          if (Array.isArray(buffered) && buffered.length) {
            const prepared = buffered.map(parseMessage);
            setMessages((prev) => {
              // Deduplicate: filter out messages that already exist by ID
              const newMsgs = prepared.filter(p => !prev.some(m => m.id === p.id));
              return [...prev, ...newMsgs];
            });
          }
        } catch (e) {
          console.error("failed to load buffered messages", e);
        }

        const onChatMsg = (msg: any) => {
          try {
            if ((msg as any)?.roomName && (msg as any).roomName !== roomName) return; // ignore other rooms

            const serverMsg = parseMessage(msg);

            // Notify if it matches a remote sender
            if (serverMsg.sender === "other") {
              // Haptic feedback
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(200);
              }
              // Sound feedback
              try {
                const audio = new Audio(VALID_POP_SOUND);
                audio.play().catch(e => console.warn("Audio play failed", e));
              } catch (e) {
                console.warn("Audio setup failed", e);
              }

              if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                try {
                  const notifTitle = `Nouveau message de ${serverMsg.pseudo || "Inconnu"}`;
                  const notifBody = serverMsg.attachment ? "📸 Photo envoyée" : serverMsg.text || "Message";
                  new Notification(notifTitle, {
                    body: notifBody,
                    icon: "/web-app-manifest-192x192.png"
                  });
                } catch (e) {
                  // ignore notification errors
                }
              }
            }

            setMessages((prev) => {
              // try to find an optimistic message matching this one (same text and sender me)
              const optimisticIndex = prev.findIndex((m) => m.optimistic && m.sender === "me" && m.text === serverMsg.text);

              if (optimisticIndex !== -1) {
                // replace optimistic with server message
                const copy = [...prev];
                copy[optimisticIndex] = serverMsg;
                return copy;
              }

              // Deduplicate real-time: if ID exists, update it (e.g. sender "other" -> "me") or ignore
              const existingIndex = prev.findIndex(m => m.id === serverMsg.id);
              if (existingIndex !== -1) {
                // If existing was "other" and new is "me", update it
                if (prev[existingIndex].sender === "other" && serverMsg.sender === "me") {
                  const copy = [...prev];
                  copy[existingIndex] = serverMsg;
                  return copy;
                }
                return prev; // Ignore exact duplicate
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input && !file) return;

    let content = input || "";

    // If file exists, upload it first
    if (file) {
      try {
        const socketId = (chat as any)?.socket?.id;
        if (!socketId) {
          alert("Impossible d'envoyer l'image : non connecté au serveur.");
          return;
        }

        const res = await fetch(`${API_BASE_URL}/socketio/tchat/api/images/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: socketId,
            image_data: file,
          }),
        });

        const data = await res.json();
        if (data.success) {
          // Construct the image URL message
          const imageUrl = `${API_BASE_URL}/socketio/tchat/api/images/${socketId}`;
          content = `[IMAGE] ${imageUrl}`;
        } else {
          console.error("Upload failed", data);
          alert("Erreur lors de l'envoi de l'image.");
          return;
        }
      } catch (e) {
        console.error("Error uploading image", e);
        alert("Erreur réseau lors de l'envoi de l'image.");
        return;
      }
    }

    // optimistically add
    const tempId = genId();
    // For images, the parser clears the text, so we must do the same for the optimistic message to match
    const textForMsg = file ? "" : content;

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: textForMsg,
        attachment: file, // Keep local file for immediate preview if needed, or we could use the URL
        sender: "me",
        pseudo: localPseudo ?? "Moi",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        optimistic: true,
        categorie: file ? "NEW_IMAGE" : undefined
      },
    ]);

    // emit via provider
    try {
      if (content) {
        // If it's an image, we send the categorie NEW_IMAGE so other clients know? 
        // Or relying on [IMAGE] parsing.
        // The implementation plan mainly relied on [IMAGE] parsing for display, 
        // but let's check if we need passing a specific category.
        // Based on previous code, the parser handles [IMAGE] string detection.
        (chat as any)?.sendMessage(content, id as string, file ? { categorie: 'NEW_IMAGE' } : undefined);
      }
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

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = { type: "LOCATION", lat: latitude, lng: longitude };
        const contentToSend = JSON.stringify(locationData);
        // On ne définit plus textForUi car c'est géré par le parser

        // Optimistic UI update
        const tempId = genId();
        // Manually construct what parseMessage would return
        const serverMsg: Message = {
          id: tempId,
          text: `${latitude},${longitude}`,
          sender: "me",
          pseudo: localPseudo ?? "Moi",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          optimistic: true,
          categorie: "LOCATION",
        };
        setMessages((prev) => [...prev, serverMsg]);

        // Send to server
        (chat as any)?.sendMessage(contentToSend, id as string, { categorie: 'LOCATION' });
      },
      () => {
        alert("Impossible de récupérer votre position.");
      }
    );
  };

  return (
    <main className="flex flex-col h-screen bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 animate-fade-in relative overflow-hidden">
      {/* Dynamic Background Particles or Overlay could go here */}

      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 text-white p-4 text-xl font-bold flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-1 hover:bg-white/20 rounded-full transition"
            title="Retour à l'accueil"
          >
            ←
          </button>
          <div className="flex flex-col">
            <span>{formatRoomName(decodeURIComponent(id as string)).short}</span>
            <span className="text-xs font-normal opacity-80">{userCount} connecté{userCount > 1 ? 's' : ''}</span>
          </div>
        </div>
        {notifPermission !== "granted" && (
          <button
            onClick={requestNotifPermission}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full flex items-center gap-2 transition-colors"
            title="Activer les notifications"
          >
            🔔 Activer notifs
          </button>
        )}
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-white/80 text-center">
              <p>Aucun message pour l'instant.</p>
              <p className="text-sm opacity-60 mt-1">Envoyez le premier !</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            msg.categorie === "INFO" ? (
              <div key={msg.id} className="w-full text-center text-xs font-medium text-white/60 my-2">{msg.text}</div>
            ) : msg.categorie === "LOCATION" ? (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-md p-3 rounded-2xl shadow-sm ${msg.sender === "me"
                  ? "bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-br-none"
                  : "bg-white/90 backdrop-blur-md text-gray-800 rounded-bl-none"
                  }`}>
                  <div className={`text-xs font-bold mb-1 ${msg.sender === "me" ? "text-pink-200" : "text-indigo-600"}`}>{msg.pseudo ?? (msg.sender === "me" ? "Moi" : "Inconnu")}</div>
                  <a
                    href={`https://www.google.com/maps?q=${msg.text}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline flex items-center gap-1 hover:text-blue-200 transition-colors"
                  >
                    📍 Position partagée
                  </a>
                  <div className={`text-[10px] text-right mt-1 ${msg.sender === "me" ? "text-white/60" : "text-gray-400"}`}>{msg.timestamp}</div>
                </div>
              </div>
            ) : (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-md p-3 rounded-2xl shadow-sm ${msg.sender === "me"
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none shadow-lg"
                  : "bg-white/90 backdrop-blur-md text-gray-900 rounded-bl-none shadow-md"
                  }`}>
                  <div className={`text-xs font-bold mb-1 ${msg.sender === "me" ? "text-pink-200" : "text-indigo-600"}`}>{msg.pseudo ?? (msg.sender === "me" ? "Moi" : "Inconnu")}</div>
                  <div className="leading-relaxed">{msg.text}</div>
                  {msg.attachment && (
                    <ChatMessageImage src={msg.attachment} alt="attachment" className="mt-2 max-h-48 rounded-lg border border-white/20" />
                  )}
                  <div className={`text-[10px] text-right mt-1 ${msg.sender === "me" ? "text-white/60" : "text-gray-400"}`}>{msg.timestamp}</div>
                </div>
              </div>
            )
          ))

        )}
        <div ref={messagesEndRef} />
      </div>
      <footer className="pt-2 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] bg-white/90 backdrop-blur-md border-t border-gray-100 flex items-end gap-2 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] z-20">

        {/* Utilities Group */}
        <div className="flex items-center gap-1 mb-2">
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-input" />
          <label
            htmlFor="file-input"
            className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors cursor-pointer"
            title="Joindre une image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 6.182l-6.47 6.475a1.5 1.5 0 01-2.121-2.12" />
            </svg>
          </label>
          <button
            type="button"
            onClick={openCamera}
            className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
            title="Prendre une photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleSendLocation}
            className="text-gray-400 hover:text-green-600 p-2 rounded-full hover:bg-green-50 transition-colors"
            title="Partager ma position"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </button>
        </div>

        {/* Input Area */}
        <div className="flex-1 min-w-0 mb-2 relative">
          {preview && (
            <div className="absolute bottom-full left-0 mb-2 flex items-center gap-2 bg-white/90 p-2 rounded-xl shadow-lg border border-gray-100 animate-slide-up">
              <img src={preview} alt="Aperçu" className="w-16 h-16 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => { setFile(undefined); setPreview(undefined); }}
                className="bg-gray-100 hover:bg-red-500 text-gray-500 hover:text-white rounded-full w-6 h-6 flex items-center justify-center transition"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message..."
            className="w-full bg-gray-100 border-0 text-gray-800 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder-gray-400"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!input && !file}
          className={`mb-2 p-3 rounded-full flex-shrink-0 transition-all shadow-md flex items-center justify-center ${(input || file)
            ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5 -translate-y-0.5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>

        {/* Modals outside flow but kept in component */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-900 p-4 rounded-3xl flex flex-col items-center gap-4 border border-gray-800 shadow-2xl">
              <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-500">
                <video ref={videoRef} width={280} height={280} autoPlay className="object-cover" />
                <canvas ref={canvasRef} width={280} height={280} style={{ display: "none" }} />
              </div>
              <div className="flex gap-4 w-full justify-center">
                <button type="button" onClick={closeCamera} className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl font-medium transition">Annuler</button>
                <button type="button" onClick={capturePhoto} className="bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold transition">📸 Capturer</button>
              </div>
            </div>
          </div>
        )}
      </footer>
      <Toast message="Photo prise avec succès !" show={showToast} onClose={() => setShowToast(false)} />
    </main>
  );
}
