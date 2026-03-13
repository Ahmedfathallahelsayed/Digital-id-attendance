import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "./firebase";
import "./Classes.css";

export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState("");

  // تحميل الكلاسات للانستراكتور الحالي
  useEffect(() => {
    const fetchClasses = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, "classes"), where("instructorId", "==", user.uid));
      const snapshot = await getDocs(q);
      const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);
    };
    fetchClasses();
  }, []);

  // إنشاء كلاس جديد
  const handleCreateClass = async () => {
    if (newClass.trim() === "") return;

    const user = auth.currentUser;
    if (!user) return;

    const docRef = await addDoc(collection(db, "classes"), {
      name: newClass,
      instructorId: user.uid
    });

    setClasses([...classes, { id: docRef.id, name: newClass }]);
    setNewClass("");
  };

  return (
    <div className="classes-container">
      <h2>Instructor Panel</h2>

      {/* CREATE CLASS */}
      <div className="create-class-box">
        <input
          type="text"
          placeholder="Enter Course Name"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
        />
        <button className="create-btn" onClick={handleCreateClass}>
          Create Class
        </button>
      </div>

      {/* قائمة الكلاسات */}
      <div className="classes-list">
        {classes.map(c => (
          <div
            key={c.id}
            className="class-card"
            style={{ cursor: "pointer" }}
          >
            <div className="class-name">{c.name}</div>
            <div
              className="class-info"
              onClick={() => navigate(`/manage-class/${c.id}`)}
            >
              Manage Attendance
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}