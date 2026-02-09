import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('dc_token'));
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('dc_token');
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
                const res = await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data);
            } catch {
                logout();
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [token, logout]);

    const login = async (email, password) => {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem('dc_token', newToken);
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    // Role helpers
    const role = user?.role;
    const isAdmin = role === 'admin';
    const isPM = role === 'project_manager';
    const isAgent = role === 'sales_agent';
    const isPartner = role === 'partner';
    const isSupervisor = role === 'supervisor';
    const isFabricator = role === 'fabricator';
    const isClient = role === 'client_b2b' || role === 'client_residential';

    return (
        <AuthContext.Provider value={{
            user, token, loading, login, logout,
            isAdmin, isPM, isAgent, isPartner, isSupervisor, isFabricator, isClient, role
        }}>
            {children}
        </AuthContext.Provider>
    );
};
