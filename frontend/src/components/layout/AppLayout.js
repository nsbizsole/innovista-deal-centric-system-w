import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { Toaster } from '../ui/sonner';

const AppLayout = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-64">
                <Outlet />
            </main>
            <Toaster position="top-right" richColors />
        </div>
    );
};

export default AppLayout;
