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
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import "./Profile.css";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({
    totalClasses: 0,
    attendanceRate: 0,
  });
  const fileInputRef = useRef();
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
          totalSessions > 0
            ? Math.round((presentCount / totalSessions) * 100)
            : 0;

        setStats({ totalClasses, attendanceRate });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !userData) return;
    setUploading(true);
    setSuccess(false);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profilePhotos/${userData.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "users", userData.uid), { photoURL: url });
      setPhotoURL(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  if (!userData) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
      </div>
    );
  }

  const initials = userData.firstName
    ? `${userData.firstName[0]}${userData.lastName ? userData.lastName[0] : ""}`.toUpperCase()
    : "?";

  const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

  return (
    <div className="profile-page">
      <div className="profile-card">

        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper" onClick={() => fileInputRef.current.click()}>
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-initials">{initials}</div>
            )}
            <div className="profile-avatar-overlay">
              <span>تغيير الصورة</span>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {uploading && <p className="profile-status uploading">جاري الرفع...</p>}
          {success && <p className="profile-status success">✓ تم تحديث الصورة</p>}
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