import { Navigate, useLocation } from "react-router-dom";

/**
 * Guards routes that require a logged-in user.
 * Redirects guests to /login, remembering where they wanted to go.
 */
export function RequireAuth({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
