import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Camera, Hammer, Plus, User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Slider } from '../components/ui/slider';
import { formatDateTime, getStatusClass } from '../lib/utils';
import { toast } from 'sonner';

export default function ProgressLogsPage() {
    const { get, loading } = useApi();
    const [logs, setLogs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState({
        project_id: '',
        notes: '',
        progress_update: 0
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [logsData, projectsData] = await Promise.all([
                get('/progress-logs'),
                get('/projects')
            ]);
            setLogs(logsData);
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to load data');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.project_id) {
            toast.error('Please select a project');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/api/progress-logs?project_id=${formData.project_id}&notes=${encodeURIComponent(formData.notes)}&progress_update=${formData.progress_update}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('pms_token')}`
                    }
                }
            );
            if (!response.ok) throw new Error('Failed to create log');
            
            toast.success('Progress logged');
            setIsCreateOpen(false);
            setFormData({ project_id: '', notes: '', progress_update: 0 });
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Failed to create log');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredLogs = selectedProject === 'all'
        ? logs
        : logs.filter(l => l.project_id === selectedProject);

    return (
        <div className="red-fade-bg min-h-screen" data-testid="progress-logs-page">
            <Header
                title="Progress Logs"
                subtitle={`${filteredLogs.length} entries`}
                actions={
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-glow bg-red-500 hover:bg-red-600" data-testid="new-log-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                Log Progress
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-heading">Log Progress</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Project *</Label>
                                    <Select
                                        value={formData.project_id}
                                        onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes *</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Describe today's progress..."
                                        rows={4}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label>Progress: {formData.progress_update}%</Label>
                                    <Slider
                                        value={[formData.progress_update]}
                                        onValueChange={([v]) => setFormData({ ...formData, progress_update: v })}
                                        max={100}
                                        step={1}
                                        className="py-2"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="btn-glow bg-red-500 hover:bg-red-600" disabled={submitting}>
                                        Submit
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="p-6">
                {/* Filter */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <Label>Filter by Project:</Label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger className="w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Projects</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Logs */}
                <Card>
                    <CardContent className="p-0">
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-12">
                                <Hammer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Logs</h3>
                                <p className="text-gray-500">Start logging daily progress updates.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredLogs.map((log) => {
                                    const project = projects.find(p => p.id === log.project_id);
                                    return (
                                        <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors" data-testid={`log-${log.id}`}>
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="font-medium">{log.user_name}</p>
                                                            <Link
                                                                to={`/projects/${log.project_id}`}
                                                                className="text-sm text-red-500 hover:underline"
                                                            >
                                                                {project?.name || 'Unknown Project'}
                                                            </Link>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-heading text-lg font-bold text-red-500">{log.progress_update}%</span>
                                                            <p className="text-xs text-gray-500">{formatDateTime(log.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700">{log.notes}</p>
                                                    {log.photos && log.photos.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-3">
                                                            {log.photos.map((photo, index) => (
                                                                <a
                                                                    key={index}
                                                                    href={`${process.env.REACT_APP_BACKEND_URL}${photo}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <img
                                                                        src={`${process.env.REACT_APP_BACKEND_URL}${photo}`}
                                                                        alt=""
                                                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:border-red-300"
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
