import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute() {
    const { session, isAdmin, loading } = useAuth();
    if (loading) return <div className="p-10">Loading...</div>;
    if (!session) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/" replace />;
    return <Outlet />;
}