import React, { useEffect, useState, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
import { Upload, FileText, Check, X, Download, Eye, Loader2 } from 'lucide-react';
import { formatDateTime, getStatusClass } from '../lib/utils';
import { toast } from 'sonner';

const DocumentList = ({ projectId, canApprove }) => {
    const { get, upload, put, loading } = useApi();
    const [documents, setDocuments] = useState([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadData, setUploadData] = useState({
        name: '',
        doc_type: 'shop_drawing',
        file: null
    });
    const fileInputRef = useRef(null);

    const docTypes = [
        { value: 'contract_addendum', label: 'Contract Addendum' },
        { value: 'shop_drawing', label: 'Shop Drawing' },
        { value: 'RFI', label: 'RFI' },
        { value: 'invoice', label: 'Invoice' },
        { value: 'asbuilt', label: 'As-Built' },
        { value: 'photo', label: 'Photo' }
    ];

    useEffect(() => {
        fetchDocuments();
    }, [projectId]);

    const fetchDocuments = async () => {
        try {
            const data = await get(`/documents?project_id=${projectId}`);
            setDocuments(data);
        } catch (error) {
            toast.error('Failed to load documents');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadData.file) {
            toast.error('Please select a file');
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadData.file);

        try {
            await upload(`/documents?project_id=${projectId}&name=${encodeURIComponent(uploadData.name)}&doc_type=${uploadData.doc_type}`, formData);
            toast.success('Document uploaded');
            setIsUploadOpen(false);
            setUploadData({ name: '', doc_type: 'shop_drawing', file: null });
            fetchDocuments();
        } catch (error) {
            toast.error(error.message || 'Failed to upload document');
        }
    };

    const handleApprove = async (docId, approved) => {
        try {
            await put(`/documents/${docId}/approve?approved=${approved}`);
            toast.success(`Document ${approved ? 'approved' : 'rejected'}`);
            fetchDocuments();
        } catch (error) {
            toast.error('Failed to update approval status');
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

    return (
        <Card data-testid="document-list">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading">Documents ({documents.length})</CardTitle>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                        <Button className="btn-glow bg-red-500 hover:bg-red-600" data-testid="upload-doc-btn">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Upload Document</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Document Name *</Label>
                                <Input
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                    placeholder="Enter document name"
                                    required
                                    data-testid="doc-name-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Document Type *</Label>
                                <Select
                                    value={uploadData.doc_type}
                                    onValueChange={(v) => setUploadData({ ...uploadData, doc_type: v })}
                                >
                                    <SelectTrigger data-testid="doc-type-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {docTypes.map(type => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>File *</Label>
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-red-300 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                                        className="hidden"
                                        data-testid="file-input"
                                    />
                                    {uploadData.file ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText className="w-5 h-5 text-red-500" />
                                            <span className="text-sm">{uploadData.file.name}</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">Click to select a file</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                                <Button type="submit" className="btn-glow bg-red-500 hover:bg-red-600" disabled={loading} data-testid="upload-btn">
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Upload
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        No documents uploaded yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Uploader</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id} className="table-row-hover" data-testid={`doc-row-${doc.id}`}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-red-500" />
                                            <span className="font-medium">{doc.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{doc.doc_type.replace('_', ' ')}</TableCell>
                                    <TableCell>v{doc.version}</TableCell>
                                    <TableCell>{doc.uploader_name || '-'}</TableCell>
                                    <TableCell>{getApprovalBadge(doc.approval_status)}</TableCell>
                                    <TableCell className="text-sm text-gray-500">{formatDateTime(doc.created_at)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={`${process.env.REACT_APP_BACKEND_URL}${doc.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </a>
                                            {canApprove && doc.approval_status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600"
                                                        onClick={() => handleApprove(doc.id, true)}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600"
                                                        onClick={() => handleApprove(doc.id, false)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default DocumentList;
