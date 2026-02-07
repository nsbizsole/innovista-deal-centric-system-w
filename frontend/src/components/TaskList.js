import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, Calendar as CalendarIcon, Trash2, Edit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatDate, getStatusClass } from '../lib/utils';
import { toast } from 'sonner';

const TaskList = ({ projectId, tasks, setTasks, canManage }) => {
    const { post, put, del, loading } = useApi();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: null,
        end_date: null,
        is_milestone: false
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.start_date || !formData.end_date) {
            toast.error('Please select dates');
            return;
        }
        try {
            const taskData = {
                project_id: projectId,
                name: formData.name,
                description: formData.description,
                start_date: format(formData.start_date, 'yyyy-MM-dd'),
                end_date: format(formData.end_date, 'yyyy-MM-dd'),
                is_milestone: formData.is_milestone,
                dependencies: [],
                assigned_users: []
            };
            const newTask = await post('/tasks', taskData);
            setTasks([...tasks, newTask]);
            toast.success('Task created');
            setIsCreateOpen(false);
            resetForm();
        } catch (error) {
            toast.error(error.message || 'Failed to create task');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const updateData = {
                name: formData.name,
                description: formData.description,
                start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : undefined,
                end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : undefined,
                is_milestone: formData.is_milestone
            };
            const updatedTask = await put(`/tasks/${selectedTask.id}`, updateData);
            setTasks(tasks.map(t => t.id === selectedTask.id ? updatedTask : t));
            toast.success('Task updated');
            setIsEditOpen(false);
            resetForm();
        } catch (error) {
            toast.error(error.message || 'Failed to update task');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            const updatedTask = await put(`/tasks/${taskId}`, { status: newStatus });
            setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleProgressChange = async (taskId, progress) => {
        try {
            const updatedTask = await put(`/tasks/${taskId}`, { progress: parseFloat(progress) });
            setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
        } catch (error) {
            toast.error('Failed to update progress');
        }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await del(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
            toast.success('Task deleted');
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const openEditDialog = (task) => {
        setSelectedTask(task);
        setFormData({
            name: task.name,
            description: task.description || '',
            start_date: new Date(task.start_date),
            end_date: new Date(task.end_date),
            is_milestone: task.is_milestone
        });
        setIsEditOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            start_date: null,
            end_date: null,
            is_milestone: false
        });
        setSelectedTask(null);
    };

    const statuses = ['pending', 'in_progress', 'completed', 'on_hold'];

    return (
        <Card data-testid="task-list">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading">Tasks ({tasks.length})</CardTitle>
                {canManage && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-glow bg-red-500 hover:bg-red-600" data-testid="add-task-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-heading">Create New Task</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Task Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter task name"
                                        required
                                        data-testid="task-name-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Task description"
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.start_date ? format(formData.start_date, "PP") : "Pick date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.start_date}
                                                    onSelect={(date) => setFormData({ ...formData, start_date: date })}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn("w-full justify-start text-left font-normal", !formData.end_date && "text-muted-foreground")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.end_date ? format(formData.end_date, "PP") : "Pick date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.end_date}
                                                    onSelect={(date) => setFormData({ ...formData, end_date: date })}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="milestone"
                                        checked={formData.is_milestone}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_milestone: checked })}
                                    />
                                    <Label htmlFor="milestone">Mark as Milestone</Label>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="btn-glow bg-red-500 hover:bg-red-600" disabled={loading} data-testid="create-task-btn">
                                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Create Task
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No tasks yet. {canManage && 'Click "Add Task" to create one.'}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="p-4 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50/30 transition-colors"
                                data-testid={`task-item-${task.id}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {task.is_milestone && (
                                            <div className="w-3 h-3 bg-red-500 rotate-45 flex-shrink-0"></div>
                                        )}
                                        <h4 className="font-medium">{task.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v)}>
                                            <SelectTrigger className="h-8 w-28">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statuses.map(s => (
                                                    <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {canManage && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(task)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(task.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {task.description && (
                                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        {formatDate(task.start_date)} - {formatDate(task.end_date)}
                                    </div>
                                    <div className="flex items-center gap-3 w-48">
                                        <Progress value={task.progress} className="h-2 flex-1" />
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={task.progress}
                                            onChange={(e) => handleProgressChange(task.id, e.target.value)}
                                            className="w-16 h-7 text-xs text-center"
                                        />
                                        <span className="text-xs text-gray-500">%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Edit Task</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Task Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter task name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Task description"
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="edit-milestone"
                                    checked={formData.is_milestone}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_milestone: checked })}
                                />
                                <Label htmlFor="edit-milestone">Mark as Milestone</Label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                <Button type="submit" className="btn-glow bg-red-500 hover:bg-red-600" disabled={loading}>
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default TaskList;
