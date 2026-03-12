import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import { getFirestore, doc, setDoc, runTransaction } from "firebase/firestore";

// ================= CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyC0vmB4UpXMGTj__T7lGUdQIBGfcH_2bJY",
  authDomain: "accessu-e7bd4.firebaseapp.com",
  projectId: "accessu-e7bd4",
  storageBucket: "accessu-e7bd4.firebasestorage.app",
  messagingSenderId: "336518154309",
  appId: "1:336518154309:web:56dea3ac0324a44f8bbb2c",
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
const db = getFirestore(app);

// ================= LOGIN =================
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// ================= GENERATE STUDENT ID =================
const generateStudentId = async () => {
  const counterRef = doc(db, "counters", "studentCounter");

  const newId = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);

    if (!counterDoc.exists()) {
      throw "Counter document does not exist!";
    }

    const currentId = counterDoc.data().currentId;

    const nextId = currentId + 1;

    transaction.update(counterRef, {
      currentId: nextId,
    });

    return nextId;
  });

  return "ST" + newId;
};

// ================= REGISTER =================
export const registerUser = async (userData) => {
  const { email, password, firstName, lastName, role, nationalId } = userData;

  // إنشاء حساب في Firebase Auth
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  let studentId = null;

  // لو Student يولد ID متسلسل
  if (role === "student") {
    studentId = await generateStudentId();
  }

  // تخزين البيانات في Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    firstName,
    lastName,
    role,
    nationalId,
    studentId: studentId,
    createdAt: new Date(),
  });
};
