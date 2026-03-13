import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Classes.css";

import { collection, addDoc, getDocs, query, where } from "firebase/firestore";import { db } from "./firebase";
import { auth } from "./firebase";
export default function Classes() {

  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState("");

  const firstName = localStorage.getItem("firstName");
  const lastName = localStorage.getItem("lastName");

  // تحميل الكلاسات من Firebase
 useEffect(() => {

  const fetchClasses = async () => {

    const user = auth.currentUser;

    const q = query(
      collection(db, "classes"),
      where("instructorId", "==", user.uid)
    );

    const querySnapshot = await getDocs(q);

    const classesData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setClasses(classesData);

  };

  fetchClasses();

}, []);
  // إنشاء كلاس جديد
 const handleCreateClass = async () => {

  if (newClass.trim() === "") return;

  const user = auth.currentUser;

  try {

    const docRef = await addDoc(collection(db, "classes"), {
      name: newClass,
      instructorId: user.uid
    });

    setClasses([
      ...classes,
      {
        id: docRef.id,
        name: newClass
      }
    ]);

    setNewClass("");

  } catch (error) {
    console.error(error);
  }

};

  return (
    <div className="classes-container">

      {/* HEADER */}
      <div className="classes-header">
        <h2>Instructor Panel</h2>
      </div>

      {/* CREATE CLASS */}
      <div className="create-class-box">

        <input
          type="text"
          placeholder="Enter class name (ex: Math)"
          value={newClass}
          onChange={(e) => setNewClass(e.target.value)}
        />

        <button onClick={handleCreateClass}>
          Create Class
        </button>

      </div>

      {/* CLASSES */}
      <div className="classes-list">

        {classes.map((c) => (
          <div
            key={c.id}
            className="class-card"
            onClick={() => navigate(`/manage-class/${c.id}`)}
            style={{ cursor: "pointer" }}
          >

            <div className="class-name">
              {c.name}
            </div>

            <div className="class-info">
              Manage Attendance
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}