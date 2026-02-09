import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '../components/ui/dialog';
import {
    ArrowLeft, Briefcase, User, Calendar, DollarSign, FileText, MessageSquare,
    Plus, Upload, CheckCircle, Clock, Camera, Loader2, Send
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, stageColors, getStageLabel, serviceTypes } from '../lib/utils';
import { toast } from 'sonner';

export default function DealDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin, isPM, isClient, isAgent, isSupervisor, isFabricator } = useAuth();
    const { get, put, post, upload, loading } = useApi();
    
    const [deal, setDeal] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [updates, setUpdates] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    // Form states
    const [newMessage, setNewMessage] = useState('');
    const [progressNotes, setProgressNotes] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);

    const stages = ['inquiry', 'quotation', 'negotiation', 'contract', 'execution', 'fabrication', 'installation', 'handover', 'completed'];

    useEffect(() => {
        fetchDeal();
    }, [id]);

    const fetchDeal = async () => {
        try {
            const [dealData, tasksData, docsData, updatesData, quotsData, msgsData] = await Promise.all([
                get(`/deals/${id}`),
                get(`/tasks?deal_id=${id}`),
                get(`/documents?deal_id=${id}`),
                get(`/progress-updates?deal_id=${id}`),
                get(`/quotations?deal_id=${id}`),
                get(`/messages?deal_id=${id}`)
            ]);
            setDeal(dealData);
            setTasks(tasksData);
            setDocuments(docsData);
            setUpdates(updatesData);
            setQuotations(quotsData);
            setMessages(msgsData);
        } catch (error) {
            toast.error('Failed to load deal');
            navigate('/deals');
        }
    };

    const handleStageChange = async (newStage) => {
        try {
            await put(`/deals/${id}`, { stage: newStage });
            setDeal({ ...deal, stage: newStage });
            toast.success('Stage updated');
        } catch (error) {
            toast.error('Failed to update stage');
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            const visibleTo = isClient 
                ? ['admin', 'project_manager', 'client_b2b', 'client_residential']
                : ['admin', 'project_manager', 'sales_agent', 'client_b2b', 'client_residential'];
            
            await post('/messages', {
                deal_id: id,
                content: newMessage,
                visible_to_roles: visibleTo
            });
            setNewMessage('');
            fetchDeal();
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const handleProgressUpdate = async () => {
        if (!progressNotes.trim()) return;
        try {
            const formData = new FormData();
            formData.append('deal_id', id);
            formData.append('notes', progressNotes);
            formData.append('progress_percentage', progressPercent);
            formData.append('is_client_visible', 'true');
            
            await upload('/progress-updates', formData);
            setProgressNotes('');
            setProgressPercent(0);
            fetchDeal();
            toast.success('Progress updated');
        } catch (error) {
            toast.error('Failed to update progress');
        }
    };

    if (!deal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="spinner"></div>
            </div>
        );
    }

    const canManage = isAdmin || isPM;

    return (
        <div className="min-h-screen bg-slate-50" data-testid="deal-detail">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/deals')} data-testid="back-btn">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-slate-900">{deal.name}</h1>
                            <p className="text-slate-500">{deal.client_name} • {deal.client_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {canManage && (
                            <Select value={deal.stage} onValueChange={handleStageChange}>
                                <SelectTrigger className="w-40" data-testid="stage-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {stages.map(s => (
                                        <SelectItem key={s} value={s}>{getStageLabel(s)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Badge className={`${stageColors[deal.stage]} px-4 py-2 text-sm`}>
                            {getStageLabel(deal.stage)}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Progress</p>
                                <p className="font-heading text-xl font-bold">{deal.progress_percentage || 0}%</p>
                            </div>
                        </CardContent>
                    </Card>

                    {!isClient && (
                        <Card>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Value</p>
                                    <p className="font-heading text-xl font-bold">
                                        {formatCurrency(deal.contract_value || deal.estimated_value)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Created</p>
                                <p className="font-heading text-lg font-bold">{formatDate(deal.created_at)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Tasks</p>
                                <p className="font-heading text-xl font-bold">{tasks.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Bar */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                            <span className="text-sm font-bold text-slate-900">{deal.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={deal.progress_percentage || 0} className="h-3" />
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-white border border-slate-200 p-1 mb-6">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        {!isFabricator && <TabsTrigger value="documents">Documents</TabsTrigger>}
                        <TabsTrigger value="messages">Messages</TabsTrigger>
                        {(canManage || isSupervisor) && <TabsTrigger value="progress">Progress Updates</TabsTrigger>}
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-heading">Project Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-slate-500">Description</p>
                                        <p className="mt-1">{deal.description || 'No description'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Services</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {deal.service_types?.map(s => (
                                                <Badge key={s} variant="secondary">
                                                    {serviceTypes.find(st => st.id === s)?.name || s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    {!isClient && deal.client_email && (
                                        <div>
                                            <p className="text-sm text-slate-500">Client Contact</p>
                                            <p className="mt-1">{deal.client_email}</p>
                                            {deal.client_phone && <p>{deal.client_phone}</p>}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Quotations */}
                            {quotations.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="font-heading">Quotations</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {quotations.map((q) => (
                                                <div key={q.id} className="p-3 rounded-xl border border-slate-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">Version {q.version}</span>
                                                        <Badge className={q.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                                            {q.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-lg font-bold mt-2">{formatCurrency(q.total_amount)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Timeline Tab */}
                    <TabsContent value="timeline">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-heading">Project Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tasks.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        No tasks defined yet
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {tasks.map((task) => (
                                            <div key={task.id} className="flex gap-4 p-4 rounded-xl border border-slate-200">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    task.status === 'completed' ? 'bg-green-100' : 'bg-slate-100'
                                                }`}>
                                                    {task.status === 'completed' ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <Clock className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium">{task.name}</p>
                                                        <Badge variant="secondary">{task.status}</Badge>
                                                    </div>
                                                    {task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                                        <span>{formatDate(task.start_date)} - {formatDate(task.end_date)}</span>
                                                        <span>Progress: {task.progress}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="font-heading">Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {documents.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        No documents available
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-red-500" />
                                                    <div>
                                                        <p className="font-medium">{doc.name}</p>
                                                        <p className="text-sm text-slate-500">{doc.doc_type} • v{doc.version}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`${process.env.REACT_APP_BACKEND_URL}${doc.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Messages Tab */}
                    <TabsContent value="messages">
                        <Card className="h-[500px] flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-heading flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-red-500" />
                                    Project Communication
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            No messages yet. Start the conversation!
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isOwn = msg.sender_id === user?.id;
                                            return (
                                                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                                        isOwn ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-900'
                                                    }`}>
                                                        <p className="text-sm">{msg.content}</p>
                                                        <p className={`text-xs mt-1 ${isOwn ? 'text-red-100' : 'text-slate-500'}`}>
                                                            {msg.sender_name} • {formatDateTime(msg.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-slate-200">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        data-testid="message-input"
                                    />
                                    <Button onClick={handleSendMessage} className="btn-glow bg-red-500" data-testid="send-btn">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Progress Updates Tab */}
                    <TabsContent value="progress">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Add Update */}
                            {(canManage || isSupervisor) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="font-heading">Log Progress</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Progress Notes</Label>
                                            <Textarea
                                                value={progressNotes}
                                                onChange={(e) => setProgressNotes(e.target.value)}
                                                placeholder="Describe today's progress..."
                                                rows={3}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Progress: {progressPercent}%</Label>
                                            <Input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={progressPercent}
                                                onChange={(e) => setProgressPercent(parseInt(e.target.value))}
                                            />
                                        </div>
                                        <Button onClick={handleProgressUpdate} className="w-full btn-glow bg-red-500">
                                            <Camera className="w-4 h-4 mr-2" /> Submit Update
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Updates List */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-heading">Progress History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {updates.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            No progress updates yet
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {updates.map((update) => (
                                                <div key={update.id} className="p-4 rounded-xl border border-slate-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">{update.created_by_name}</span>
                                                        <Badge>{update.progress_percentage}%</Badge>
                                                    </div>
                                                    <p className="text-slate-600">{update.notes}</p>
                                                    <p className="text-sm text-slate-500 mt-2">{formatDateTime(update.created_at)}</p>
                                                    {update.photos?.length > 0 && (
                                                        <div className="flex gap-2 mt-3">
                                                            {update.photos.map((photo, i) => (
                                                                <a key={i} href={`${process.env.REACT_APP_BACKEND_URL}${photo}`} target="_blank" rel="noreferrer">
                                                                    <img src={`${process.env.REACT_APP_BACKEND_URL}${photo}`} alt="" className="w-16 h-16 rounded object-cover" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
