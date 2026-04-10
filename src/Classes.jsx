import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { FaTimes } from "react-icons/fa";
import "./Classes.css";

export default function Classes() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // 🔥 تحويل الوقت لـ AM/PM
  const formatTo12Hour = (time24) => {
    const [hour, minute] = time24.split(":");
    let h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  // 🔥 تحميل الكلاسات + حساب عدد الطلاب (FIXED)
  useEffect(() => {
    const fetchClasses = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "classes"),
        where("instructorId", "==", user.uid),
      );

      const snapshot = await getDocs(q);

      const classesData = await Promise.all(
        snapshot.docs.map(async (docItem) => {
          const classData = { id: docItem.id, ...docItem.data() };

          // ✅ FIX ENROLL
          const enrollQuery = query(
            collection(db, "enrollments"),
            where("classId", "==", docItem.id),
          );

          const enrollSnapshot = await getDocs(enrollQuery);

          return {
            ...classData,
            enrolledCount: enrollSnapshot.size,
          };
        }),
      );

      setClasses(classesData);
    };

    fetchClasses();
  }, []);

  // 🔥 إنشاء كلاس (FIXED)
  const handleCreateClass = async () => {
    if (
      !className.trim() ||
      !classCode.trim() ||
      !day.trim() ||
      !startTime.trim() ||
      !endTime.trim()
    ) {
      alert("Please fill all fields");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      const newClassData = {
        name: className,

        // ✅ FIX
        classCode: classCode.toUpperCase(),

        day,

        // ✅ FIX
        fromTime: formatTo12Hour(startTime),
        toTime: formatTo12Hour(endTime),

        instructorId: user.uid,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "classes"), newClassData);

      setClasses([
        ...classes,
        {
          id: docRef.id,
          ...newClassData,
          enrolledCount: 0,
        },
      ]);

      // reset
      setClassName("");
      setClassCode("");
      setDay("");
      setStartTime("");
      setEndTime("");
    } catch (e) {
      console.log(e);
      alert("Error creating class");
    }

    setLoading(false);
  };

  // 🔥 حذف كلاس
  const openDeleteModal = (classId) => {
    setSelectedClass(classId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedClass) return;

    await deleteDoc(doc(db, "classes", selectedClass));

    setClasses(classes.filter((c) => c.id !== selectedClass));

    setShowDeleteModal(false);
    setSelectedClass(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreateClass();
  };

  return (
    <div className="classes-container">
      <div className="classes-header">
        <div>
          <h2>My Classes</h2>
          <p className="subtitle">Manage your courses and attendance</p>
        </div>

        <div className="class-count">
          {classes.length} course{classes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* 🔥 CREATE */}
      <div className="create-box">
        <div className="create-box-title">Create New Class</div>

        <div className="create-grid">
          <input
            type="text"
            placeholder="Course Name"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="course-input"
          />

          <input
            type="text"
            placeholder="Class Code (e.g. CS317)"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="course-input"
          />

          <select
            className="course-input"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            <option value="">Select Day</option>
            <option>Saturday</option>
            <option>Sunday</option>
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
          </select>

          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="course-input"
          />

          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="course-input"
          />

          <button
            className="create-btn"
            onClick={handleCreateClass}
            disabled={
              loading ||
              !className ||
              !classCode ||
              !day ||
              !startTime ||
              !endTime
            }
          >
            {loading ? "Creating..." : "+ Create"}
          </button>
        </div>
      </div>

      {/* 🔥 LIST */}
      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>No classes yet. Create your first one!</p>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((c, index) => (
            <div key={c.id} className="class-card">
              <button
                className="delete-btn"
                onClick={() => openDeleteModal(c.id)}
              >
                <FaTimes />
              </button>

              <div className="card-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="card-name">{c.name}</div>

              {/* ✅ FIX */}
              <div className="card-code">Class Code: {c.classCode}</div>

              <div className="card-schedule">
                {c.day} • {c.fromTime} - {c.toTime}
              </div>

              <div className="card-enrolled">
                Enrolled Students: <strong>{c.enrolledCount || 0}</strong>
              </div>

              <button
                className="manage-btn"
                onClick={() => navigate(`/manage-class/${c.id}`)}
              >
                Manage Attendance →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 🔥 DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Delete Class?</h3>
            <p>Do you want to delete this class?</p>

            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
