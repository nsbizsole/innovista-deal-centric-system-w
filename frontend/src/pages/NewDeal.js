import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { ArrowLeft, Loader2, Briefcase } from 'lucide-react';
import { serviceTypes } from '../lib/utils';
import { toast } from 'sonner';

export default function NewDeal() {
    const navigate = useNavigate();
    const { isAgent } = useAuth();
    const { post, loading } = useApi();
    
    const [formData, setFormData] = useState({
        name: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        client_type: 'B2B',
        service_types: [],
        estimated_value: '',
        description: ''
    });

    const handleServiceToggle = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            service_types: prev.service_types.includes(serviceId)
                ? prev.service_types.filter(s => s !== serviceId)
                : [...prev.service_types, serviceId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.client_name || formData.service_types.length === 0) {
            toast.error('Please fill required fields');
            return;
        }

        try {
            const dealData = {
                ...formData,
                estimated_value: parseFloat(formData.estimated_value) || 0
            };

            const deal = await post('/deals', dealData);
            toast.success(isAgent ? 'Referral submitted!' : 'Deal created!');
            navigate(`/deals/${deal.id}`);
        } catch (error) {
            toast.error(error.message || 'Failed to create deal');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50" data-testid="new-deal-page">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate(-1)} data-testid="back-btn">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <div>
                            <h1 className="font-heading text-2xl font-bold text-slate-900">
                                {isAgent ? 'New Referral' : 'New Deal'}
                            </h1>
                            <p className="text-slate-500">
                                {isAgent ? 'Submit a new client referral' : 'Create a new deal opportunity'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-red-500" />
                            {isAgent ? 'Referral Details' : 'Deal Information'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Deal Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Deal/Project Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Office Renovation - ABC Corp"
                                    required
                                    data-testid="deal-name-input"
                                />
                            </div>

                            {/* Client Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="client_name">Client Name *</Label>
                                    <Input
                                        id="client_name"
                                        value={formData.client_name}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                        placeholder="Client's full name"
                                        required
                                        data-testid="client-name-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Client Type *</Label>
                                    <Select
                                        value={formData.client_type}
                                        onValueChange={(v) => setFormData({ ...formData, client_type: v })}
                                    >
                                        <SelectTrigger data-testid="client-type-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="B2B">B2B Client</SelectItem>
                                            <SelectItem value="residential">Residential Client</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="client_email">Client Email</Label>
                                    <Input
                                        id="client_email"
                                        type="email"
                                        value={formData.client_email}
                                        onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                                        placeholder="client@example.com"
                                        data-testid="client-email-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="client_phone">Client Phone</Label>
                                    <Input
                                        id="client_phone"
                                        value={formData.client_phone}
                                        onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                                        placeholder="+1 234 567 8900"
                                        data-testid="client-phone-input"
                                    />
                                </div>
                            </div>

                            {/* Service Types */}
                            <div className="space-y-3">
                                <Label>Service Types Required *</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {serviceTypes.map((service) => (
                                        <div
                                            key={service.id}
                                            className={`flex items-center space-x-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                formData.service_types.includes(service.id)
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                            onClick={() => handleServiceToggle(service.id)}
                                        >
                                            <Checkbox
                                                checked={formData.service_types.includes(service.id)}
                                                data-testid={`service-${service.id}`}
                                            />
                                            <span className="text-sm font-medium">{service.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Estimated Value */}
                            <div className="space-y-2">
                                <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                                <Input
                                    id="estimated_value"
                                    type="number"
                                    value={formData.estimated_value}
                                    onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                                    placeholder="Enter estimated project value"
                                    data-testid="estimated-value-input"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Project Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the project requirements, scope, and any special considerations..."
                                    rows={4}
                                    data-testid="description-input"
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="btn-glow bg-gradient-to-r from-red-500 to-orange-500"
                                    disabled={loading}
                                    data-testid="create-deal-btn"
                                >
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                                    ) : (
                                        isAgent ? 'Submit Referral' : 'Create Deal'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
