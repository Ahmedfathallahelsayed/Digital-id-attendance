import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { auth } from "./auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  FaTachometerAlt,
  FaUserCheck,
  FaChalkboardTeacher,
  FaIdCard,
  FaSignOutAlt,
  FaCog,
  FaUsers,
} from "react-icons/fa";
import "./Dashboard.css";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const db = getFirestore();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }
      setUserEmail(user.email);
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirstName(data.firstName);
          setLastName(data.lastName);
          setRole(data.role);
        }
      } catch (err) {
        console.log("Error:", err);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const displayName = firstName ? `${firstName} ${lastName}` : userEmail;
  const initials = firstName
    ? `${firstName[0]}${lastName ? lastName[0] : ""}`.toUpperCase()
    : (userEmail[0] || "?").toUpperCase();

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        {/* لوجو بس من غير AccessU */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">CU</div>
        </div>

        <nav className="sidebar-menu">
          <p
            className={`menu-item ${isActive("/dashboard") ? "active" : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            <FaTachometerAlt /> Dashboard
          </p>

          <p
            className={`menu-item ${isActive("/attendance") ? "active" : ""}`}
            onClick={() => navigate("/attendance")}
          >
            <FaUserCheck /> Attendance
          </p>

          {/* Admin - بدون label */}
          {role === "admin" && (
            <>
              <p
                className={`menu-item ${isActive("/instructors") ? "active" : ""}`}
                onClick={() => navigate("/instructors")}
              >
                <FaUsers /> Instructors
              </p>
              <p
                className={`menu-item ${isActive("/settings") ? "active" : ""}`}
                onClick={() => navigate("/settings")}
              >
                <FaCog /> Settings
              </p>
            </>
          )}

          {/* Instructor - بدون label */}
          {role === "instructor" && (
            <>
              <p
                className={`menu-item ${isActive("/classes") ? "active" : ""}`}
                onClick={() => navigate("/classes")}
              >
                <FaChalkboardTeacher /> Classes
              </p>
              <p
                className={`menu-item ${isActive("/settings") ? "active" : ""}`}
                onClick={() => navigate("/settings")}
              >
                <FaCog /> Settings
              </p>
            </>
          )}

          {/* Student - بدون label */}
          {role === "student" && (
            <>
              <p
                className={`menu-item ${isActive("/digital-id") ? "active" : ""}`}
                onClick={() => navigate("/digital-id")}
              >
                <FaIdCard /> Digital ID
              </p>
              <p
                className={`menu-item ${isActive("/settings") ? "active" : ""}`}
                onClick={() => navigate("/settings")}
              >
                <FaCog /> Settings
              </p>
            </>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h3>Faculty of Science — Cairo University</h3>
          {/* اسم + role + avatar زي الأول */}
          <div className="topbar-right">
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              {role && <span className="user-role">{role}</span>}
            </div>
            <div className="user-avatar">{initials}</div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
