import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "./auth";
import { auth, googleProvider, facebookProvider } from "./firebase";

import {
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";

import "./App.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // detect if user already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard");
      }
    });

    return () => unsubscribe();
  }, []);

  // EMAIL LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginUser(email, password);
      navigate("/dashboard");
    } catch (err) {
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
          setError("Email or password incorrect");
          break;

        default:
          setError("Something went wrong");
      }
    }
  };

  // GOOGLE LOGIN
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setError("Google login failed");
    }
  };

  // FACEBOOK LOGIN
  const loginWithFacebook = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setError("Facebook login failed");
    }
  };

  // RESET PASSWORD
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Reset password email sent");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>

      <p className="subtitle">Access your digital campus identity</p>

      <form onSubmit={handleLogin}>
        <div className="input-box">
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter email"
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

        <p
          style={{ color: "#007bff", cursor: "pointer" }}
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </p>

        <hr />

        <button type="button" onClick={loginWithGoogle}>
          Login with Google
        </button>

        <button type="button" onClick={loginWithFacebook}>
          Login with Facebook
        </button>

        <p className="bottom-text">
          Don’t have an account?
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