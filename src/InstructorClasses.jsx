import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import "./Admin.css";

export default function InstructorClasses() {

  const { id } = useParams();
  const db = getFirestore();

  const [classes, setClasses] = useState([]);

  useEffect(() => {

    const fetchClasses = async () => {

      const q = query(
        collection(db, "classes"),
        where("instructorId", "==", id)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setClasses(data);
    };

    fetchClasses();

  }, [id]);

  return (
    <div className="admin-page">

      <h2>Instructor Classes</h2>

      <div className="cards-grid">

        {classes.map((c) => (
          <div key={c.id} className="admin-card">
            <h3>{c.name}</h3>
            <p>Class ID: {c.id}</p>
          </div>
        ))}

      </div>

    </div>
  );
}