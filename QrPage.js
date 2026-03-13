import React from "react";

function QRPage() {

  return (
    <div>

      <h2>Scan to Join Class</h2>

      <img
        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=attendance"
        alt="qr"
      />

      <p>Scan this code to mark attendance</p>

    </div>
  );
}

export default QRPage;