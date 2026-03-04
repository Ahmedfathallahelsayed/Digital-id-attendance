import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login.jsx";
import Register from "./register.jsx";
import Dashboard from "./Dashboard";
import Classes from "./Classes";
import DigitalCard from "./DigitalCard";
import CardStatus from "./CardStatus";
import DigitalIdPage from "./DigitalIdPage";

import "./App.css";

function App() {
     const student = {
    name: "name",
    major: "Computer Science",
    id: "2327",
    photo:"" };

     const studen = {
    id: "12345",
    lastScan: "2026-03-02 10:30 AM"
  };
  return (
    <Router>
     <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/classes" element={<Classes />} />
       <Route path="/digital-card" element={
      <div style={{ padding: "2rem" }}>
        <DigitalCard student={student} />
      </div> } />
     <Route path="/card-status" element={
      <div style={{ padding: "2rem" }}>
        <CardStatus student={studen} />
      </div>} />
    <Route path="/digital-id" element={<DigitalIdPage />} />
</Routes>
    </Router>
  );
}

export default App;
