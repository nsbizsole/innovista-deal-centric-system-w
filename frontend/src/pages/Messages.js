import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { MessageSquare, Send, User, Briefcase, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { formatDateTime, getStageLabel, stageColors } from '../lib/utils';
import { toast } from 'sonner';

export default function Messages() {
    const { user, isClient } = useAuth();
    const { get, post, loading } = useApi();
    const [deals, setDeals] = useState([]);
    const [selectedDeal, setSelectedDeal] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDeals();
    }, []);

    useEffect(() => {
        if (selectedDeal) {
            fetchMessages();
        }
    }, [selectedDeal]);

    const fetchDeals = async () => {
        try {
            const data = await get('/deals');
            setDeals(data || []);
            if (data?.length > 0) {
                setSelectedDeal(data[0].id);
            }
        } catch (error) {
            toast.error('Failed to load deals');
        }
    };

    const fetchMessages = async () => {
        try {
            const data = await get(`/messages?deal_id=${selectedDeal}`);
            setMessages(data || []);
        } catch (error) {
            console.error('Failed to fetch messages');
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedDeal) return;

        try {
            // Determine visible roles based on sender
            const visibleTo = isClient
                ? ['admin', 'project_manager', 'client_b2b', 'client_residential']
                : ['admin', 'project_manager', 'sales_agent', 'supervisor', 'client_b2b', 'client_residential'];

            await post('/messages', {
                deal_id: selectedDeal,
                content: newMessage.trim(),
                visible_to_roles: visibleTo
            });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const filteredDeals = deals.filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentDeal = deals.find(d => d.id === selectedDeal);

    return (
        <div className="min-h-screen bg-slate-50" data-testid="messages-page">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-slate-900">Messages</h1>
                        <p className="text-slate-500">Deal communications</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Deals List */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="font-heading text-lg">
                                {isClient ? 'My Projects' : 'Deals'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9"
                                />
                            </div>
                            {filteredDeals.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                    <p className="text-sm">No deals found</p>
                                </div>
                            ) : (
                                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                                    {filteredDeals.map((deal) => (
                                        <button
                                            key={deal.id}
                                            onClick={() => setSelectedDeal(deal.id)}
                                            className={`w-full text-left p-3 rounded-xl transition-all ${
                                                selectedDeal === deal.id
                                                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                                                    : 'hover:bg-slate-100'
                                            }`}
                                            data-testid={`deal-btn-${deal.id}`}
                                        >
                                            <p className="font-medium truncate">{deal.name}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className={`text-xs ${selectedDeal === deal.id ? 'text-red-100' : 'text-slate-500'}`}>
                                                    {deal.client_name}
                                                </p>
                                                <Badge className={`text-[10px] px-1.5 py-0 ${
                                                    selectedDeal === deal.id ? 'bg-white/20 text-white' : stageColors[deal.stage]
                                                }`}>
                                                    {getStageLabel(deal.stage)}
                                                </Badge>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Messages */}
                    <Card className="lg:col-span-3 flex flex-col h-[600px]">
                        <CardHeader className="flex-shrink-0 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-heading flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-red-500" />
                                    {currentDeal?.name || 'Select a deal'}
                                </CardTitle>
                                {currentDeal && (
                                    <Badge className={stageColors[currentDeal.stage]}>
                                        {getStageLabel(currentDeal.stage)}
                                    </Badge>
                                )}
                            </div>
                            {currentDeal && (
                                <p className="text-sm text-slate-500 mt-1">
                                    {currentDeal.client_name}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                {!selectedDeal ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        <p>Select a deal to view messages</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                        <p>No messages yet</p>
                                        <p className="text-sm mt-1">Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((message) => {
                                        const isOwn = message.sender_id === user?.id;
                                        return (
                                            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`} data-testid={`message-${message.id}`}>
                                                {!isOwn && (
                                                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0 mr-2">
                                                        <span className="text-sm font-semibold text-slate-600">
                                                            {message.sender_name?.charAt(0)?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                                                    {!isOwn && (
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-sm">{message.sender_name}</span>
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                {message.sender_role?.replace('_', ' ')}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                    <div className={`rounded-2xl px-4 py-2 ${
                                                        isOwn
                                                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                                                            : 'bg-slate-100 text-slate-900'
                                                    }`}>
                                                        <p className="text-sm">{message.content}</p>
                                                    </div>
                                                    <p className={`text-xs mt-1 ${isOwn ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {formatDateTime(message.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t border-slate-200">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1"
                                    disabled={!selectedDeal}
                                    data-testid="message-input"
                                />
                                <Button
                                    type="submit"
                                    className="btn-glow bg-gradient-to-r from-red-500 to-orange-500"
                                    disabled={!newMessage.trim() || !selectedDeal}
                                    data-testid="send-btn"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
