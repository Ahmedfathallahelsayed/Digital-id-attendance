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
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { QRCodeCanvas } from "qrcode.react";

import "./ManageClass.css";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

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

  const [instructorName, setInstructorName] = useState("");
  const [lectureDate, setLectureDate] = useState("");

  const pollRef = useRef(null);

  const formatDate = (dateObj) =>
    dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const randomCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const buildQrUrl = (sid) => {
    const nonce = Date.now();
    return `${window.location.origin}/attend/${sid}?v=${nonce}`;
  };

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (sid) => {
    clearPolling();
    fetchAttendees(sid);
    pollRef.current = setInterval(() => fetchAttendees(sid), 5000);
  };

  const applySession = (sid, code, createdAtDate) => {
    setSessionId(sid);
    setSessionCode(code);
    setAttendanceUrl(buildQrUrl(sid));
    setLectureDate(formatDate(createdAtDate));
    setSessionActive(true);
    startPolling(sid);
  };

  const fetchClass = async () => {
    const docRef = doc(db, "classes", classId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setClassName(docSnap.data().name || "");
    }
  };

  const fetchInstructor = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      setInstructorName(
        `${data.firstName || ""} ${data.lastName || ""}`.trim() || user.email
      );
    } else {
      setInstructorName(user.email || "Instructor");
    }
  };

  const findOpenLectureSession = async () => {
    const q = query(collection(db, "sessions"), where("classId", "==", classId));
    const snap = await getDocs(q);

    if (snap.empty) return null;

    const now = Date.now();

    const sessions = snap.docs
      .map((d) => {
        const data = d.data();
        const createdAtDate = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date(data.createdAt);

        return {
          id: d.id,
          ...data,
          createdAtDate,
        };
      })
      .filter((s) => s.createdAtDate instanceof Date && !isNaN(s.createdAtDate))
      .sort((a, b) => b.createdAtDate - a.createdAtDate);

    const validSession = sessions.find(
      (s) => now - s.createdAtDate.getTime() <= TWO_HOURS_MS
    );

    return validSession || null;
  };

  useEffect(() => {
    const init = async () => {
      await fetchClass();
      await fetchInstructor();

      const existingSession = await findOpenLectureSession();

      if (existingSession) {
        applySession(
          existingSession.id,
          existingSession.code || randomCode(),
          existingSession.createdAtDate
        );
      }
    };

    init();

    return () => clearPolling();
  }, [classId]);

  const startSession = async () => {
    setLoading(true);

    try {
      const existingSession = await findOpenLectureSession();

      // لو فيه session شغالة في نفس نطاق الساعتين
      if (existingSession) {
        const newCode = randomCode();

        await updateDoc(doc(db, "sessions", existingSession.id), {
          code: newCode,
          qrRegeneratedAt: new Date(),
          active: true,
        });

        applySession(
          existingSession.id,
          newCode,
          existingSession.createdAtDate
        );

        setLoading(false);
        return;
      }

      // لو مفيش session صالحة -> نعمل session جديدة
      const user = auth.currentUser;
      const code = randomCode();
      const now = new Date();

      const sessionRef = await addDoc(collection(db, "sessions"), {
        classId,
        code,
        createdAt: now,
        active: true,
        instructorId: user?.uid || "",
        instructorName: instructorName || user?.email || "Instructor",
      });

      applySession(sessionRef.id, code, now);
      setScannedStudents([]);
    } catch (error) {
      console.log("Start session error:", error);
    }

    setLoading(false);
  };

  const fetchAttendees = async (sid) => {
    try {
      const q = query(
        collection(db, "attendance"),
        where("sessionId", "==", sid)
      );
      const snap = await getDocs(q);
      const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setScannedStudents(students);
    } catch (error) {
      console.log("Fetch attendees error:", error);
    }
  };

  // هنا مش بنقفل المحاضرة نفسها من الداتابيز
  // احنا بس بنقفل العرض من الشاشة
  const stopSession = () => {
    clearPolling();
    setSessionActive(false);
    setAttendanceUrl("");
    setSessionCode("");
    setSessionId(null);
  };

  return (
    <div className="manage-container">
      <button className="back-btn" onClick={() => navigate("/classes")}>
        ← Back to Classes
      </button>

      <div className="manage-header">
        <div>
          <h2>{className || "Loading..."}</h2>
          <p className="manage-sub">Attendance Manager</p>
        </div>

        <div className="manage-meta">
          <div className="meta-chip">
            <span className="meta-label">Instructor</span>
            <span className="meta-value">{instructorName || "Loading..."}</span>
          </div>

          <div className="meta-chip">
            <span className="meta-label">Date</span>
            <span className="meta-value">{lectureDate || "—"}</span>
          </div>

          <div className="meta-chip">
            <span className="meta-label">Session Window</span>
            <span className="meta-value">2 hours</span>
          </div>
        </div>
      </div>

      <div className="qr-section">
        {!sessionActive ? (
          <div className="start-box">
            <div className="start-icon">📋</div>
            <p>
              Start attendance. Any QR generated within 2 hours will belong to
              the same lecture session.
            </p>

            <button
              className="start-btn"
              onClick={startSession}
              disabled={loading}
            >
              {loading ? "Preparing..." : "Start Session"}
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
              <p className="qr-hint">
                Students scan this with their phone
              </p>
            </div>

            <button className="stop-btn" onClick={stopSession}>
              Close QR View
            </button>
          </div>
        )}
      </div>

      <div className="attendance-section">
        <div className="attendance-header">
          <h3>Checked In Students</h3>
          <span className="count-badge">{scannedStudents.length}</span>
        </div>

        {scannedStudents.length === 0 ? (
          <div className="no-students">
            {sessionActive
              ? "Waiting for students to scan..."
              : "No session currently shown on screen"}
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