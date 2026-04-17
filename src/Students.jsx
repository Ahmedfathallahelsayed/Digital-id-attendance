import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "student"));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStudents(data);
      } catch (error) {
        console.log("Error loading students:", error);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="admin-container">
      <h2>All Students</h2>

      <div className="admin-grid">
        {students.map((student, index) => (
          <div
            key={student.id}
            className="admin-card"
            onClick={() => navigate(`/admin/student/${student.id}`)}
          >
            <div className="card-number">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div className="card-name">
              {student.firstName} {student.lastName}
            </div>

            <div className="card-email">{student.email}</div>

            <div className="attendance-card-link">View Classes →</div>
          </div>
        ))}
      </div>
    </div>
  );
}