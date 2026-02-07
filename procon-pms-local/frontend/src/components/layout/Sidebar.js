import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    FolderKanban,
    Users,
    FileText,
    DollarSign,
    ClipboardList,
    MessageSquare,
    Settings,
    LogOut,
    Building2,
    Hammer,
    BarChart3,
    Bell
} from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout, isAdmin, isProjectManager, isClient, isOperational, isAgent } = useAuth();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    // Navigation items based on role
    const getNavItems = () => {
        const items = [];

        // Dashboard - all roles
        items.push({
            path: '/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard'
        });

        // Projects - all roles with different views
        items.push({
            path: '/projects',
            icon: FolderKanban,
            label: 'Projects'
        });

        // Users - admin only
        if (isAdmin) {
            items.push({
                path: '/users',
                icon: Users,
                label: 'User Management'
            });
        }

        // Documents - most roles
        if (!isClient) {
            items.push({
                path: '/documents',
                icon: FileText,
                label: 'Documents'
            });
        }

        // Financials - admin and PM
        if (isAdmin || isProjectManager) {
            items.push({
                path: '/financials',
                icon: DollarSign,
                label: 'Financials'
            });
        }

        // Change Orders - admin, PM, agents
        if (isAdmin || isProjectManager || isAgent) {
            items.push({
                path: '/change-orders',
                icon: ClipboardList,
                label: 'Change Orders'
            });
        }

        // Progress Logs - operational and PM
        if (isOperational || isProjectManager || isAdmin) {
            items.push({
                path: '/progress-logs',
                icon: Hammer,
                label: 'Progress Logs'
            });
        }

        // Reports - admin and PM
        if (isAdmin || isProjectManager) {
            items.push({
                path: '/reports',
                icon: BarChart3,
                label: 'Reports'
            });
        }

        // Messages - all roles
        items.push({
            path: '/messages',
            icon: MessageSquare,
            label: 'Messages'
        });

        // Notifications - all roles
        items.push({
            path: '/notifications',
            icon: Bell,
            label: 'Notifications'
        });

        // Settings - admin only
        if (isAdmin) {
            items.push({
                path: '/settings',
                icon: Settings,
                label: 'Settings'
            });
        }

        return items;
    };

    const navItems = getNavItems();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40" data-testid="sidebar">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-glow">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-heading text-xl font-bold text-gray-900">ProCon</h1>
                        <p className="text-xs text-gray-500">Project Management</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-semibold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="sidebar-item w-full text-red-600 hover:bg-red-50"
                    data-testid="logout-btn"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
