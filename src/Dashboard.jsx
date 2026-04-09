import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [classesCount, setClassesCount] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // ✅ Classes
      const classSnap = await getDocs(collection(db, "Classes"));
      const classList = [];

      classSnap.forEach((doc) => {
        classList.push({ id: doc.id, ...doc.data() });
      });

      setClasses(classList);
      setClassesCount(classList.length);

      // ✅ Attendance
      const attSnap = await getDocs(collection(db, "Attendance"));

      let total = 0;
      let present = 0;

      attSnap.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.status === "present") present++;
      });

      const percent = total ? ((present / total) * 100).toFixed(0) : 0;
      setAttendanceRate(percent);

    } catch (err) {
      console.log("Error:", err);
    }
  };

  return (
    <div className="dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back 👋</p>
        </div>
      </div>

      {/* Cards */}
      <div className="cards">
        <div className="card">
          <h4>Attendance Rate</h4>
          <h2>{attendanceRate}%</h2>
        </div>

        <div className="card">
          <h4>Total Classes</h4>
          <h2>{classesCount}</h2>
        </div>

        <div className="card">
          <h4>Upcoming Classes</h4>
          <h2>{classes.length}</h2>
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="upcoming">
        <h4>Upcoming Classes</h4>

        {classes.length === 0 ? (
          <p>No classes available</p>
        ) : (
          classes.slice(0, 3).map((cls) => (
            <div key={cls.id} className="class-item">
              <p>{cls.name || "No Name"}</p>
              <span>
                {cls.date || "No Date"} {cls.time || ""}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default Dashboard;