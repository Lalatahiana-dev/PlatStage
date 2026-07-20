import { forwardRef } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  dark?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 80, height: 28 },
  md: { width: 120, height: 42 },
  lg: { width: 160, height: 56 },
};

const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", withText = true, dark = false, className = "" }, ref) => {
    const { width, height } = sizeConfig[size];

    return (
      <div ref={ref} className={className}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 44"
          width={width}
          height={height}
          role="img"
          aria-label="e-Stage"
        >
          <defs>
            <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>

          {/* Graduation cap */}
          <polygon
            points="32,4 22,10 32,16 42,10"
            fill={dark ? "#CBD5E1" : "#0F172A"}
          />
          <line
            x1="32" y1="10" x2="32" y2="13"
            stroke={dark ? "#CBD5E1" : "#0F172A"}
            strokeWidth="1.2"
          />
          <circle
            cx="32" cy="13" r="1.1"
            fill={dark ? "#CBD5E1" : "#0F172A"}
          />
          <path
            d="M27.5,8 Q25,5 22,7"
            fill="none"
            stroke={dark ? "#CBD5E1" : "#0F172A"}
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <rect
            x="28" y="16" width="8" height="1.2"
            rx="0.6"
            fill={dark ? "#CBD5E1" : "#0F172A"}
          />

          {/* "e" letter */}
          <text
            x="18" y="38"
            fontFamily="Poppins, Inter, Manrope, -apple-system, sans-serif"
            fontSize="28"
            fontWeight="800"
            fill="url(#eGrad)"
            letterSpacing="-1"
          >
            e
          </text>

          {/* "-Stage" text */}
          <text
            x="41" y="38"
            fontFamily="Poppins, Inter, Manrope, -apple-system, sans-serif"
            fontSize="20"
            fontWeight="700"
            fill={dark ? "#CBD5E1" : "#0F172A"}
            letterSpacing="-0.5"
          >
            -Stage
          </text>

          {/* Curved underline */}
          <path
            d="M14,42 Q42,35 78,42"
            fill="none"
            stroke={dark ? "#60A5FA" : "#93C5FD"}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </div>
    );
  }
);

Logo.displayName = "Logo";

export default Logo;
