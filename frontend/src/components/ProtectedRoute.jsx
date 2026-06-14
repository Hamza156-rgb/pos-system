import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, adminOnly = false, superadminOnly = false, perm }) {
  const { isAuthenticated, isAdmin, isSuperadmin, can } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  // Super-admins only belong in the platform (Shops) area.
  if (superadminOnly && !isSuperadmin) return <Navigate to="/" replace />;
  if (perm && isSuperadmin) return <Navigate to="/tenants" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (perm && !can(perm)) return <Navigate to="/" replace />;
  return children;
}
