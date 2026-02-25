import React from "react";
import "./App.css";

function App() {
  return (
    <div className="container">

      <div className="icon">🎓</div>

      <h2>Student Registration</h2>
      <p className="subtitle">Create your digital campus identity</p>

      <form>

        <div className="row">
          <div className="input-box">
            <label>First Name</label>
            <input type="text" placeholder="First Name" />
          </div>

          <div className="input-box">
            <label>Last Name</label>
            <input type="text" placeholder="Last Name" />
          </div>
        </div>

        <div className="input-box">
          <label>University Email</label>
          <input type="email" placeholder="Email" />
        </div>

        <div className="input-box">
          <label>National ID</label>
          <input type="text" placeholder="Id" />
        </div>

        <div className="input-box">
          <label>Password</label>
          <input type="password" placeholder="Password" />
        </div>

        <button type="submit">Create Account</button>

        <p className="bottom-text">
          Already have an account? <a href="#">Log in</a>
        </p>

      </form>

    </div>
  );
}

export default App;