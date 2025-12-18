'use client'

import { useState, useEffect } from 'react';
import { offboardingApi } from '../../../services/api';
import { ClearanceChecklist, TerminationRequest, ApprovalStatus, TerminationStatus } from '../../../lib/types';
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus,
  Package,
  CreditCard,
  User,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../../components/Card';

interface OffboardingChecklistManagerProps {
  approvedTerminations: TerminationRequest[];
  userId: string;
  onRefresh: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface ChecklistWithTermination {
  termination: TerminationRequest;
  checklist: ClearanceChecklist | null;
}

// Default departments for offboarding checklist
const DEFAULT_DEPARTMENTS = [
  'IT_Department',
  'HR_Department', 
  'Finance',
  'Facilities',
  'Security',
  'System_Access',
];

// Predefined offboarding checklist items
const OFFBOARDING_CHECKLIST_ITEMS = [
  {
    category: 'IT & Systems',
    items: [
      'Company Laptop',
      'Company Mobile Phone',
      'Desk Phone',
      'Tablet/iPad',
      'Monitor(s)',
      'Keyboard & Mouse',
      'Headset',
      'Charging Cables',
      'USB Drives',
      'External Hard Drives',
    ]
  },
  {
    category: 'Access & Security',
    items: [
      'Employee ID Badge',
      'Access Card',
      'Office Keys',
      'Parking Pass',
      'Building Access Fob',
      'Cabinet/Locker Keys',
      'Email Account Access',
      'System Account Deactivation',
      'VPN Access Revocation',
      'Cloud Storage Access',
    ]
  },
  {
    category: 'Finance & Payments',
    items: [
      'Corporate Credit Card',
      'Fuel Card',
      'Petty Cash',
      'Expense Reimbursements Cleared',
      'Final Paycheck Issued',
      'Benefits Settlement',
      'Unused Leave Payout',
    ]
  },
  {
    category: 'Documentation',
    items: [
      'Company Documents Return',
      'Confidential Files Return',
      'Exit Interview Completed',
      'Non-Disclosure Agreement Signed',
      'Non-Compete Agreement Review',
      'Clearance Form Signed',
      'Knowledge Transfer Document',
    ]
  },
  {
    category: 'Handover',
    items: [
      'Project Handover Complete',
      'Client Contacts Transferred',
      'Ongoing Tasks Documented',
      'Team Knowledge Transfer',
      'Email Forwarding Setup',
      'Calendar Handover',
    ]
  },
];

export function OffboardingChecklistManager({
  approvedTerminations,
  userId,
  onRefresh,
  onSuccess,
  onError,
}: OffboardingChecklistManagerProps) {
  const [checklistsData, setChecklistsData] = useState<ChecklistWithTermination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(new Set());
  const [creatingChecklist, setCreatingChecklist] = useState<string | null>(null);
  const [newEquipmentInputs, setNewEquipmentInputs] = useState<Record<string, string>>({});

  // Fetch checklists for all approved terminations
  useEffect(() => {
    const fetchChecklists = async () => {
      setIsLoading(true);
      const results: ChecklistWithTermination[] = [];
      
      for (const termination of approvedTerminations) {
        try {
          const response = await offboardingApi.checklist.getByTermination(termination._id);
          results.push({ termination, checklist: response.data });
        } catch (err: any) {
          if (err.response?.status === 404) {
            results.push({ termination, checklist: null });
          }
        }
      }
      
      setChecklistsData(results);
      setIsLoading(false);
    };

    if (approvedTerminations.length > 0) {
      fetchChecklists();
    } else {
      setChecklistsData([]);
      setIsLoading(false);
    }
  }, [approvedTerminations]);

  // Create checklist for a termination
  const handleCreateChecklist = async (terminationId: string) => {
    setCreatingChecklist(terminationId);
    try {
      await offboardingApi.checklist.create({
        terminationId,
        departments: DEFAULT_DEPARTMENTS,
        hrManagerId: userId,
      });
      onSuccess('Offboarding checklist created successfully');
      onRefresh();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to create checklist');
    } finally {
      setCreatingChecklist(null);
    }
  };

  // Handle department sign-off
  const handleDepartmentSignOff = async (
    checklistId: string, 
    department: string, 
    status: 'approved' | 'rejected'
  ) => {
    try {
      await offboardingApi.clearance.departmentSignOff(checklistId, userId, {
        department,
        status,
        comments: `${status === 'approved' ? 'Cleared' : 'Not cleared'} by HR`,
      });
      onSuccess(`Department ${department.replace('_', ' ')} ${status}`);
      onRefresh();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to update department status');
    }
  };

  // Handle equipment return
  const handleEquipmentReturn = async (
    checklistId: string,
    equipmentId: string,
    returned: boolean
  ) => {
    try {
      await offboardingApi.clearance.updateEquipmentReturn(checklistId, {
        equipmentId,
        returned,
        condition: returned ? 'Good' : undefined,
      });
      onSuccess(`Equipment ${returned ? 'marked as returned' : 'marked as pending'}`);
      onRefresh();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to update equipment status');
    }
  };

  // Handle add equipment
  const handleAddEquipment = async (checklistId: string) => {
    const equipmentName = newEquipmentInputs[checklistId]?.trim();
    if (!equipmentName) return;

    try {
      await offboardingApi.clearance.addEquipment(checklistId, { name: equipmentName });
      setNewEquipmentInputs(prev => ({ ...prev, [checklistId]: '' }));
      onSuccess('Equipment added successfully');
      onRefresh();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to add equipment');
    }
  };

  // Handle access card return
  const handleAccessCardReturn = async (checklistId: string, returned: boolean) => {
    try {
      await offboardingApi.clearance.updateAccessCardReturn(checklistId, { returned });
      onSuccess(`Access card ${returned ? 'marked as returned' : 'marked as pending'}`);
      onRefresh();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to update access card status');
    }
  };

  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    setExpandedChecklists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Calculate progress
  const calculateProgress = (checklist: ClearanceChecklist) => {
    const totalDepts = checklist.items.length;
    const approvedDepts = checklist.items.filter(i => i.status === ApprovalStatus.APPROVED).length;
    const totalEquip = checklist.equipmentList.length;
    const returnedEquip = checklist.equipmentList.filter(i => i.returned).length;
    
    const deptProgress = totalDepts > 0 ? (approvedDepts / totalDepts) * 100 : 0;
    const equipProgress = totalEquip > 0 ? (returnedEquip / totalEquip) * 100 : 100;
    const cardProgress = checklist.cardReturned ? 100 : 0;
    
    // Weighted average: departments 50%, equipment 30%, card 20%
    const overall = (deptProgress * 0.5) + (equipProgress * 0.3) + (cardProgress * 0.2);
    
    return {
      deptProgress: Math.round(deptProgress),
      equipProgress: Math.round(equipProgress),
      cardProgress: Math.round(cardProgress),
      overall: Math.round(overall),
      approvedDepts,
      totalDepts,
      returnedEquip,
      totalEquip,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
        <span className="ml-3 text-slate-600">Loading checklists...</span>
      </div>
    );
  }

  if (checklistsData.length === 0) {
    return (
      <Card title="Offboarding Checklists">
        <div className="text-center py-12">
          <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Approved Cases</h3>
          <p className="text-slate-500">
            There are no approved termination cases requiring offboarding checklists.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Checklists</p>
              <p className="text-xl font-bold text-slate-900">
                {checklistsData.filter(d => d.checklist).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending Creation</p>
              <p className="text-xl font-bold text-slate-900">
                {checklistsData.filter(d => !d.checklist).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Completed</p>
              <p className="text-xl font-bold text-slate-900">
                {checklistsData.filter(d => d.checklist && calculateProgress(d.checklist).overall === 100).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-xl font-bold text-slate-900">
                {checklistsData.filter(d => d.checklist && calculateProgress(d.checklist).overall > 0 && calculateProgress(d.checklist).overall < 100).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Checklists List */}
      <Card title="Offboarding Checklists">
        <div className="space-y-4">
          {checklistsData.map(({ termination, checklist }) => {
            const isExpanded = expandedChecklists.has(termination._id);
            const progress = checklist ? calculateProgress(checklist) : null;

            return (
              <div 
                key={termination._id}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                {/* Header */}
                <div 
                  className={`p-4 cursor-pointer transition-colors ${
                    checklist ? 'bg-white hover:bg-slate-50' : 'bg-amber-50 hover:bg-amber-100'
                  }`}
                  onClick={() => toggleExpanded(termination._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${checklist ? 'bg-blue-100' : 'bg-amber-100'}`}>
                        <User className={`w-5 h-5 ${checklist ? 'text-blue-600' : 'text-amber-600'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          Employee: {termination.employeeId.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-sm text-slate-600">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Last Day: {termination.terminationDate 
                            ? new Date(termination.terminationDate).toLocaleDateString()
                            : 'Not set'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {checklist && progress && (
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            progress.overall === 100 ? 'text-green-600' :
                            progress.overall >= 50 ? 'text-blue-600' : 'text-yellow-600'
                          }`}>
                            {progress.overall}%
                          </p>
                          <p className="text-xs text-slate-500">Complete</p>
                        </div>
                      )}
                      
                      {!checklist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateChecklist(termination._id);
                          }}
                          disabled={creatingChecklist === termination._id}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {creatingChecklist === termination._id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Create Checklist
                        </button>
                      )}
                      
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar (visible when collapsed) */}
                  {checklist && !isExpanded && (
                    <div className="mt-3">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            progress!.overall === 100 ? 'bg-green-600' :
                            progress!.overall >= 50 ? 'bg-blue-600' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${progress!.overall}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && checklist && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-6">
                    {/* Progress Breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">Department Clearance</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-slate-900">
                            {progress!.approvedDepts}/{progress!.totalDepts}
                          </span>
                          <span className={`text-sm font-medium ${
                            progress!.deptProgress === 100 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {progress!.deptProgress}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">Equipment Returned</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-slate-900">
                            {progress!.returnedEquip}/{progress!.totalEquip}
                          </span>
                          <span className={`text-sm font-medium ${
                            progress!.equipProgress === 100 ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {progress!.equipProgress}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">Access Card</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-lg font-bold ${
                            checklist.cardReturned ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {checklist.cardReturned ? 'Returned' : 'Pending'}
                          </span>
                          <button
                            onClick={() => handleAccessCardReturn(checklist._id, !checklist.cardReturned)}
                            className={`px-2 py-1 text-xs rounded ${
                              checklist.cardReturned 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                          >
                            {checklist.cardReturned ? '✓' : 'Mark Returned'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Department Clearances */}
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Department Clearances
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {checklist.items.map((item, idx) => (
                          <div 
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              item.status === ApprovalStatus.APPROVED 
                                ? 'bg-green-50 border-green-200' 
                                : item.status === ApprovalStatus.REJECTED
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-white border-slate-200'
                            }`}
                          >
                            <span className="font-medium text-slate-900">{item.department.replace(/_/g, ' ')}</span>
                            {item.status === ApprovalStatus.PENDING ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDepartmentSignOff(checklist._id, item.department, 'approved')}
                                  className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDepartmentSignOff(checklist._id, item.department, 'rejected')}
                                  className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                item.status === ApprovalStatus.APPROVED 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {item.status === ApprovalStatus.APPROVED ? '✓ Cleared' : '✗ Issue'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equipment List */}
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        Equipment Recovery
                      </h5>
                      
                      {/* Add Equipment */}
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={newEquipmentInputs[checklist._id] || ''}
                          onChange={(e) => setNewEquipmentInputs(prev => ({ 
                            ...prev, 
                            [checklist._id]: e.target.value 
                          }))}
                          placeholder="Add equipment (e.g., Laptop, Phone, Keys)"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddEquipment(checklist._id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddEquipment(checklist._id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Equipment Items */}
                      {checklist.equipmentList.length === 0 ? (
                        <p className="text-slate-500 text-center py-4 bg-white rounded-lg border border-slate-200">
                          No equipment added yet. Add items that need to be returned.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {checklist.equipmentList.map((equip, idx) => (
                            <div 
                              key={idx}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                equip.returned ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Package className={`w-4 h-4 ${equip.returned ? 'text-green-600' : 'text-slate-400'}`} />
                                <span className="font-medium text-slate-900">{equip.name}</span>
                                {equip.condition && (
                                  <span className="text-xs text-slate-500">({equip.condition})</span>
                                )}
                              </div>
                              <button
                                onClick={() => handleEquipmentReturn(
                                  checklist._id, 
                                  equip.equipmentId || String(idx), 
                                  !equip.returned
                                )}
                                className={`px-3 py-1 text-sm font-medium rounded ${
                                  equip.returned 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {equip.returned ? '✓ Returned' : 'Mark Returned'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Access Card Section */}
                    <div>
                      <h5 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        Access Card / ID Badge
                      </h5>
                      <div className={`p-4 rounded-lg border ${
                        checklist.cardReturned ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className={`w-6 h-6 ${
                              checklist.cardReturned ? 'text-green-600' : 'text-yellow-600'
                            }`} />
                            <div>
                              <p className="font-medium text-slate-900">Employee Access Card</p>
                              <p className="text-sm text-slate-600">
                                {checklist.cardReturned 
                                  ? 'Card has been returned and deactivated'
                                  : 'Waiting for card return'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAccessCardReturn(checklist._id, !checklist.cardReturned)}
                            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                              checklist.cardReturned 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                          >
                            {checklist.cardReturned ? '✓ Returned' : 'Mark as Returned'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comprehensive Offboarding Checklist */}
                    <div className="border-t-2 border-slate-300 pt-6">
                      <div className="mb-4">
                        <h5 className="font-bold text-slate-900 text-lg mb-1 flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-purple-600" />
                          Complete Offboarding Checklist
                        </h5>
                        <p className="text-sm text-slate-600">
                          Use this comprehensive checklist to ensure all offboarding tasks are completed
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        {OFFBOARDING_CHECKLIST_ITEMS.map((section, sectionIdx) => (
                          <div key={sectionIdx} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-slate-200">
                              <h6 className="font-semibold text-slate-900">{section.category}</h6>
                            </div>
                            <div className="p-3">
                              <div className="grid grid-cols-2 gap-2">
                                {section.items.map((item, itemIdx) => {
                                  // Check if item exists in equipment list
                                  const isInEquipment = checklist.equipmentList.some(
                                    eq => eq.name.toLowerCase().includes(item.toLowerCase()) || 
                                          item.toLowerCase().includes(eq.name.toLowerCase())
                                  );
                                  const equipItem = checklist.equipmentList.find(
                                    eq => eq.name.toLowerCase().includes(item.toLowerCase()) || 
                                          item.toLowerCase().includes(eq.name.toLowerCase())
                                  );
                                  
                                  return (
                                    <div 
                                      key={itemIdx}
                                      className={`flex items-center justify-between p-2 rounded border text-sm ${
                                        isInEquipment && equipItem?.returned
                                          ? 'bg-green-50 border-green-200' 
                                          : 'bg-slate-50 border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                          isInEquipment && equipItem?.returned
                                            ? 'bg-green-500 border-green-600' 
                                            : 'bg-white border-slate-300'
                                        }`}>
                                          {isInEquipment && equipItem?.returned && (
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                          )}
                                        </div>
                                        <span className={`${
                                          isInEquipment && equipItem?.returned 
                                            ? 'text-slate-700 line-through' 
                                            : 'text-slate-900'
                                        }`}>
                                          {item}
                                        </span>
                                      </div>
                                      {!isInEquipment && (
                                        <button
                                          onClick={() => {
                                            setNewEquipmentInputs(prev => ({ 
                                              ...prev, 
                                              [checklist._id]: item 
                                            }));
                                            handleAddEquipment(checklist._id);
                                          }}
                                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                          title="Add to tracking"
                                        >
                                          + Track
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quick Add All from Category */}
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900 font-medium mb-2">
                          💡 Quick Tip: Click "+ Track" next to items to add them to your equipment tracking list above.
                        </p>
                        <p className="text-xs text-blue-700">
                          Items already in the equipment list are automatically checked when marked as returned.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No checklist message */}
                {isExpanded && !checklist && (
                  <div className="border-t border-slate-200 p-6 bg-amber-50 text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <p className="text-amber-800 font-medium">Checklist not yet created</p>
                    <p className="text-sm text-amber-600 mt-1">
                      Click "Create Checklist" to start the offboarding process for this employee.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
