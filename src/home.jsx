import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h2>Choose Your Role</h2>

      <div className="role-box">
        <button onClick={() => navigate("/student")}>Student</button>

        <button>Admin</button>
        <button>Instructor</button>
      </div>
    </div>
  );
}
