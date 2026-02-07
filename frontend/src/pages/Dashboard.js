import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
    FolderKanban,
    DollarSign,
    AlertTriangle,
    CheckCircle2,
    Clock,
    TrendingUp,
    Users,
    FileText,
    Plus,
    ArrowRight,
    Activity
} from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusClass, truncateText } from '../lib/utils';
import { toast } from 'sonner';

export default function Dashboard() {
    const { user, isAdmin, isProjectManager, isClient, canManageProjects } = useAuth();
    const { get, loading } = useApi();
    const [stats, setStats] = useState(null);
    const [projects, setProjects] = useState([]);
    const [activities, setActivities] = useState([]);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, projectsData, activitiesData, summaryData] = await Promise.all([
                    get('/dashboard/stats'),
                    get('/projects'),
                    get('/dashboard/recent-activities'),
                    get('/dashboard/project-summary')
                ]);
                setStats(statsData);
                setProjects(projectsData.slice(0, 5));
                setActivities(activitiesData);
                setSummary(summaryData);
            } catch (error) {
                toast.error('Failed to load dashboard data');
            }
        };
        fetchData();
    }, [get]);

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="red-fade-bg min-h-screen" data-testid="dashboard-page">
            <Header
                title={`${getWelcomeMessage()}, ${user?.name?.split(' ')[0]}`}
                subtitle={isClient ? 'View your project updates' : 'Here\'s what\'s happening with your projects'}
                actions={
                    canManageProjects && (
                        <Link to="/projects/new">
                            <Button className="btn-glow bg-red-500 hover:bg-red-600" data-testid="new-project-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                New Project
                            </Button>
                        </Link>
                    )
                }
            />

            <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="kpi-card" data-testid="stat-total-projects">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="kpi-label">Total Projects</p>
                                    <p className="kpi-value">{stats?.total_projects || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <FolderKanban className="w-6 h-6 text-red-500" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    {stats?.active_projects || 0} Active
                                </Badge>
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                    {stats?.completed_projects || 0} Completed
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card" data-testid="stat-budget">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="kpi-label">Total Budget</p>
                                    <p className="kpi-value">{formatCurrency(stats?.total_budget || 0)}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-500">Spent</span>
                                    <span className="font-medium">{formatCurrency(stats?.total_actuals || 0)}</span>
                                </div>
                                <Progress 
                                    value={stats?.total_budget ? (stats.total_actuals / stats.total_budget) * 100 : 0} 
                                    className="h-2"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card" data-testid="stat-pending">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="kpi-label">Pending Approvals</p>
                                    <p className="kpi-value">{stats?.pending_approvals || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-yellow-500" />
                                </div>
                            </div>
                            {(isAdmin || isProjectManager) && stats?.pending_approvals > 0 && (
                                <Link to="/change-orders" className="mt-4 text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
                                    Review pending items <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="kpi-card" data-testid="stat-overdue">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="kpi-label">Overdue Tasks</p>
                                    <p className="kpi-value text-red-500">{stats?.overdue_tasks || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                            </div>
                            {stats?.overdue_tasks > 0 && (
                                <p className="mt-4 text-sm text-gray-500">
                                    Requires immediate attention
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Projects */}
                    <div className="lg:col-span-2">
                        <Card className="card-hover" data-testid="recent-projects">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="font-heading text-xl">Recent Projects</CardTitle>
                                <Link to="/projects">
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                                        View All <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="spinner"></div>
                                    </div>
                                ) : projects.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No projects yet</p>
                                        {canManageProjects && (
                                            <Link to="/projects/new">
                                                <Button className="mt-4 btn-glow bg-red-500 hover:bg-red-600">
                                                    Create First Project
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {projects.map((project) => (
                                            <Link
                                                key={project.id}
                                                to={`/projects/${project.id}`}
                                                className="block p-4 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50/50 transition-colors"
                                                data-testid={`project-card-${project.id}`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                                                        <p className="text-sm text-gray-500">{truncateText(project.description, 60)}</p>
                                                    </div>
                                                    <Badge className={getStatusClass(project.status)}>
                                                        {project.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>{formatCurrency(project.approved_value)}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Activity className="w-4 h-4" />
                                                            {project.progress_percentage}%
                                                        </span>
                                                    </div>
                                                    <Progress value={project.progress_percentage} className="w-24 h-2" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Activity Feed */}
                    <div>
                        <Card className="card-hover" data-testid="activity-feed">
                            <CardHeader>
                                <CardTitle className="font-heading text-xl">Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activities.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No recent activity</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activities.slice(0, 8).map((activity, index) => (
                                            <div key={activity.id || index} className="flex gap-3">
                                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Activity className="w-4 h-4 text-red-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                                                    <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Project Summary */}
                        {summary && (
                            <Card className="card-hover mt-6" data-testid="project-summary">
                                <CardHeader>
                                    <CardTitle className="font-heading text-xl">Project Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Object.entries(summary.by_status || {}).map(([status, count]) => (
                                            <div key={status} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 capitalize">{status}</span>
                                                <Badge className={getStatusClass(status)}>{count}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
