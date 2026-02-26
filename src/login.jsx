import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h2>Login</h2>
      <p className="subtitle">Access your digital campus identity</p>

      <form>
        <div className="input-box">
          <label>Email</label>
          <input type="email" placeholder="Enter your email" />
        </div>

        <div className="input-box">
          <label>Password</label>
          <input type="password" placeholder="Enter password" />
        </div>

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
