import React, { useEffect, useRef, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import "./QRScannerModal.css";

export default function QRScannerModal({ onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [status, setStatus] = useState("starting");
  const [message, setMessage] = useState("");
  const [scannedOnce, setScannedOnce] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopAll();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("scanning");
        startScanInterval();
      }
    } catch {
      setStatus("error");
      setMessage("Camera access denied. Please allow camera permission.");
    }
  };

  const stopAll = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startScanInterval = () => {
    if (!("BarcodeDetector" in window)) {
      setStatus("error");
      setMessage("QR scanning is not supported on this browser. Please use Chrome on Android/Desktop.");
      return;
    }

    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      try {
        const codes = await detector.detect(video);
        if (codes.length > 0) {
          clearInterval(intervalRef.current);
          handleQRResult(codes[0].rawValue);
        }
      } catch {}
    }, 300);
  };

  const handleQRResult = async (rawValue) => {
    if (scannedOnce) return;
    setScannedOnce(true);
    stopAll();
    setStatus("processing");
    setMessage("Processing...");

    try {
      let parsed;
      try {
        parsed = JSON.parse(rawValue);
      } catch {
        setStatus("error");
        setMessage("Invalid QR code. Please scan the correct lecture QR.");
        return;
      }

      const { sessionId, classId } = parsed;
      if (!sessionId || !classId) {
        setStatus("error");
        setMessage("Invalid QR code format.");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setStatus("error");
        setMessage("You are not logged in.");
        return;
      }

      // تأكد إن الطالب enrolled
      const enrollSnap = await getDocs(
        query(
          collection(db, "enrollments"),
          where("studentId", "==", user.uid),
          where("classId", "==", classId)
        )
      );
      if (enrollSnap.empty) {
        setStatus("error");
        setMessage("You are not enrolled in this class.");
        return;
      }

      // تحقق مش سجّل قبل كده
      const attSnap = await getDocs(
        query(
          collection(db, "attendance"),
          where("studentId", "==", user.uid),
          where("sessionId", "==", sessionId)
        )
      );
      if (!attSnap.empty) {
        setStatus("already");
        setMessage("You have already marked attendance for this session.");
        return;
      }

      // سجّل الحضور
      await addDoc(collection(db, "attendance"), {
        studentId: user.uid,
        classId,
        sessionId,
        status: "Present",
        timestamp: Timestamp.now(),
      });

      setStatus("success");
      setMessage("Attendance marked successfully ✓");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const handleTryAgain = () => {
    setScannedOnce(false);
    setStatus("starting");
    setMessage("");
    startCamera();
  };

  return (
    <div
      className="qr-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="qr-modal">
        <button className="qr-modal-close" onClick={onClose}>✕</button>
        <h3 className="qr-modal-title">Scan QR Code</h3>

        {/* الكاميرا */}
        {(status === "starting" || status === "scanning") && (
          <div className="qr-video-wrapper">
            <video ref={videoRef} className="qr-video" muted playsInline />
            <div className="qr-overlay">
              <div className="qr-frame" />
            </div>
            {status === "starting" && (
              <div className="qr-loading-text">Starting camera...</div>
            )}
            {status === "scanning" && (
              <div className="qr-loading-text">Point at the QR code</div>
            )}
          </div>
        )}

        {/* Processing */}
        {status === "processing" && (
          <div className="qr-result processing">
            <span className="qr-result-icon">⏳</span>
            <p>Processing...</p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="qr-result success">
            <span className="qr-result-icon">✅</span>
            <p>{message}</p>
            <button className="qr-result-btn" onClick={onClose}>Close</button>
          </div>
        )}

        {/* Already marked */}
        {status === "already" && (
          <div className="qr-result already">
            <span className="qr-result-icon">ℹ️</span>
            <p>{message}</p>
            <button className="qr-result-btn" onClick={onClose}>Close</button>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="qr-result error">
            <span className="qr-result-icon">❌</span>
            <p>{message}</p>
            <button className="qr-result-btn" onClick={handleTryAgain}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}