import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

function Dashboard() {
  const [classes, setClasses] = useState([]);
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
          <p>Welcome back, here's what's happening today.</p>
        </div>

        <button className="schedule-btn">View Schedule</button>
      </div>

      {/* Cards */}
      <div className="cards">

        <div className="card">
          <div className="card-top">
            <h4>Attendance Rate</h4>
          </div>
          <h2>{attendanceRate}%</h2>
          <span className="green">+2.5%</span>
        </div>

        <div className="card">
          <div className="card-top">
            <h4>Upcoming Classes</h4>
          </div>
          <h2>{classes.length}</h2>
          <span>Today</span>
        </div>

        <div className="card">
          <div className="card-top">
            <h4>Active Tickets</h4>
          </div>
          <h2>1</h2>
          <span>Pending</span>
        </div>

        <div className="card">
          <div className="card-top">
            <h4>CGPA</h4>
          </div>
          <h2>3.8</h2>
          <span className="green">Top 5%</span>
        </div>

      </div>

      {/* Chart */}
      <div className="chart">
        <h4>Attendance Overview</h4>
        <div className="bars">
          <div style={{ height: "60%" }}></div>
          <div style={{ height: "80%" }}></div>
          <div style={{ height: "50%" }}></div>
          <div style={{ height: "75%" }}></div>
          <div style={{ height: "65%" }}></div>
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="upcoming">
        <div className="upcoming-header">
          <h4>Upcoming Classes</h4>
          <span>View All</span>
        </div>

        {classes.length === 0 ? (
          <p>No classes available</p>
        ) : (
          classes.slice(0, 3).map((cls) => (
            <div key={cls.id} className="class-item">
              <div>
                <p className="class-title">{cls.name || "No Name"}</p>
                <span>
                  {cls.date || "No Date"} - {cls.time || ""}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick">
        <h4>Quick Access</h4>
        <p>Common tasks for your role.</p>

        <button>Raise Ticket</button>
        <button>Mark Attendance</button>
      </div>

    </div>
  );
}

export default Dashboard;