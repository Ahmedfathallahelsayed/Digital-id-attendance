import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import "./MyClasses.css";

export default function MyClasses() {
  const [classCode, setClassCode] = useState("");
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedClass, setSelectedClass] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const getStudentName = async (user) => {
    const directSnap = await getDoc(doc(db, "users", user.uid));

    if (directSnap.exists()) {
      const data = directSnap.data();
      return `${data.firstName || ""} ${data.lastName || ""}`.trim() || user.email;
    }

    const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));
    const userSnap = await getDocs(userQuery);

    if (!userSnap.empty) {
      const data = userSnap.docs[0].data();
      return `${data.firstName || ""} ${data.lastName || ""}`.trim() || user.email;
    }

    return user.email || "Student";
  };

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

  const fetchMyReviews = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "reviews"),
      where("studentUid", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setMyReviews(data);
  };

  useEffect(() => {
    fetchJoinedClasses();
    fetchMyReviews();
  }, []);

  const handleJoinClass = async () => {
    setMessage("");
    setError("");

    if (!classCode.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      const classQuery = query(
        collection(db, "classes"),
        where("classCode", "==", classCode.trim().toUpperCase())
      );

      const classSnapshot = await getDocs(classQuery);

      if (classSnapshot.empty) {
        setError("Class code not found.");
        setLoading(false);
        return;
      }

      const classDoc = classSnapshot.docs[0];
      const classData = classDoc.data();

      const enrollQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.uid),
        where("classId", "==", classDoc.id)
      );

      const enrollSnapshot = await getDocs(enrollQuery);

      if (!enrollSnapshot.empty) {
        setError("You already joined this class.");
        setLoading(false);
        return;
      }

      const studentName = await getStudentName(user);

      await addDoc(collection(db, "enrollments"), {
        studentId: user.uid,
        studentName,
        classId: classDoc.id,
        classCode: classData.classCode,
        className: classData.name,
        day: classData.day,
        fromTime: classData.fromTime,
        toTime: classData.toTime,
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

  const openReview = (cls) => {
    setSelectedClass(cls);
    setRating(5);
    setComment("");
    setMessage("");
    setError("");
  };

  const closeReview = () => {
    setSelectedClass(null);
    setRating(5);
    setComment("");
  };

  const hasReviewed = (classId) => {
    return myReviews.some((review) => review.classId === classId);
  };

  const handleSubmitReview = async () => {
    setMessage("");
    setError("");

    if (!selectedClass) return;

    if (!comment.trim()) {
      setError("Please write your review.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    if (hasReviewed(selectedClass.classId)) {
      setError("You already reviewed this class.");
      return;
    }

    setReviewLoading(true);

    try {
      const studentName = await getStudentName(user);

      await addDoc(collection(db, "reviews"), {
        studentUid: user.uid,
        studentName,
        classId: selectedClass.classId,
        classCode: selectedClass.classCode,
        className: selectedClass.className,
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });

      setMessage("Review submitted successfully!");
      closeReview();
      fetchMyReviews();
    } catch (err) {
      console.log("Submit review error:", err);
      setError("Something went wrong while submitting review.");
    }

    setReviewLoading(false);
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
            disabled={loading || !classCode.trim()}
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

              <div className="myclass-name">
                {c.className || "Unnamed Class"}
              </div>

              <div className="myclass-code">
                Class Code: {c.classCode || "-"}
              </div>

              <div className="myclass-schedule">
                {c.day || "No day"} • {c.fromTime || "--:--"} -{" "}
                {c.toTime || "--:--"}
              </div>

              {hasReviewed(c.classId) ? (
                <div className="review-submitted">Review Submitted</div>
              ) : (
                <button className="review-btn" onClick={() => openReview(c)}>
                  Leave Review
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedClass && (
        <div className="review-modal-overlay">
          <div className="review-modal">
            <h3>Review {selectedClass.className}</h3>

            <label>Rating</label>
            <select
              className="review-select"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              <option value={5}>⭐⭐⭐⭐⭐ Excellent</option>
              <option value={4}>⭐⭐⭐⭐ Very Good</option>
              <option value={3}>⭐⭐⭐ Good</option>
              <option value={2}>⭐⭐ Fair</option>
              <option value={1}>⭐ Poor</option>
            </select>

            <label>Comment</label>
            <textarea
              className="review-textarea"
              placeholder="Write your feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="review-modal-actions">
              <button className="review-cancel-btn" onClick={closeReview}>
                Cancel
              </button>

              <button
                className="review-submit-btn"
                onClick={handleSubmitReview}
                disabled={reviewLoading}
              >
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}