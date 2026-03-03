import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Classes.css";

export default function Classes() {

  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState("");

  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastName");

  const handleCreateClass = () => {
    if (newClass.trim() === "") return;

    setClasses([...classes, newClass]);
    setNewClass("");
  };

  return (
    <div className="classes-container">

      {/* HEADER */}
      <div className="classes-header">

        <h2>Instructor Panel</h2>

       

      </div>

      {/* CREATE CLASS */}
      <div className="create-class-box">

        <input
          type="text"
          placeholder="Enter class name (ex: Math)"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
        />

        <button onClick={handleCreateClass}>
          Create Class
        </button>

      </div>

      {/* CLASSES */}
      <div className="classes-list">

        {classes.map((c, index) => (
          <div key={index} className="class-card">

            <div className="class-name">
              {c}
            </div>

            <div className="class-info">
              Manage Attendance
            </div>

          </div>
        ))}

      </div>

      

    </div>
  );
}