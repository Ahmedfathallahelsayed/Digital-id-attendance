import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import "./Attendance.css";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(collection(db, "courseDropRequests"));

      const data = snap.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      data.sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dbb = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dbb - da;
      });

      setRequests(data);
    } catch (error) {
      console.log("Fetch requests error:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const removeStudentFromClass = async (studentUid, classId) => {
    const enrollQuery = query(
      collection(db, "enrollments"),
      where("studentId", "==", studentUid),
      where("classId", "==", classId)
    );

    const enrollSnap = await getDocs(enrollQuery);

    for (const enrollDoc of enrollSnap.docs) {
      await deleteDoc(doc(db, "enrollments", enrollDoc.id));
    }

    const sessionsQuery = query(
      collection(db, "sessions"),
      where("classId", "==", classId)
    );

    const sessionsSnap = await getDocs(sessionsQuery);

    for (const sessionDoc of sessionsSnap.docs) {
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("sessionId", "==", sessionDoc.id),
        where("studentUid", "==", studentUid)
      );

      const attendanceSnap = await getDocs(attendanceQuery);

      for (const attDoc of attendanceSnap.docs) {
        await deleteDoc(doc(db, "attendance", attDoc.id));
      }
    }
  };

  const handleApprove = async (req) => {
    const reply = replies[req.id] || "Request approved. The course has been removed.";

    try {
      await removeStudentFromClass(req.studentUid, req.classId);

      await updateDoc(doc(db, "courseDropRequests", req.id), {
        status: "approved",
        adminReply: reply,
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.uid || "",
      });

      fetchRequests();
    } catch (error) {
      console.log("Approve request error:", error);
    }
  };

  const handleReject = async (req) => {
    const reply = replies[req.id];

    if (!reply || !reply.trim()) {
      alert("Please write a rejection reason.");
      return;
    }

    try {
      await updateDoc(doc(db, "courseDropRequests", req.id), {
        status: "rejected",
        adminReply: reply.trim(),
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.uid || "",
      });

      fetchRequests();
    } catch (error) {
      console.log("Reject request error:", error);
    }
  };

  if (loading) {
    return (
      <div className="attendance-page">
        <div className="attendance-empty">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h2>Course Drop Requests</h2>
          <p className="attendance-subtitle">
            Review students requests to remove joined classes.
          </p>
        </div>

        <div className="attendance-count">
          {requests.length} request{requests.length !== 1 ? "s" : ""}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="attendance-empty">No requests found.</div>
      ) : (
        <div className="attendance-grid">
          {requests.map((req) => (
            <div key={req.id} className="attendance-card">
              <div className="attendance-card-name">{req.className}</div>

              <div className="session-meta">
                <strong>Student:</strong>
                <span>{req.studentName}</span>
              </div>

              <div className="session-meta">
                <strong>Code:</strong>
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

              <textarea
                className="course-input"
                placeholder="Write admin reply..."
                value={replies[req.id] || ""}
                onChange={(e) =>
                  setReplies((prev) => ({
                    ...prev,
                    [req.id]: e.target.value,
                  }))
                }
                style={{
                  height: "90px",
                  paddingTop: "12px",
                  resize: "vertical",
                }}
                disabled={req.status !== "pending"}
              />

              {req.adminReply && (
                <div className="session-meta">
                  <strong>Reply:</strong>
                  <span>{req.adminReply}</span>
                </div>
              )}

              {req.status === "pending" && (
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    className="attendance-back-btn"
                    style={{
                      marginBottom: 0,
                      background: "#dcfce7",
                      color: "#15803d",
                    }}
                    onClick={() => handleApprove(req)}
                  >
                    Approve
                  </button>

                  <button
                    className="attendance-back-btn"
                    style={{
                      marginBottom: 0,
                      borderColor: "#fca5a5",
                      color: "#dc2626",
                    }}
                    onClick={() => handleReject(req)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}