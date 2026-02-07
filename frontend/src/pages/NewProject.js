import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { CalendarIcon, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function NewProject() {
    const navigate = useNavigate();
    const { post, loading } = useApi();
    
    const [formData, setFormData] = useState({
        name: '',
        client_id: '',
        client_type: 'B2B',
        service_types: [],
        approved_value: '',
        start_date: null,
        end_date: null,
        description: '',
        linked_contract_id: ''
    });

    const services = [
        { id: 'aluminum_fab', label: 'Aluminum Fabrication' },
        { id: 'steel_fab', label: 'Steel Fabrication' },
        { id: 'interior', label: 'Interior Design' },
        { id: 'construction', label: 'Construction' },
        { id: 'renovation', label: 'Renovation' }
    ];

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
        
        if (!formData.name || !formData.client_id || formData.service_types.length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!formData.start_date || !formData.end_date) {
            toast.error('Please select start and end dates');
            return;
        }

        try {
            const projectData = {
                ...formData,
                approved_value: parseFloat(formData.approved_value) || 0,
                start_date: format(formData.start_date, 'yyyy-MM-dd'),
                end_date: format(formData.end_date, 'yyyy-MM-dd')
            };

            const project = await post('/projects', projectData);
            toast.success('Project created successfully!');
            navigate(`/projects/${project.id}`);
        } catch (error) {
            toast.error(error.message || 'Failed to create project');
        }
    };

    return (
        <div className="red-fade-bg min-h-screen" data-testid="new-project-page">
            <Header
                title="Create New Project"
                subtitle="Set up a new construction project"
                actions={
                    <Button variant="ghost" onClick={() => navigate(-1)} data-testid="back-btn">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                }
            />

            <div className="p-6 max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-heading">Project Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Project Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Project Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter project name"
                                    required
                                    data-testid="project-name-input"
                                />
                            </div>

                            {/* Client ID */}
                            <div className="space-y-2">
                                <Label htmlFor="client_id">Client ID *</Label>
                                <Input
                                    id="client_id"
                                    value={formData.client_id}
                                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                    placeholder="Enter client ID"
                                    required
                                    data-testid="client-id-input"
                                />
                            </div>

                            {/* Client Type */}
                            <div className="space-y-2">
                                <Label>Client Type *</Label>
                                <Select
                                    value={formData.client_type}
                                    onValueChange={(value) => setFormData({ ...formData, client_type: value })}
                                >
                                    <SelectTrigger data-testid="client-type-select">
                                        <SelectValue placeholder="Select client type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="B2B">B2B Client</SelectItem>
                                        <SelectItem value="residential">Residential Client</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Service Types */}
                            <div className="space-y-3">
                                <Label>Service Types *</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {services.map((service) => (
                                        <div
                                            key={service.id}
                                            className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50/50 transition-colors cursor-pointer"
                                            onClick={() => handleServiceToggle(service.id)}
                                        >
                                            <Checkbox
                                                checked={formData.service_types.includes(service.id)}
                                                onCheckedChange={() => handleServiceToggle(service.id)}
                                                data-testid={`service-${service.id}`}
                                            />
                                            <span className="text-sm">{service.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Approved Value */}
                            <div className="space-y-2">
                                <Label htmlFor="approved_value">Approved Value ($)</Label>
                                <Input
                                    id="approved_value"
                                    type="number"
                                    value={formData.approved_value}
                                    onChange={(e) => setFormData({ ...formData, approved_value: e.target.value })}
                                    placeholder="Enter approved value"
                                    data-testid="approved-value-input"
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.start_date && "text-muted-foreground"
                                                )}
                                                data-testid="start-date-picker"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.start_date ? format(formData.start_date, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.start_date}
                                                onSelect={(date) => setFormData({ ...formData, start_date: date })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label>End Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.end_date && "text-muted-foreground"
                                                )}
                                                data-testid="end-date-picker"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.end_date ? format(formData.end_date, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.end_date}
                                                onSelect={(date) => setFormData({ ...formData, end_date: date })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter project description"
                                    rows={4}
                                    data-testid="description-input"
                                />
                            </div>

                            {/* Contract ID */}
                            <div className="space-y-2">
                                <Label htmlFor="linked_contract_id">Linked Contract ID (Optional)</Label>
                                <Input
                                    id="linked_contract_id"
                                    value={formData.linked_contract_id}
                                    onChange={(e) => setFormData({ ...formData, linked_contract_id: e.target.value })}
                                    placeholder="Enter linked contract ID"
                                    data-testid="contract-id-input"
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="btn-glow bg-red-500 hover:bg-red-600"
                                    disabled={loading}
                                    data-testid="create-project-btn"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Project'
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
