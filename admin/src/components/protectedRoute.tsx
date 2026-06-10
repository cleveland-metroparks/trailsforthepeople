import { Navigate } from "react-router";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";

/**
 * Protected route component.
 *
 * Gates a route on the server-validated auth status:
 * - while the boot-time session check is in flight, show a spinner
 * - if anonymous, redirect to /login
 * - if authenticated (or dev bypass, which resolves to authenticated), render
 */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  }

  return children;
};
