import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { QRCodeCanvas } from "qrcode.react";

import "./ManageClass.css";

export default function ManageClass() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [className, setClassName] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [attendanceUrl, setAttendanceUrl] = useState("");
  const [scannedStudents, setScannedStudents] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  // جيب اسم الكلاس
  useEffect(() => {
    const fetchClass = async () => {
      const docRef = doc(db, "classes", classId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setClassName(docSnap.data().name);
    };
    fetchClass();
    return () => clearInterval(pollRef.current);
  }, [classId]);

  // ابدأ session جديد وعمل QR
  const startSession = async () => {
    setLoading(true);

    // كود عشوائي 6 خانات
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionCode(code);

    // احفظ الـ session في Firestore
    const sessionRef = await addDoc(collection(db, "sessions"), {
      classId,
      code,
      createdAt: new Date(),
      active: true,
    });
    setSessionId(sessionRef.id);

    // URL اللي الطالب هيفتحه
    const url = `${window.location.origin}/attend/${sessionRef.id}`;
    setAttendanceUrl(url);

    setSessionActive(true);
    setScannedStudents([]);

    // poll كل 5 ثواني عشان تعرف مين اسكن
    pollRef.current = setInterval(() => fetchAttendees(sessionRef.id), 5000);
    setLoading(false);
  };

  const fetchAttendees = async (sid) => {
    const q = query(
      collection(db, "attendance"),
      where("sessionId", "==", sid),
    );
    const snap = await getDocs(q);
    const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setScannedStudents(students);
  };

  const stopSession = () => {
    clearInterval(pollRef.current);
    setSessionActive(false);
    setAttendanceUrl("");
    setSessionCode("");
    setSessionId(null);
  };

  return (
    <div className="manage-container">
      {/* Back */}
      <button className="back-btn" onClick={() => navigate("/classes")}>
        ← Back to Classes
      </button>

      {/* Title */}
      <div className="manage-header">
        <h2>{className || "Loading..."}</h2>
        <p className="manage-sub">Attendance Manager</p>
      </div>

      {/* QR Section */}
      <div className="qr-section">
        {!sessionActive ? (
          <div className="start-box">
            <div className="start-icon">📋</div>
            <p>Start a new session to generate a QR code for attendance</p>
            <button
              className="start-btn"
              onClick={startSession}
              disabled={loading}
            >
              {loading ? "Generating..." : "Start Session & Generate QR"}
            </button>
          </div>
        ) : (
          <div className="active-session">
            <div className="session-info">
              <div className="session-badge">Session Active</div>
              <div className="session-code">
                Code: <strong>{sessionCode}</strong>
              </div>
            </div>

            <div className="qr-wrapper">
              <QRCodeCanvas
                value={attendanceUrl}
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
                style={{ borderRadius: "12px", border: "6px solid #f1f5f9" }}
              />
              <p className="qr-hint">Students scan this with their phone</p>
            </div>

            <button className="stop-btn" onClick={stopSession}>
              Stop Session
            </button>
          </div>
        )}
      </div>

      {/* Attendance List */}
      <div className="attendance-section">
        <div className="attendance-header">
          <h3>Checked In Students</h3>
          <span className="count-badge">{scannedStudents.length}</span>
        </div>

        {scannedStudents.length === 0 ? (
          <div className="no-students">
            {sessionActive
              ? "Waiting for students to scan..."
              : "No session started yet"}
          </div>
        ) : (
          <div className="students-list">
            {scannedStudents.map((s, i) => (
              <div key={s.id} className="student-row">
                <div className="student-num">{i + 1}</div>
                <div className="student-info">
                  <div className="student-name">
                    {s.studentName || "Unknown"}
                  </div>
                  <div className="student-id">{s.studentId || ""}</div>
                </div>
                <div className="check-icon">✓</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
