import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

/**
 * Logout functionality
 */
export function Logout() {  
    const { user, onLogout } = useAuth();

    if (user) {
      onLogout();
    }

    return <Navigate to="/login" />;
}