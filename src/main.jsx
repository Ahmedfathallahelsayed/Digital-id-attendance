import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0vmB4UpXMGTj__T7lGUdQIBGfcH_2bJY",
  authDomain: "accessu-e7bd4.firebaseapp.com",
  projectId: "accessu-e7bd4",
  storageBucket: "accessu-e7bd4.firebasestorage.app",
  messagingSenderId: "336518154309",
  appId: "1:336518154309:web:56dea3ac0324a44f8bbb2c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
