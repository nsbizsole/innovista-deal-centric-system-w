import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { MessageSquare, Send, User } from 'lucide-react';
import { Input } from '../components/ui/input';
import { formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

export default function Messages() {
    const { get, post, loading } = useApi();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchMessages();
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        try {
            const data = await get('/projects');
            setProjects(data);
            if (data.length > 0) {
                setSelectedProject(data[0].id);
            }
        } catch (error) {
            toast.error('Failed to load projects');
        }
    };

    const fetchMessages = async () => {
        try {
            const data = await get(`/messages?project_id=${selectedProject}`);
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch messages');
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedProject) return;

        try {
            await post('/messages', {
                project_id: selectedProject,
                content: newMessage.trim()
            });
            setNewMessage('');
            fetchMessages();
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    return (
        <div className="red-fade-bg min-h-screen" data-testid="messages-page">
            <Header
                title="Messages"
                subtitle="Project communications"
            />

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Projects List */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="font-heading text-lg">Projects</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            {projects.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">No projects</div>
                            ) : (
                                <div className="space-y-1">
                                    {projects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => setSelectedProject(project.id)}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                selectedProject === project.id
                                                    ? 'bg-red-500 text-white'
                                                    : 'hover:bg-gray-100'
                                            }`}
                                            data-testid={`project-btn-${project.id}`}
                                        >
                                            <p className="font-medium truncate">{project.name}</p>
                                            <p className={`text-xs ${selectedProject === project.id ? 'text-red-100' : 'text-gray-500'}`}>
                                                {project.status}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Messages */}
                    <Card className="lg:col-span-3 flex flex-col h-[600px]">
                        <CardHeader className="flex-shrink-0 border-b">
                            <CardTitle className="font-heading flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-red-500" />
                                {projects.find(p => p.id === selectedProject)?.name || 'Select a project'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p>No messages yet</p>
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div key={message.id} className="flex gap-3" data-testid={`message-${message.id}`}>
                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-medium text-sm">{message.sender_name}</span>
                                                    <span className="text-xs text-gray-500">{formatDateTime(message.created_at)}</span>
                                                </div>
                                                <p className="text-gray-700 mt-1">{message.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1"
                                    disabled={!selectedProject}
                                    data-testid="message-input"
                                />
                                <Button
                                    type="submit"
                                    className="btn-glow bg-red-500 hover:bg-red-600"
                                    disabled={!newMessage.trim() || !selectedProject}
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
