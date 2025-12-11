import {
  Navigate,
  // Outlet,
} from "react-router";
import { useAuth } from "../hooks/useAuth";

/**
 * Protected route component
 */
export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const skipLogin =
    (process.env.REACT_APP_SKIP_LOGIN || "").toLowerCase() === "true";

  if (!user && !skipLogin) {
    return <Navigate to={"/login"} replace />;
  }

  return children;
};
