"use client";

import { QRCodeCanvas } from "qrcode.react";

const envBaseUrl = process.env["NEXT_PUBLIC_BASE_URL"];

interface PollQRCodeProps {
  pollId: string;
  size?: number;
}

export function PollQRCode({ pollId, size = 200 }: PollQRCodeProps) {
  const baseUrl = envBaseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  const votingUrl = `${baseUrl}/poll/${pollId}`;

  return (
    <div className="rounded-sm bg-white p-3">
      <QRCodeCanvas value={votingUrl} bgColor="#ffffff" fgColor="#000000" level="M" size={size} />
    </div>
  );
}
