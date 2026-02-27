import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const firstName = localStorage.getItem("firstName");
const lastName = localStorage.getItem("lastName");

  // ✅ يجيب المستخدم الحالي
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        navigate("/"); // لو مش عامل login يرجع login
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h3 className="sidebar-title">Menu</h3>

        <nav className="sidebar-menu">
          <p className="menu-item active">Dashboard</p>
          <p className="menu-item">Attendance</p>
          <p className="menu-item">Digital ID</p>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="topbar">
          <h3>Faculty of Science - Cairo University</h3>
          <div className="user-info">👤 {firstName}{" "}{lastName}</div>
        </header>

        <hr />

        <section className="dashboard-main">
          <h2>Welcome to your Dashboard</h2>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;