"use client";

import React, { createContext, useCallback, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type ChatContextType = {
  socket: Socket | null;
  connected: boolean;
  currentRoom: string | null;
  joinRoom: (pseudo: string, roomName: string) => Promise<any>;
  sendMessage: (content: string, roomName: string) => void;
  disconnect: () => void;
};

export const ChatSocketContext = createContext<ChatContextType>({
  socket: null,
  connected: false,
  currentRoom: null,
  joinRoom: async () => {},
  sendMessage: () => {},
  disconnect: () => {},
});

export function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  const ensureSocket = useCallback((): Socket => {
    if (!socketRef.current) {
      // adjust URL if needed
      // Important: do NOT put the namespace in the URL (e.g. /socketio) —
      // that becomes the namespace and the server may reject it with "Invalid namespace".
      // Use the host + set path to the server socket.io endpoint.
      socketRef.current = io("https://api.tools.gavago.fr", {
        path: "/socket.io",
        transports: ["websocket"],
      });

      // expose for temporary debug in the console
      try {
        // @ts-ignore
        window.__SOCKET__ = socketRef.current;
      } catch (e) {}

      socketRef.current.on("connect", () => setConnected(true));
      socketRef.current.on("disconnect", () => setConnected(false));
      socketRef.current.on("error", (e: any) => console.error("socket error", e));
    }
    return socketRef.current;
  }, []);

  const joinRoom = useCallback((pseudo: string, roomName: string) => {
    const socket = ensureSocket();

    return new Promise((resolve, reject) => {
      // increase timeout and ensure listener is registered only once
      const timeoutMs = 15000;
      let timeout = setTimeout(() => {
        socket.off("chat-joined-room", onJoined);
        console.warn("joinRoom timeout", { pseudo, roomName });
        reject(new Error("Timeout joining room"));
      }, timeoutMs);

      const onJoined = (payload: any) => {
        clearTimeout(timeout);
        setCurrentRoom(roomName);
        socket.off("chat-joined-room", onJoined);
        console.log("joinRoom succeeded", payload);
        resolve(payload);
      };

      socket.once("chat-joined-room", onJoined);

      const doEmit = () => {
        // send both keys in case server expects one or the other
        const payload: any = { roomName };
        try {
          payload.pseudo = pseudo;
          payload.myPseudo = pseudo;
        } catch (e) {}
        console.log("emitting chat-join-room", payload);
        socket.emit("chat-join-room", payload);
      };

      if (socket.connected) {
        doEmit();
      } else {
        // wait for connect then emit
        const onConnect = () => {
          doEmit();
          socket.off("connect", onConnect);
        };
        socket.on("connect", onConnect);
      }
    });
  }, [ensureSocket]);

  const sendMessage = useCallback((content: string, roomName: string) => {
    const socket = ensureSocket();
    socket.emit("chat-msg", { content, roomName });
  }, [ensureSocket]);

  const disconnect = useCallback(() => {
    try {
      socketRef.current?.disconnect();
    } catch (e) {
      // ignore
    }
    socketRef.current = null;
    setConnected(false);
    setCurrentRoom(null);
  }, []);

  return (
    <ChatSocketContext.Provider value={{ socket: socketRef.current, connected, currentRoom, joinRoom, sendMessage, disconnect }}>
      {children}
    </ChatSocketContext.Provider>
  );
}
