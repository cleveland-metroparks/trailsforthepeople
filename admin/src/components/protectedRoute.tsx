import {
  Navigate,
  // Outlet,
} from 'react-router-dom';
import { useAuth } from "../hooks/useAuth";

/**
 * Protected route component
 */
export const ProtectedRoute = ({
    children,
  }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={"/login"} replace />;
  }

  return children;
};