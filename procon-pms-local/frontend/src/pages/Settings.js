import React from 'react';
import Header from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Settings as SettingsIcon, Bell, Shield, Palette, Database } from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';

export default function Settings() {
    return (
        <div className="red-fade-bg min-h-screen" data-testid="settings-page">
            <Header
                title="Settings"
                subtitle="System configuration"
            />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <Bell className="w-5 h-5 text-red-500" />
                            Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-gray-500">Receive email updates for project changes</p>
                            </div>
                            <Switch data-testid="email-notifications-toggle" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Task Reminders</Label>
                                <p className="text-sm text-gray-500">Get reminded about upcoming deadlines</p>
                            </div>
                            <Switch defaultChecked data-testid="task-reminders-toggle" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Approval Alerts</Label>
                                <p className="text-sm text-gray-500">Notify when items need approval</p>
                            </div>
                            <Switch defaultChecked data-testid="approval-alerts-toggle" />
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-500" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Two-Factor Authentication</Label>
                                <p className="text-sm text-gray-500">Add extra security to your account</p>
                            </div>
                            <Switch data-testid="2fa-toggle" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Session Timeout</Label>
                                <p className="text-sm text-gray-500">Auto-logout after 30 minutes of inactivity</p>
                            </div>
                            <Switch defaultChecked data-testid="session-timeout-toggle" />
                        </div>
                    </CardContent>
                </Card>

                {/* System Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <Database className="w-5 h-5 text-red-500" />
                            System Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Version</p>
                                <p className="font-medium">1.0.0</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Environment</p>
                                <p className="font-medium">Production</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Database</p>
                                <p className="font-medium">MongoDB</p>
                            </div>
                            <div>
                                <p className="text-gray-500">API Status</p>
                                <p className="font-medium text-green-600">Connected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
