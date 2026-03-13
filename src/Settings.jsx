import React, { useState } from "react";

function Settings() {

  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);

  return (
    <div>

      <h2>Settings</h2>

      <h3>Notifications</h3>

      <div>
        <label>Email Notifications</label>
        <input
          type="checkbox"
          checked={email}
          onChange={() => setEmail(!email)}
        />
      </div>

      <div>
        <label>Push Notifications</label>
        <input
          type="checkbox"
          checked={push}
          onChange={() => setPush(!push)}
        />
      </div>

    </div>
  );
}

export default Settings;