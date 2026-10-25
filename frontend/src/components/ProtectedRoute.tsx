import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
  roles?: Role[];
}

export const ProtectedRoute = ({ children, adminOnly = false, roles }: ProtectedRouteProps) => {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/forbidden" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};
