import { useOutlet } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth";

/**
 * Auth layout component.
 *
 * This component is used to wrap routes that require authentication,
 * so we can provide the auth context to those routes.
 * Necessary because we're using react-router-dom's createRoutesFromElements().
 */
export const AuthLayout = () => {
  const outlet = useOutlet();

  return (
    <AuthProvider>{outlet}</AuthProvider>
  );
};