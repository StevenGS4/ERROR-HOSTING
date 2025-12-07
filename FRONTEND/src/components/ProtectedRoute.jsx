import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const logged = localStorage.getItem("loggedUser");

  if (!logged) {
    return <Navigate to="/login-error" replace />;
  }

  return children;
}
