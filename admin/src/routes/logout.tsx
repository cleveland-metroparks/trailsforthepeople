import { Navigate } from "react-router-dom";

import { mapsApiClient } from "../components/mapsApi";
import { useAuth } from "../hooks/useAuth";

/**
 * Logout functionality
 */
export function Logout() {  
    const { user, onLogout } = useAuth();

    // Submit logout to API
    const authLogout = async () => {
      mapsApiClient.post<any>("/logout", {})
        .then(function (logoutResponse: any) {
          console.log('API auth logout response:', logoutResponse);
          onLogout();
        })
        .catch(function (error) {
          console.log('API auth logout error:', error);
        });
    };

    if (user) {
      authLogout();
    }

    return <Navigate to="/login" />;
}