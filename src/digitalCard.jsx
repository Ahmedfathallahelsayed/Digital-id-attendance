import React from "react";
import "./DigitalCard.css";

export default function DigitalCard({ student }) {
  return (
    <div className="card">
      <img
        src={student.photo || "https://i.pravatar.cc/60?img=5"}
        alt={student.name}
        className="student-photo"
      />

      <h3 className="student-name">{student.name}</h3>
      <p className="student-major">{student.major}</p>
      <p className="student-id">ID: {student.id}</p>

      <div className="qr-placeholder"></div>
    </div>
  );
}
