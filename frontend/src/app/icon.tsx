import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6366F1",
          borderRadius: "8px",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
        >
          <polygon
            points="12,2 3,7 12,12 21,7"
            fill="white"
          />
          <rect
            x="8" y="12" width="8" height="1.5" rx="0.75"
            fill="white"
          />
          <line
            x1="12" y1="7" x2="12" y2="10"
            stroke="white"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="10.5" r="1" fill="white" />
          <path
            d="M9,5 Q7,3 5,4.5"
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
