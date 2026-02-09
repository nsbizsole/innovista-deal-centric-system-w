import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useApi = () => {
    const { token, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const headers = useCallback(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

    const handleError = useCallback((err) => {
        if (err.response?.status === 401) logout();
        const msg = err.response?.data?.detail || err.message || 'Error occurred';
        setError(msg);
        throw new Error(msg);
    }, [logout]);

    const get = useCallback(async (endpoint) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_URL}${endpoint}`, { headers: headers() });
            return res.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [headers, handleError]);

    const post = useCallback(async (endpoint, data) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}${endpoint}`, data, { headers: headers() });
            return res.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [headers, handleError]);

    const put = useCallback(async (endpoint, data) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.put(`${API_URL}${endpoint}`, data, { headers: headers() });
            return res.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [headers, handleError]);

    const del = useCallback(async (endpoint) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.delete(`${API_URL}${endpoint}`, { headers: headers() });
            return res.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [headers, handleError]);

    const upload = useCallback(async (endpoint, formData) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}${endpoint}`, formData, {
                headers: { ...headers(), 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [headers, handleError]);

    return { get, post, put, del, upload, loading, error, setError };
};
