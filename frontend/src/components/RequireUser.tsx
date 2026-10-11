import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireUser() {
    const { session, loading } = useAuth();
    const location = useLocation();
    if (loading) return <div className="p-10 text-center text-muted">Loading...</div>;
    if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    return <Outlet />;
}