import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Label } from '../components/ui/label';
import {
    Plus,
    Search,
    UserPlus,
    Edit,
    Trash2,
    MoreVertical,
    Shield,
    User,
    Mail,
    Phone,
    Building,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { formatDateTime, getRoleDisplayName } from '../lib/utils';
import { toast } from 'sonner';

export default function UserManagement() {
    const { isAdmin } = useAuth();
    const { get, post, put, del, loading } = useApi();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'project_manager',
        phone: '',
        company: ''
    });

    const roles = [
        'admin',
        'project_manager',
        'sales_agent',
        'partner',
        'supervisor',
        'fabricator',
        'client_b2b',
        'client_residential'
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await get('/users');
            setUsers(data);
            setFilteredUsers(data);
        } catch (error) {
            toast.error('Failed to load users');
        }
    };

    useEffect(() => {
        let filtered = users;

        if (searchTerm) {
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (roleFilter !== 'all') {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        setFilteredUsers(filtered);
    }, [searchTerm, roleFilter, users]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await post('/auth/register', formData);
            toast.success('User created successfully');
            setIsCreateOpen(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to create user');
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            await put(`/users/${selectedUser.id}`, {
                name: formData.name,
                phone: formData.phone,
                company: formData.company,
                role: formData.role,
                is_active: formData.is_active
            });
            toast.success('User updated successfully');
            setIsEditOpen(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to update user');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to deactivate this user?')) return;
        try {
            await del(`/users/${userId}`);
            toast.success('User deactivated');
            fetchUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to deactivate user');
        }
    };

    const openEditDialog = (user) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            role: user.role,
            phone: user.phone || '',
            company: user.company || '',
            is_active: user.is_active
        });
        setIsEditOpen(true);
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            name: '',
            role: 'project_manager',
            phone: '',
            company: ''
        });
        setSelectedUser(null);
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: 'bg-red-100 text-red-700',
            project_manager: 'bg-blue-100 text-blue-700',
            sales_agent: 'bg-green-100 text-green-700',
            partner: 'bg-purple-100 text-purple-700',
            supervisor: 'bg-orange-100 text-orange-700',
            fabricator: 'bg-yellow-100 text-yellow-700',
            client_b2b: 'bg-cyan-100 text-cyan-700',
            client_residential: 'bg-pink-100 text-pink-700'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="red-fade-bg min-h-screen" data-testid="users-page">
            <Header
                title="User Management"
                subtitle={`${filteredUsers.length} users`}
                actions={
                    isAdmin && (
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="btn-glow bg-red-500 hover:bg-red-600" data-testid="add-user-btn">
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="font-heading text-xl">Create New User</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Name *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Full name"
                                            required
                                            data-testid="user-name-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email *</Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="Email address"
                                            required
                                            data-testid="user-email-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password *</Label>
                                        <Input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Password"
                                            required
                                            data-testid="user-password-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role *</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) => setFormData({ ...formData, role: value })}
                                        >
                                            <SelectTrigger data-testid="user-role-select">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map(role => (
                                                    <SelectItem key={role} value={role}>
                                                        {getRoleDisplayName(role)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="Phone number"
                                            data-testid="user-phone-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Company</Label>
                                        <Input
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            placeholder="Company name"
                                            data-testid="user-company-input"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="btn-glow bg-red-500 hover:bg-red-600" disabled={loading} data-testid="create-user-btn">
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            Create User
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )
                }
            />

            <div className="p-6">
                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                    data-testid="search-users"
                                />
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full md:w-48" data-testid="role-filter">
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {roles.map(role => (
                                        <SelectItem key={role} value={role}>
                                            {getRoleDisplayName(role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">No users found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="table-row-hover" data-testid={`user-row-${user.id}`}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                        <span className="text-red-600 font-semibold">
                                                            {user.name?.charAt(0)?.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getRoleBadgeColor(user.role)}>
                                                    {getRoleDisplayName(user.role)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {user.phone && (
                                                        <p className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {user.phone}
                                                        </p>
                                                    )}
                                                    {user.company && (
                                                        <p className="flex items-center gap-1 text-gray-500">
                                                            <Building className="w-3 h-3" /> {user.company}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {formatDateTime(user.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" data-testid={`user-actions-${user.id}`}>
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {isAdmin && user.role !== 'admin' && (
                                                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-600">
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Deactivate
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading text-xl">Edit User</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEdit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(role => (
                                            <SelectItem key={role} value={role}>
                                                {getRoleDisplayName(role)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Phone number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Input
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                    placeholder="Company name"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="btn-glow bg-red-500 hover:bg-red-600" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
