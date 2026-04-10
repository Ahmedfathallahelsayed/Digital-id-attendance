import React, { useEffect, useState, useRef } from "react";
import { auth } from "./auth";
import { onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import "./Profile.css";

// WhatsApp-style default avatar SVG
const DefaultAvatar = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <rect width="200" height="200" fill="#dfe5e7" />
    <circle cx="100" cy="85" r="38" fill="#b0bec5" />
    <ellipse cx="100" cy="170" rx="60" ry="40" fill="#b0bec5" />
  </svg>
);

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [stats, setStats] = useState({ totalClasses: 0, attendanceRate: 0 });
  const fileInputRef = useRef();
  const menuRef = useRef();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      setUserData({ ...data, uid: user.uid });
      setPhotoURL(data.photoURL || null);

      if (data.role === "student") {
        const enrollSnap = await getDocs(
          query(collection(db, "enrollments"), where("studentId", "==", user.uid))
        );
        const totalClasses = enrollSnap.docs.length;
        const attendSnap = await getDocs(
          query(collection(db, "attendance"), where("studentId", "==", user.uid))
        );
        const presentCount = attendSnap.docs.filter(
          (d) => (d.data().status || "Present") === "Present"
        ).length;
        const classIds = enrollSnap.docs.map((d) => d.data().classId);
        let totalSessions = 0;
        for (const classId of classIds) {
          const sessSnap = await getDocs(
            query(collection(db, "sessions"), where("classId", "==", classId))
          );
          totalSessions += sessSnap.docs.length;
        }
        const attendanceRate =
          totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
        setStats({ totalClasses, attendanceRate });
      }
    });
    return () => unsubscribe();
  }, []);

  // إغلاق الـ menu لو الـ user ضغط برا
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !userData) return;
    setShowMenu(false);

    if (file.size > 500 * 1024) {
      setError("الصورة كبيرة أوي، اختار صورة أقل من 500KB");
      setTimeout(() => setError(null), 4000);
      return;
    }

    setUploading(true);
    setSuccess(false);
    setError(null);

    try {
      const compressedBase64 = await compressImage(file, 400, 400, 0.7);
      await updateDoc(doc(db, "users", userData.uid), { photoURL: compressedBase64 });
      setPhotoURL(compressedBase64);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setError("حصل خطأ، حاول تاني");
      setTimeout(() => setError(null), 4000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!userData) return;
    setShowMenu(false);
    setUploading(true);
    setError(null);
    try {
      await updateDoc(doc(db, "users", userData.uid), { photoURL: "" });
      setPhotoURL(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      setError("حصل خطأ، حاول تاني");
      setTimeout(() => setError(null), 4000);
    } finally {
      setUploading(false);
    }
  };

  const compressImage = (file, maxWidth, maxHeight, quality) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  if (!userData) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
      </div>
    );
  }

  const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

  return (
    <div className="profile-page">
      <div className="profile-card">

        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper" ref={menuRef}>

            {/* الأفاتار */}
            <div className="profile-avatar-circle" onClick={() => setShowMenu((v) => !v)}>
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="profile-avatar-img" />
              ) : (
                <DefaultAvatar />
              )}
              <div className="profile-avatar-overlay">
                <span>✏️</span>
              </div>
            </div>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="profile-avatar-menu">
                <button
                  className="profile-menu-item"
                  onClick={() => { fileInputRef.current.click(); setShowMenu(false); }}
                >
                  📷 تغيير الصورة
                </button>
                {photoURL && (
                  <button className="profile-menu-item delete" onClick={handleDeletePhoto}>
                    🗑️ مسح الصورة
                  </button>
                )}
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {uploading && <p className="profile-status uploading">جاري التحديث...</p>}
          {success && <p className="profile-status success">✓ تم التحديث</p>}
          {error && <p className="profile-status error">{error}</p>}
        </div>

        <div className="profile-info">
          <h2 className="profile-name">{fullName}</h2>
          <span className="profile-role-badge">{userData.role}</span>
        </div>

        {userData.role === "student" && (
          <div className="profile-stats">
            <div className="profile-stat-box">
              <span className="profile-stat-number">{stats.totalClasses}</span>
              <span className="profile-stat-label">Enrolled Classes</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat-box">
              <span
                className="profile-stat-number"
                style={{
                  color:
                    stats.attendanceRate >= 75
                      ? "#16a34a"
                      : stats.attendanceRate >= 50
                      ? "#d97706"
                      : "#dc2626",
                }}
              >
                {stats.attendanceRate}%
              </span>
              <span className="profile-stat-label">Attendance Rate</span>
            </div>
          </div>
        )}

        <div className="profile-details">
          <div className="profile-detail-row">
            <span className="profile-detail-label">Student ID</span>
            <span className="profile-detail-value">
              {userData.studentId || userData.uid?.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">National ID</span>
            <span className="profile-detail-value">{userData.nationalId || "—"}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Email</span>
            <span className="profile-detail-value">
              {userData.email || auth.currentUser?.email}
            </span>
          </div>
          {userData.department && (
            <div className="profile-detail-row">
              <span className="profile-detail-label">Department</span>
              <span className="profile-detail-value">{userData.department}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
