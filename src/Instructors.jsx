import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

export default function Instructors() {

  const navigate = useNavigate();

  const [instructors, setInstructors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  useEffect(() => {

    const fetchInstructors = async () => {

      const q = query(
        collection(db, "users"),
        where("role", "==", "instructor")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setInstructors(data);
    };

    fetchInstructors();

  }, []);


  const openDeleteModal = (id) => {
    setSelectedInstructor(id);
    setShowModal(true);
  };


  const confirmDelete = async () => {

    if (!selectedInstructor) return;

    await deleteDoc(doc(db, "users", selectedInstructor));

    setInstructors(
      instructors.filter(i => i.id !== selectedInstructor)
    );

    setShowModal(false);
    setSelectedInstructor(null);

  };


  return (

    <div className="admin-container">

      <h2>All Instructors</h2>

      <div className="admin-grid">

        {instructors.map((inst, index) => (

          <div
            key={inst.id}
            className="admin-card"
            onClick={() => navigate(`/admin/instructor/${inst.id}`)}
          >

            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(inst.id);
              }}
            >
              <FaTimes />
            </button>

            <div className="card-number">
              {String(index + 1).padStart(2, "0")}
            </div>

            <div className="card-name">
              {inst.firstName} {inst.lastName}
            </div>

            <div className="card-email">
              {inst.email}
            </div>

          </div>

        ))}

      </div>


      {showModal && (

        <div className="modal-overlay">

          <div className="delete-modal">

            <h3>Delete Instructor?</h3>

            <p>This action cannot be undone.</p>

            <div className="modal-buttons">

              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
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