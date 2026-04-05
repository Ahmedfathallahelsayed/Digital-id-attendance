import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import "./MyClasses.css";

export default function MyClasses() {
  const [classCode, setClassCode] = useState("");
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchJoinedClasses = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "enrollments"),
      where("studentId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setJoinedClasses(data);
  };

  useEffect(() => {
    fetchJoinedClasses();
  }, []);

  const handleJoinClass = async () => {
    setMessage("");
    setError("");

    if (classCode.trim() === "") return;

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      // دور على الكلاس بالكود
      const classQuery = query(
        collection(db, "classes"),
        where("classId", "==", classCode.trim())
      );

      const classSnapshot = await getDocs(classQuery);

      if (classSnapshot.empty) {
        setError("Class code not found.");
        setLoading(false);
        return;
      }

      const classDoc = classSnapshot.docs[0];
      const classData = classDoc.data();

      // نتأكد إنه مش مشترك قبل كده
      const enrollQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.uid),
        where("classDocId", "==", classDoc.id)
      );

      const enrollSnapshot = await getDocs(enrollQuery);

      if (!enrollSnapshot.empty) {
        setError("You already joined this class.");
        setLoading(false);
        return;
      }

      // ضيف enrollment
      await addDoc(collection(db, "enrollments"), {
        studentId: user.uid,
        classDocId: classDoc.id,
        classId: classData.classId,
        className: classData.name,
        day: classData.day,
        startTime: classData.startTime,
        endTime: classData.endTime,
        instructorId: classData.instructorId,
        joinedAt: new Date(),
      });

      setMessage("Joined class successfully!");
      setClassCode("");
      fetchJoinedClasses();
    } catch (err) {
      console.log("Join class error:", err);
      setError("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="myclasses-container">
      <div className="myclasses-header">
        <div>
          <h2>My Classes</h2>
          <p className="myclasses-subtitle">
            Join a class using the course code and view your enrolled courses.
          </p>
        </div>

        <div className="myclasses-count">
          {joinedClasses.length} class{joinedClasses.length !== 1 ? "es" : ""}
        </div>
      </div>

      <div className="join-box">
        <div className="join-box-title">Join New Class</div>

        {message && <div className="success-msg">{message}</div>}
        {error && <div className="error-msg">{error}</div>}

        <div className="join-row">
          <input
            type="text"
            placeholder="Enter Class Code (e.g. CS317)"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            className="join-input"
          />

          <button
            className="join-btn"
            onClick={handleJoinClass}
            disabled={loading || classCode.trim() === ""}
          >
            {loading ? "Joining..." : "Join"}
          </button>
        </div>
      </div>

      {joinedClasses.length === 0 ? (
        <div className="myclasses-empty">
          <div className="myclasses-empty-icon">📘</div>
          <p>You have not joined any classes yet.</p>
        </div>
      ) : (
        <div className="myclasses-grid">
          {joinedClasses.map((c, index) => (
            <div key={c.id} className="myclass-card">
              <div className="myclass-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="myclass-name">{c.className}</div>

              <div className="myclass-code">Class Code: {c.classId}</div>

              <div className="myclass-schedule">
                {c.day} • {c.startTime} - {c.endTime}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}