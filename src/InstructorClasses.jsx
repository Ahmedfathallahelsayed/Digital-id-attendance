import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import "./Admin.css";

export default function InstructorClasses() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [instructorName, setInstructorName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const instructorSnap = await getDoc(doc(db, "users", id));
        if (instructorSnap.exists()) {
          const data = instructorSnap.data();
          setInstructorName(`${data.firstName || ""} ${data.lastName || ""}`.trim());
        }

        const q = query(
          collection(db, "classes"),
          where("instructorId", "==", id)
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setClasses(data);
      } catch (error) {
        console.log("Error loading instructor classes:", error);
      }
    };

    fetchData();
  }, [id]);

  return (
    <div className="admin-container">
      <button className="attendance-back-btn" onClick={() => navigate("/instructors")}>
        ← Back
      </button>

      <div className="attendance-header">
        <div>
          <h2>{instructorName || "Instructor Classes"}</h2>
          <p className="attendance-subtitle">
            Choose a class to view its lectures and attendance.
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
              onClick={() => navigate(`/admin/class/${c.id}`)}
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