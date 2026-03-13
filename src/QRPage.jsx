import React from "react";
import { useLocation } from "react-router-dom";

export default function QRPage() {
  const location = useLocation();

  // نجيب البيانات من query params
  const params = new URLSearchParams(location.search);
  const classId = params.get("classId");
  const className = params.get("className");

  // بيانات QR
  const qrData = classId
    ? `https://attendance-system.com/scan?classId=${classId}&className=${encodeURIComponent(className)}`
    : "https://attendance-system.com/scan?classId=default";

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>{className ? `Start Attendance: ${className}` : "Scan to Join Class"}</h2>

      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
        alt="qr"
      />

      <p>Scan this code to mark attendance</p>
    </div>
  );
}