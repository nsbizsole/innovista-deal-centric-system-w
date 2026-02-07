import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { formatCurrency, formatDateTime, getStatusClass } from '../lib/utils';
import { toast } from 'sonner';

export default function Financials() {
    const { get, loading } = useApi();
    const [entries, setEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [entriesData, projectsData] = await Promise.all([
                get('/financial-entries'),
                get('/projects')
            ]);
            setEntries(entriesData);
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to load data');
        }
    };

    const filteredEntries = selectedProject === 'all'
        ? entries
        : entries.filter(e => e.project_id === selectedProject);

    // Calculate summary
    const summary = {
        totalInvoices: filteredEntries.filter(e => e.entry_type === 'invoice').reduce((sum, e) => sum + e.amount, 0),
        totalPayments: filteredEntries.filter(e => e.entry_type === 'payment').reduce((sum, e) => sum + e.amount, 0),
        totalVariations: filteredEntries.filter(e => e.entry_type === 'variation').reduce((sum, e) => sum + e.amount, 0),
        pending: filteredEntries.filter(e => e.status === 'pending').length
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
        <div className="red-fade-bg min-h-screen" data-testid="financials-page">
            <Header
                title="Financial Overview"
                subtitle={`${filteredEntries.length} entries`}
            />

            <div className="p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Invoices</p>
                                    <p className="font-heading text-2xl font-bold text-blue-600">{formatCurrency(summary.totalInvoices)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Payments</p>
                                    <p className="font-heading text-2xl font-bold text-green-600">{formatCurrency(summary.totalPayments)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    {summary.totalVariations >= 0 ? (
                                        <TrendingUp className="w-5 h-5 text-orange-600" />
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-orange-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Variations</p>
                                    <p className={`font-heading text-2xl font-bold ${summary.totalVariations >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                        {formatCurrency(summary.totalVariations)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="kpi-card">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Pending</p>
                                    <p className="font-heading text-2xl font-bold text-yellow-600">{summary.pending}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">Filter by Project:</span>
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

                {/* Entries Table */}
                <Card>
                    <CardContent className="p-0">
                        {filteredEntries.length === 0 ? (
                            <div className="text-center py-12">
                                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Entries</h3>
                                <p className="text-gray-500">Add financial entries from project detail pages.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEntries.map((entry) => {
                                        const project = projects.find(p => p.id === entry.project_id);
                                        return (
                                            <TableRow key={entry.id} className="table-row-hover">
                                                <TableCell>
                                                    <Link to={`/projects/${entry.project_id}`} className="text-red-500 hover:underline">
                                                        {project?.name || 'Unknown'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{getTypeBadge(entry.entry_type)}</TableCell>
                                                <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                                                <TableCell className={`font-medium ${entry.entry_type === 'payment' ? 'text-green-600' : ''}`}>
                                                    {formatCurrency(entry.amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusClass(entry.status)}>{entry.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-500">{formatDateTime(entry.created_at)}</TableCell>
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
