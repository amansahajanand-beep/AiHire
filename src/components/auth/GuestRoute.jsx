import { Navigate, Outlet } from 'react-router-dom';
import { getToken, getStoredUser } from '../../api/config';

/** For login/register — redirects already-logged-in users to dashboard. */
export default function GuestRoute() {
  const token = getToken();
  const user = getStoredUser();
  const isAuthenticated = Boolean(token && user);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
