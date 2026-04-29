import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import "./Attendance.css";

export default function StudentRequests() {
  const [joinedClasses, setJoinedClasses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [reason, setReason] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const enrollQuery = query(
      collection(db, "enrollments"),
      where("studentId", "==", user.uid)
    );

    const enrollSnap = await getDocs(enrollQuery);

    const classesData = enrollSnap.docs.map((docItem) => ({
      enrollmentId: docItem.id,
      ...docItem.data(),
    }));

    setJoinedClasses(classesData);

    const usersQuery = query(
      collection(db, "users"),
      where("__name__", "==", user.uid)
    );

    const usersSnap = await getDocs(usersQuery);

    if (!usersSnap.empty) {
      const data = usersSnap.docs[0].data();
      setStudentName(`${data.firstName || ""} ${data.lastName || ""}`.trim());
    }

    const requestsQuery = query(
      collection(db, "courseDropRequests"),
      where("studentUid", "==", user.uid)
    );

    const requestsSnap = await getDocs(requestsQuery);

    const requestsData = requestsSnap.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));

    setRequests(requestsData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendRequest = async () => {
    setMessage("");
    setError("");

    if (!selectedClassId || !reason.trim()) {
      setError("Please select a class and write a reason.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    const selectedClass = joinedClasses.find(
      (item) => item.classId === selectedClassId
    );

    if (!selectedClass) {
      setError("Selected class not found.");
      return;
    }

    const alreadyPending = requests.some(
      (req) => req.classId === selectedClass.classId && req.status === "pending"
    );

    if (alreadyPending) {
      setError("You already have a pending request for this class.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "courseDropRequests"), {
        studentUid: user.uid,
        studentName: studentName || user.email || "Student",
        classId: selectedClass.classId,
        className: selectedClass.className,
        classCode: selectedClass.classCode,
        reason: reason.trim(),
        status: "pending",
        adminReply: "",
        createdAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: "",
      });

      setMessage("Request sent successfully.");
      setSelectedClassId("");
      setReason("");
      fetchData();
    } catch (err) {
      console.log("Send request error:", err);
      setError("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h2>Requests</h2>
          <p className="attendance-subtitle">
            Send a request to drop one of your joined classes.
          </p>
        </div>

        <div className="attendance-count">
          {requests.length} request{requests.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="attendance-empty" style={{ textAlign: "left" }}>
        <h3 style={{ marginBottom: "18px", color: "var(--text)" }}>
          Course Drop Request
        </h3>

        {message && <p style={{ color: "#16a34a" }}>{message}</p>}
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}

        <select
          className="course-input"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          style={{ marginBottom: "14px" }}
        >
          <option value="">Select Class</option>
          {joinedClasses.map((c) => (
            <option key={c.enrollmentId} value={c.classId}>
              {c.className} - {c.classCode}
            </option>
          ))}
        </select>

        <textarea
          className="course-input"
          placeholder="Write your reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            height: "120px",
            paddingTop: "14px",
            resize: "vertical",
            marginBottom: "14px",
          }}
        />

        <button
          className="attendance-back-btn"
          onClick={handleSendRequest}
          disabled={loading}
          style={{ marginBottom: 0 }}
        >
          {loading ? "Sending..." : "Send Request"}
        </button>
      </div>

      <div style={{ marginTop: "28px" }}>
        <div className="attendance-header">
          <div>
            <h2>My Requests</h2>
            <p className="attendance-subtitle">
              Track admin replies and request status.
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="attendance-empty">No requests yet.</div>
        ) : (
          <div className="attendance-grid">
            {requests.map((req) => (
              <div key={req.id} className="attendance-card">
                <div className="attendance-card-name">{req.className}</div>

                <div className="session-meta">
                  <span>{req.classCode}</span>
                </div>

                <div className="session-meta">
                  <strong>Status:</strong>
                  <span>{req.status}</span>
                </div>

                <div className="session-meta">
                  <strong>Reason:</strong>
                  <span>{req.reason}</span>
                </div>

                <div className="session-meta">
                  <strong>Admin Reply:</strong>
                  <span>{req.adminReply || "No reply yet"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}