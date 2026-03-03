import React from "react";
import "./DigitalCard.css";

export default function DigitalCard({ student }) {
  return (
   <div className="card">

  <div className="university">
    Faculty of Science<br/>
    Cairo University
  </div>

  <p className="student-name">{student.name}</p>

  <p className="student-major">{student.major}</p>

  <p className="student-id">ID: {student.id}</p>

  <div className="qr-placeholder"></div>

</div>
  );
  
}
