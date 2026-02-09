import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, TrendingUp, Activity, Briefcase, Users, Award, FileText } from 'lucide-react';
import { formatCurrency, getStageLabel } from '../lib/utils';
import { toast } from 'sonner';

export default function Reports() {
    const { get, loading } = useApi();
    const [deals, setDeals] = useState([]);
    const [pipeline, setPipeline] = useState([]);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);

    const COLORS = ['#DC2626', '#EF4444', '#F97316', '#FB923C', '#FBBF24', '#34D399', '#06B6D4', '#8B5CF6', '#EC4899'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [dealsData, pipelineData, statsData, usersData] = await Promise.all([
                get('/deals'),
                get('/dashboard/pipeline'),
                get('/dashboard/stats'),
                get('/users').catch(() => [])
            ]);
            setDeals(dealsData || []);
            setPipeline(pipelineData || []);
            setStats(statsData || {});
            setUsers(usersData || []);
        } catch (error) {
            toast.error('Failed to load reports data');
        }
    };

    // Process pipeline data for chart
    const pipelineChartData = pipeline
        .filter(p => p.count > 0)
        .map(p => ({
            name: getStageLabel(p.stage),
            deals: p.count,
            value: p.value
        }));

    // Process deals by service type
    const serviceTypeData = deals.reduce((acc, deal) => {
        deal.service_types?.forEach(service => {
            const existing = acc.find(s => s.name === service);
            if (existing) {
                existing.value += 1;
            } else {
                acc.push({ name: service.replace('_', ' '), value: 1 });
            }
        });
        return acc;
    }, []);

    // Process deals by client type
    const clientTypeData = deals.reduce((acc, deal) => {
        const type = deal.client_type || 'Unknown';
        const existing = acc.find(c => c.name === type);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: type, value: 1 });
        }
        return acc;
    }, []);

    // Top deals by value
    const topDealsByValue = [...deals]
        .sort((a, b) => (b.contract_value || b.estimated_value || 0) - (a.contract_value || a.estimated_value || 0))
        .slice(0, 8)
        .map(d => ({
            name: d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name,
            value: d.contract_value || d.estimated_value || 0
        }));

    // Users by role
    const usersByRole = users.reduce((acc, user) => {
        const role = user.role?.replace('_', ' ') || 'Unknown';
        const existing = acc.find(r => r.name === role);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: role, value: 1 });
        }
        return acc;
    }, []);

    // Summary stats
    const totalPipelineValue = deals.reduce((sum, d) => sum + (d.contract_value || d.estimated_value || 0), 0);
    const activeDeals = deals.filter(d => !['completed', 'closed'].includes(d.stage)).length;
    const completedDeals = deals.filter(d => d.stage === 'completed').length;

    return (
        <div className="min-h-screen bg-slate-50" data-testid="reports-page">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                        <p className="text-slate-500">Deal performance insights</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-red-500 to-orange-500 text-white border-0">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-red-100 text-sm">Total Deals</p>
                                    <p className="font-heading text-2xl font-bold">{deals.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-green-100 text-sm">Pipeline Value</p>
                                    <p className="font-heading text-2xl font-bold">{formatCurrency(totalPipelineValue)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm">Active Deals</p>
                                    <p className="font-heading text-2xl font-bold">{activeDeals}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-violet-500 text-white border-0">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-purple-100 text-sm">Completed</p>
                                    <p className="font-heading text-2xl font-bold">{completedDeals}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Deal Pipeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Deal Pipeline by Stage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {pipelineChartData.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">No data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={pipelineChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip formatter={(value, name) => [name === 'value' ? formatCurrency(value) : value, name === 'value' ? 'Value' : 'Deals']} />
                                        <Legend />
                                        <Bar dataKey="deals" fill="#DC2626" name="Deals" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Deals by Service Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Deals by Service Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {serviceTypeData.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">No data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={serviceTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {serviceTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Deals by Value */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Top Deals by Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topDealsByValue.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">No data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={topDealsByValue} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Users by Role / Client Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-heading">Deals by Client Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {clientTypeData.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">No data available</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={clientTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {clientTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
