import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../lib/utils';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('pms_token'));
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('pms_token');
        setToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token, logout]);

    const login = async (email, password) => {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('pms_token', newToken);
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const isAdmin = user?.role === 'admin';
    const isProjectManager = user?.role === 'project_manager';
    const isClient = ['client_b2b', 'client_residential'].includes(user?.role);
    const isOperational = ['supervisor', 'fabricator'].includes(user?.role);
    const isAgent = ['sales_agent', 'partner'].includes(user?.role);

    const canManageProjects = isAdmin || isProjectManager;
    const canManageUsers = isAdmin;
    const canApprove = isAdmin || isProjectManager;

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAdmin,
        isProjectManager,
        isClient,
        isOperational,
        isAgent,
        canManageProjects,
        canManageUsers,
        canApprove,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
