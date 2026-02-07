import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Plus, Camera, Image, User, Loader2 } from 'lucide-react';
import { formatDateTime } from '../lib/utils';
import { toast } from 'sonner';

const ProgressLogs = ({ projectId }) => {
    const { user } = useAuth();
    const { get, loading } = useApi();
    const [logs, setLogs] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState({
        notes: '',
        progress_update: 0,
        photos: []
    });
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchLogs();
    }, [projectId]);

    const fetchLogs = async () => {
        try {
            const data = await get(`/progress-logs?project_id=${projectId}`);
            setLogs(data);
        } catch (error) {
            toast.error('Failed to load progress logs');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('project_id', projectId);
            formDataToSend.append('notes', formData.notes);
            formDataToSend.append('progress_update', formData.progress_update);
            
            formData.photos.forEach((photo) => {
                formDataToSend.append('photos', photo);
            });

            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/progress-logs?project_id=${projectId}&notes=${encodeURIComponent(formData.notes)}&progress_update=${formData.progress_update}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('pms_token')}`
                },
                body: formDataToSend
            });

            if (!response.ok) throw new Error('Failed to create log');

            toast.success('Progress logged');
            setIsCreateOpen(false);
            setFormData({ notes: '', progress_update: 0, photos: [] });
            fetchLogs();
        } catch (error) {
            toast.error(error.message || 'Failed to create log');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        setFormData({ ...formData, photos: [...formData.photos, ...files] });
    };

    const removePhoto = (index) => {
        setFormData({
            ...formData,
            photos: formData.photos.filter((_, i) => i !== index)
        });
    };

    return (
        <Card data-testid="progress-logs">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading">Progress Logs ({logs.length})</CardTitle>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="btn-glow bg-red-500 hover:bg-red-600" data-testid="add-log-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            Log Progress
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Log Progress</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Notes *</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Describe today's progress..."
                                    rows={4}
                                    required
                                    data-testid="log-notes-input"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label>Progress Update: {formData.progress_update}%</Label>
                                <Slider
                                    value={[formData.progress_update]}
                                    onValueChange={([v]) => setFormData({ ...formData, progress_update: v })}
                                    max={100}
                                    step={1}
                                    className="py-2"
                                    data-testid="progress-slider"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Photos (Optional)</Label>
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-red-300 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handlePhotoSelect}
                                        className="hidden"
                                    />
                                    <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click to add photos</p>
                                </div>
                                {formData.photos.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.photos.map((photo, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={URL.createObjectURL(photo)}
                                                    alt=""
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoto(index)}
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" className="btn-glow bg-red-500 hover:bg-red-600" disabled={submitting} data-testid="submit-log-btn">
                                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Submit Log
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Camera className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        No progress logs yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="p-4 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
                                data-testid={`log-item-${log.id}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-medium">{log.user_name}</p>
                                                <p className="text-sm text-gray-500">{formatDateTime(log.created_at)}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm text-gray-500">Progress:</span>
                                                <span className="ml-2 font-heading text-lg font-bold text-red-500">{log.progress_update}%</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 mb-3">{log.notes}</p>
                                        {log.photos && log.photos.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {log.photos.map((photo, index) => (
                                                    <a
                                                        key={index}
                                                        href={`${process.env.REACT_APP_BACKEND_URL}${photo}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <img
                                                            src={`${process.env.REACT_APP_BACKEND_URL}${photo}`}
                                                            alt=""
                                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:border-red-300 transition-colors"
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProgressLogs;
