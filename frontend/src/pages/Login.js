import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Briefcase, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    
    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                await axios.post(`${API_URL}/init-admin`);
            } catch {} 
            finally { setInitializing(false); }
        };
        init();
    }, []);

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex" data-testid="login-page">
            {/* Left - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 via-red-500 to-orange-500 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Briefcase className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h1 className="font-heading text-3xl font-bold text-white">DealCentric</h1>
                            <p className="text-red-100">Relationship-Driven Integration</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="font-heading text-5xl font-bold text-white leading-tight">
                        Where Every Deal<br />Becomes a Journey
                    </h2>
                    <p className="text-red-100 text-xl max-w-md">
                        Connect clients, agents, partners, and teams in a transparent, trust-building ecosystem.
                    </p>
                    <div className="grid grid-cols-3 gap-4 pt-6">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                            <p className="font-heading text-3xl font-bold text-white">360°</p>
                            <p className="text-red-100 text-sm">Visibility</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                            <p className="font-heading text-3xl font-bold text-white">Real-time</p>
                            <p className="text-red-100 text-sm">Updates</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                            <p className="font-heading text-3xl font-bold text-white">Trust</p>
                            <p className="text-red-100 text-sm">Built-in</p>
                        </div>
                    </div>
                </div>

                <p className="relative z-10 text-red-200 text-sm">
                    Empowering construction excellence through integration
                </p>
            </div>

            {/* Right - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-white">
                <Card className="w-full max-w-md border-0 shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-glow">
                            <Briefcase className="w-9 h-9 text-white" />
                        </div>
                        <CardTitle className="font-heading text-3xl">Welcome Back</CardTitle>
                        <CardDescription>Sign in to your workspace</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12"
                                    data-testid="email-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-12 pr-10"
                                        data-testid="password-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 btn-glow bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium"
                                disabled={loading}
                                data-testid="login-btn"
                            >
                                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs text-slate-500 text-center mb-3 font-medium">Demo Credentials</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-white rounded-lg">
                                    <span className="text-slate-600">Admin</span>
                                    <code className="text-red-600">admin@dealcentric.com / Admin@123</code>
                                </div>
                                <div className="flex justify-between p-2 bg-white rounded-lg">
                                    <span className="text-slate-600">Agent</span>
                                    <code className="text-red-600">agent@dealcentric.com / Agent@123</code>
                                </div>
                                <div className="flex justify-between p-2 bg-white rounded-lg">
                                    <span className="text-slate-600">PM</span>
                                    <code className="text-red-600">pm@dealcentric.com / PM@123</code>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
