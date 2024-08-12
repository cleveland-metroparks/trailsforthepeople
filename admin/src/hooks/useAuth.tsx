import { createContext, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";

const AuthContext = createContext(null);

/**
 * Auth provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage("user", null);
  const navigate = useNavigate();

  // call this function when you want to authenticate the user
  const onLogin = async (data) => {
    console.log('onLogin() data:', data);
    setUser(data);
    navigate("/");
  };

  // call this function to sign out logged in user
  const onLogout = async () => {
    console.log('onLogout()');
    setUser(null);
    navigate("/login", { replace: true });
  };

  const value = useMemo(
    () => ({
      user,
      onLogin,
      onLogout
    }),
    [user]
  );

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