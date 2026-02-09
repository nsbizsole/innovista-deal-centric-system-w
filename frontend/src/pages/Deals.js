import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Plus, Search, Briefcase, Eye, Filter } from 'lucide-react';
import { formatCurrency, formatDate, stageColors, getStageLabel, truncate } from '../lib/utils';
import { toast } from 'sonner';

export default function Deals() {
    const { isAdmin, isPM, isAgent, isClient } = useAuth();
    const { get, loading } = useApi();
    const [deals, setDeals] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [stageFilter, setStageFilter] = useState('all');

    const stages = ['inquiry', 'quotation', 'negotiation', 'contract', 'execution', 'fabrication', 'installation', 'handover', 'completed'];

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                const data = await get('/deals');
                setDeals(data);
                setFiltered(data);
            } catch (error) {
                toast.error('Failed to load deals');
            }
        };
        fetchDeals();
    }, [get]);

    useEffect(() => {
        let result = deals;
        if (search) {
            result = result.filter(d => 
                d.name.toLowerCase().includes(search.toLowerCase()) ||
                d.client_name?.toLowerCase().includes(search.toLowerCase())
            );
        }
        if (stageFilter !== 'all') {
            result = result.filter(d => d.stage === stageFilter);
        }
        setFiltered(result);
    }, [search, stageFilter, deals]);

    const canCreateDeal = isAdmin || isPM || isAgent;

    return (
        <div className="min-h-screen bg-slate-50" data-testid="deals-page">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-slate-900">
                            {isClient ? 'My Projects' : 'Deals'}
                        </h1>
                        <p className="text-slate-500">{filtered.length} {isClient ? 'projects' : 'deals'} found</p>
                    </div>
                    {canCreateDeal && (
                        <Link to="/deals/new">
                            <Button className="btn-glow bg-gradient-to-r from-red-500 to-orange-500" data-testid="new-deal-btn">
                                <Plus className="w-4 h-4 mr-2" /> New {isAgent ? 'Referral' : 'Deal'}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="p-6">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder={isClient ? "Search projects..." : "Search deals..."}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                    data-testid="search-input"
                                />
                            </div>
                            <Select value={stageFilter} onValueChange={setStageFilter}>
                                <SelectTrigger className="w-full md:w-48" data-testid="stage-filter">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stages</SelectItem>
                                    {stages.map(s => (
                                        <SelectItem key={s} value={s}>{getStageLabel(s)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Deals List */}
                {loading ? (
                    <div className="flex justify-center py-12"><div className="spinner"></div></div>
                ) : filtered.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No {isClient ? 'Projects' : 'Deals'} Found</h3>
                            <p className="text-slate-500 mb-4">
                                {deals.length === 0 
                                    ? (isClient ? 'Your projects will appear here' : 'Create your first deal to get started')
                                    : 'Try adjusting your filters'}
                            </p>
                            {canCreateDeal && deals.length === 0 && (
                                <Link to="/deals/new">
                                    <Button className="btn-glow bg-gradient-to-r from-red-500 to-orange-500">
                                        <Plus className="w-4 h-4 mr-2" /> Create Deal
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((deal) => (
                            <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`deal-card-${deal.id}`}>
                                <CardContent className="p-0">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <Badge className={`${stageColors[deal.stage]} px-3 py-1`}>
                                                {getStageLabel(deal.stage)}
                                            </Badge>
                                        </div>
                                        <h3 className="font-heading text-lg font-semibold mb-1">{deal.name}</h3>
                                        <p className="text-slate-500 text-sm mb-3">{deal.client_name}</p>
                                        <p className="text-slate-600 text-sm mb-4">{truncate(deal.description, 80)}</p>
                                        
                                        {/* Progress */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-slate-500">Progress</span>
                                                <span className="font-medium">{deal.progress_percentage || 0}%</span>
                                            </div>
                                            <Progress value={deal.progress_percentage || 0} className="h-2" />
                                        </div>

                                        {/* Value */}
                                        {!isClient && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Value</span>
                                                <span className="font-semibold text-lg">
                                                    {formatCurrency(deal.contract_value || deal.estimated_value)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                                        <Link to={`/deals/${deal.id}`}>
                                            <Button variant="ghost" className="w-full">
                                                <Eye className="w-4 h-4 mr-2" /> View Details
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
