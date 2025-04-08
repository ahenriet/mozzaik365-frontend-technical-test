import { jwtDecode } from "jwt-decode";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type AuthenticationState =
  | {
    isAuthenticated: true;
    token: string;
    userId: string;
  }
  | {
    isAuthenticated: false;
  };

export type Authentication = {
  state: AuthenticationState;
  authenticate: (token: string) => void;
  signout: () => void;
};

export const AuthenticationContext = createContext<Authentication | undefined>(
  undefined,
);

const isTokenValid = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return Date.now() < exp * 1000;
  } catch {
    return false;
  }
};

export const AuthenticationProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [state, setState] = useState<AuthenticationState>(() => {
    const token = localStorage.getItem("authToken");
    if (token && isTokenValid(token)) {
      const userId = jwtDecode<{ id: string }>(token).id;
      return { isAuthenticated: true, token, userId };
    }
    return { isAuthenticated: false };
  });

  const authenticate = useCallback(
    (token: string) => {
      const userId = jwtDecode<{ id: string }>(token).id;
      setState({ isAuthenticated: true, token, userId });
      localStorage.setItem("authToken", token); // Persist token
    },
    [setState],
  );

  const signout = useCallback(() => {
    setState({ isAuthenticated: false });
    localStorage.removeItem("authToken"); // Clear token
  }, [setState]);

  const contextValue = useMemo(
    () => ({ state, authenticate, signout }),
    [state, authenticate, signout],
  );

  return (
    <AuthenticationContext.Provider value={contextValue}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export function useAuthentication() {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error(
      "useAuthentication must be used within an AuthenticationProvider",
    );
  }
  return context;
}

export function useAuthToken() {
  const { state } = useAuthentication();
  if (!state.isAuthenticated) {
    throw new Error("User is not authenticated");
  }
  return state.token;
}
