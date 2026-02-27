import React from "react";

function Student() {
  return (
    <div className="container">

      <h2>Student Registration</h2>
      <p className="subtitle">Create your digital campus identity</p>

      <form>
        <div className="row">
          <div className="input-box">
            <label>First Name</label>
            <input type="text" />
          </div>

          <div className="input-box">
            <label>Last Name</label>
            <input type="text" />
          </div>
        </div>

        <div className="input-box">
          <label>Email</label>
          <input type="email" />
        </div>

        <div className="input-box">
          <label>Password</label>
          <input type="password" />
        </div>

        <button type="submit">Create Account</button>
      </form>

    </div>
  );
}

export default Student;