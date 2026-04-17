import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import "./Attendance.css";

export default function StudentClasses() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState("");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    try {
      const studentSnap = await getDoc(doc(db, "users", id));
      if (studentSnap.exists()) {
        const data = studentSnap.data();
        setStudentName(`${data.firstName || ""} ${data.lastName || ""}`.trim());
      }

      const q = query(collection(db, "enrollments"), where("studentId", "==", id));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id, // enrollment doc id
        ...docItem.data(),
      }));

      setClasses(data);
    } catch (error) {
      console.log("Error loading student classes:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRemoveClass = async (enrollmentId) => {
    const confirmRemove = window.confirm(
      "Do you want to remove this class from the student?"
    );
    if (!confirmRemove) return;

    try {
      await deleteDoc(doc(db, "enrollments", enrollmentId));
      setClasses((prev) => prev.filter((item) => item.id !== enrollmentId));
    } catch (error) {
      console.log("Error removing class:", error);
    }
  };

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-empty">Loading...</div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <button className="attendance-back-btn" onClick={() => navigate("/students")}>
        ← Back
      </button>

      <div className="attendance-header">
        <div>
          <h2>{studentName || "Student Classes"}</h2>
          <p className="attendance-subtitle">
            View joined classes and remove any class from this student.
          </p>
        </div>

        <div className="attendance-count">
          {classes.length} class{classes.length !== 1 ? "es" : ""}
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="attendance-empty">
          This student has not joined any classes yet.
        </div>
      ) : (
        <div className="attendance-grid">
          {classes.map((c, index) => (
            <div key={c.id} className="attendance-card">
              <div className="attendance-card-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="attendance-card-name">
                {c.className || "Unnamed Class"}
              </div>

              <div className="session-meta">
                <span>{c.classCode || c.classId || "—"}</span>
              </div>

              <div className="session-meta">
                <span>{c.day || "—"}</span>
                <span>•</span>
                <span>{c.fromTime || c.startTime || "—"}</span>
                <span>→</span>
                <span>{c.toTime || c.endTime || "—"}</span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  className="attendance-back-btn"
                  style={{ marginBottom: 0 }}
                  onClick={() =>
                    navigate(`/admin/student/${id}/class/${c.classId || c.classDocId}`)
                  }
                >
                  View Attendance
                </button>

                <button
                  className="attendance-back-btn"
                  style={{
                    marginBottom: 0,
                    borderColor: "#fca5a5",
                    color: "#dc2626",
                  }}
                  onClick={() => handleRemoveClass(c.id)}
                >
                  Remove Class
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}