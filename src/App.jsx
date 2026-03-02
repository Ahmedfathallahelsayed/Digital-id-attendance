import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login.jsx";
import Register from "./register.jsx";
import Dashboard from "./Dashboard";
import Classes from "./Classes";

import "./App.css";

function App() {
  return (
    <Router>
     <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/classes" element={<Classes />} />

</Routes>
    </Router>
  );
}

export default App;
