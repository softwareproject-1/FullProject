'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, GripVertical, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { EntitlementRuleDto, ApprovalStepDto } from '@/lib/types';
import { leavesApi } from '@/services/api';

// Updated mock to match new DTO
const mockEntitlement: EntitlementRuleDto = {
    leaveTypeCode: 'AL01',
    daysPerYear: 21,
    eligibilityCriteria: {
        minTenure: 3,
        grade: 'G1',
        contractType: 'FULL_TIME'
    }
};

const mockWorkflow: ApprovalStepDto[] = [
    { role: 'MANAGER', level: 1 },
    { role: 'HR_ADMIN', level: 2 },
];

const getRoleDisplayName = (role: string) => {
    switch (role) {
        case 'MANAGER': return 'Direct Manager';
        case 'department_head': return 'Department Head';
        case 'HR_ADMIN': return 'HR Administrator';
        default: return role;
    }
};


export default function LeaveTypeConfigurationPage() {
    const params = useParams();
    const id = params.id as string; // This is actually the ID, but rules need code. 
    // In a real app we'd fetch the type by ID first to get the code. 
    // For now we assume the user enters the code manually or it enters from context?
    // Let's assume we maintain the ID usage for the route but use the code for the DTO.

    // State for Entitlement Tab
    const [entitlement, setEntitlement] = useState<EntitlementRuleDto>(mockEntitlement);

    // State for Workflow Tab
    const [workflow, setWorkflow] = useState<ApprovalStepDto[]>(mockWorkflow);
    const [payrollCode, setPayrollCode] = useState('LV_ANNUAL_001');

    const handleEntitlementSave = async () => {
        try {
            // Note: The API expects leaveTypeId in URL but DTO has leaveTypeCode. 
            // We pass the ID from params.
            await leavesApi.setEntitlementRule(id, entitlement);
            console.log('Saving entitlement for', id, entitlement);
            alert('Entitlement rules saved!');
        } catch (error) {
            console.error(error);
            alert('Failed to save rules');
        }
    };

    const handleWorkflowSave = async () => {
        try {
            await leavesApi.configureApprovalWorkflow(id, { approvalWorkflow: workflow, payrollCode });
            console.log('Saving workflow for', id, { workflow, payrollCode });
            alert('Workflow saved!');
        } catch (error) {
            console.error(error);
            alert('Failed to save workflow');
        }
    };

    const addWorkflowStep = () => {
        setWorkflow([...workflow, { role: 'MANAGER', level: workflow.length + 1 }]);
    };

    const removeWorkflowStep = (index: number) => {
        const newWorkflow = workflow.filter((_, i) => i !== index);
        // Re-order levels
        const reordered = newWorkflow.map((step, i) => ({ ...step, level: i + 1 }));
        setWorkflow(reordered);
    };

    const updateWorkflowStep = (index: number, role: string) => {
        const newWorkflow = [...workflow];
        newWorkflow[index].role = role;
        setWorkflow(newWorkflow);
    };

    return (
        <div className="space-y-6 container mx-auto py-6">
            <div className="flex items-center gap-4">
                <Link href="/leaves/configuration">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configure Leave Type</h1>
                    <p className="text-slate-500">ID: {id}</p>
                </div>
            </div>

            <Tabs defaultValue="entitlement" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="entitlement">Entitlement Rules</TabsTrigger>
                    <TabsTrigger value="workflow">Approval & Payroll</TabsTrigger>
                </TabsList>

                {/* --- ENTITLEMENT RULES TAB --- */}
                <TabsContent value="entitlement">
                    <Card>
                        <CardHeader>
                            <CardTitle>Entitlement Policy</CardTitle>
                            <CardDescription>
                                Define how employees earn this leave type.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Leave Type Code</Label>
                                    <Input
                                        value={entitlement.leaveTypeCode}
                                        onChange={(e) => setEntitlement({ ...entitlement, leaveTypeCode: e.target.value })}
                                        placeholder="AL01"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Minimum Service (Months)</Label>
                                    <Input
                                        type="number"
                                        value={entitlement.eligibilityCriteria?.minTenure || 0}
                                        onChange={(e) => setEntitlement({
                                            ...entitlement,
                                            eligibilityCriteria: {
                                                ...entitlement.eligibilityCriteria,
                                                minTenure: Number(e.target.value)
                                            }
                                        })}
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-slate-500">Months of service required before eligibility.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Days Per Year</Label>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={entitlement.daysPerYear}
                                            onChange={(e) => setEntitlement({ ...entitlement, daysPerYear: Number(e.target.value) })}
                                        />
                                        <span className="text-sm text-slate-500">days</span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-end">
                                <Button onClick={handleEntitlementSave} className="bg-slate-900">
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Entitlement Rules
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- WORKFLOW TAB --- */}
                <TabsContent value="workflow">
                    <Card>
                        <CardHeader>
                            <CardTitle>Approval Workflow</CardTitle>
                            <CardDescription>
                                Configure the chain of command for approving requests.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-medium text-slate-900">Approval Steps</h3>
                                    <Button variant="outline" size="sm" onClick={addWorkflowStep}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Step
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {workflow.map((step, index) => (
                                        <div key={index} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-sm">
                                                {step.level}
                                            </div>
                                            <GripVertical className="h-5 w-5 text-slate-400 cursor-grab" />

                                            <div className="flex-1 flex items-center gap-3">
                                                <span className="text-sm font-medium text-slate-900">
                                                    {getRoleDisplayName(step.role)}
                                                </span>
                                                <Select
                                                    value={step.role}
                                                    onValueChange={(val) => updateWorkflowStep(index, val)}
                                                >
                                                    <SelectTrigger className="w-[180px] h-8 text-xs">
                                                        <SelectValue placeholder="Change role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MANAGER">Direct Manager</SelectItem>
                                                        <SelectItem value="department_head">Department Head</SelectItem>
                                                        <SelectItem value="HR_ADMIN">HR Administrator</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeWorkflowStep(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {workflow.length === 0 && (
                                        <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                                            No approval steps defined. Requests will be auto-approved?
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-slate-900">Payroll Integration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Payroll Code</Label>
                                        <Input
                                            value={payrollCode}
                                            onChange={(e) => setPayrollCode(e.target.value)}
                                            placeholder="e.g. LV_ANN_01"
                                        />
                                        <p className="text-xs text-slate-500">Unique code used for payroll processing mapping.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleWorkflowSave} className="bg-slate-900">
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Workflow Configuration
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
