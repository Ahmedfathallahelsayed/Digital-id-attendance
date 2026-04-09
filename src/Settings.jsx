import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./auth";
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import "./Settings.css";

function Settings() {
  const [theme, setTheme] = useState("system");
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();

  // بيانات اليوزر
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameLoading, setNameLoading] = useState(false);

  // باسورد
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "system";
    setTheme(saved);
    applyTheme(saved);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
      }
    });
    return () => unsubscribe();
  }, []);

  const applyTheme = (mode) => {
    document.body.classList.remove("dark-mode");
    if (mode === "dark") {
      document.body.classList.add("dark-mode");
    } else if (mode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.classList.toggle("dark-mode", prefersDark);
    }
  };

  const changeTheme = (mode) => {
    setTheme(mode);
    applyTheme(mode);
    localStorage.setItem("theme", mode);
  };

  const handleSaveName = async () => {
    setNameError("");
    setNameSuccess("");
    if (!firstName.trim() || !lastName.trim()) {
      setNameError("Please fill in both fields.");
      return;
    }
    setNameLoading(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setNameSuccess("Name updated successfully ✓");
      setTimeout(() => setNameSuccess(""), 3000);
    } catch (err) {
      setNameError("Something went wrong.");
    }
    setNameLoading(false);
  };

  const handleChangePassword = async () => {
    setPassError("");
    setPassSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("Password must be at least 6 characters.");
      return;
    }
    setPassLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPassSuccess("Password updated successfully ✓");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassSuccess(""), 3000);
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setPassError("Current password is incorrect.");
      } else {
        setPassError("Something went wrong.");
      }
    }
    setPassLoading(false);
  };

  return (
    <div className="settings-page">
      <h2 className="settings-title">Settings</h2>

      {/* Appearance */}
      <div className="settings-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">🎨</span>
          <div>
            <h3>Appearance</h3>
            <p>Choose how the app looks</p>
          </div>
        </div>
        <div className="theme-buttons">
          {[
            { key: "light",  label: "Light",  icon: "🌞" },
            { key: "dark",   label: "Dark",   icon: "🌙" },
            { key: "system", label: "System", icon: "💻" },
          ].map((t) => (
            <button
              key={t.key}
              className={`theme-btn ${theme === t.key ? "active" : ""}`}
              onClick={() => changeTheme(t.key)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Edit Name */}
      <div className="settings-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">✏️</span>
          <div>
            <h3>Edit Name</h3>
            <p>Update your first and last name</p>
          </div>
        </div>

        <div className="settings-fields">
          <div className="settings-field-row">
            <div className="settings-field">
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
              />
            </div>
            <div className="settings-field">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
              />
            </div>
          </div>

          {nameError && <p className="settings-msg error">{nameError}</p>}
          {nameSuccess && <p className="settings-msg success">{nameSuccess}</p>}

          <button
            className="settings-save-btn"
            onClick={handleSaveName}
            disabled={nameLoading}
          >
            {nameLoading ? "Saving..." : "Save Name"}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="settings-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">🔒</span>
          <div>
            <h3>Change Password</h3>
            <p>Update your account password</p>
          </div>
        </div>

        <div className="settings-fields">
          <div className="settings-field">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="settings-field">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="settings-field">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          {passError && <p className="settings-msg error">{passError}</p>}
          {passSuccess && <p className="settings-msg success">{passSuccess}</p>}

          <button
            className="settings-save-btn"
            onClick={handleChangePassword}
            disabled={passLoading}
          >
            {passLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="settings-card">
        <div className="settings-card-header">
          <span className="settings-card-icon">🔔</span>
          <div>
            <h3>Notifications</h3>
            <p>Manage your notification preferences</p>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <h4>Email Notifications</h4>
            <p>Receive updates via email</p>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={email} onChange={() => setEmail(!email)} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <h4>Push Notifications</h4>
            <p>Get alerts on your device</p>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={push} onChange={() => setPush(!push)} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

    </div>
  );
}

export default Settings;