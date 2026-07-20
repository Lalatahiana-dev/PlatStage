"use client";

import { useState } from "react";
import { getFullUrl } from "@/lib/image";

interface AdminAvatarProps {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}

export default function AdminAvatar({
  src,
  name,
  size = 40,
  className = "",
}: AdminAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = getFullUrl(src);
  const showImage = resolvedSrc && !imgError;

  const initials = name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {showImage ? (
        <img
          src={resolvedSrc!}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className="font-bold text-indigo-600"
          style={{ fontSize: size * 0.35 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
