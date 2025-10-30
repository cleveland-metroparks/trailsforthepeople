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
          onLogout();
        })
        .catch(function (error) {
          console.error('API auth logout error:', error);
        });
    };

    if (user) {
      authLogout();
    }

    return <Navigate to="/login" />;
}