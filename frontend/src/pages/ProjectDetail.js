import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    ArrowLeft,
    Edit,
    Calendar,
    DollarSign,
    Users,
    FileText,
    ClipboardList,
    MessageSquare,
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Trash2
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, getStatusClass, getServiceDisplayName } from '../lib/utils';
import { toast } from 'sonner';
import GanttChart from '../components/GanttChart';
import TaskList from '../components/TaskList';
import DocumentList from '../components/DocumentList';
import FinancialSummary from '../components/FinancialSummary';
import ProgressLogs from '../components/ProgressLogs';
import ProjectMessages from '../components/ProjectMessages';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin, isProjectManager, canManageProjects, canApprove } = useAuth();
    const { get, put, del, loading } = useApi();
    
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const [projectData, tasksData] = await Promise.all([
                    get(`/projects/${id}`),
                    get(`/tasks?project_id=${id}`)
                ]);
                setProject(projectData);
                setTasks(tasksData);
            } catch (error) {
                toast.error('Failed to load project');
                navigate('/projects');
            }
        };
        fetchProject();
    }, [id, get, navigate]);

    const handleStatusChange = async (newStatus) => {
        try {
            await put(`/projects/${id}`, { status: newStatus });
            setProject({ ...project, status: newStatus });
            toast.success('Project status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }
        try {
            await del(`/projects/${id}`);
            toast.success('Project deleted');
            navigate('/projects');
        } catch (error) {
            toast.error('Failed to delete project');
        }
    };

    if (loading || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="spinner"></div>
            </div>
        );
    }

    const statuses = ['planning', 'procurement', 'fabrication', 'installation', 'handover', 'closed'];

    return (
        <div className="red-fade-bg min-h-screen" data-testid="project-detail-page">
            <Header
                title={project.name}
                subtitle={`Project ID: ${project.id.slice(0, 8)}...`}
                actions={
                    <div className="flex items-center gap-3">
                        {canManageProjects && (
                            <Select value={project.status} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-40" data-testid="status-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map(status => (
                                        <SelectItem key={status} value={status} className="capitalize">
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {isAdmin && (
                            <Button variant="destructive" size="icon" onClick={handleDelete} data-testid="delete-project-btn">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => navigate('/projects')} data-testid="back-btn">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </div>
                }
            />

            <div className="p-6">
                {/* Project Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Progress</p>
                                    <p className="font-heading text-2xl font-bold">{project.progress_percentage}%</p>
                                </div>
                            </div>
                            <Progress value={project.progress_percentage} className="mt-3 h-2" />
                        </CardContent>
                    </Card>

                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Budget</p>
                                    <p className="font-heading text-2xl font-bold">{formatCurrency(project.budget)}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Spent: {formatCurrency(project.actuals)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Timeline</p>
                                    <p className="font-heading text-lg font-bold">{formatDate(project.start_date)}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                End: {formatDate(project.end_date)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusClass(project.status)}`}>
                                    {project.status === 'closed' ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <Clock className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <Badge className={`${getStatusClass(project.status)} font-heading text-lg capitalize`}>
                                        {project.status}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="bg-white border border-gray-200 p-1">
                        <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                        <TabsTrigger value="gantt" data-testid="tab-gantt">Gantt Chart</TabsTrigger>
                        <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
                        <TabsTrigger value="financials" data-testid="tab-financials">Financials</TabsTrigger>
                        <TabsTrigger value="progress" data-testid="tab-progress">Progress Logs</TabsTrigger>
                        <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-heading">Project Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Description</p>
                                        <p className="mt-1">{project.description || 'No description provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Client Type</p>
                                        <p className="mt-1 capitalize">{project.client_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Services</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {project.service_types?.map(service => (
                                                <Badge key={service} variant="secondary">
                                                    {getServiceDisplayName(service)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Created</p>
                                        <p className="mt-1">{formatDateTime(project.created_at)}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-heading">Financial Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Approved Value</span>
                                        <span className="font-semibold">{formatCurrency(project.approved_value)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Budget</span>
                                        <span className="font-semibold">{formatCurrency(project.budget)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Actuals</span>
                                        <span className="font-semibold">{formatCurrency(project.actuals)}</span>
                                    </div>
                                    <hr />
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Variance</span>
                                        <span className={`font-semibold ${(project.budget - project.actuals) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(project.budget - project.actuals)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="gantt">
                        <GanttChart projectId={id} tasks={tasks} />
                    </TabsContent>

                    <TabsContent value="tasks">
                        <TaskList projectId={id} tasks={tasks} setTasks={setTasks} canManage={canManageProjects} />
                    </TabsContent>

                    <TabsContent value="documents">
                        <DocumentList projectId={id} canApprove={canApprove} />
                    </TabsContent>

                    <TabsContent value="financials">
                        <FinancialSummary projectId={id} canManage={canManageProjects} />
                    </TabsContent>

                    <TabsContent value="progress">
                        <ProgressLogs projectId={id} />
                    </TabsContent>

                    <TabsContent value="messages">
                        <ProjectMessages projectId={id} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
