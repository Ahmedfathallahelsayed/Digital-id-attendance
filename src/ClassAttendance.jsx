import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import "./Attendance.css";

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

export default function ClassAttendance() {
  const { classId, sessionId } = useParams();
  const navigate = useNavigate();

  const [className, setClassName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const classSnap = await getDoc(doc(db, "classes", classId));
        if (classSnap.exists()) {
          setClassName(classSnap.data().name || "Class");
        }

        if (!sessionId) {
          const q = query(
            collection(db, "sessions"),
            where("classId", "==", classId)
          );

          const snapshot = await getDocs(q);

          const sessionsData = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              const createdAtDate = data.createdAt?.toDate
                ? data.createdAt.toDate()
                : new Date(data.createdAt);

              return {
                id: doc.id,
                ...data,
                createdAtDate,
              };
            })
            .sort((a, b) => b.createdAtDate - a.createdAtDate);

          setSessions(sessionsData);
        } else {
          const q = query(
            collection(db, "attendance"),
            where("sessionId", "==", sessionId)
          );

          const snapshot = await getDocs(q);

          const studentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setStudents(studentsData);
        }
      } catch (error) {
        console.log("ClassAttendance error:", error);
      }

      setLoading(false);
    };

    loadData();
  }, [classId, sessionId]);

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-empty">Loading...</div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <button
        className="attendance-back-btn"
        onClick={() =>
          navigate(
            sessionId ? `/attendance/class/${classId}` : "/attendance"
          )
        }
      >
        ← Back
      </button>

      <div className="attendance-header">
        <div>
          <h2>{className}</h2>
          <p className="attendance-subtitle">
            {!sessionId
              ? "Choose a lecture session to see the attended students."
              : "Students who attended this lecture."}
          </p>
        </div>
      </div>

      {!sessionId ? (
        sessions.length === 0 ? (
          <div className="attendance-empty">
            No lecture sessions found for this class yet.
          </div>
        ) : (
          <div className="attendance-grid">
            {sessions.map((s, index) => {
              const started = s.createdAtDate;
              const ended = new Date(
                started.getTime() + 2 * 60 * 60 * 1000
              );

              return (
                <div
                  key={s.id}
                  className="attendance-card"
                  onClick={() =>
                    navigate(`/attendance/class/${classId}/session/${s.id}`)
                  }
                >
                  <div className="attendance-card-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="attendance-card-name">
                    {formatDate(started)}
                  </div>

                  <div className="session-meta">
                    <span>{formatTime(started)}</span>
                    <span>→</span>
                    <span>{formatTime(ended)}</span>
                  </div>

                  <div className="attendance-card-link">
                    View Students →
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : students.length === 0 ? (
        <div className="attendance-empty">
          No students attendance found for this lecture.
        </div>
      ) : (
        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s, index) => (
                <tr key={s.id || index}>
                  <td>{index + 1}</td>
                  <td>{s.studentName || "Unknown"}</td>
                  <td>{s.studentId || "—"}</td>
                  <td>
                    <span className="status-pill">
                      {s.status || "Present"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}