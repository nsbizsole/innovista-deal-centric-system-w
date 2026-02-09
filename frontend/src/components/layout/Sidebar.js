import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Briefcase, Users, FileText, DollarSign,
    MessageSquare, Settings, LogOut, Hammer, BarChart3,
    UserCheck, Building, ClipboardCheck, TrendingUp
} from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout, isAdmin, isPM, isAgent, isPartner, isSupervisor, isFabricator, isClient } = useAuth();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const getNavItems = () => {
        const items = [{ path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }];

        // Deals - all roles
        items.push({ path: '/deals', icon: Briefcase, label: isClient ? 'My Projects' : 'Deals' });

        // Admin & PM specific
        if (isAdmin || isPM) {
            items.push({ path: '/pipeline', icon: TrendingUp, label: 'Pipeline' });
            items.push({ path: '/users', icon: Users, label: 'Team' });
        }

        // Agent specific
        if (isAgent) {
            items.push({ path: '/commissions', icon: DollarSign, label: 'Commissions' });
        }

        // Partner specific
        if (isPartner) {
            items.push({ path: '/collaborations', icon: Building, label: 'Collaborations' });
        }

        // Supervisor & Fabricator
        if (isSupervisor) {
            items.push({ path: '/sites', icon: ClipboardCheck, label: 'My Sites' });
        }
        if (isFabricator) {
            items.push({ path: '/jobs', icon: Hammer, label: 'My Jobs' });
        }

        // Documents - most roles
        if (!isFabricator) {
            items.push({ path: '/documents', icon: FileText, label: 'Documents' });
        }

        // Messages - all
        items.push({ path: '/messages', icon: MessageSquare, label: 'Messages' });

        // Reports - admin & PM
        if (isAdmin || isPM) {
            items.push({ path: '/reports', icon: BarChart3, label: 'Reports' });
        }

        // Settings - admin
        if (isAdmin) {
            items.push({ path: '/settings', icon: Settings, label: 'Settings' });
        }

        return items;
    };

    const getRoleColor = () => {
        if (isAdmin) return 'from-red-500 to-orange-500';
        if (isPM) return 'from-blue-500 to-cyan-500';
        if (isAgent) return 'from-green-500 to-emerald-500';
        if (isPartner) return 'from-purple-500 to-violet-500';
        if (isSupervisor) return 'from-amber-500 to-yellow-500';
        if (isFabricator) return 'from-slate-500 to-gray-500';
        if (isClient) return 'from-teal-500 to-cyan-500';
        return 'from-red-500 to-orange-500';
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-40" data-testid="sidebar">
            {/* Logo */}
            <div className="p-6 border-b border-slate-100">
                <Link to="/dashboard" className="flex items-center gap-3">
                    <div className={`w-11 h-11 bg-gradient-to-br ${getRoleColor()} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-heading text-xl font-bold text-slate-900">DealCentric</h1>
                        <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {getNavItems().map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                    isActive(item.path)
                                        ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
                    <div className={`w-10 h-10 bg-gradient-to-br ${getRoleColor()} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-semibold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    data-testid="logout-btn"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
