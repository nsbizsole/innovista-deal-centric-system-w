import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

export default function Notifications() {
    const { get, put, loading } = useApi();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await get('/notifications');
            setNotifications(data);
        } catch (error) {
            // Notifications might be empty
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await put(`/notifications/${notificationId}/read`);
            setNotifications(notifications.map(n => 
                n.id === notificationId ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const markAllAsRead = async () => {
        for (const n of notifications.filter(n => !n.is_read)) {
            await markAsRead(n.id);
        }
        toast.success('All notifications marked as read');
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="red-fade-bg min-h-screen" data-testid="notifications-page">
            <Header
                title="Notifications"
                subtitle={`${unreadCount} unread notifications`}
                actions={
                    unreadCount > 0 && (
                        <Button variant="outline" onClick={markAllAsRead} data-testid="mark-all-read-btn">
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Mark All as Read
                        </Button>
                    )
                }
            />

            <div className="p-6">
                <Card>
                    <CardContent className="p-0">
                        {notifications.length === 0 ? (
                            <div className="text-center py-12">
                                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                                <p className="text-gray-500">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-red-50/50' : ''}`}
                                        data-testid={`notification-${notification.id}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.is_read ? 'bg-gray-100' : 'bg-red-100'}`}>
                                            <Bell className={`w-5 h-5 ${notification.is_read ? 'text-gray-500' : 'text-red-500'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`${notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                                {notification.message || 'New notification'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {formatDateTime(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => markAsRead(notification.id)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
