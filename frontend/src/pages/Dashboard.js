import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
    Briefcase, DollarSign, TrendingUp, Users, Clock, CheckCircle2,
    ArrowRight, Plus, Target, Zap, Award, Building, Hammer, Eye
} from 'lucide-react';
import { formatCurrency, formatDateTime, stageColors, getStageLabel, truncate } from '../lib/utils';
import { toast } from 'sonner';

// Different dashboard components for each role
const AdminDashboard = ({ stats, deals, pipeline }) => (
    <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-red-500 to-orange-500 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Total Deals</p>
                            <p className="text-4xl font-heading font-bold">{stats?.total_deals || 0}</p>
                        </div>
                        <Briefcase className="w-12 h-12 text-white/30" />
                    </div>
                    <p className="mt-2 text-sm text-red-100">{stats?.active_deals || 0} active</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Pipeline Value</p>
                            <p className="text-4xl font-heading font-bold">{formatCurrency(stats?.total_pipeline_value)}</p>
                        </div>
                        <DollarSign className="w-12 h-12 text-white/30" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Sales Agents</p>
                            <p className="text-4xl font-heading font-bold">{stats?.total_agents || 0}</p>
                        </div>
                        <Users className="w-12 h-12 text-white/30" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-violet-500 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Pending Approvals</p>
                            <p className="text-4xl font-heading font-bold">{stats?.pending_approvals || 0}</p>
                        </div>
                        <Clock className="w-12 h-12 text-white/30" />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Pipeline & Recent Deals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-heading">Deal Pipeline</CardTitle>
                    <Link to="/pipeline"><Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {pipeline?.slice(0, 6).map((stage) => (
                            <div key={stage.stage} className="flex items-center gap-3">
                                <Badge className={stageColors[stage.stage]}>{getStageLabel(stage.stage)}</Badge>
                                <div className="flex-1">
                                    <Progress value={(stage.count / (stats?.total_deals || 1)) * 100} className="h-2" />
                                </div>
                                <span className="text-sm font-medium w-8">{stage.count}</span>
                                <span className="text-sm text-slate-500 w-24 text-right">{formatCurrency(stage.value)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-heading">Recent Deals</CardTitle>
                    <Link to="/deals"><Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {deals?.slice(0, 5).map((deal) => (
                            <Link key={deal.id} to={`/deals/${deal.id}`} className="block p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{deal.name}</p>
                                        <p className="text-sm text-slate-500">{deal.client_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={stageColors[deal.stage]}>{getStageLabel(deal.stage)}</Badge>
                                        <p className="text-sm font-medium mt-1">{formatCurrency(deal.contract_value || deal.estimated_value)}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);

const AgentDashboard = ({ stats, deals }) => (
    <div className="space-y-6">
        {/* Agent KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">My Deals</p>
                            <p className="text-4xl font-heading font-bold">{stats?.total_deals || 0}</p>
                        </div>
                        <Briefcase className="w-12 h-12 text-white/30" />
                    </div>
                    <p className="mt-2 text-sm text-green-100">{stats?.active_deals || 0} active</p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-sm">Deals Won</p>
                            <p className="text-4xl font-heading font-bold">{stats?.deals_won || 0}</p>
                        </div>
                        <Award className="w-12 h-12 text-white/30" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Commission Earned</p>
                            <p className="text-4xl font-heading font-bold">{formatCurrency(stats?.total_commission_earned)}</p>
                        </div>
                        <DollarSign className="w-12 h-12 text-white/30" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-violet-500 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Pending Commission</p>
                            <p className="text-4xl font-heading font-bold">{formatCurrency(stats?.commission_pending)}</p>
                        </div>
                        <Clock className="w-12 h-12 text-white/30" />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* My Deals */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading">My Deals</CardTitle>
                <Link to="/deals/new"><Button className="btn-glow bg-gradient-to-r from-green-500 to-emerald-500"><Plus className="w-4 h-4 mr-2" /> New Referral</Button></Link>
            </CardHeader>
            <CardContent>
                {deals?.length === 0 ? (
                    <div className="text-center py-12">
                        <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Start referring deals to see them here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deals?.map((deal) => (
                            <Link key={deal.id} to={`/deals/${deal.id}`} className="block p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50/30 transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-lg">{deal.name}</p>
                                        <p className="text-slate-500">{deal.client_name} • {deal.client_type}</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={stageColors[deal.stage]}>{getStageLabel(deal.stage)}</Badge>
                                        <p className="text-lg font-bold mt-1">{formatCurrency(deal.contract_value || deal.estimated_value)}</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-slate-500">Progress</span>
                                        <span className="font-medium">{deal.progress_percentage || 0}%</span>
                                    </div>
                                    <Progress value={deal.progress_percentage || 0} className="h-2" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
);

const ClientDashboard = ({ stats, deals }) => (
    <div className="space-y-6">
        {/* Client Welcome */}
        <Card className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white border-0">
            <CardContent className="p-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Eye className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="font-heading text-3xl font-bold">Your Projects</h2>
                        <p className="text-teal-100 mt-1">Track progress, view documents, and stay informed</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                        <p className="text-3xl font-heading font-bold">{stats?.my_projects || 0}</p>
                        <p className="text-teal-100 text-sm">Total Projects</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                        <p className="text-3xl font-heading font-bold">{stats?.in_progress || 0}</p>
                        <p className="text-teal-100 text-sm">In Progress</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                        <p className="text-3xl font-heading font-bold">{stats?.completed || 0}</p>
                        <p className="text-teal-100 text-sm">Completed</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Projects */}
        <Card>
            <CardHeader>
                <CardTitle className="font-heading">Your Projects</CardTitle>
            </CardHeader>
            <CardContent>
                {deals?.length === 0 ? (
                    <div className="text-center py-12">
                        <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No projects yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deals?.map((deal) => (
                            <Link key={deal.id} to={`/deals/${deal.id}`} className="block p-5 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-heading text-xl font-semibold">{deal.name}</h3>
                                        <p className="text-slate-500">{truncate(deal.description, 80)}</p>
                                    </div>
                                    <Badge className={`${stageColors[deal.stage]} px-3 py-1`}>{getStageLabel(deal.stage)}</Badge>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-slate-500">Project Progress</span>
                                        <span className="font-semibold text-teal-600">{deal.progress_percentage || 0}%</span>
                                    </div>
                                    <Progress value={deal.progress_percentage || 0} className="h-3" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
);

const PMDashboard = ({ stats, deals }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
                <CardContent className="p-6">
                    <p className="text-blue-100 text-sm">Assigned Deals</p>
                    <p className="text-4xl font-heading font-bold">{stats?.assigned_deals || 0}</p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white border-0">
                <CardContent className="p-6">
                    <p className="text-orange-100 text-sm">In Execution</p>
                    <p className="text-4xl font-heading font-bold">{stats?.in_execution || 0}</p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-500 to-green-500 text-white border-0">
                <CardContent className="p-6">
                    <p className="text-emerald-100 text-sm">Pending Handover</p>
                    <p className="text-4xl font-heading font-bold">{stats?.pending_handover || 0}</p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500 to-rose-500 text-white border-0">
                <CardContent className="p-6">
                    <p className="text-red-100 text-sm">Overdue Tasks</p>
                    <p className="text-4xl font-heading font-bold">{stats?.overdue_tasks || 0}</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading">My Projects</CardTitle>
                <Link to="/deals"><Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {deals?.map((deal) => (
                        <Link key={deal.id} to={`/deals/${deal.id}`} className="block p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{deal.name}</p>
                                    <p className="text-sm text-slate-500">{deal.client_name}</p>
                                </div>
                                <div className="text-right">
                                    <Badge className={stageColors[deal.stage]}>{getStageLabel(deal.stage)}</Badge>
                                    <Progress value={deal.progress_percentage || 0} className="h-2 w-24 mt-2" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
);

const OperationalDashboard = ({ stats, role }) => (
    <div className="space-y-6">
        <Card className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white border-0">
            <CardContent className="p-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Hammer className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="font-heading text-3xl font-bold">
                            {role === 'supervisor' ? 'Site Overview' : 'My Jobs'}
                        </h2>
                        <p className="text-amber-100 mt-1">Quick access to your assignments</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                        <p className="text-3xl font-heading font-bold">{stats?.assigned_jobs || stats?.assigned_sites || 0}</p>
                        <p className="text-amber-100 text-sm">Assigned</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                        <p className="text-3xl font-heading font-bold">{stats?.pending_jobs || stats?.pending_updates || 0}</p>
                        <p className="text-amber-100 text-sm">Pending</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);

export default function Dashboard() {
    const { user, isAdmin, isPM, isAgent, isClient, isSupervisor, isFabricator, isPartner, role } = useAuth();
    const { get } = useApi();
    const [stats, setStats] = useState(null);
    const [deals, setDeals] = useState([]);
    const [pipeline, setPipeline] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, dealsData] = await Promise.all([
                    get('/dashboard/stats'),
                    get('/deals')
                ]);
                setStats(statsData);
                setDeals(dealsData);

                if (isAdmin || isPM) {
                    const pipelineData = await get('/dashboard/pipeline');
                    setPipeline(pipelineData);
                }
            } catch (error) {
                toast.error('Failed to load dashboard');
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="min-h-screen bg-slate-50" data-testid="dashboard">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-slate-900">
                            {getGreeting()}, {user?.name?.split(' ')[0]}
                        </h1>
                        <p className="text-slate-500">Here's what's happening today</p>
                    </div>
                    {(isAdmin || isPM || isAgent) && (
                        <Link to="/deals/new">
                            <Button className="btn-glow bg-gradient-to-r from-red-500 to-orange-500">
                                <Plus className="w-4 h-4 mr-2" /> New Deal
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {isAdmin && <AdminDashboard stats={stats} deals={deals} pipeline={pipeline} />}
                {isAgent && <AgentDashboard stats={stats} deals={deals} />}
                {isClient && <ClientDashboard stats={stats} deals={deals} />}
                {isPM && <PMDashboard stats={stats} deals={deals} />}
                {(isSupervisor || isFabricator) && <OperationalDashboard stats={stats} role={role} />}
                {isPartner && <PMDashboard stats={stats} deals={deals} />}
            </div>
        </div>
    );
}
