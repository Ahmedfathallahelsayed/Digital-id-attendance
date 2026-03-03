import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "./auth"; // 👈 من auth.js
import "./App.css";

export default function Login() {
  const navigate = useNavigate();

  // ================= STATE =================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ================= LOGIN FUNCTION =================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginUser(email, password);
navigate("/dashboard");
    } catch (err) {
      console.log(err.code);

      switch (err.code) {
        case "auth/invalid-email":
          setError("Email format is invalid");
          break;

        case "auth/user-not-found":
          setError("No account found with this email");
          break;

        case "auth/wrong-password":
          setError("Incorrect password");
          break;

        case "auth/invalid-credential":
          setError("Email or password is incorrect");
          break;

        default:
          setError("Something went wrong. Try again.");
      }
    }
  };
  // ================= UI =================
  return (
    <div className="container">
      <h2>Login</h2>
      <p className="subtitle">Access your digital campus identity</p>

      <form onSubmit={handleLogin}>
        <div className="input-box">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-box">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Login</button>

        <p className="bottom-text">
          Don’t have an account?{" "}
          <span
            style={{ color: "#007bff", cursor: "pointer" }}
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
}
