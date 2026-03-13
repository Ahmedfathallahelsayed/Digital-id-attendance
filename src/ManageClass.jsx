import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import "./ManageClass.css";

export default function ManageClass() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [className, setClassName] = useState("");
  const [showQR, setShowQR] = useState(false); // للتحكم في ظهور QR

  // جلب اسم الكلاس من Firebase
  useEffect(() => {
    const fetchClass = async () => {
      const docRef = doc(db, "classes", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setClassName(docSnap.data().name);
      }
    };
    fetchClass();
  }, [id]);

  // بيانات QR
  const qrData = id
    ? `https://attendance-system.com/scan?classId=${id}&className=${encodeURIComponent(className)}`
    : "https://attendance-system.com/scan?classId=default";

  return (
    <div className="manage-container">
      <h2>Manage Class</h2>

      <p>Class ID: {id}</p>
      {className && <p>Class Name: {className}</p>}

      <div className="manage-box">
        <button
          className="attendance-btn"
          onClick={() => setShowQR(!showQR)} // toggle
        >
          Start Attendance
        </button>

        <button
          className="students-btn"
          onClick={() => alert("View Students functionality")}
        >
          View Students
        </button>
      </div>

      {/* عرض QR مباشرة تحت الزر */}
      {showQR && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h3>{`Scan to mark attendance for: ${className}`}</h3>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
            alt="qr"
          />
        </div>
      )}

      <button
        className="back-btn"
        onClick={() => navigate("/classes")}
        style={{ marginTop: "20px" }}
      >
        Back to Classes
      </button>
    </div>
  );
}