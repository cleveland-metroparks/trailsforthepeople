import { Navigate } from "react-router";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "../hooks/useAuth";
import { isGisUser } from "../types/user";

/**
 * Protected route component.
 *
 * Gates a route on the server-validated auth status:
 * - while the boot-time session check is in flight, show a spinner
 * - if anonymous, redirect to /login
 * - if authenticated (or dev bypass, which resolves to authenticated), render
 * - if requireGis and the user is Fulcrum-only, redirect to /fulcrum
 */
export const ProtectedRoute = ({
  children,
  requireGis = false,
}: {
  children: React.ReactNode;
  requireGis?: boolean;
}) => {
  const { status, user } = useAuth();

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

  if (requireGis && !isGisUser(user)) {
    return <Navigate to="/fulcrum" replace />;
  }

  return children;
};
