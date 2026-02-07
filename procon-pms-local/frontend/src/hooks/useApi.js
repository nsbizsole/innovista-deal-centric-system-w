import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const useApi = () => {
    const { token, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getHeaders = useCallback(() => {
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [token]);

    const handleError = useCallback((err) => {
        if (err.response?.status === 401) {
            logout();
        }
        const message = err.response?.data?.detail || err.message || 'An error occurred';
        setError(message);
        throw new Error(message);
    }, [logout]);

    const get = useCallback(async (endpoint) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}${endpoint}`, { headers: getHeaders() });
            return response.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [getHeaders, handleError]);

    const post = useCallback(async (endpoint, data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_URL}${endpoint}`, data, { headers: getHeaders() });
            return response.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [getHeaders, handleError]);

    const put = useCallback(async (endpoint, data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.put(`${API_URL}${endpoint}`, data, { headers: getHeaders() });
            return response.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [getHeaders, handleError]);

    const del = useCallback(async (endpoint) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.delete(`${API_URL}${endpoint}`, { headers: getHeaders() });
            return response.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [getHeaders, handleError]);

    const upload = useCallback(async (endpoint, formData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${API_URL}${endpoint}`, formData, {
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (err) {
            handleError(err);
        } finally {
            setLoading(false);
        }
    }, [getHeaders, handleError]);

    return { get, post, put, del, upload, loading, error, setError };
};
