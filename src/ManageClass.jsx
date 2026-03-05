import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ManageClass.css";

export default function ManageClass() {

  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="manage-container">

      <h2>Manage Class</h2>

      <p>Class ID: {id}</p>

      <div className="manage-box">

        <button className="attendance-btn">
          Start Attendance
        </button>

        <button className="students-btn">
          View Students
        </button>

      </div>

      <button
        className="back-btn"
        onClick={() => navigate("/attendance")}
      >
        Back to Classes
      </button>

    </div>
  );
}