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
import { FileText, Search, Filter } from 'lucide-react';
import { Input } from '../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { formatDateTime, getStatusClass } from '../lib/utils';
import { toast } from 'sonner';

export default function Documents() {
    const { get, loading } = useApi();
    const [documents, setDocuments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [filteredDocs, setFilteredDocs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const docTypes = [
        { value: 'contract_addendum', label: 'Contract Addendum' },
        { value: 'shop_drawing', label: 'Shop Drawing' },
        { value: 'RFI', label: 'RFI' },
        { value: 'invoice', label: 'Invoice' },
        { value: 'asbuilt', label: 'As-Built' },
        { value: 'photo', label: 'Photo' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [docsData, projectsData] = await Promise.all([
                get('/documents'),
                get('/projects')
            ]);
            setDocuments(docsData);
            setFilteredDocs(docsData);
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to load documents');
        }
    };

    useEffect(() => {
        let filtered = documents;

        if (searchTerm) {
            filtered = filtered.filter(d =>
                d.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(d => d.doc_type === typeFilter);
        }

        setFilteredDocs(filtered);
    }, [searchTerm, typeFilter, documents]);

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

    return (
        <div className="red-fade-bg min-h-screen" data-testid="documents-page">
            <Header
                title="Document Library"
                subtitle={`${filteredDocs.length} documents`}
            />

            <div className="p-6">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search documents..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                    data-testid="search-docs"
                                />
                            </div>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full md:w-48" data-testid="type-filter">
                                    <SelectValue placeholder="Document Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    {docTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
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
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
                                <p className="text-gray-500">Upload documents from project detail pages.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Version</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Uploaded</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDocs.map((doc) => {
                                        const project = projects.find(p => p.id === doc.project_id);
                                        return (
                                            <TableRow key={doc.id} className="table-row-hover" data-testid={`doc-row-${doc.id}`}>
                                                <TableCell>
                                                    <a
                                                        href={`${process.env.REACT_APP_BACKEND_URL}${doc.file_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-red-500 hover:underline"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        {doc.name}
                                                    </a>
                                                </TableCell>
                                                <TableCell className="capitalize">{doc.doc_type.replace('_', ' ')}</TableCell>
                                                <TableCell>
                                                    <Link to={`/projects/${doc.project_id}`} className="text-red-500 hover:underline">
                                                        {project?.name || 'Unknown'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>v{doc.version}</TableCell>
                                                <TableCell>{getApprovalBadge(doc.approval_status)}</TableCell>
                                                <TableCell className="text-sm text-gray-500">{formatDateTime(doc.created_at)}</TableCell>
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
