import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";

import { mapsApiClient } from "../components/mapsApi";
import type { User } from "../types/user";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  onLogin: (user: User) => void;
  onLogout: () => Promise<void> | void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: "loading",
  onLogin: () => {},
  onLogout: () => {},
});

const skipLogin =
  (import.meta.env.VITE_SKIP_LOGIN || "").toLowerCase() === "true";

// Synthetic user used only when auth is bypassed for local development.
const DEV_USER: User = {
  id: 0,
  name: "Developer",
  username: "dev",
  email: null,
  email_verified_at: null,
  created_at: "",
  updated_at: "",
  guid: null,
  domain: null,
};

/**
 * Auth provider component.
 *
 * The Laravel Sanctum HttpOnly session cookie is the single source of truth for
 * whether the user is authenticated. On mount we validate that session against
 * the server ("who am I") rather than trusting any client-side mirror, which
 * keeps the React app from drifting out of sync with the real session.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(skipLogin ? DEV_USER : null);
  const [status, setStatus] = useState<AuthStatus>(
    skipLogin ? "authenticated" : "loading"
  );

  // Boot-time session check: ask the server who we are. A 401 (or network
  // failure) simply means we're anonymous — a normal, expected outcome.
  useEffect(() => {
    if (skipLogin) {
      return;
    }

    let cancelled = false;

    mapsApiClient
      .get<User>(import.meta.env.VITE_MAPS_API_BASE_PATH + "/user", {
        // Don't let the 401 response interceptor hard-redirect on this probe;
        // an unauthenticated boot is handled by routing, not a page reload.
        skipAuthRedirect: true,
      })
      .then((response) => {
        if (cancelled) return;
        setUser(response.data);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus("anonymous");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Call this once login has succeeded, with the real user object.
  const onLogin = useCallback(
    (loggedInUser: User) => {
      setUser(loggedInUser);
      setStatus("authenticated");
      navigate("/");
    },
    [navigate]
  );

  // Call this to clear local auth state after signing out.
  const onLogout = useCallback(async () => {
    setUser(null);
    setStatus("anonymous");
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({ user, status, onLogin, onLogout }),
    [user, status, onLogin, onLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
