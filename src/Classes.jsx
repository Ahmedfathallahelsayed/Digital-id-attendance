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
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { FaTimes, FaEdit } from "react-icons/fa";
import "./Classes.css";

export default function Classes() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [day, setDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const formatTo12Hour = (time24) => {
    if (!time24) return "";
    const [hour, minute] = time24.split(":");
    let h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${minute} ${ampm}`;
  };

  const fetchClasses = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "classes"),
      where("instructorId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    const classesData = await Promise.all(
      snapshot.docs.map(async (docItem) => {
        const classData = { id: docItem.id, ...docItem.data() };

        const enrollQuery = query(
          collection(db, "enrollments"),
          where("classId", "==", docItem.id)
        );

        const enrollSnapshot = await getDocs(enrollQuery);

        return {
          ...classData,
          enrolledCount: enrollSnapshot.size,
        };
      })
    );

    setClasses(classesData);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

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
        name: className.trim(),
        classCode: classCode.trim().toUpperCase(),
        day,
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

  const openEditModal = (c) => {
    setEditingClass(c);
    setEditName(c.name || "");
    setEditCode(c.classCode || "");
    setEditDay(c.day || "");
    setEditStartTime("");
    setEditEndTime("");
    setShowEditModal(true);
  };

const handleUpdateClass = async () => {
  if (!editingClass) return;

  if (!editName.trim() || !editCode.trim() || !editDay.trim()) {
    alert("Please fill course name, code and day");
    return;
  }

  const updatedData = {
    name: editName.trim(),
    classCode: editCode.trim().toUpperCase(),
    day: editDay,
    fromTime: editStartTime
      ? formatTo12Hour(editStartTime)
      : editingClass.fromTime,
    toTime: editEndTime
      ? formatTo12Hour(editEndTime)
      : editingClass.toTime,
  };

  try {
    // ✅ تحديث الكلاس نفسه
    await updateDoc(doc(db, "classes", editingClass.id), updatedData);

    // ✅ تحديث كل الطلبة اللي مشتركين في الكلاس
    const enrollQuery = query(
      collection(db, "enrollments"),
      where("classId", "==", editingClass.id)
    );

    const enrollSnap = await getDocs(enrollQuery);

    await Promise.all(
      enrollSnap.docs.map((enrollDoc) =>
        updateDoc(doc(db, "enrollments", enrollDoc.id), {
          className: updatedData.name,
          classCode: updatedData.classCode,
          day: updatedData.day,
          fromTime: updatedData.fromTime,
          toTime: updatedData.toTime,
        })
      )
    );

    // ✅ تحديث الـ UI عندك
    setClasses((prev) =>
      prev.map((c) =>
        c.id === editingClass.id ? { ...c, ...updatedData } : c
      )
    );

    setShowEditModal(false);
    setEditingClass(null);
  } catch (error) {
    console.log("Update class error:", error);
    alert("Error updating class");
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreateClass();
  };

  const filteredClasses = classes.filter((c) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return true;

    return (
      (c.name || "").toLowerCase().includes(search) ||
      (c.classCode || "").toLowerCase().includes(search) ||
      (c.day || "").toLowerCase().includes(search)
    );
  });

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
            <option>Friday</option>
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

      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="Search by course name, code or day..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <span className="search-count">
          {filteredClasses.length} result{filteredClasses.length !== 1 ? "s" : ""}
        </span>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>No classes yet. Create your first one!</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No matching classes found.</p>
        </div>
      ) : (
        <div className="classes-grid">
          {filteredClasses.map((c, index) => (
            <div key={c.id} className="class-card">
              <button
                className="delete-btn"
                onClick={() => openDeleteModal(c.id)}
                title="Delete class"
              >
                <FaTimes />
              </button>

              <button
                className="edit-btn"
                onClick={() => openEditModal(c)}
                title="Edit class"
              >
                <FaEdit />
              </button>

              <div className="card-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="card-name">{c.name}</div>

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

      {showEditModal && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <h3>Edit Class</h3>

            <input
              className="course-input"
              placeholder="Course Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <input
              className="course-input"
              placeholder="Class Code"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
            />

            <select
              className="course-input"
              value={editDay}
              onChange={(e) => setEditDay(e.target.value)}
            >
              <option value="">Select Day</option>
              <option>Saturday</option>
              <option>Sunday</option>
              <option>Monday</option>
              <option>Tuesday</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
            </select>

            <p className="edit-hint">
              Current Time: {editingClass?.fromTime || "—"} -{" "}
              {editingClass?.toTime || "—"}
            </p>

            <input
              type="time"
              className="course-input"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
            />

            <input
              type="time"
              className="course-input"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
            />

            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>

              <button className="confirm-edit-btn" onClick={handleUpdateClass}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}