'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { leavesApi } from '@/services/api';
import { CreateLeaveTypeDto, PersonalizedEntitlementDto } from '@/lib/types';

export default function LeaveConfigurationPage() {
    const [types, setTypes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isOpen, setIsOpen] = useState(false);

    // Edit dialog state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<CreateLeaveTypeDto | null>(null);
    const [currentEditId, setCurrentEditId] = useState<string | null>(null);

    // Personalize dialog state
    const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
    const [personalizeMode, setPersonalizeMode] = useState<'individual' | 'group'>('individual');
    const [personalizeData, setPersonalizeData] = useState<{
        leaveTypeId?: string | null;
        employeeId?: string;
        yearlyEntitlement?: number;
        reason?: string;
        employeeIds?: string; // comma separated
        departmentIds?: string; // comma separated
        positionIds?: string; // comma separated
        contractTypes?: string; // comma separated
        locations?: string; // comma separated
    }>({ yearlyEntitlement: 0 });

    // Updated state to match CreateLeaveTypeDto
    const [formData, setFormData] = useState<CreateLeaveTypeDto>({
        code: '',
        name: '',
        categoryId: '',
        description: '',
        paid: true,
        deductible: false,
        requiresAttachment: false,
        payrollCode: '',
    });

    const openEdit = (type: any) => {
        setCurrentEditId(type._id || type.id || null);
        setEditFormData({
            code: type.code || '',
            name: type.name || '',
            categoryId: type.categoryId || '',
            description: type.description || '',
            paid: type.paid ?? true,
            deductible: type.deductible ?? false,
            requiresAttachment: type.requiresAttachment ?? false,
            payrollCode: type.payrollCode || '',
        });
        setIsEditOpen(true);
    };

    const openPersonalize = (type: any) => {
        setPersonalizeData({
            leaveTypeId: type._id || type.id || type.code || null,
            yearlyEntitlement: 0,
            reason: '',
            employeeId: '',
            employeeIds: '',
            departmentIds: '',
            positionIds: '',
            contractTypes: '',
            locations: '',
        });
        setPersonalizeMode('individual');
        setIsPersonalizeOpen(true);
    };

    const handlePersonalizeSubmit = async () => {
        if (!personalizeData.leaveTypeId || !personalizeData.yearlyEntitlement) {
            alert('Please provide leave type and yearly entitlement');
            return;
        }

        try {
            if (personalizeMode === 'individual') {
                if (!personalizeData.employeeId) {
                    alert('Enter an employee id');
                    return;
                }
                await leavesApi.setPersonalizedEntitlement({
                    leaveTypeId: personalizeData.leaveTypeId!,
                    employeeId: personalizeData.employeeId!,
                    yearlyEntitlement: personalizeData.yearlyEntitlement!,
                    reason: personalizeData.reason,
                });
                alert('Personalized entitlement assigned to employee');
            } else {
                // build group DTO
                const groupCriteria: any = {};
                if (personalizeData.employeeIds) groupCriteria.employeeIds = personalizeData.employeeIds.split(',').map(s => s.trim()).filter(Boolean);
                if (personalizeData.departmentIds) groupCriteria.departmentIds = personalizeData.departmentIds.split(',').map(s => s.trim()).filter(Boolean);
                if (personalizeData.positionIds) groupCriteria.positionIds = personalizeData.positionIds.split(',').map(s => s.trim()).filter(Boolean);
                if (personalizeData.contractTypes) groupCriteria.contractTypes = personalizeData.contractTypes.split(',').map(s => s.trim()).filter(Boolean);
                if (personalizeData.locations) groupCriteria.locations = personalizeData.locations.split(',').map(s => s.trim()).filter(Boolean);

                // Require at least one non-empty group filter to avoid accidental bulk/no-match calls
                const hasFilter = (groupCriteria.employeeIds && groupCriteria.employeeIds.length > 0)
                    || (groupCriteria.departmentIds && groupCriteria.departmentIds.length > 0)
                    || (groupCriteria.positionIds && groupCriteria.positionIds.length > 0)
                    || (groupCriteria.contractTypes && groupCriteria.contractTypes.length > 0)
                    || (groupCriteria.locations && groupCriteria.locations.length > 0);

                if (!hasFilter) {
                    alert('Please provide at least one group filter (employee IDs, department IDs, position IDs, contract types, or locations)');
                    return;
                }

                await leavesApi.setPersonalizedEntitlementGroup({
                    leaveTypeId: personalizeData.leaveTypeId!,
                    yearlyEntitlement: personalizeData.yearlyEntitlement!,
                    reason: personalizeData.reason,
                    groupCriteria
                });

                alert('Personalized entitlement assigned to group');
            }

            setIsPersonalizeOpen(false);
            setPersonalizeData({ yearlyEntitlement: 0 });
        } catch (error) {
            console.error('Failed to assign personalized entitlement', error);
            const message = (error as any)?.response?.data?.message || (error as any)?.message || 'Unknown error';
            alert('Failed to assign personalized entitlement: ' + message);
        }
    };

    const handleUpdate = async () => {
        if (!editFormData || !currentEditId) return;
        try {
            await leavesApi.updateLeaveType(currentEditId, editFormData);

            // Refresh list
            const response = await leavesApi.getLeaveTypes();
            setTypes(response.data);

            setIsEditOpen(false);
            setEditFormData(null);
            setCurrentEditId(null);
        } catch (error) {
            console.error('Failed to update leave type', error);
            alert('Failed to update leave type');
        }
    };

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await leavesApi.getLeaveTypes();
                setTypes(response.data);
            } catch (error) {
                console.error('Failed to fetch leave types', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTypes();
    }, []);

    const handleCreate = async () => {
        try {
            await leavesApi.createLeaveType(formData);

            // Refresh list
            const response = await leavesApi.getLeaveTypes();
            setTypes(response.data);

            setIsOpen(false);
            // Reset form
            setFormData({
                code: '',
                name: '',
                categoryId: '',
                description: '',
                paid: true,
                deductible: false,
                requiresAttachment: false,
                payrollCode: '',
            });
        } catch (error) {
            console.error('Failed to create leave type', error);
            alert('Failed to create leave type');
        }
    };

    return (
        <div className="space-y-6 container mx-auto py-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/leaves">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Configuration</h1>
                        <p className="text-slate-500">Manage leave types and their policies.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/leaves/configuration/calendar">
                        <Button variant="outline">Holiday Calendar</Button>
                    </Link>
                    <Link href="/leaves/admin/accruals">
                        <Button variant="outline">Accrual Admin</Button>
                    </Link>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Leave Type
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-white border-slate-200">
                            <DialogHeader>
                                <DialogTitle>Create Leave Type</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Annual Leave"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="code">Code</Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="e.g. AL01"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="categoryId">Category ID</Label>
                                        <Input
                                            id="categoryId"
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                            placeholder="e.g. CAT_STD"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="payrollCode">Payroll Code</Label>
                                        <Input
                                            id="payrollCode"
                                            value={formData.payrollCode}
                                            onChange={(e) => setFormData({ ...formData, payrollCode: e.target.value })}
                                            placeholder="e.g. P_AL"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Short description"
                                    />
                                </div>

                                <div className="flex flex-col gap-4 mt-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="paid">Paid Leave?</Label>
                                        <Switch
                                            id="paid"
                                            checked={formData.paid}
                                            onCheckedChange={(checked) => setFormData({ ...formData, paid: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="deductible">Deductible?</Label>
                                        <Switch
                                            id="deductible"
                                            checked={formData.deductible}
                                            onCheckedChange={(checked) => setFormData({ ...formData, deductible: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="requiresAttachment">Requires Attachment?</Label>
                                        <Switch
                                            id="requiresAttachment"
                                            checked={formData.requiresAttachment}
                                            onCheckedChange={(checked) => setFormData({ ...formData, requiresAttachment: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate}>Create Type</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Personalize Dialog */}
                    <Dialog open={isPersonalizeOpen} onOpenChange={setIsPersonalizeOpen}>
                        <DialogContent className="sm:max-w-[700px] bg-white border-slate-200">
                            <DialogHeader>
                                <DialogTitle>Assign Personalized Entitlement</DialogTitle>
                                <DialogDescription>Assign a custom entitlement to an individual or a group of employees.</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="flex gap-2">
                                    <Button variant={personalizeMode === 'individual' ? 'default' : 'ghost'} onClick={() => setPersonalizeMode('individual')}>Individual</Button>
                                    <Button variant={personalizeMode === 'group' ? 'default' : 'ghost'} onClick={() => setPersonalizeMode('group')}>Group</Button>
                                </div>

                                {personalizeMode === 'individual' ? (
                                    <div className="grid gap-2">
                                        <Label>Employee ID</Label>
                                        <Input value={personalizeData.employeeId || ''} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), employeeId: e.target.value })} placeholder="e.g. emp_123" />
                                        <Label>Yearly Entitlement</Label>
                                        <Input type="number" value={personalizeData.yearlyEntitlement} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), yearlyEntitlement: Number(e.target.value) })} />
                                        <Label>Reason (optional)</Label>
                                        <Input value={personalizeData.reason || ''} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), reason: e.target.value })} />
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        <Label>Employee IDs (comma separated)</Label>
                                        <Input value={personalizeData.employeeIds || ''} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), employeeIds: e.target.value })} placeholder="emp1,emp2" />
                                        <Label>Department IDs (comma separated)</Label>
                                        <Input value={personalizeData.departmentIds || ''} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), departmentIds: e.target.value })} placeholder="dept1,dept2" />
                                        <Label>Position IDs (comma separated)</Label>
                                        <Input value={personalizeData.positionIds || ''} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), positionIds: e.target.value })} placeholder="pos1,pos2" />
                                        <Label>Contract Types (comma separated)</Label>
                                        <Input value={personalizeData.contractTypes || ''} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), contractTypes: e.target.value })} placeholder="PERMANENT,CONTRACT" />
                                        <Label>Locations (comma separated)</Label>
                                        <Input value={personalizeData.locations || ''} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), locations: e.target.value })} placeholder="Egypt,USA" />
                                        <Label>Yearly Entitlement</Label>
                                        <Input type="number" value={personalizeData.yearlyEntitlement} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), yearlyEntitlement: Number(e.target.value) })} />
                                        <Label>Reason (optional)</Label>
                                        <Input value={personalizeData.reason || ''} onChange={(e) => setPersonalizeData({ ...(personalizeData as any), reason: e.target.value })} />
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button onClick={handlePersonalizeSubmit} className="bg-slate-900">Assign</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Leave Type Dialog */}
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="sm:max-w-[600px] bg-white border-slate-200">
                            <DialogHeader>
                                <DialogTitle>Edit Leave Type</DialogTitle>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input
                                            id="edit-name"
                                            value={editFormData?.name || ''}
                                            onChange={(e) => setEditFormData({ ...(editFormData as any), name: e.target.value })}
                                            placeholder="e.g. Annual Leave"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-code">Code</Label>
                                        <Input
                                            id="edit-code"
                                            value={editFormData?.code || ''}
                                            onChange={(e) => setEditFormData({ ...(editFormData as any), code: e.target.value })}
                                            placeholder="e.g. AL01"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-categoryId">Category ID</Label>
                                        <Input
                                            id="edit-categoryId"
                                            value={editFormData?.categoryId || ''}
                                            onChange={(e) => setEditFormData({ ...(editFormData as any), categoryId: e.target.value })}
                                            placeholder="e.g. CAT_STD"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-payrollCode">Payroll Code</Label>
                                        <Input
                                            id="edit-payrollCode"
                                            value={editFormData?.payrollCode || ''}
                                            onChange={(e) => setEditFormData({ ...(editFormData as any), payrollCode: e.target.value })}
                                            placeholder="e.g. P_AL"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Input
                                        id="edit-description"
                                        value={editFormData?.description || ''}
                                        onChange={(e) => setEditFormData({ ...(editFormData as any), description: e.target.value })}
                                        placeholder="Short description"
                                    />
                                </div>

                                <div className="flex flex-col gap-4 mt-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="edit-paid">Paid Leave?</Label>
                                        <Switch
                                            id="edit-paid"
                                            checked={editFormData?.paid ?? true}
                                            onCheckedChange={(checked) => setEditFormData({ ...(editFormData as any), paid: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="edit-deductible">Deductible?</Label>
                                        <Switch
                                            id="edit-deductible"
                                            checked={editFormData?.deductible ?? false}
                                            onCheckedChange={(checked) => setEditFormData({ ...(editFormData as any), deductible: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="edit-requiresAttachment">Requires Attachment?</Label>
                                        <Switch
                                            id="edit-requiresAttachment"
                                            checked={editFormData?.requiresAttachment ?? false}
                                            onCheckedChange={(checked) => setEditFormData({ ...(editFormData as any), requiresAttachment: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleUpdate} className="bg-slate-900">Save Changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="bg-white border-slate-200">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {types.map((type) => (
                            <TableRow key={type._id || type.id}>
                                <TableCell className="font-mono text-xs">{type.code}</TableCell>
                                <TableCell className="font-medium">{type.name}</TableCell>
                                <TableCell className="text-slate-500">{type.description}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.paid ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                                        }`}>
                                        {type.paid ? 'Paid' : 'Unpaid'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(type)}>
                                        Edit
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => openPersonalize(type)}>
                                        Personalize
                                    </Button>
                                    <Link href={`/leaves/configuration/${type._id || type.id}`}>
                                        <Button variant="outline" size="sm">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Configure
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
