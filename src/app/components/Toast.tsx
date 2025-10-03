"use client";
import { useEffect } from "react";

export default function Toast({ message, show, onClose }: { message: string; show: boolean; onClose: () => void }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black bg-opacity-90 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in">
      {message}
    </div>
  );
}
