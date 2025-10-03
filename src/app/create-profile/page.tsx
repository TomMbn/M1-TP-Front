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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Créer votre profil
        </h2>

        <div>
          <label htmlFor="pseudo" className="block text-gray-700 font-medium mb-1">
            Pseudo <span className="text-red-500">*</span>
          </label>
          <input
            id="pseudo"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 text-black focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="photo" className="block text-gray-700 font-medium mb-1">
            Photo (facultatif)
          </label>
          <div className="flex gap-2">
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full text-black border rounded-lg p-2"
            />
            <button
              type="button"
              onClick={openCamera}
              className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600"
            >
              Prendre une photo
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
          className="mt-4 w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Valider
        </button>
      </form>
      <Toast message="Photo prise avec succès !" show={showToast} onClose={() => setShowToast(false)} />
    </main>
  );
}
