import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./login.jsx";
import Register from "./register.jsx";

import Dashboard from "./Dashboard.jsx";
import Classes from "./Classes.jsx";
import ManageClass from "./ManageClass.jsx";

import DigitalIdPage from "./digitalPage.jsx";

import Settings from "./Settings.jsx";
import Security from "./Security.jsx";
import Layout from "./Layout.jsx";
import Instructors from "./Instructors";
import InstructorClasses from "./InstructorClasses";
import Attendance from "./Attendance.jsx";
import ClassAttendance from "./ClassAttendance";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/classes" element={<Classes />} />
          <Route path="/manage-class/:classId" element={<ManageClass />} />

          <Route path="/digital-id" element={<DigitalIdPage />} />

          <Route path="/attendance" element={<Attendance />} />
          <Route path="/attendance/class/:classId" element={<ClassAttendance />} />
          <Route
            path="/attendance/class/:classId/session/:sessionId"
            element={<ClassAttendance />}
          />

          <Route path="/settings" element={<Settings />} />
          <Route path="/security" element={<Security />} />

          <Route path="/instructors" element={<Instructors />} />
          <Route path="/admin/instructor/:id" element={<InstructorClasses />} />
          <Route path="/admin/class/:id" element={<ClassAttendance />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;