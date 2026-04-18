import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
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

export default function StudentClassAttendance() {
  const { studentId, classId } = useParams();
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const studentSnap = await getDoc(doc(db, "users", studentId));
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          setStudentName(
            `${studentData.firstName || ""} ${studentData.lastName || ""}`.trim()
          );
        }

        const classSnap = await getDoc(doc(db, "classes", classId));
        if (classSnap.exists()) {
          setClassName(classSnap.data().name || "Class");
        }

        const sessionsQuery = query(
          collection(db, "sessions"),
          where("classId", "==", classId)
        );
        const sessionsSnap = await getDocs(sessionsQuery);

        const sessionMap = sessionsSnap.docs.map((sessionDoc) => {
          const sessionData = sessionDoc.data();
          const createdAtDate = sessionData.createdAt?.toDate
            ? sessionData.createdAt.toDate()
            : new Date(sessionData.createdAt);

          return {
            id: sessionDoc.id,
            ...sessionData,
            createdAtDate,
          };
        });

        const attendanceRecords = [];

        for (const session of sessionMap) {
          const attendanceQuery = query(
            collection(db, "attendance"),
            where("sessionId", "==", session.id),
            where("studentUid", "==", studentId)
          );

          const attendanceSnap = await getDocs(attendanceQuery);

          attendanceSnap.docs.forEach((attDoc) => {
            attendanceRecords.push({
              id: attDoc.id,
              ...attDoc.data(),
              sessionDate: session.createdAtDate,
            });
          });
        }

        attendanceRecords.sort((a, b) => b.sessionDate - a.sessionDate);
        setRecords(attendanceRecords);
      } catch (error) {
        console.log("StudentClassAttendance error:", error);
      }

      setLoading(false);
    };

    loadData();
  }, [studentId, classId]);

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
        onClick={() => navigate(`/admin/student/${studentId}`)}
      >
        ← Back
      </button>

      <div className="attendance-header">
        <div>
          <h2>{className}</h2>
          <p className="attendance-subtitle">
            Attendance records for {studentName || "student"} in this class.
          </p>
        </div>

        <div className="attendance-count">
          {records.length} lecture{records.length !== 1 ? "s" : ""}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="attendance-empty">
          This student has no attendance records in this class yet.
        </div>
      ) : (
        <div className="attendance-table-wrap">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Time</th>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record, index) => (
                <tr key={record.id}>
                  <td>{index + 1}</td>
                  <td>{formatDate(record.sessionDate)}</td>
                  <td>{formatTime(record.sessionDate)}</td>
                  <td>{record.studentName || "Unknown"}</td>
                  <td>{record.studentId || "—"}</td>
                  <td>
                    <span className="status-pill">
                      {record.status || "Present"}
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