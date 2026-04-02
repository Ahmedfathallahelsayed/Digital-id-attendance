import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "./firebase";
import "./Attendance.css";

export default function Attendance() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "classes"),
          where("instructorId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setClasses(data);
      } catch (error) {
        console.log("Attendance page error:", error);
      }

      setLoading(false);
    };

    fetchClasses();
  }, []);

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-empty">Loading classes...</div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h2>Attendance</h2>
          <p className="attendance-subtitle">
            Choose a class to view its lecture sessions.
          </p>
        </div>

        <div className="attendance-count">
          {classes.length} class{classes.length !== 1 ? "es" : ""}
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="attendance-empty">
          No classes found for this instructor.
        </div>
      ) : (
        <div className="attendance-grid">
          {classes.map((c, index) => (
            <div
              key={c.id}
              className="attendance-card"
              onClick={() => navigate(`/attendance/class/${c.id}`)}
            >
              <div className="attendance-card-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="attendance-card-name">{c.name}</div>

              <div className="attendance-card-link">View Lectures →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}