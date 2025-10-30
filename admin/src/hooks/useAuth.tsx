import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";

const AuthContext = createContext(null);

/**
 * Auth provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage("user", null);
  const navigate = useNavigate();

  const skipLogin = (process.env.REACT_APP_SKIP_LOGIN || "").toLowerCase() === "true";

  // call this function when you want to authenticate the user
  const onLogin = useCallback(async (data) => {
    setUser(data);
    navigate("/");
  }, [navigate, setUser]);

  // call this function to sign out logged in user
  const onLogout = useCallback(async () => {
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate, setUser]);

  const value = useMemo(
    () => ({
      user,
      onLogin,
      onLogout
    }),
    [user, onLogin, onLogout]
  );

  // If skipping login is enabled, ensure a default user is present
  useEffect(() => {
    if (skipLogin && !user) {
      setUser("dev");
    }
  }, [skipLogin, user, setUser]);

  return <AuthContext.Provider value={value}>
           {children}
         </AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  return useContext(AuthContext);
};