import { type ReactNode } from "react";
import { ClipLoader } from "react-spinners";
import { useAuth } from "../../utils/context/AuthContext";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";

interface ProtectedRouteProps {
  children: ReactNode;
  authRequired?: boolean;
  redirectPath?: string;
}

const ProtectedRoute = ({
  children,
  authRequired = true,
  redirectPath,
}: ProtectedRouteProps) => {
  const { isLoading, user } = useAuth();
  const { token } = useSelector((state: RootState) => state.auth);

  const redirectTo = redirectPath
    ? redirectPath
    : authRequired
    ? "/login"
    : "/";

  if (authRequired && token && !user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <ClipLoader size={22} color="#0ea5e9" />
          <span>Checking authentication...</span>
        </div>
      </div>
    );

  if (authRequired && !token && !isLoading) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
