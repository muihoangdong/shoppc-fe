import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../Common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

type Props = {
  children: JSX.Element;
};

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
