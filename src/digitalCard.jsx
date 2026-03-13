import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import "./digitalCard.css";

export default function DigitalCard({ student }) {
  return (
    <div className="card">
      <div className="university">
        Faculty of Science
        <br />
        Cairo University
      </div>

      <p className="student-name">{student.name || "Student Name"}</p>

      <p className="student-role">{student.role || "Student"}</p>

      <p className="student-id">ID: {student.id || "Loading..."}</p>

      <div className="qr-placeholder">
        <QRCodeCanvas
          value={student.id || "no-id"}
          size={70}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
    </div>
  );
}
