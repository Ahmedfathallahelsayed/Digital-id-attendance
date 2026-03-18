import React, { useState } from "react";
import { registerUser } from "./auth";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.png";
import "./register.css";

function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    nationalId: "",
    password: "",
  });
  const [alert, setAlert] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ text: "", type: "" });
    setLoading(true);
    try {
      await registerUser({ ...formData, role });
      setAlert({ text: "Account created successfully ✅", type: "success" });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        nationalId: "",
        password: "",
      });
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      let message = "Something went wrong";
      if (err.code === "auth/email-already-in-use")
        message = "This email is already registered";
      else if (err.code === "auth/weak-password")
        message = "Password must be at least 6 characters";
      setAlert({ text: message, type: "error" });
    }
    setLoading(false);
  };

  return (
    <div className="reg-page">
      {/* LEFT */}
      <div className="reg-left">
        <div className="reg-logo">
          <img src={logo} alt="Cairo University" className="reg-logo-img" />
        </div>

        <div className="reg-form-wrap">
          <h1 className="reg-title">Create Account</h1>
          <p className="reg-sub">Select your role and fill in your details</p>

          {alert.text && (
            <div
              className={alert.type === "success" ? "reg-success" : "reg-error"}
            >
              {alert.text}
            </div>
          )}

          {/* Role Selector */}
          <div className="reg-roles">
            {["student", "instructor", "admin"].map((r) => (
              <button
                key={r}
                type="button"
                className={`reg-role ${role === r ? "active" : ""}`}
                onClick={() => setRole(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="reg-form">
            <div className="reg-row">
              <div className="field">
                <label>First Name</label>
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field">
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

            <div className="field">
              <label>University Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>National ID</label>
              <input
                name="nationalId"
                placeholder="Enter National ID"
                value={formData.nationalId}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
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

            <button type="submit" className="reg-btn" disabled={loading}>
              {loading ? "Creating..." : `Create Account (${role})`}
            </button>
          </form>

          <p className="reg-bottom">
            Already have an account?{" "}
            <span onClick={() => navigate("/")}>Sign in</span>
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="reg-right">
        <div className="deco-blob blob-1" />
        <div className="deco-blob blob-2" />
        <div className="deco-blob blob-3" />
        <div className="deco-blob blob-4" />
        <div className="reg-right-content">
          <h2>
            Join the
            <br />
            Campus Network
          </h2>
          <p>
            Create your account and get access to smart attendance, your digital
            ID, and the Faculty of Science dashboard.
          </p>
          <div className="feature-pills">
            <span>📋 Smart Attendance</span>
            <span>🪪 Digital ID</span>
            <span>📊 Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
