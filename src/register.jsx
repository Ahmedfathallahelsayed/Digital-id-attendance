import React, { useState } from "react";
import "./App.css";

function Student() {
  const [role, setRole] = useState("student");

  return (
    <div className="container">
      <h2>Create Account</h2>
      <p className="subtitle">Select your role and fill in your details</p>

      {/* ROLE SELECTOR */}
      <div className="role-selector">
        <button
          className={role === "student" ? "role active" : "role"}
          onClick={() => setRole("student")}
          type="button"
        >
          Student
        </button>

        <button
          className={role === "admin" ? "role active" : "role"}
          onClick={() => setRole("admin")}
          type="button"
        >
          Admin
        </button>

        <button
          className={role === "instructor" ? "role active" : "role"}
          onClick={() => setRole("instructor")}
          type="button"
        >
          Instructor
        </button>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="row">
          <div className="input-box">
            <label>First Name</label>
            <input type="text" placeholder="First Name" />
          </div>

          <div className="input-box">
            <label>Last Name</label>
            <input type="text" placeholder="Last Name" />
          </div>
        </div>

        <div className="input-box">
          <label>University Email</label>
          <input type="email" placeholder="Email" />
        </div>

        <div className="input-box">
          <label>National ID</label>
          <input type="text" placeholder="ID" />
        </div>

        <div className="input-box">
          <label>Password</label>
          <input type="password" placeholder="Password" />
        </div>

        <button type="submit">Create Account ({role || "Select Role"})</button>

        <p className="bottom-text">
          already have an account? <a href="/">log in</a>
        </p>
      </form>
    </div>
  );
}

export default Student;
