import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

//
export function Logout() {  
    const { user, onLogout } = useAuth();
  
    if (user) {
      onLogout();
    }

    return <Navigate to="/login" />;
}