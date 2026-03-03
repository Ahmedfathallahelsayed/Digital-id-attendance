import React, { useState } from "react";
import { registerUser } from "./auth";
import { useNavigate } from "react-router-dom";
import "./App.css";

function Register() {
  const navigate = useNavigate();

  // ================= ROLE =================
  const [role, setRole] = useState("student");

  // ================= FORM DATA =================
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    nationalId: "",
    password: "",
  });

  // ================= ALERT =================
  const [alert, setAlert] = useState({
    text: "",
    type: "", // success | error
  });

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // امسح أي رسالة قديمة
    setAlert({ text: "", type: "" });

    try {
      await registerUser({
        ...formData,
        role,
      });

      setAlert({
        text: "Account created successfully ✅",
        type: "success",
      });

      // reset form بعد النجاح
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        nationalId: "",
        password: "",
      });

      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.log(err.code);

      let message = "Something went wrong";

      if (err.code === "auth/email-already-in-use") {
        message = "This email is already registered";
      } else if (err.code === "auth/weak-password") {
        message = "Password must be at least 6 characters";
      }

      setAlert({
        text: message,
        type: "error",
      });
    }
  };

  // ================= UI =================
  return (
    <div className="container">
      <h2>Create Account</h2>
      <p className="subtitle">Select your role and fill in your details</p>

      {/* ALERT MESSAGE */}
      {alert.text && (
        <div className={alert.type === "success" ? "success-box" : "error-box"}>
          {alert.text}
        </div>
      )}

      {/* ROLE SELECTOR */}
      <div className="role-selector">
        {["student", "admin", "instructor"].map((r) => (
          <button
            key={r}
            type="button"
            className={role === r ? "role active" : "role"}
            onClick={() => setRole(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="input-box">
            <label>First Name</label>
            <input
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-box">
            <label>Last Name</label>
            <input
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-box">
          <label>University Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your university email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-box">
          <label>National ID</label>
          <input
            name="nationalId"
            placeholder="Enter National ID"
            value={formData.nationalId}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-box">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Create Account ({role})</button>

        <p className="bottom-text">
          already have an account?{" "}
          <span
            style={{ cursor: "pointer", color: "#007bff" }}
            onClick={() => navigate("/")}
          >
            log in
          </span>
        </p>
      </form>
    </div>
  );
}

export default Register;
