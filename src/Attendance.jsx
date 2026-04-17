import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import "./Attendance.css";

const dayOrder = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export default function Attendance() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [classes, setClasses] = useState([]);
  const [groupedSchedule, setGroupedSchedule] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const currentRole = userData.role || "";
        setRole(currentRole);

        // ================= INSTRUCTOR =================
        if (currentRole === "instructor") {
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
        }

        // ================= STUDENT =================
        if (currentRole === "student") {
          const q = query(
            collection(db, "enrollments"),
            where("studentId", "==", user.uid)
          );

          const snapshot = await getDocs(q);

          const enrolledClasses = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const grouped = {};

          enrolledClasses.forEach((item) => {
            const day = item.day || "Unknown";
            if (!grouped[day]) grouped[day] = [];

            grouped[day].push({
              className: item.className,
              // ✅ FIX: استخدم classDocId لو موجود، لو لأ استخدم classId
              classId: item.classCode || item.classCode,
              startTime: item.fromTime,
              endTime: item.toTime,
            });
          });

          // ترتيب المواد داخل كل يوم حسب وقت البداية
          Object.keys(grouped).forEach((day) => {
            grouped[day].sort((a, b) =>
              (a.fromTime || "").localeCompare(b.fromTime || "")
            );
          });

          setGroupedSchedule(grouped);
        }
      } catch (error) {
        console.log("Attendance page error:", error);
      }

      setLoading(false);
    };

    fetchAttendanceData();
  }, []);

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-empty">Loading...</div>
      </div>
    );
  }

  // ================= INSTRUCTOR VIEW =================
  if (role === "instructor") {
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

  // ================= STUDENT VIEW =================
  if (role === "student") {
    const availableDays = dayOrder.filter((day) => groupedSchedule[day]?.length);

    return (
      <div className="attendance-page">
        <div className="attendance-header">
          <div>
            <h2>My Weekly Schedule</h2>
            <p className="attendance-subtitle">
              Here are the classes you joined, organized by day and time.
            </p>
          </div>

          <div className="attendance-count">
            {Object.values(groupedSchedule).flat().length} lecture
            {Object.values(groupedSchedule).flat().length !== 1 ? "s" : ""}
          </div>
        </div>

        {availableDays.length === 0 ? (
          <div className="attendance-empty">
            You have not joined any classes yet.
          </div>
        ) : (
          <div className="schedule-days">
            {availableDays.map((day) => (
              <div key={day} className="schedule-day-card">
                <div className="schedule-day-title">{day}</div>

                <div className="schedule-list">
                  {groupedSchedule[day].map((item, index) => (
                    <div key={index} className="schedule-item">
                      <div className="schedule-item-main">
                        <div className="schedule-class-name">{item.className}</div>
                        <div className="schedule-class-code">
                          {item.classId}
                        </div>
                      </div>

                      <div className="schedule-time">
                        {item.startTime} - {item.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ================= FALLBACK =================
  return (
    <div className="attendance-page">
      <div className="attendance-empty">
        Attendance view is not available for this role.
      </div>
    </div>
  );
}