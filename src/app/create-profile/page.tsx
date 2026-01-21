"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect, useRef } from "react";
import Toast from "../components/Toast";

type UserProfile = {
  pseudo: string;
  photo?: string;
};

export default function CreateProfilePage() {
  const router = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("chat_user");
    if (stored) {
      const user: UserProfile = JSON.parse(stored);
      setPseudo(user.pseudo || "");
      setPhoto(user.photo);
    }
  }, []);

  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      setError("Impossible d'accéder à la caméra.");
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
        setPhoto(dataUrl);
        setShowToast(true);
        closeCamera();
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!pseudo.trim()) {
      setError("Le pseudo est obligatoire.");
      return;
    }

    const profile: UserProfile = { pseudo: pseudo.trim(), photo };
    localStorage.setItem("chat_user", JSON.stringify(profile));

    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-6 animate-fade-in"
      >
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
            title="Retour"
          >
            ←
          </button>
          <h2 className="text-3xl font-bold text-center text-white drop-shadow-md flex-1 pr-10">
            Profil
          </h2>
        </div>

        <div>
          <label htmlFor="pseudo" className="block text-white/80 font-medium mb-1 ml-1">
            Pseudo <span className="text-pink-400">*</span>
          </label>
          <input
            id="pseudo"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 text-white placeholder-white/50 transition"
            placeholder="Votre pseudo..."
            required
          />
        </div>

        <div>
          <label htmlFor="photo" className="block text-white/80 font-medium mb-1 ml-1">
            Photo (facultatif)
          </label>
          <div className="flex gap-4">
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />

            <label
              htmlFor="photo"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white text-center py-3 rounded-xl border border-white/10 cursor-pointer transition flex items-center justify-center gap-2"
            >
              📂 Choisir un fichier
            </label>

            <button
              type="button"
              onClick={openCamera}
              className="flex-1 bg-white/20 text-white py-3 rounded-xl hover:bg-white/30 border border-white/10 transition flex items-center justify-center gap-2"
            >
              📷 Prendre Photo
            </button>
          </div>
          {showCamera && (
            <div className="mt-2 flex flex-col items-center gap-2">
              <video ref={videoRef} width={240} height={240} autoPlay className="rounded-lg border" />
              <canvas ref={canvasRef} width={240} height={240} style={{ display: "none" }} />
              <div className="flex gap-2">
                <button type="button" onClick={capturePhoto} className="bg-green-600 text-white px-3 py-1 rounded-lg">Capturer</button>
                <button type="button" onClick={closeCamera} className="bg-gray-400 text-white px-3 py-1 rounded-lg">Annuler</button>
              </div>
            </div>
          )}
          {photo && (
            <img
              src={photo}
              alt="Aperçu"
              className="mt-2 w-24 h-24 rounded-full object-cover mx-auto"
            />
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="mt-4 w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg transition transform hover:scale-105"
        >
          Valider
        </button>
      </form>
      <Toast message="Photo prise avec succès !" show={showToast} onClose={() => setShowToast(false)} />
    </main>
  );
}
