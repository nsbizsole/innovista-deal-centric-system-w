import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '../lib/utils';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Initialize admin on first load
    useEffect(() => {
        const initAdmin = async () => {
            try {
                await axios.post(`${API_URL}/init-admin`);
            } catch (error) {
                console.log('Admin init check completed');
            } finally {
                setInitializing(false);
            }
        };
        initAdmin();
    }, []);

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-gray-500">Initializing system...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex red-fade-bg" data-testid="login-page">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-500 to-red-700 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-red-500" />
                        </div>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-white">ProCon PMS</h1>
                            <p className="text-red-100 text-sm">Construction Management</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <h2 className="font-heading text-4xl font-bold text-white mb-4">
                        Streamline Your Construction Projects
                    </h2>
                    <p className="text-red-100 text-lg mb-8">
                        Manage aluminum/steel fabrication, interior design, construction, and renovation projects with complete control and transparency.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <p className="font-heading text-3xl font-bold text-white">100%</p>
                            <p className="text-red-100 text-sm">Project Visibility</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <p className="font-heading text-3xl font-bold text-white">Real-time</p>
                            <p className="text-red-100 text-sm">Progress Tracking</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-red-200 text-sm">
                        Trusted by construction professionals worldwide
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <Card className="w-full max-w-md border-0 shadow-xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
                            <Building2 className="w-9 h-9 text-white" />
                        </div>
                        <CardTitle className="font-heading text-2xl">Welcome Back</CardTitle>
                        <CardDescription>Sign in to access your dashboard</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@pms.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="input-glow"
                                    data-testid="email-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="input-glow pr-10"
                                        data-testid="password-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full btn-glow bg-red-500 hover:bg-red-600 text-white py-6"
                                disabled={loading}
                                data-testid="login-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 text-center mb-2">Default Admin Credentials</p>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-mono text-gray-700">admin@pms.com</p>
                                <p className="text-sm font-mono text-gray-700">Admin@123</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
