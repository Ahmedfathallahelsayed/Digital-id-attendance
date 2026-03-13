import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  sendPasswordResetEmail,
} from "firebase/auth";

import { doc, setDoc, runTransaction } from "firebase/firestore";

import { auth, db, googleProvider, facebookProvider } from "./firebase";

// ================= LOGIN =================

// LOGIN EMAIL
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// LOGIN GOOGLE
export const loginWithGoogle = () => {
  return signInWithRedirect(auth, googleProvider);
};

// LOGIN FACEBOOK
export const loginWithFacebook = () => {
  return signInWithRedirect(auth, facebookProvider);
};

// RESET PASSWORD
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
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

    transaction.update(counterRef, { currentId: nextId });

    return nextId;
  });

  return "ST" + newId;
};

// ================= REGISTER =================
export const registerUser = async (userData) => {
  const { email, password, firstName, lastName, role, nationalId } = userData;

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  let studentId = null;
  if (role === "student") {
    studentId = await generateStudentId();
  }

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

export { auth };
