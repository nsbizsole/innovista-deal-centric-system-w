import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import { FileText, Search, Filter, Upload, FolderOpen, Eye, Download } from 'lucide-react';
import { Input } from '../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

export default function Documents() {
    const { isAdmin, isPM } = useAuth();
    const { get, put, loading } = useApi();
    const [documents, setDocuments] = useState([]);
    const [deals, setDeals] = useState([]);
    const [filteredDocs, setFilteredDocs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const categories = [
        { value: 'client_facing', label: 'Client-Facing' },
        { value: 'internal', label: 'Internal' },
        { value: 'deal_relationship', label: 'Deal/Relationship' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [docsData, dealsData] = await Promise.all([
                get('/documents'),
                get('/deals')
            ]);
            setDocuments(docsData || []);
            setFilteredDocs(docsData || []);
            setDeals(dealsData || []);
        } catch (error) {
            toast.error('Failed to load documents');
        }
    };

    useEffect(() => {
        let filtered = documents;

        if (searchTerm) {
            filtered = filtered.filter(d =>
                d.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(d => d.category === categoryFilter);
        }

        setFilteredDocs(filtered);
    }, [searchTerm, categoryFilter, documents]);

    const handleApprove = async (docId, approved) => {
        try {
            await put(`/documents/${docId}/approve`, null, { params: { approved } });
            toast.success(`Document ${approved ? 'approved' : 'rejected'}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update document');
        }
    };

    const getApprovalBadge = (status) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
            default:
                return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
        }
    };

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'client_facing':
                return <Badge className="bg-blue-100 text-blue-700">Client-Facing</Badge>;
            case 'internal':
                return <Badge className="bg-slate-100 text-slate-700">Internal</Badge>;
            case 'deal_relationship':
                return <Badge className="bg-purple-100 text-purple-700">Deal/Relationship</Badge>;
            default:
                return <Badge variant="secondary">{category}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50" data-testid="documents-page">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-slate-900">Document Library</h1>
                        <p className="text-slate-500">{filteredDocs.length} documents</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search documents..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                    data-testid="search-docs"
                                />
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full md:w-48" data-testid="category-filter">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents Table */}
                <Card>
                    <CardContent className="p-0">
                        {filteredDocs.length === 0 ? (
                            <div className="text-center py-12">
                                <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 mb-2">No Documents Found</h3>
                                <p className="text-slate-500">Upload documents from deal detail pages.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Deal</TableHead>
                                        <TableHead>Version</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocs.map((doc) => {
                                        const deal = deals.find(d => d.id === doc.deal_id);
                                        return (
                                            <TableRow key={doc.id} className="hover:bg-slate-50" data-testid={`doc-row-${doc.id}`}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{doc.name}</p>
                                                            <p className="text-sm text-slate-500">{doc.doc_type}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getCategoryBadge(doc.category)}</TableCell>
                                                <TableCell>
                                                    {deal ? (
                                                        <Link to={`/deals/${doc.deal_id}`} className="text-red-500 hover:underline">
                                                            {deal.name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-slate-400">Unknown</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">v{doc.version}</Badge>
                                                </TableCell>
                                                <TableCell>{getApprovalBadge(doc.approval_status)}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p className="text-slate-900">{doc.uploaded_by_name}</p>
                                                        <p className="text-slate-500">{formatDateTime(doc.created_at)}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={`${process.env.REACT_APP_BACKEND_URL}${doc.file_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </a>
                                                        {(isAdmin || isPM) && doc.approval_status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-green-600"
                                                                    onClick={() => handleApprove(doc.id, true)}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600"
                                                                    onClick={() => handleApprove(doc.id, false)}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
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
