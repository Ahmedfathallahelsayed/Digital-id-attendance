import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Admin.css";

export default function Instructors() {

  const [instructors, setInstructors] = useState([]);
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {

    const fetchInstructors = async () => {

      const q = query(collection(db, "users"), where("role", "==", "instructor"));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setInstructors(data);
    };

    fetchInstructors();

  }, []);

  return (
    <div className="admin-page">

      <h2>All Instructors</h2>

      <div className="cards-grid">

        {instructors.map((inst) => (
          <div
            key={inst.id}
            className="admin-card"
            onClick={() => navigate(`/instructor/${inst.id}`)}
          >
            <h3>{inst.firstName} {inst.lastName}</h3>
            <p>{inst.email}</p>
          </div>
        ))}

      </div>

    </div>
  );
}