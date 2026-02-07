import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f2eb] flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden mx-auto mb-4 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-white to-blue-100" />
          </div>
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
