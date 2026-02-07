import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import { Plus, DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateTime, getStatusClass } from '../lib/utils';
import { toast } from 'sonner';

const FinancialSummary = ({ projectId, canManage }) => {
    const { get, post, put, loading } = useApi();
    const [entries, setEntries] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState({
        entry_type: 'invoice',
        amount: '',
        description: ''
    });

    const entryTypes = [
        { value: 'invoice', label: 'Invoice' },
        { value: 'payment', label: 'Payment' },
        { value: 'budget_line', label: 'Budget Line' },
        { value: 'variation', label: 'Variation' }
    ];

    useEffect(() => {
        fetchEntries();
    }, [projectId]);

    const fetchEntries = async () => {
        try {
            const data = await get(`/financial-entries?project_id=${projectId}`);
            setEntries(data);
        } catch (error) {
            toast.error('Failed to load financial entries');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await post('/financial-entries', {
                project_id: projectId,
                entry_type: formData.entry_type,
                amount: parseFloat(formData.amount),
                description: formData.description
            });
            toast.success('Entry created');
            setIsCreateOpen(false);
            setFormData({ entry_type: 'invoice', amount: '', description: '' });
            fetchEntries();
        } catch (error) {
            toast.error(error.message || 'Failed to create entry');
        }
    };

    const handleStatusUpdate = async (entryId, status) => {
        try {
            await put(`/financial-entries/${entryId}/status?status=${status}`);
            toast.success('Status updated');
            fetchEntries();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    // Calculate summary
    const summary = {
        totalInvoices: entries.filter(e => e.entry_type === 'invoice').reduce((sum, e) => sum + e.amount, 0),
        totalPayments: entries.filter(e => e.entry_type === 'payment').reduce((sum, e) => sum + e.amount, 0),
        totalVariations: entries.filter(e => e.entry_type === 'variation').reduce((sum, e) => sum + e.amount, 0)
    };

    const getTypeBadge = (type) => {
        const colors = {
            invoice: 'bg-blue-100 text-blue-700',
            payment: 'bg-green-100 text-green-700',
            budget_line: 'bg-purple-100 text-purple-700',
            variation: 'bg-orange-100 text-orange-700'
        };
        return <Badge className={colors[type] || 'bg-gray-100 text-gray-700'}>{type.replace('_', ' ')}</Badge>;
    };

    return (
        <div className="space-y-6" data-testid="financial-summary">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="kpi-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Invoices</p>
                                <p className="font-heading text-2xl font-bold text-blue-600">{formatCurrency(summary.totalInvoices)}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="kpi-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Payments</p>
                                <p className="font-heading text-2xl font-bold text-green-600">{formatCurrency(summary.totalPayments)}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="kpi-card">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Variations</p>
                                <p className={`font-heading text-2xl font-bold ${summary.totalVariations >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                    {formatCurrency(summary.totalVariations)}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                {summary.totalVariations >= 0 ? (
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-orange-600" />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Entries Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-heading">Financial Entries</CardTitle>
                    {canManage && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="btn-glow bg-red-500 hover:bg-red-600" data-testid="add-entry-btn">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Entry
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="font-heading">New Financial Entry</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Entry Type *</Label>
                                        <Select
                                            value={formData.entry_type}
                                            onValueChange={(v) => setFormData({ ...formData, entry_type: v })}
                                        >
                                            <SelectTrigger data-testid="entry-type-select">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {entryTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Amount ($) *</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="Enter amount"
                                            required
                                            data-testid="entry-amount-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description *</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Enter description"
                                            rows={3}
                                            required
                                            data-testid="entry-description-input"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                        <Button type="submit" className="btn-glow bg-red-500 hover:bg-red-600" disabled={loading} data-testid="create-entry-btn">
                                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Create Entry
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardHeader>
                <CardContent>
                    {entries.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            No financial entries yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    {canManage && <TableHead className="w-24">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.map((entry) => (
                                    <TableRow key={entry.id} className="table-row-hover" data-testid={`entry-row-${entry.id}`}>
                                        <TableCell>{getTypeBadge(entry.entry_type)}</TableCell>
                                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                                        <TableCell className={`font-medium ${entry.entry_type === 'payment' ? 'text-green-600' : ''}`}>
                                            {formatCurrency(entry.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusClass(entry.status)}>{entry.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">{formatDateTime(entry.created_at)}</TableCell>
                                        {canManage && (
                                            <TableCell>
                                                <Select
                                                    value={entry.status}
                                                    onValueChange={(v) => handleStatusUpdate(entry.id, v)}
                                                >
                                                    <SelectTrigger className="h-8 w-24">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="approved">Approved</SelectItem>
                                                        <SelectItem value="paid">Paid</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FinancialSummary;
