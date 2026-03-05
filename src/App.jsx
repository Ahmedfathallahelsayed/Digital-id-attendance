import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./login.jsx";
import Register from "./register.jsx";

import Dashboard from "./Dashboard";
import Classes from "./Classes";
import ManageClass from "./ManageClass";

import CardStatus from "./CardStatus";
import DigitalCard from "./digitalCard";
import DigitalPage from "./digitalPage.jsx";

import Layout from "./Layout";

import "./App.css";

function App() {

  const student = {
    name: "name",
    major: "Computer Science",
    id: "2327",
    photo: "",
  };

  const studen = {
    id: "12345",
    lastScan: "2026-03-02 10:30 AM",
  };

  return (
    <Router>

      <Routes>

        {/* صفحات بدون Sidebar */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* صفحات فيها Sidebar ثابت */}
        <Route element={<Layout />}>

          <Route path="/dashboard" element={<Dashboard />} />

          {/* صفحة الكلاسات */}
          <Route path="/classes" element={<Classes />} />

          {/* صفحة إدارة الكلاس */}
<Route path="/manage-class/:id" element={<ManageClass />} />
          <Route
            path="/digital-card"
            element={
              <div style={{ padding: "2rem" }}>
                <DigitalCard student={student} />
              </div>
            }
          />

          <Route
            path="/card-status"
            element={
              <div style={{ padding: "2rem" }}>
                <CardStatus student={studen} />
              </div>
            }
          />

          {/* صفحة الـ Digital ID */}
          <Route path="/digital-id" element={<DigitalPage />} />

        </Route>

      </Routes>

    </Router>
  );
}

export default App;