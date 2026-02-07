import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { DollarSign, TrendingUp, Activity, FolderKanban } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export default function Reports() {
    const { get, loading } = useApi();
    const [projects, setProjects] = useState([]);
    const [financials, setFinancials] = useState([]);
    const [summary, setSummary] = useState(null);

    const COLORS = ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projectsData, summaryData] = await Promise.all([
                get('/projects'),
                get('/dashboard/project-summary')
            ]);
            setProjects(projectsData);
            setSummary(summaryData);
        } catch (error) {
            toast.error('Failed to load reports data');
        }
    };

    // Process data for charts
    const statusData = summary?.by_status
        ? Object.entries(summary.by_status).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        : [];

    const serviceData = summary?.by_service
        ? Object.entries(summary.by_service).map(([name, value]) => ({
            name: name.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            value
        }))
        : [];

    const financialData = projects.slice(0, 10).map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        budget: p.budget,
        actuals: p.actuals
    }));

    const progressData = projects.slice(0, 10).map(p => ({
        name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
        progress: p.progress_percentage
    }));

    // Summary stats
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalActuals = projects.reduce((sum, p) => sum + (p.actuals || 0), 0);
    const avgProgress = projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length)
        : 0;

    return (
        <div className="red-fade-bg min-h-screen" data-testid="reports-page">
            <Header
                title="Reports & Analytics"
                subtitle="Project performance insights"
            />

            <div className="p-6 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <FolderKanban className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Projects</p>
                                    <p className="font-heading text-2xl font-bold">{projects.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Budget</p>
                                    <p className="font-heading text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Spent</p>
                                    <p className="font-heading text-2xl font-bold">{formatCurrency(totalActuals)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Avg Progress</p>
                                    <p className="font-heading text-2xl font-bold">{avgProgress}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Projects by Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Projects by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {statusData.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Projects by Service Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Projects by Service Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {serviceData.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={serviceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#DC2626" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Budget vs Actuals */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Budget vs Actuals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {financialData.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={financialData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Bar dataKey="budget" fill="#DC2626" name="Budget" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="actuals" fill="#10B981" name="Actuals" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Project Progress */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Project Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {progressData.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={progressData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                                        <Tooltip formatter={(value) => `${value}%`} />
                                        <Bar dataKey="progress" fill="#DC2626" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
