import { useEffect } from "react";

import { mapsApiClient } from "../components/mapsApi";
import { useAuth } from "../hooks/useAuth";

/**
 * Logout functionality
 */
export function Logout() {
  const { user, onLogout } = useAuth();

  useEffect(() => {
    if (user) {
      // Submit logout to API
      mapsApiClient
        .post<any>("/logout", {})
        .then(function (_logoutResponse: any) {
          onLogout();
        })
        .catch(function (error) {
          console.error("API auth logout error:", error);
          // Still logout locally even if API call fails
          onLogout();
        });
    } else {
      // No user, just redirect to login
      onLogout();
    }
  }, [user, onLogout]);

  // Show nothing while logout is in progress
  // onLogout() will handle navigation to /login
  return null;
}
