import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "./auth";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import "./login.css";
import logo from "./assets/logo.png";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/dashboard");
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setResetMsg("");
    setLoading(true);
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
    setLoading(false);
  };

  const loginWithGoogle = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err) {
      setError("Google login failed");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Reset email sent! Check your inbox.");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT */}
      <div className="login-left">
        <div className="login-form-wrap">
          <div className="login-logo">
            <img src={logo} alt="Cairo University" className="login-logo-img" />
          </div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-sub">Sign in to your campus account</p>

          {error && <div className="login-error">{error}</div>}
          {resetMsg && <div className="login-success">{resetMsg}</div>}

          {/* Google */}
          <button
            type="button"
            className="google-btn"
            onClick={loginWithGoogle}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="field">
              <label>University Email</label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <div className="field-row">
                <label>Password</label>
                <span className="forgot-link" onClick={handleForgotPassword}>
                  Forgot password?
                </span>
              </div>
              <div className="pass-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="login-bottom">
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")}>Register</span>
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="deco-blob blob-1" />
        <div className="deco-blob blob-2" />
        <div className="deco-blob blob-3" />
        <div className="deco-blob blob-4" />

        <div className="login-right-content">
          <h2>
            Your Digital
            <br />
            Campus Identity
          </h2>
          <p>
            Manage attendance, access your digital ID, and stay connected with
            Faculty of Science - Cairo University.
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
