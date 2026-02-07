import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    Plus,
    Search,
    Filter,
    FolderKanban,
    Calendar,
    DollarSign,
    Activity,
    MoreVertical,
    Eye
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { formatCurrency, formatDate, getStatusClass, getServiceDisplayName } from '../lib/utils';
import { toast } from 'sonner';

export default function Projects() {
    const { canManageProjects } = useAuth();
    const { get, loading } = useApi();
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await get('/projects');
                setProjects(data);
                setFilteredProjects(data);
            } catch (error) {
                toast.error('Failed to load projects');
            }
        };
        fetchProjects();
    }, [get]);

    useEffect(() => {
        let filtered = projects;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        if (serviceFilter !== 'all') {
            filtered = filtered.filter(p => p.service_types?.includes(serviceFilter));
        }

        setFilteredProjects(filtered);
    }, [searchTerm, statusFilter, serviceFilter, projects]);

    const statuses = ['planning', 'procurement', 'fabrication', 'installation', 'handover', 'closed'];
    const services = ['aluminum_fab', 'steel_fab', 'interior', 'construction', 'renovation'];

    return (
        <div className="red-fade-bg min-h-screen" data-testid="projects-page">
            <Header
                title="Projects"
                subtitle={`${filteredProjects.length} projects found`}
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

            <div className="p-6">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                    data-testid="search-projects"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {statuses.map(status => (
                                        <SelectItem key={status} value={status} className="capitalize">
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={serviceFilter} onValueChange={setServiceFilter}>
                                <SelectTrigger className="w-full md:w-48" data-testid="service-filter">
                                    <SelectValue placeholder="Service Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Services</SelectItem>
                                    {services.map(service => (
                                        <SelectItem key={service} value={service}>
                                            {getServiceDisplayName(service)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Projects Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="spinner"></div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
                            <p className="text-gray-500 mb-4">
                                {projects.length === 0
                                    ? 'Get started by creating your first project'
                                    : 'Try adjusting your filters'}
                            </p>
                            {canManageProjects && projects.length === 0 && (
                                <Link to="/projects/new">
                                    <Button className="btn-glow bg-red-500 hover:bg-red-600">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Project
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <Card key={project.id} className="card-hover overflow-hidden" data-testid={`project-card-${project.id}`}>
                                <CardContent className="p-0">
                                    {/* Card Header */}
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-start justify-between mb-2">
                                            <Badge className={getStatusClass(project.status)}>
                                                {project.status}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link to={`/projects/${project.id}`}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <h3 className="font-heading text-lg font-semibold text-gray-900 mb-1">
                                            {project.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {project.description || 'No description'}
                                        </p>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 space-y-4">
                                        {/* Services */}
                                        <div className="flex flex-wrap gap-1">
                                            {project.service_types?.map(service => (
                                                <Badge key={service} variant="secondary" className="text-xs">
                                                    {getServiceDisplayName(service)}
                                                </Badge>
                                            ))}
                                        </div>

                                        {/* Progress */}
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-gray-500">Progress</span>
                                                <span className="font-medium">{project.progress_percentage}%</span>
                                            </div>
                                            <Progress value={project.progress_percentage} className="h-2" />
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <DollarSign className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">{formatCurrency(project.approved_value)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">{formatDate(project.end_date)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                        <Link to={`/projects/${project.id}`}>
                                            <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                                                View Project Details
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
