import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Format currency
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Format date
export function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format datetime
export function formatDateTime(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status color class
export function getStatusClass(status) {
    const statusClasses = {
        planning: 'status-planning',
        procurement: 'status-procurement',
        fabrication: 'status-fabrication',
        installation: 'status-installation',
        handover: 'status-handover',
        closed: 'status-closed',
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        completed: 'bg-green-100 text-green-700',
        in_progress: 'bg-blue-100 text-blue-700',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-700';
}

// Get role display name
export function getRoleDisplayName(role) {
    const roleNames = {
        admin: 'Administrator',
        project_manager: 'Project Manager',
        sales_agent: 'Sales Agent',
        partner: 'Partner',
        supervisor: 'Site Supervisor',
        fabricator: 'Fabricator',
        client_b2b: 'B2B Client',
        client_residential: 'Residential Client',
    };
    return roleNames[role] || role;
}

// Get service type display name
export function getServiceDisplayName(service) {
    const serviceNames = {
        aluminum_fab: 'Aluminum Fabrication',
        steel_fab: 'Steel Fabrication',
        interior: 'Interior Design',
        construction: 'Construction',
        renovation: 'Renovation',
    };
    return serviceNames[service] || service;
}

// Calculate days remaining
export function getDaysRemaining(endDate) {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
}

// Truncate text
export function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
