import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
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
  FaUsers
} from "react-icons/fa";

import "./Dashboard.css";

export default function Layout() {

  const navigate = useNavigate();

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

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {

          const data = docSnap.data();

          setFirstName(data.firstName);
          setLastName(data.lastName);
          setRole(data.role);

        }

      } catch (error) {

        console.log("Error loading profile:", error);

      }

    });

    return () => unsubscribe();

  }, [navigate]);



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

          {/* Dashboard */}

          <p
            className="menu-item"
            onClick={() => navigate("/dashboard")}
            style={{ cursor: "pointer" }}
          >
            <FaTachometerAlt /> Dashboard
          </p>
   <p
                className="menu-item"
                onClick={() => navigate("/attendance")}
                style={{ cursor: "pointer" }}
              >
                <FaUserCheck /> Attendance
              </p>


          {/* ADMIN MENU */}

          {role === "admin" && (

            <>

           
              <p
                className="menu-item"
                onClick={() => navigate("/instructors")}
                style={{ cursor: "pointer" }}
              >
                <FaUsers /> Instructors
              </p>

              <p
                className="menu-item"
                onClick={() => navigate("/settings")}
                style={{ cursor: "pointer" }}
              >
                <FaCog /> Settings
              </p>

            </>

          )}


          {/* Instructor */}

          {role === "instructor" && (

            <p
              className="menu-item"
              onClick={() => navigate("/classes")}
              style={{ cursor: "pointer" }}
            >
              <FaChalkboardTeacher /> Classes
            </p>

          )}


          {/* Student */}

          {role === "student" && (

            <p
              className="menu-item"
              onClick={() => navigate("/digital-id")}
              style={{ cursor: "pointer" }}
            >
              <FaIdCard /> Digital ID
            </p>

          )}


          {/* Settings لغير الادمن */}

          {role !== "admin" && (

            <p
              className="menu-item"
              onClick={() => navigate("/settings")}
              style={{ cursor: "pointer" }}
            >
              <FaCog /> Settings
            </p>

          )}

        </nav>


        {/* Logout */}

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt style={{ marginRight: "6px" }} />
          Logout
        </button>

      </aside>


      {/* Main Content */}

      <main className="main-content">

        <header className="topbar">

          <h3>Faculty of Science - Cairo University</h3>

          <div className="user-info">

            <div>
              👤 {firstName ? `${firstName} ${lastName}` : userEmail}
            </div>

            {role && (
              <div className="user-role">
                {role}
              </div>
            )}

          </div>

        </header>

        <hr />

        {/* الصفحات هتفتح هنا */}

        <Outlet />

      </main>

    </div>

  );

}