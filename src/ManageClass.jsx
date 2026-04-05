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
import { db } from "./firebase";
import { QRCodeCanvas } from "qrcode.react";

import "./ManageClass.css";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const QR_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

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

  const [lectureDate, setLectureDate] = useState("");
  const [lastQrChange, setLastQrChange] = useState("");
  const [countdown, setCountdown] = useState(QR_REFRESH_MS / 1000);

  const pollRef = useRef(null);
  const qrRefreshRef = useRef(null);
  const countdownRef = useRef(null);

  const formatDate = (dateObj) =>
    dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (dateObj) =>
    dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const randomCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const clearQrRefresh = () => {
    if (qrRefreshRef.current) {
      clearInterval(qrRefreshRef.current);
      qrRefreshRef.current = null;
    }
  };

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const buildQrUrl = (sid, code) => {
    return `${window.location.origin}/attend/${sid}?code=${code}`;
  };

  const fetchAttendees = async (sid) => {
    try {
      const q = query(
        collection(db, "attendance"),
        where("sessionId", "==", sid)
      );

      const snap = await getDocs(q);

      const students = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setScannedStudents(students);
    } catch (error) {
      console.log("Fetch attendees error:", error);
    }
  };

  const startPolling = (sid) => {
    clearPolling();
    fetchAttendees(sid);
    pollRef.current = setInterval(() => fetchAttendees(sid), 5000);
  };

  const startCountdown = () => {
    clearCountdown();
    setCountdown(QR_REFRESH_MS / 1000);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return QR_REFRESH_MS / 1000;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const applySession = (sid, code, createdAtDate) => {
    setSessionId(sid);
    setSessionCode(code);
    setAttendanceUrl(buildQrUrl(sid, code));
    setLectureDate(formatDate(createdAtDate));
    setLastQrChange(formatTime(new Date()));
    setSessionActive(true);
    startPolling(sid);
    startCountdown();
  };

  const startAutoQrRefresh = (sid) => {
    clearQrRefresh();

    qrRefreshRef.current = setInterval(async () => {
      try {
        const newCode = randomCode();

        await updateDoc(doc(db, "sessions", sid), {
          code: newCode,
          qrUpdatedAt: new Date(),
        });

        setSessionCode(newCode);
        setAttendanceUrl(buildQrUrl(sid, newCode));
        setLastQrChange(formatTime(new Date()));
        setCountdown(QR_REFRESH_MS / 1000);
      } catch (error) {
        console.log("Auto QR refresh error:", error);
      }
    }, QR_REFRESH_MS);
  };

  const handleChangeQr = async () => {
    if (!sessionId) return;

    try {
      const newCode = randomCode();

      await updateDoc(doc(db, "sessions", sessionId), {
        code: newCode,
        qrUpdatedAt: new Date(),
      });

      setSessionCode(newCode);
      setAttendanceUrl(buildQrUrl(sessionId, newCode));
      setLastQrChange(formatTime(new Date()));
      setCountdown(QR_REFRESH_MS / 1000);
    } catch (error) {
      console.log("Manual QR change error:", error);
    }
  };

  useEffect(() => {
    const fetchClass = async () => {
      const docRef = doc(db, "classes", classId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setClassName(docSnap.data().name);
      }
    };

    fetchClass();

    return () => {
      clearPolling();
      clearQrRefresh();
      clearCountdown();
    };
  }, [classId]);

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
      .filter((s) => s.active !== false)
      .filter((s) => s.createdAtDate instanceof Date && !isNaN(s.createdAtDate))
      .sort((a, b) => b.createdAtDate - a.createdAtDate);

    const validSession = sessions.find(
      (s) => now - s.createdAtDate.getTime() <= TWO_HOURS_MS
    );

    return validSession || null;
  };

  useEffect(() => {
    const loadExistingSession = async () => {
      const existingSession = await findOpenLectureSession();

      if (existingSession) {
        const currentCode = existingSession.code || randomCode();

        applySession(
          existingSession.id,
          currentCode,
          existingSession.createdAtDate
        );

        startAutoQrRefresh(existingSession.id);
      }
    };

    loadExistingSession();
  }, [classId]);

  const startSession = async () => {
    setLoading(true);

    try {
      const existingSession = await findOpenLectureSession();

      if (existingSession) {
        const currentCode = existingSession.code || randomCode();

        applySession(
          existingSession.id,
          currentCode,
          existingSession.createdAtDate
        );

        startAutoQrRefresh(existingSession.id);
        setLoading(false);
        return;
      }

      const code = randomCode();

      const sessionRef = await addDoc(collection(db, "sessions"), {
        classId,
        code,
        createdAt: new Date(),
        active: true,
      });

      applySession(sessionRef.id, code, new Date());
      setScannedStudents([]);
      startAutoQrRefresh(sessionRef.id);
    } catch (error) {
      console.log("Start session error:", error);
    }

    setLoading(false);
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

    try {
      await updateDoc(doc(db, "sessions", sessionId), {
        active: false,
        endedAt: new Date(),
      });
    } catch (error) {
      console.log("End session error:", error);
    }

    clearPolling();
    clearQrRefresh();
    clearCountdown();

    setSessionActive(false);
    setAttendanceUrl("");
    setSessionCode("");
    setSessionId(null);
    setCountdown(QR_REFRESH_MS / 1000);
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
            <span className="meta-label">Date</span>
            <span className="meta-value">{lectureDate || "—"}</span>
          </div>

          <div className="meta-chip">
            <span className="meta-label">Lecture Window</span>
            <span className="meta-value">2 hours</span>
          </div>

          <div className="meta-chip">
            <span className="meta-label">Last QR Change</span>
            <span className="meta-value">{lastQrChange || "—"}</span>
          </div>
        </div>
      </div>

      <div className="qr-section">
        {!sessionActive ? (
          <div className="start-box">
            <div className="start-icon">📋</div>
            <p>
              Start a lecture session. If a session already exists within 2
              hours, it will be resumed automatically.
            </p>

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
              <p className="qr-hint">
                Students scan this with their phone. QR changes automatically
                every 5 minutes.
              </p>

              <div className="qr-timer-box">
                <span className="qr-timer-label">Next QR change in</span>
                <span className="qr-timer-value">{formatCountdown(countdown)}</span>
              </div>
            </div>

            <div className="session-actions">
              <button className="change-btn" onClick={handleChangeQr}>
                Change QR
              </button>

              <button className="end-btn" onClick={handleEndSession}>
                End Session
              </button>
            </div>
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