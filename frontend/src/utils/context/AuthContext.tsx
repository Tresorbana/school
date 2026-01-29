import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import type { AuthUser } from "../../store/slices/authSlice";
import { setUser as setReduxUser, logout as reduxLogout, clearAuth } from "../../store/slices/authSlice";
import { useMeQuery } from "../../store/api/authApi";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshSession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Fetch user data from /api/me on every page reload when token exists
  const { data: meData, error: meError, isLoading: meLoading } = useMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  // Update user state when me query succeeds
  useEffect(() => {
    if (meData && token) {
      const userWithRoles: AuthUser = {
        id: meData.id,
        first_name: meData.first_name,
        last_name: meData.last_name,
        email: meData.email,
        role: meData.roles.length > 0 ? meData.roles[0].name : 'inactive',
        role_id: meData.roles.length > 0 ? meData.roles[0].id : ''
      };
      dispatch(setReduxUser(userWithRoles));
    } else if (meError && token) {
      console.error('Me query failed:', meError);
      dispatch(clearAuth());
    }
  }, [meData, meError, token, dispatch]);

  const refreshSession = useCallback(async () => {
    return !!token;
  }, [token]);

  const logout = useCallback(async () => {
    dispatch(reduxLogout());
    localStorage.clear();
  }, [dispatch]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading: meLoading,
    isAuthenticated: isAuthenticated && !!user && user.role !== 'inactive',
    setUser: (userData: AuthUser | null) => dispatch(setReduxUser(userData)),
    refreshSession,
    logout,
  }), [user, isAuthenticated, meLoading, dispatch, refreshSession, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}