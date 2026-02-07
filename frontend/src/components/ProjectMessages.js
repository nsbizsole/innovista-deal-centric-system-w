import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Send, MessageSquare, User } from 'lucide-react';
import { formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

const ProjectMessages = ({ projectId }) => {
    const { user } = useAuth();
    const { get, post, loading } = useApi();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 10 seconds
        const interval = setInterval(fetchMessages, 10000);
        return () => clearInterval(interval);
    }, [projectId]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const data = await get(`/messages?project_id=${projectId}`);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch messages');
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const message = await post('/messages', {
                project_id: projectId,
                content: newMessage.trim()
            });
            setMessages([...messages, message]);
            setNewMessage('');
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <Card className="flex flex-col h-[600px]" data-testid="project-messages">
            <CardHeader className="flex-shrink-0">
                <CardTitle className="font-heading flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-red-500" />
                    Project Messages
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
                {/* Messages Area */}
                <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                    {messages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((message) => {
                                const isOwn = message.sender_id === user?.id;
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        data-testid={`message-${message.id}`}
                                    >
                                        <div className={`flex gap-3 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isOwn ? 'bg-red-500' : 'bg-gray-200'}`}>
                                                <User className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-gray-600'}`} />
                                            </div>
                                            <div>
                                                <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                                    <p className="text-sm">{message.content}</p>
                                                </div>
                                                <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : ''}`}>
                                                    <span>{message.sender_name}</span>
                                                    <span>•</span>
                                                    <span>{formatDateTime(message.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Input Area */}
                <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={sending}
                        data-testid="message-input"
                    />
                    <Button
                        type="submit"
                        className="btn-glow bg-red-500 hover:bg-red-600"
                        disabled={sending || !newMessage.trim()}
                        data-testid="send-message-btn"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default ProjectMessages;
