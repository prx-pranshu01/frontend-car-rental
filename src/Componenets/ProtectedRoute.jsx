import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// ProtectedRoute.jsx
const ProtectedRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  
  return children;
};

export default ProtectedRoute;