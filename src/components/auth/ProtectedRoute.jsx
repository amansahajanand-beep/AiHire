import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getToken, getStoredUser } from '../../api/config';

/** Requires a valid login session. Redirects guests to /login. */
export default function ProtectedRoute() {
  const location = useLocation();
  const token = getToken();
  const user = getStoredUser();
  const isAuthenticated = Boolean(token && user);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
