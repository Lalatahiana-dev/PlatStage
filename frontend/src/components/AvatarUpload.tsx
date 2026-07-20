"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import api from "@/lib/axios";
import { getFullUrl } from "@/lib/image";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/avif",
  "image/heic",
  "image/heif",
];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  shape?: "circle" | "square";
  size?: "lg" | "xl";
  className?: string;
}

export default function AvatarUpload({
  currentUrl,
  onUpload,
  shape = "circle",
  size = "xl",
  className = "",
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-2xl";
  const sizeClass =
    size === "xl"
      ? "w-28 h-28 sm:w-32 sm:h-32"
      : "w-16 h-16";

  const displayUrl = preview || getFullUrl(currentUrl);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Format non supporté. Fichiers acceptés : JPG, JPEG, PNG, WEBP, GIF, BMP, AVIF, HEIC, HEIF.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Fichier trop volumineux. Maximum : ${MAX_SIZE_MB} Mo.`;
    }
    return null;
  };

  const handleFile = async (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpload(res.data.url);
      setPreview(null);
    } catch (err) {
      const data =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data
          : null;
      const raw = data?.message;
      const msg = Array.isArray(raw) ? raw.join(", ") : raw ?? null;
      setError(msg ?? "Échec de l'upload. Réessayez.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={`relative self-center sm:self-auto ${className}`}>
      <div
        className={`${sizeClass} bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden ${shapeClass} ${dragOver ? "ring-2 ring-indigo-400" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        ) : displayUrl ? (
          <img
            src={displayUrl}
            alt="Aperçu"
            className="w-full h-full object-cover"
          />
        ) : (
          <Upload className="w-8 h-8 text-gray-300" />
        )}
      </div>

      {!uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-1 right-1 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-colors"
          title="Changer la photo"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/avif,image/heic,image/heif"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <p className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded-lg whitespace-nowrap shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}
