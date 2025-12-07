import React, { useEffect, useState } from "react";
import "../styles/notification.css";

export default function NotificationToast() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setData(e.detail);

      // Ocultar después de 4s
      setTimeout(() => setData(null), 4000);
    };

    window.addEventListener("error-notification", handler);
    return () => window.removeEventListener("error-notification", handler);
  }, []);

  if (!data) return null;

  return (
    <div className={`noti-container ${data.type}`}>
      <p>{data.errorMessage}</p>

      <button
        className="noti-btn"
        onClick={() => {
          window.location.href = `/login-error?errorId=${data.errorId}`;
        }}
      >
        Ver en ErrorManager
      </button>
    </div>
  );
}
