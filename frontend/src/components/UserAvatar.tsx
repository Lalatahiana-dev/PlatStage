"use client";

import { useState } from "react";
import { getFullUrl } from "@/lib/image";

const GRADIENTS = [
  "from-indigo-500 to-indigo-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
  "from-blue-500 to-blue-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-pink-500 to-pink-600",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square";
  className?: string;
}

const SIZE_MAP = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-28 h-28 sm:w-32 sm:h-32 text-3xl sm:text-4xl",
};

const SHAPE_MAP = {
  circle: "rounded-full",
  square: "rounded-2xl",
};

export default function UserAvatar({
  src,
  name,
  size = "md",
  shape = "circle",
  className = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = getFullUrl(src);
  const showImage = resolvedSrc && !imgError;

  const gradient = GRADIENTS[hashName(name) % GRADIENTS.length];
  const initials = getInitials(name);
  const sizeClass = SIZE_MAP[size];
  const shapeClass = SHAPE_MAP[shape];

  return (
    <div
      className={`bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ${sizeClass} ${shapeClass} ${className}`}
    >
      {showImage ? (
        <img
          src={resolvedSrc!}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
