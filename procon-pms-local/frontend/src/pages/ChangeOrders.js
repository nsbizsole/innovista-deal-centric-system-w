import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
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
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Plus, ClipboardList, Check, X, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusClass } from '../lib/utils';
import { toast } from 'sonner';

export default function ChangeOrders() {
    const { isAdmin, isProjectManager } = useAuth();
    const { get, post, put, loading } = useApi();
    const [changeOrders, setChangeOrders] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState({
        project_id: '',
        description: '',
        change_type: 'add_item',
        value_impact: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [cosData, projectsData] = await Promise.all([
                get('/change-orders'),
                get('/projects')
            ]);
            setChangeOrders(cosData);
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to load data');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await post('/change-orders', {
                ...formData,
                value_impact: parseFloat(formData.value_impact)
            });
            toast.success('Change order created');
            setIsCreateOpen(false);
            setFormData({ project_id: '', description: '', change_type: 'add_item', value_impact: '' });
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Failed to create change order');
        }
    };

    const handleApproval = async (coId, approved) => {
        try {
            await put(`/change-orders/${coId}/approve?approved=${approved}`);
            toast.success(`Change order ${approved ? 'approved' : 'rejected'}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getTypeBadge = (type) => {
        const colors = {
            add_item: 'bg-green-100 text-green-700',
            remove_item: 'bg-red-100 text-red-700',
            modify: 'bg-blue-100 text-blue-700'
        };
        return <Badge className={colors[type] || 'bg-gray-100 text-gray-700'}>{type.replace('_', ' ')}</Badge>;
    };

    const canApprove = isAdmin || isProjectManager;

    return (
        <div className="red-fade-bg min-h-screen" data-testid="change-orders-page">
            <Header
                title="Change Orders"
                subtitle={`${changeOrders.length} change orders`}
                actions={
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="btn-glow bg-red-500 hover:bg-red-600" data-testid="new-co-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                New Change Order
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-heading">Create Change Order</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Project *</Label>
                                    <Select
                                        value={formData.project_id}
                                        onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                                    >
                                        <SelectTrigger data-testid="co-project-select">
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
                                    <Label>Change Type *</Label>
                                    <Select
                                        value={formData.change_type}
                                        onValueChange={(v) => setFormData({ ...formData, change_type: v })}
                                    >
                                        <SelectTrigger data-testid="co-type-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="add_item">Add Item</SelectItem>
                                            <SelectItem value="remove_item">Remove Item</SelectItem>
                                            <SelectItem value="modify">Modify</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Value Impact ($) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.value_impact}
                                        onChange={(e) => setFormData({ ...formData, value_impact: e.target.value })}
                                        placeholder="Enter value (negative for deductions)"
                                        required
                                        data-testid="co-value-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description *</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the change..."
                                        rows={4}
                                        required
                                        data-testid="co-description-input"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="btn-glow bg-red-500 hover:bg-red-600" disabled={loading} data-testid="create-co-btn">
                                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Submit
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="p-6">
                <Card>
                    <CardContent className="p-0">
                        {changeOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Change Orders</h3>
                                <p className="text-gray-500">Create a change order to request project modifications.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Value Impact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        {canApprove && <TableHead className="w-24">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {changeOrders.map((co) => {
                                        const project = projects.find(p => p.id === co.project_id);
                                        return (
                                            <TableRow key={co.id} className="table-row-hover" data-testid={`co-row-${co.id}`}>
                                                <TableCell>
                                                    <Link to={`/projects/${co.project_id}`} className="text-red-500 hover:underline">
                                                        {project?.name || 'Unknown'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{getTypeBadge(co.change_type)}</TableCell>
                                                <TableCell className="max-w-xs truncate">{co.description}</TableCell>
                                                <TableCell className={`font-medium ${co.value_impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {co.value_impact >= 0 ? '+' : ''}{formatCurrency(co.value_impact)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusClass(co.approval_status)}>{co.approval_status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">{formatDateTime(co.created_at)}</TableCell>
                                                {canApprove && (
                                                    <TableCell>
                                                        {co.approval_status === 'pending' && (
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-green-600"
                                                                    onClick={() => handleApproval(co.id, true)}
                                                                    data-testid={`approve-co-${co.id}`}
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-600"
                                                                    onClick={() => handleApproval(co.id, false)}
                                                                    data-testid={`reject-co-${co.id}`}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
