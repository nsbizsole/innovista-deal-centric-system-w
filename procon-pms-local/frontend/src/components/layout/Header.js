import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '../ui/input';

const Header = ({ title, subtitle, actions }) => {
    const { user } = useAuth();

    return (
        <header className="glass-header sticky top-0 z-30 px-6 py-4" data-testid="header">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-gray-900" data-testid="page-title">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Search */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 w-64 bg-white/50"
                            data-testid="search-input"
                        />
                    </div>

                    {/* Actions */}
                    {actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}

                    {/* Notifications */}
                    <button
                        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        data-testid="notifications-btn"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Avatar */}
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold shadow-glow">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
