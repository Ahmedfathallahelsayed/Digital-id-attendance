import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

// ================= REGISTER =================
export const registerUser = async (userData) => {
  const { email, password, firstName, lastName, role, nationalId } = userData;

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    firstName,
    lastName,
    role,
    nationalId,
    createdAt: new Date(),
  });
};
