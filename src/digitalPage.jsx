import React, { useEffect, useState } from "react";
import DigitalCard from "./digitalCard.jsx";
import CardStatus from "./cardStatus.jsx";
import "./digitalPage.css";

import { auth } from "./auth";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export default function DigitalIdPage() {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      const user = auth.currentUser;

      if (!user) {
        console.log("No user logged in");
        return;
      }

      const docRef = doc(db, "users", user.uid);

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        setStudent({
          name: data.firstName + " " + data.lastName,
          role: data.role,
          id: data.studentId || "No ID",
          lastScan: data.lastScan || "Never",
        });
      } else {
        console.log("User not found");
      }
    };

    fetchStudent();
  }, []);

  if (!student) {
    return <h3>Loading...</h3>;
  }

  return (
    <div className="digital-id-page">
      <h2>Digital ID</h2>

      <DigitalCard student={student} />

      <CardStatus student={student} />
    </div>
  );
}
