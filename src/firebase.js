import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC0vmB4UpXMGTj__T7lGUdQIBGfcH_2bJY",
  authDomain: "accessu-e7bd4.firebaseapp.com",
  projectId: "accessu-e7bd4",
  storageBucket: "accessu-e7bd4.firebasestorage.app",
  messagingSenderId: "336518154309",
  appId: "1:336518154309:web:56dea3ac0324a44f8bbb2c",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});