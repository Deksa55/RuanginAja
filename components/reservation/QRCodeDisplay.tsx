"use client";

import { useState } from "react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeDisplay({
  value,
  size = 180,
  className = "",
}: QRCodeDisplayProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  // Online QR generator URL
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(
    value || "RUANGINAJA-EMPTY"
  )}`;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 ${className}`}
    >
      {!loadFailed ? (
        <img
          src={qrUrl}
          alt={`QR Code: ${value}`}
          width={size}
          height={size}
          className="rounded-lg object-contain mx-auto"
          onError={() => setLoadFailed(true)}
        />
      ) : (
        /* Standalone SVG QR Pattern Fallback in case offline */
        <div
          style={{ width: size, height: size }}
          className="bg-slate-900 text-white rounded-lg flex flex-col items-center justify-center p-4 text-center"
        >
          <svg
            className="w-16 h-16 text-sky-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          <span className="text-[10px] font-mono font-bold text-slate-300 break-all">
            {value.slice(0, 24)}...
          </span>
        </div>
      )}
    </div>
  );
}
