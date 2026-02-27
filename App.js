import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./home";
import Student from "./student";
import "./App.css";
function App() {
  return (
       <Router>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/student" element={<Student />} />
      </Routes>
    </Router>
   
  );
}

export default App;