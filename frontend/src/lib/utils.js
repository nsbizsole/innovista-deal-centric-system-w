import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount || 0);
}

export function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

export function formatDateTime(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

export const stageColors = {
    inquiry: 'bg-gray-100 text-gray-700',
    quotation: 'bg-blue-100 text-blue-700',
    negotiation: 'bg-yellow-100 text-yellow-700',
    contract: 'bg-purple-100 text-purple-700',
    execution: 'bg-orange-100 text-orange-700',
    fabrication: 'bg-amber-100 text-amber-700',
    installation: 'bg-cyan-100 text-cyan-700',
    handover: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-700'
};

export const roleNames = {
    admin: 'Administrator',
    project_manager: 'Project Manager',
    sales_agent: 'Sales Agent',
    partner: 'Strategic Partner',
    supervisor: 'Site Supervisor',
    fabricator: 'Fabricator',
    client_b2b: 'B2B Client',
    client_residential: 'Residential Client'
};

export const serviceTypes = [
    { id: 'aluminum_fab', name: 'Aluminum Fabrication' },
    { id: 'steel_fab', name: 'Steel Fabrication' },
    { id: 'interior', name: 'Interior Design' },
    { id: 'construction', name: 'Construction' },
    { id: 'renovation', name: 'Renovation' }
];

export function getStageLabel(stage) {
    return stage?.charAt(0).toUpperCase() + stage?.slice(1).replace('_', ' ');
}

export function truncate(str, len = 50) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}
