import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "./firebase";
import { FaTimes } from "react-icons/fa";
import "./Classes.css";

export default function Classes() {

  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [newClass, setNewClass] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {

    const fetchClasses = async () => {

      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "classes"),
        where("instructorId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setClasses(classesData);
    };

    fetchClasses();

  }, []);

  const handleCreateClass = async () => {

    if (newClass.trim() === "") return;

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    const docRef = await addDoc(collection(db, "classes"), {
      name: newClass,
      instructorId: user.uid,
      createdAt: new Date()
    });

    setClasses([...classes, { id: docRef.id, name: newClass }]);

    setNewClass("");
    setLoading(false);

  };

  const openDeleteModal = (classId) => {

    setSelectedClass(classId);
    setShowDeleteModal(true);

  };

  const confirmDelete = async () => {

    if (!selectedClass) return;

    await deleteDoc(doc(db, "classes", selectedClass));

    setClasses(classes.filter(c => c.id !== selectedClass));

    setShowDeleteModal(false);
    setSelectedClass(null);

  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreateClass();
  };

  return (

    <div className="classes-container">

      {/* Header */}

      <div className="classes-header">
        <div>
          <h2>My Classes</h2>
          <p className="subtitle">Manage your courses and attendance</p>
        </div>

        <div className="class-count">
          {classes.length} course{classes.length !== 1 ? "s" : ""}
        </div>
      </div>


      {/* Create Box */}

      <div className="create-box">

        <div className="create-box-title">Create New Class</div>

        <div className="create-row">

          <input
            type="text"
            placeholder="e.g. Data Structures CS317"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={handleKeyDown}
            className="course-input"
          />

          <button
            className="create-btn"
            onClick={handleCreateClass}
            disabled={loading || newClass.trim() === ""}
          >
            {loading ? "Creating..." : "+ Create"}
          </button>

        </div>

      </div>


      {/* Classes Grid */}

      {classes.length === 0 ? (

        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>No classes yet. Create your first one above!</p>
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


      {/* Delete Modal */}

      {showDeleteModal && (

        <div className="modal-overlay">

          <div className="delete-modal">

            <h3>Delete Class?</h3>

            <p>DO YOU WANT TO DELETE?</p>

            <div className="modal-buttons">

              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                Delete
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}