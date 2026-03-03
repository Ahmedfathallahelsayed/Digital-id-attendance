import React from "react";
import DigitalCard from "./digitalCard.jsx";
import CardStatus from "./cardStatus.jsx";
import "./DigitalIdPage.css";

export default function DigitalIdPage() {
  const student = {
    name: "name",
    major: "major",
    id: "id",
    lastScan: "",
    photo: "https://i.pravatar.cc/60?img=5"
  };

  return (
    <div className="digital-id-page">
      <h2>Digital ID</h2>

      <DigitalCard student={student} />
      <CardStatus student={student} />
    </div>
  );
}