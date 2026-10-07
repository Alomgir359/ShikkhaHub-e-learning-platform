// components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, allowedRoles }) {
  const isLoggedIn = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");
  
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}