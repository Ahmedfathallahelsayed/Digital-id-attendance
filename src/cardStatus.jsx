import React from "react";
import "./CardStatus.css";

export default function CardStatus({ student }) {
  const copyId = () => {
    navigator.clipboard.writeText(student.id);
    alert("ID Copied!");
  };

  const reportLost = () => {
    alert("Card Reported as Lost!");
  };

  return (
    <div className="card-status">
      <h4>Card Status</h4>

      <p className="status-active">Active & Verified</p>
      <p className="last-scanned">Last scanned: {student.lastScan}</p>

      <button onClick={copyId} className="copy-btn">
        Copy ID Number
      </button>

      <button onClick={reportLost} className="report-btn">
        Report Lost Card
      </button>
    </div>
  );
}