'use client'

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import RouteGuard from '../../components/RouteGuard';
import { AccountProvisioningPanel } from '../../components/AccountProvisioningPanel';

import {
  UserPlus,
  CheckCircle2,
  FileText,
  Key,
  Package,
  RefreshCw,
  Briefcase,
  Users,
  Calendar,
  Gift,
  BarChart3,
  Building2,
  MapPin,
  Clock,
  Eye,
  Send,
  X as XIcon,
  XCircle,
  AlertCircle,
  Trash2,
  Upload,
  Bell,
  CreditCard,
  Shield,
  Star,
  PenLine,
  Award,
  UserX,
  Plus,
  Edit,
  Settings,
} from 'lucide-react';
import { recruitmentApi, onboardingApi, offboardingApi } from '../../services/api';
import { useAuth } from '@/contexts/AuthContext';
import { mockOnboardingTasks } from '../../lib/api';
import {
  Application,
  ApplicationStage,
  ApplicationStatus,
  InterviewMethod,
  JobTemplate,
  JobRequisition,
  Interview,
  Offer,
  PipelineColumn,
  OnboardingTracker,
  OnboardingTaskStatus,
  OnboardingTaskItem,
  ChecklistTemplate,
  ChecklistTaskTemplate,
  ComplianceDocument,
  TerminationRequest,
  TerminationStatus,
  TerminationInitiation,
  Reservation,
  SystemProvisioning,
  HiringStage,
  Referral,
} from '../../lib/types';

// Map backend stage/status to UI column
function getColumnForApplication(stage: ApplicationStage, status: ApplicationStatus): PipelineColumn {
  if (status === ApplicationStatus.REJECTED) return 'Rejected';
  if (status === ApplicationStatus.HIRED) return 'Hired';

  switch (stage) {
    case ApplicationStage.SCREENING:
      return 'Applied';
    case ApplicationStage.DEPARTMENT_INTERVIEW:
    case ApplicationStage.HR_INTERVIEW:
      return 'Interview';
    case ApplicationStage.OFFER:
      return 'Offer';
    default:
      return 'Applied';
  }
}

function getStageDisplayName(stage: ApplicationStage): string {
  switch (stage) {
    case ApplicationStage.SCREENING:
      return 'Screening';
    case ApplicationStage.DEPARTMENT_INTERVIEW:
      return 'Dept. Interview';
    case ApplicationStage.HR_INTERVIEW:
      return 'HR Interview';
    case ApplicationStage.OFFER:
      return 'Offer';
    default:
      return stage;
  }
}

// Helper to safely get ID string from string or object
function getIdString(id: string | any): string {
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && id._id) return id._id;
  return String(id || '');
}

export default function Recruitment() {
  const { user, isHRManager, isHREmployee, isRecruiter, isSystemAdmin, hasPermission } = useAuth();

  // Check if user has recruitment access
  const canManageRecruitment = hasPermission('manageRecruitment') || isHRManager() || isSystemAdmin() || isRecruiter();
  const canViewOnboarding = hasPermission('manageOnboarding') || hasPermission('viewOnboarding') || isHRManager() || isSystemAdmin() || isHREmployee();
  const canManageOffboarding = hasPermission('manageOffboarding') || isHRManager() || isSystemAdmin();
  const canViewOffboarding = hasPermission('viewOffboarding') || canManageOffboarding || isHREmployee();

  // Main view tabs
  const [currentView, setCurrentView] = useState<'pipeline' | 'onboarding' | 'offboarding'>('pipeline');

  // Pipeline sub-tabs - added 'stages' and 'referrals' for REC-004 and REC-030
  const [pipelineTab, setPipelineTab] = useState<'candidates' | 'jobs' | 'interviews' | 'offers' | 'stages' | 'referrals' | 'analytics'>('candidates');

  // Data states
  const [applications, setApplications] = useState<Application[]>([]);
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [hiringStages, setHiringStages] = useState<HiringStage[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  // Offboarding data states
  const [offboardingCases, setOffboardingCases] = useState<TerminationRequest[]>([]);
  const [isOffboardingLoading, setIsOffboardingLoading] = useState(false);
  const [offboardingSuccess, setOffboardingSuccess] = useState<string | null>(null);
  const [employeePerformanceData, setEmployeePerformanceData] = useState<any>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [expandedOffboardingCase, setExpandedOffboardingCase] = useState<string | null>(null);
  const [offboardingChecklists, setOffboardingChecklists] = useState<{ [key: string]: any }>({});
  const [newEquipment, setNewEquipment] = useState({ name: '', equipmentId: '' });

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Offboarding form
  const [isOffboardingModalOpen, setIsOffboardingModalOpen] = useState(false);
  const [offboardingForm, setOffboardingForm] = useState({
    type: 'Resignation' as 'Resignation' | 'Termination',
    employeeId: '',
    contractId: '',
    lastWorkingDay: '',
    reason: '',
    comments: '',
  });

  // Job Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    title: '',
    department: '',
    description: '',
    qualifications: '',
    skills: '',
  });

  // Job Requisition Modal
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobForm, setJobForm] = useState({
    requisitionId: '',
    templateId: '',
    openings: 1,
    location: '',
    hiringManagerId: '',
  });

  // Add Candidate Modal
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    candidateId: '',
    jobRequisitionId: '',
  });

  // Schedule Interview Modal
  const [isScheduleInterviewModalOpen, setIsScheduleInterviewModalOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    applicationId: '',
    stage: ApplicationStage.DEPARTMENT_INTERVIEW,
    scheduledDate: '',
    method: InterviewMethod.VIDEO,
    videoLink: '',
    panel: '', // Comma-separated ObjectIds
  });

  // Feedback Modal
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    interviewerId: '',
    score: 50,
    comments: '',
  });

  // Offer Modal
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({
    applicationId: '',
    grossSalary: 0,
    signingBonus: 0,
    benefits: '',
    offerExpiry: '',
  });

  // REC-018: Offer Sign/Respond Modal
  const [isOfferActionsModalOpen, setIsOfferActionsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerResponseForm, setOfferResponseForm] = useState({
    response: 'accepted' as 'accepted' | 'rejected' | 'pending',
    notes: '',
  });
  const [offerSignForm, setOfferSignForm] = useState({
    signerId: '',
    role: 'candidate' as 'candidate' | 'hr' | 'manager',
  });

  // REC-030: Referral Modal
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [referralForm, setReferralForm] = useState({
    referringEmployeeId: '',
    candidateId: '',
    role: '',
    level: '',
  });

  // REC-021: Panel Management Modal
  const [isPanelModalOpen, setIsPanelModalOpen] = useState(false);
  const [panelForm, setPanelForm] = useState({
    panelIds: '',
  });

  // REC-022: Rejection Modal with Templates
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionApplicationId, setRejectionApplicationId] = useState<string>('');
  const [rejectionForm, setRejectionForm] = useState({
    template: 'standard',
    customMessage: '',
    sendNotification: true,
  });
  const rejectionTemplates = {
    standard: 'Thank you for your interest in the position. After careful consideration of your application, we have decided to proceed with other candidates whose qualifications more closely match our current requirements. We appreciate the time you invested and wish you the best in your job search.',
    after_interview: 'Thank you for taking the time to interview with us. While we were impressed with your background and experience, we have decided to move forward with another candidate who more closely matches our needs at this time. We encourage you to apply for future openings that match your skills.',
    position_filled: 'Thank you for your interest in this position. We wanted to let you know that we have successfully filled this role. We appreciate your application and encourage you to check our careers page for future opportunities.',
    custom: '',
  };

  // Onboarding States
  const [onboardingTab, setOnboardingTab] = useState<'tracker' | 'templates' | 'documents' | 'resources' | 'contracts'>('tracker');
  const [onboardings, setOnboardings] = useState<OnboardingTracker[]>([]);
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingTracker | null>(null);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [complianceDocuments, setComplianceDocuments] = useState<ComplianceDocument[]>([]);
  const [provisioning, setProvisioning] = useState<SystemProvisioning | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<any>(null);

  // ONB-002: Contracts & Employee Profile Creation
  const [signedContracts, setSignedContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [isContractDetailsModalOpen, setIsContractDetailsModalOpen] = useState(false);
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false);
  const [createEmployeeForm, setCreateEmployeeForm] = useState({
    department: '',
    position: '',
    startDate: new Date().toISOString().split('T')[0],
    managerId: '',
  });

  // Onboarding Modals
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isUploadDocumentModalOpen, setIsUploadDocumentModalOpen] = useState(false);
  const [isReserveResourceModalOpen, setIsReserveResourceModalOpen] = useState(false);
  const [isProvisionAccessModalOpen, setIsProvisionAccessModalOpen] = useState(false);
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
  const [isDeleteTemplateConfirmOpen, setIsDeleteTemplateConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ChecklistTemplate | null>(null);

  // Onboarding Forms
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    departmentId: '',
    isDefault: false,
    tasks: [] as { name: string; department: string; category: string; daysFromStart: number; description: string }[],
  });
  const [newTask, setNewTask] = useState({
    name: '',
    department: '',
    category: 'HR',
    daysFromStart: 1,
    description: '',
  });

  const [documentFormData, setDocumentFormData] = useState({
    documentType: 'ID',
    documentUrl: '',
    fileName: '',
  });

  const [resourceFormData, setResourceFormData] = useState({
    type: 'equipment' as 'equipment' | 'desk' | 'access_card',
    itemName: '',
    notes: '',
    building: '',
    floor: '',
    accessLevel: 'standard',
    areas: [] as string[],
  });

  const [applyTemplateForm, setApplyTemplateForm] = useState({
    templateId: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const [provisionAccessForm, setProvisionAccessForm] = useState({
    systems: [] as string[],
    priority: 'normal' as 'low' | 'normal' | 'high',
  });

  // Data Fetching
  const fetchApplications = useCallback(async () => {
    try {
      const response = await recruitmentApi.applications.getAll();
      console.log('Fetched applications:', response.data);
      setApplications(response.data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      // Silently fail if backend is not running
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await recruitmentApi.templates.getAll();
      setTemplates(response.data);
    } catch (err) {
      // Silently fail if backend is not running
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await recruitmentApi.jobs.getAll();
      setJobs(response.data);
    } catch (err) {
      // Silently fail if backend is not running
    }
  }, []);

  const fetchInterviews = useCallback(async () => {
    try {
      const response = await recruitmentApi.interviews.getAll();
      setInterviews(response.data);
    } catch (err) {
      // Silently fail if backend is not running
    }
  }, []);

  const fetchOffers = useCallback(async () => {
    try {
      const response = await recruitmentApi.offers.getAll();
      setOffers(response.data);
    } catch (err) {
      // Silently fail if backend is not running
    }
  }, []);

  // REC-004: Fetch Hiring Stages
  const fetchHiringStages = useCallback(async () => {
    try {
      const response = await recruitmentApi.stages.getAll();
      setHiringStages(response.data);
    } catch (err) {
      // Silently fail if backend is not running
    }
  }, []);

  // REC-030: Fetch Referral Applications
  const fetchReferrals = useCallback(async () => {
    try {
      const response = await recruitmentApi.referrals.getApplications();
      console.log('Fetched referral applications:', response.data);
      // Note: Referral applications are already included in the main applications array
      // with isReferral: true flag. This endpoint is for validation/debugging.
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    }
  }, []);

  const fetchOnboardings = useCallback(async () => {
    try {
      const response = await onboardingApi.tracker.getAll();
      setOnboardings(response.data);
    } catch (err: any) {
      console.error('Failed to fetch onboardings:', err);
      // Don't throw, just log - prevents redirect loop
      if (err.response?.status !== 401) {
        // Only show error for non-auth issues
        const errorMsg = err.response?.data?.message || 'Could not load onboarding data';
        console.warn(errorMsg);
      }
    }
  }, []);

  const fetchChecklistTemplates = useCallback(async () => {
    try {
      const response = await onboardingApi.templates.getAll();
      setChecklistTemplates(response.data);
    } catch (err: any) {
      console.error('Failed to fetch checklist templates:', err);
      // Don't throw, just log - prevents redirect loop
      if (err.response?.status !== 401) {
        const errorMsg = err.response?.data?.message || 'Could not load templates';
        console.warn(errorMsg);
      }
    }
  }, []);

  const fetchOffboardingCases = useCallback(async () => {
    try {
      const response = await offboardingApi.termination.getPending();
      setOffboardingCases(response.data);
    } catch (err: any) {
      console.error('Failed to fetch offboarding cases:', err);
      if (err.response?.status !== 401) {
        console.warn('Could not load offboarding data');
      }
    }
  }, []);

  const fetchEmployeePerformance = useCallback(async (employeeId: string) => {
    if (!employeeId || employeeId.length !== 24) {
      setEmployeePerformanceData(null);
      return;
    }

    setIsLoadingPerformance(true);
    try {
      const response = await offboardingApi.termination.getEmployeePerformance(employeeId);
      setEmployeePerformanceData(response.data);
    } catch (err: any) {
      console.error('Failed to fetch employee performance:', err);
      setEmployeePerformanceData(null);
    } finally {
      setIsLoadingPerformance(false);
    }
  }, []);

  const fetchOffboardingChecklist = useCallback(async (terminationId: string) => {
    try {
      const response = await offboardingApi.checklist.getByTermination(terminationId);
      setOffboardingChecklists(prev => ({ ...prev, [terminationId]: response.data }));
    } catch (err: any) {
      // 404 is expected when no checklist exists yet - this is not an error
      if (err.response?.status !== 404) {
        console.error('Failed to fetch checklist:', err);
      }
      setOffboardingChecklists(prev => ({ ...prev, [terminationId]: null }));
    }
  }, []);

  const createOffboardingChecklist = async (terminationId: string) => {
    try {
      const response = await offboardingApi.checklist.create({ terminationId });
      // Use the created checklist directly from response
      setOffboardingChecklists(prev => ({ ...prev, [terminationId]: response.data }));
      setOffboardingSuccess('Checklist created successfully');
      setTimeout(() => setOffboardingSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to create checklist:', err);
      console.error('Error details:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Failed to create checklist';
      setError(errorMsg);
    }
  };

  const addEquipmentToChecklist = async (checklistId: string, terminationId: string) => {
    if (!newEquipment.name) return;

    try {
      // Only include equipmentId if it's a valid 24-character MongoDB ObjectId
      const isValidObjectId = newEquipment.equipmentId && newEquipment.equipmentId.length === 24 && /^[a-f0-9]{24}$/i.test(newEquipment.equipmentId);

      const response = await offboardingApi.checklist.addEquipment(checklistId, {
        equipment: [{
          name: newEquipment.name,
          ...(isValidObjectId && { equipmentId: newEquipment.equipmentId })
        }]
      });
      setNewEquipment({ name: '', equipmentId: '' });
      // Use the updated checklist from the response
      setOffboardingChecklists(prev => ({ ...prev, [terminationId]: response.data }));
      setOffboardingSuccess('Equipment added to checklist');
      setTimeout(() => setOffboardingSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to add equipment:', err);
      console.error('Error details:', err.response?.data);
      const errorMsg = err.response?.data?.message
        || (Array.isArray(err.response?.data?.message) ? err.response?.data?.message.join(', ') : null)
        || 'Failed to add equipment';
      setError(errorMsg);
    }
  };

  const markEquipmentReturned = async (checklistId: string, equipmentId: string, terminationId: string, returned: boolean) => {
    try {
      await offboardingApi.clearance.updateEquipmentReturn(checklistId, {
        equipmentId,
        returned,
        condition: returned ? 'good' : undefined
      });
      await fetchOffboardingChecklist(terminationId);
    } catch (err: any) {
      console.error('Failed to update equipment:', err);
      setError('Failed to update equipment status');
    }
  };

  const revokeAccessImmediately = async (employeeId: string, terminationId: string) => {
    try {
      await offboardingApi.access.revokeImmediately({
        employeeId,
        reason: 'termination',
        terminationId
      });

      // Refresh checklist to show the updated System_Access item
      await fetchOffboardingChecklist(terminationId);

      setOffboardingSuccess('Access revoked immediately for security');
      setTimeout(() => setOffboardingSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to revoke access:', err);
      setError('Failed to revoke access');
    }
  };

  const handleDepartmentSignOff = async (checklistId: string, department: string, status: 'approved' | 'rejected', terminationId: string) => {
    try {
      const userId = user?.id || 'system';
      await offboardingApi.clearance.departmentSignOff(checklistId, userId, {
        department,
        status,
        comments: status === 'approved' ? `${department} clearance approved` : `${department} clearance rejected`
      });
      await fetchOffboardingChecklist(terminationId);
      setOffboardingSuccess(`${department} clearance ${status}`);
      setTimeout(() => setOffboardingSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to update department clearance:', err);
      setError(`Failed to update ${department} clearance`);
    }
  };

  const triggerFinalSettlement = async (terminationId: string, checklistId: string) => {
    try {
      const response = await offboardingApi.settlement.trigger(terminationId, {
        triggeredBy: user?.id || 'system',
        notes: 'All clearances complete, triggering final settlement'
      });
      setOffboardingSuccess(`Final settlement triggered! Leave balance: ${response.data?.leaveBalanceIncluded || 0} days`);

      // Refresh offboarding cases to reflect updated termination state
      await fetchOffboardingCases();

      // Refresh the specific checklist
      await fetchOffboardingChecklist(terminationId);

      // Close expanded view to reset UI
      setExpandedOffboardingCase(null);

      setTimeout(() => setOffboardingSuccess(null), 5000);
    } catch (err: any) {
      console.error('Failed to trigger settlement:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to trigger final settlement';
      setError(errorMsg);
    }
  };

  const calculateChecklistProgress = (checklist: any): number => {
    if (!checklist) return 0;

    let totalItems = 0;
    let completedItems = 0;

    // Count equipment items
    if (checklist.equipmentList && checklist.equipmentList.length > 0) {
      totalItems += checklist.equipmentList.length;
      completedItems += checklist.equipmentList.filter((item: any) => item.returned).length;
    }

    // Count access card (always counts as 1 item)
    totalItems += 1;
    if (checklist.cardReturned) {
      completedItems += 1;
    }

    // Count access revocation (always counts as 1 item)
    totalItems += 1;
    const accessRevoked = checklist.items?.find((item: any) => item.department === 'System_Access' && item.status === 'approved');
    if (accessRevoked) {
      completedItems += 1;
    }

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const refreshOffboardingData = useCallback(async () => {
    setIsOffboardingLoading(true);
    setError(null);
    try {
      await fetchOffboardingCases();
    } catch (err: any) {
      console.error('Failed to refresh offboarding data:', err);
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError('Failed to load offboarding data. Please try again.');
      }
    } finally {
      setIsOffboardingLoading(false);
    }
  }, [fetchOffboardingCases]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchApplications(),
        fetchTemplates(),
        fetchJobs(),
        fetchInterviews(),
        fetchOffers(),
        fetchHiringStages(),
      ]);
      // Fetch referrals after applications are loaded to properly mark them
      await fetchReferrals();
    } catch (err) {
      // Only show error banner if user manually refreshed (not on initial mount)
      if (!isLoading) {
        setError('Unable to connect to backend. Please ensure the server is running.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchApplications, fetchTemplates, fetchJobs, fetchInterviews, fetchOffers, fetchHiringStages, fetchReferrals]);

  const refreshOnboardingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchOnboardings(),
        fetchChecklistTemplates(),
      ]);
    } catch (err: any) {
      console.error('Failed to refresh onboarding data:', err);
      // Only set error if it's not an auth issue (auth issues are handled by interceptor)
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError('Failed to load onboarding data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchOnboardings, fetchChecklistTemplates]);

  // Fetch pipeline data when view is pipeline or on initial mount
  useEffect(() => {
    if (currentView === 'pipeline' && user) {
      // Automatically fetch all recruitment data when viewing pipeline
      refreshData();
    } else if (currentView === 'pipeline' && !user) {
      setError('Please log in to view recruitment data');
    }
  }, [currentView, user]); // Note: intentionally not including refreshData to avoid infinite loop

  // Fetch onboarding data when view changes to onboarding
  useEffect(() => {
    if (currentView === 'onboarding' && user) {
      // Only fetch if user is logged in
      refreshOnboardingData();
    } else if (currentView === 'onboarding' && !user) {
      // Show message if not logged in
      setError('Please log in to view onboarding data');
    }
  }, [currentView, user, refreshOnboardingData]);

  // Fetch offboarding data when view changes to offboarding
  useEffect(() => {
    if (currentView === 'offboarding' && user) {
      refreshOffboardingData();
    } else if (currentView === 'offboarding' && !user) {
      setError('Please log in to view offboarding data');
    }
  }, [currentView, user, refreshOffboardingData]);

  // Pipeline Logic
  const columns: PipelineColumn[] = ['Applied', 'Interview', 'Offer', 'Hired', 'Rejected'];

  const getApplicationsByColumn = (column: PipelineColumn): Application[] => {
    return applications.filter(app =>
      getColumnForApplication(app.currentStage, app.status) === column
    );
  };

  const handleMoveApplication = async (applicationId: string, targetColumn: PipelineColumn) => {
    // REC-022: Open rejection modal with templates instead of direct rejection
    if (targetColumn === 'Rejected') {
      setRejectionApplicationId(applicationId);
      setRejectionForm({ template: 'standard', customMessage: '', sendNotification: true });
      setIsRejectionModalOpen(true);
      return;
    }

    // Use a placeholder ID if user is not set (since auth is disabled)
    const changedById = user?.id || '000000000000000000000000';

    let newStage: ApplicationStage | undefined;
    let newStatus: ApplicationStatus | undefined;

    switch (targetColumn) {
      case 'Applied':
        newStage = ApplicationStage.SCREENING;
        newStatus = ApplicationStatus.SUBMITTED;
        break;
      case 'Interview':
        newStage = ApplicationStage.DEPARTMENT_INTERVIEW;
        newStatus = ApplicationStatus.IN_PROCESS;
        break;
      case 'Offer':
        newStage = ApplicationStage.OFFER;
        newStatus = ApplicationStatus.OFFER;
        break;
      case 'Hired':
        newStatus = ApplicationStatus.HIRED;
        break;
    }

    try {
      console.log(`Moving application ${applicationId} to ${targetColumn}`, { newStage, newStatus });
      await recruitmentApi.applications.updateStatus(applicationId, {
        currentStage: newStage,
        status: newStatus,
        changedBy: changedById,
        notes: `Moved to ${targetColumn}`,
      });
      await fetchApplications();
    } catch (err: any) {
      console.error('Failed to update application status:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to move candidate. Please try again.');
    }
  };

  // REC-022: Confirm rejection with template message
  const handleConfirmRejection = async () => {
    if (!rejectionApplicationId) return;

    const changedById = user?.id || '000000000000000000000000';
    const rejectionMessage = rejectionForm.template === 'custom'
      ? rejectionForm.customMessage
      : rejectionTemplates[rejectionForm.template as keyof typeof rejectionTemplates];

    try {
      console.log('Rejecting application:', rejectionApplicationId);
      console.log('Rejecting application with message:', rejectionMessage);
      console.log('Rejection payload:', {
        status: ApplicationStatus.REJECTED,
        changedBy: changedById,
        notes: `Rejection: ${rejectionMessage.substring(0, 200)}...`,
      });

      const response = await recruitmentApi.applications.updateStatus(rejectionApplicationId, {
        status: ApplicationStatus.REJECTED,
        changedBy: changedById,
        notes: `Rejection: ${rejectionMessage.substring(0, 200)}...`,
      });

      console.log('Rejection response:', response.data);
      console.log('Application status after rejection:', response.data?.status);

      // Show notification that email was sent
      if (rejectionForm.sendNotification) {
        alert('✉️ Rejection notification sent to candidate');
      }

      setIsRejectionModalOpen(false);
      setRejectionApplicationId('');
      setRejectionForm({ template: 'standard', customMessage: '', sendNotification: true });
      await fetchApplications();
    } catch (err: any) {
      console.error('Failed to reject application:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError('Failed to reject application. Please try again.');
    }
  };

  // Template Actions
  const handleCreateTemplate = async () => {
    try {
      await recruitmentApi.templates.create({
        title: templateForm.title,
        department: templateForm.department,
        description: templateForm.description,
        qualifications: templateForm.qualifications.split(',').map(q => q.trim()).filter(Boolean),
        skills: templateForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setIsTemplateModalOpen(false);
      setTemplateForm({ title: '', department: '', description: '', qualifications: '', skills: '' });
      await fetchTemplates();
    } catch (err) {
      console.error('Failed to create template:', err);
      setError('Failed to create template.');
    }
  };

  // Job Actions
  const handleCreateJob = async () => {
    try {
      const payload = {
        requisitionId: jobForm.requisitionId,
        templateId: jobForm.templateId || undefined,
        openings: jobForm.openings,
        location: jobForm.location || undefined,
        hiringManagerId: jobForm.hiringManagerId || user?.id || '',
      };
      console.log('Creating job with payload:', payload);
      await recruitmentApi.jobs.create(payload);
      setIsJobModalOpen(false);
      setJobForm({ requisitionId: '', templateId: '', openings: 1, location: '', hiringManagerId: '' });
      await fetchJobs();
    } catch (err: any) {
      console.error('Failed to create job:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message
        || (Array.isArray(err.response?.data?.message) ? err.response?.data?.message.join(', ') : null)
        || err.response?.data?.error
        || 'Failed to create job requisition. Check console for details.';
      setError(errorMsg);
    }
  };

  const handlePublishJob = async (jobId: string) => {
    try {
      await recruitmentApi.jobs.publish(jobId);
      await fetchJobs();
    } catch (err) {
      console.error('Failed to publish job:', err);
      setError('Failed to publish job.');
    }
  };

  const handleCloseJob = async (jobId: string) => {
    try {
      await recruitmentApi.jobs.close(jobId);
      await fetchJobs();
    } catch (err) {
      console.error('Failed to close job:', err);
      setError('Failed to close job.');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job requisition?')) return;
    try {
      await recruitmentApi.jobs.delete(jobId);
      await fetchJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
      setError('Failed to delete job.');
    }
  };

  const handleDeleteJobTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this job template?')) return;
    try {
      await recruitmentApi.templates.delete(templateId);
      await fetchTemplates();
    } catch (err) {
      console.error('Failed to delete job template:', err);
      setError('Failed to delete job template.');
    }
  };

  const handleCreateApplication = async () => {
    try {
      // Validate ObjectId format (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;

      if (!objectIdRegex.test(candidateForm.candidateId)) {
        setError('Candidate ID must be a valid MongoDB ObjectId (24 hexadecimal characters)');
        return;
      }

      if (!objectIdRegex.test(candidateForm.jobRequisitionId)) {
        setError('Job Requisition ID must be a valid MongoDB ObjectId');
        return;
      }

      // Use a placeholder ID if user is not set (since auth is disabled)
      const changedById = user?.id || '000000000000000000000000'; // Default MongoDB ObjectId

      const payload = {
        candidateId: candidateForm.candidateId,
        requisitionId: candidateForm.jobRequisitionId, // Note: backend DTO expects 'requisitionId', not 'jobRequisitionId'
        assignedHr: changedById,
      };

      console.log('Creating application with payload:', payload);
      await recruitmentApi.applications.create(payload);
      setIsCandidateModalOpen(false);
      setCandidateForm({ candidateId: '', jobRequisitionId: '' });
      await fetchApplications();
    } catch (err: any) {
      console.error('Failed to create application:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message
        || (Array.isArray(err.response?.data?.message) ? err.response?.data?.message.join(', ') : null)
        || err.response?.data?.error
        || 'Failed to create application. Check console for details.';
      setError(errorMsg);
    }
  };

  const handleSubmitOffboarding = async () => {
    try {
      setIsOffboardingLoading(true);
      setError(null);

      console.log('Starting offboarding:', offboardingForm);

      // Validate required fields
      if (!offboardingForm.employeeId && !user?.id) {
        setError('Employee ID is required');
        setIsOffboardingLoading(false);
        return;
      }

      if (!offboardingForm.lastWorkingDay) {
        setError('Last working day is required');
        setIsOffboardingLoading(false);
        return;
      }

      if (!offboardingForm.reason) {
        setError('Reason is required');
        setIsOffboardingLoading(false);
        return;
      }

      if (offboardingForm.type === 'Resignation') {
        // Create resignation request
        const payload = {
          employeeId: offboardingForm.employeeId || user?.id || '',
          contractId: offboardingForm.contractId || '000000000000000000000001', // Valid ObjectId format
          requestedLastDay: new Date(offboardingForm.lastWorkingDay).toISOString(),
          reason: offboardingForm.reason,
        };
        console.log('Creating resignation with payload:', payload);
        await offboardingApi.resignation.create(payload);
      } else {
        // Create termination review request
        const payload = {
          employeeId: offboardingForm.employeeId || user?.id || '',
          contractId: offboardingForm.contractId || '000000000000000000000001', // Valid ObjectId format
          reason: offboardingForm.reason,
          initiator: TerminationInitiation.HR as 'employee' | 'hr' | 'manager',
          comments: offboardingForm.comments || undefined,
        };
        console.log('Creating termination with payload:', payload);
        await offboardingApi.termination.initiateReview(payload);
      }

      setOffboardingSuccess(`${offboardingForm.type} request submitted successfully!`);
      setIsOffboardingModalOpen(false);
      setOffboardingForm({
        type: 'Resignation',
        employeeId: '',
        contractId: '',
        lastWorkingDay: '',
        reason: '',
        comments: ''
      });

      // Refresh offboarding data
      await refreshOffboardingData();

      // Clear success message after 3 seconds
      setTimeout(() => setOffboardingSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to submit offboarding:', err);
      console.error('Error details:', err.response?.data);
      const errorMsg = err.response?.data?.message
        || (Array.isArray(err.response?.data?.message) ? err.response?.data?.message.join(', ') : null)
        || err.response?.data?.error
        || `Failed to submit ${offboardingForm.type.toLowerCase()}. Please try again.`;
      setError(errorMsg);
    } finally {
      setIsOffboardingLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    try {
      const panelArray = interviewForm.panel
        ? interviewForm.panel.split(',').map(id => id.trim()).filter(Boolean)
        : [];

      const payload = {
        applicationId: interviewForm.applicationId,
        stage: interviewForm.stage,
        scheduledDate: new Date(interviewForm.scheduledDate).toISOString(),
        method: interviewForm.method,
        videoLink: interviewForm.videoLink || undefined,
        panel: panelArray.length > 0 ? panelArray : undefined,
      };
      console.log('Scheduling interview with payload:', payload);
      await recruitmentApi.interviews.schedule(payload);
      setIsScheduleInterviewModalOpen(false);
      setInterviewForm({
        applicationId: '',
        stage: ApplicationStage.DEPARTMENT_INTERVIEW,
        scheduledDate: '',
        method: InterviewMethod.VIDEO,
        videoLink: '',
        panel: '',
      });
      await fetchInterviews();
    } catch (err: any) {
      console.error('Failed to schedule interview:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message
        || (Array.isArray(err.response?.data?.message) ? err.response?.data?.message.join(', ') : null)
        || err.response?.data?.error
        || 'Failed to schedule interview. Check console for details.';
      setError(errorMsg);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      if (!selectedInterview) return;
      const changedById = user?.id || '000000000000000000000000';
      const payload = {
        interviewerId: feedbackForm.interviewerId || changedById,
        score: feedbackForm.score,
        comments: feedbackForm.comments,
      };
      console.log('Submitting feedback with payload:', payload);
      await recruitmentApi.interviews.submitFeedback(selectedInterview._id, payload);
      setIsFeedbackModalOpen(false);
      setSelectedInterview(null);
      setFeedbackForm({ interviewerId: '', score: 50, comments: '' });
      await fetchInterviews();
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message
        || (Array.isArray(err.response?.data?.message) ? err.response?.data?.message.join(', ') : null)
        || err.response?.data?.error
        || 'Failed to submit feedback. Check console for details.';
      setError(errorMsg);
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    try {
      console.log('Cancelling interview:', interviewId);
      await recruitmentApi.interviews.cancel(interviewId);
      await fetchInterviews();
    } catch (err: any) {
      console.error('Failed to cancel interview:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message
        || err.response?.data?.error
        || 'Failed to cancel interview.';
      setError(errorMsg);
    }
  };

  // Complete an interview
  const handleCompleteInterview = async (interviewId: string) => {
    try {
      await recruitmentApi.interviews.complete(interviewId);
      await fetchInterviews();
      alert('Interview marked as completed!');
    } catch (err: any) {
      console.error('Failed to complete interview:', err);
      const errorMsg = err.response?.data?.message || 'Failed to complete interview.';
      setError(errorMsg);
    }
  };

  const handleCreateOffer = async () => {
    try {
      const changedById = user?.id || '000000000000000000000000';
      const payload = {
        applicationId: offerForm.applicationId,
        grossSalary: offerForm.grossSalary,
        signingBonus: offerForm.signingBonus || undefined,
        benefits: offerForm.benefits || undefined,
        offerExpiry: offerForm.offerExpiry ? new Date(offerForm.offerExpiry).toISOString() : undefined,
        approvers: [{ employeeId: changedById, role: 'HR Manager' }],
      };
      console.log('Creating offer with payload:', payload);
      await recruitmentApi.offers.create(payload);
      setIsOfferModalOpen(false);
      setOfferForm({
        applicationId: '',
        grossSalary: 0,
        signingBonus: 0,
        benefits: '',
        offerExpiry: '',
      });
      await fetchOffers();
    } catch (err: any) {
      console.error('Failed to create offer:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.message
        || (Array.isArray(err.response?.data?.message) ? err.response?.data?.message.join(', ') : null)
        || err.response?.data?.error
        || 'Failed to create offer. Check console for details.';
      setError(errorMsg);
    }
  };

  // REC-018: Respond to Offer (Candidate accepts/rejects)
  const handleRespondToOffer = async () => {
    if (!selectedOffer) return;
    try {
      await recruitmentApi.offers.respond(selectedOffer._id, {
        response: offerResponseForm.response,
        notes: offerResponseForm.notes || undefined,
      });
      setIsOfferActionsModalOpen(false);
      setSelectedOffer(null);
      setOfferResponseForm({ response: 'accepted', notes: '' });
      await fetchOffers();
    } catch (err: any) {
      console.error('Failed to respond to offer:', err);
      setError(err.response?.data?.message || 'Failed to respond to offer');
    }
  };

  // REC-018: Sign Offer (E-signature)
  const handleSignOffer = async () => {
    if (!selectedOffer) return;
    try {
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(offerSignForm.signerId)) {
        setError('Signer ID must be a valid MongoDB ObjectId');
        return;
      }
      await recruitmentApi.offers.sign(selectedOffer._id, {
        signerId: offerSignForm.signerId,
        role: offerSignForm.role,
      });
      setIsOfferActionsModalOpen(false);
      setSelectedOffer(null);
      setOfferSignForm({ signerId: '', role: 'candidate' });
      await fetchOffers();
      alert('Offer signed successfully!');
    } catch (err: any) {
      console.error('Failed to sign offer:', err);
      setError(err.response?.data?.message || 'Failed to sign offer');
    }
  };

  // REC-030: Create Referral (Tag candidate as referral)
  const handleCreateReferral = async () => {
    try {
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(referralForm.referringEmployeeId)) {
        setError('Referring Employee ID must be a valid MongoDB ObjectId');
        return;
      }
      if (!objectIdRegex.test(referralForm.candidateId)) {
        setError('Candidate ID must be a valid MongoDB ObjectId');
        return;
      }
      await recruitmentApi.referrals.create({
        referringEmployeeId: referralForm.referringEmployeeId,
        candidateId: referralForm.candidateId,
        role: referralForm.role || undefined,
        level: referralForm.level || undefined,
      });
      console.log('Referral created successfully for candidate:', referralForm.candidateId);
      setIsReferralModalOpen(false);
      setReferralForm({ referringEmployeeId: '', candidateId: '', role: '', level: '' });

      // Refresh applications to get updated isReferral flags
      await fetchApplications();
      console.log('Applications refreshed. Checking referrals...');

      // Log referral applications for debugging
      const refreshedApps = applications;
      const referralApps = refreshedApps.filter(app => app.isReferral);
      console.log('Referral applications count:', referralApps.length);
      console.log('Referral applications:', referralApps.map(a => ({ id: a._id, candidateId: a.candidateId, isReferral: a.isReferral })));

      alert('Candidate tagged as referral successfully! The list will update.');
    } catch (err: any) {
      console.error('Failed to create referral:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create referral');
    }
  };

  // REC-021: Assign Interview Panel
  const handleAssignPanel = async () => {
    if (!selectedInterview) return;
    try {
      const panelIds = panelForm.panelIds.split(',').map(id => id.trim()).filter(Boolean);
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      const invalidIds = panelIds.filter(id => !objectIdRegex.test(id));
      if (invalidIds.length > 0) {
        setError(`Invalid ObjectId(s): ${invalidIds.join(', ')}`);
        return;
      }
      await recruitmentApi.interviews.assignPanel(selectedInterview._id, panelIds);
      setIsPanelModalOpen(false);
      setPanelForm({ panelIds: '' });
      await fetchInterviews();
      alert('Interview panel assigned successfully!');
    } catch (err: any) {
      console.error('Failed to assign panel:', err);
      setError(err.response?.data?.message || 'Failed to assign panel');
    }
  };

  // Onboarding Handlers
  const handleCreateChecklistTemplate = async () => {
    if (!templateFormData.name || templateFormData.tasks.length === 0) {
      setError('Template name and at least one task are required');
      return;
    }
    try {
      // Map tasks to match backend DTO structure
      const tasksPayload = templateFormData.tasks.map(task => ({
        name: task.name,
        department: task.department,
        category: task.category,
        daysFromStart: task.daysFromStart,
        description: task.description,
      }));

      await onboardingApi.templates.create({
        name: templateFormData.name,
        departmentId: templateFormData.departmentId || undefined,
        isDefault: templateFormData.isDefault,
        tasks: tasksPayload,
      });
      setIsCreateTemplateModalOpen(false);
      setTemplateFormData({
        name: '',
        departmentId: '',
        isDefault: false,
        tasks: [],
      });
      setNewTask({
        name: '',
        department: '',
        category: 'HR',
        daysFromStart: 1,
        description: '',
      });
      await fetchChecklistTemplates();
    } catch (err: any) {
      console.error('Failed to create template:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create template';
      setError(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    }
  };

  const handleAddTask = () => {
    if (!newTask.name || !newTask.department) {
      return;
    }
    setTemplateFormData({
      ...templateFormData,
      tasks: [...templateFormData.tasks, { ...newTask }],
    });
    setNewTask({
      name: '',
      department: '',
      category: 'HR',
      daysFromStart: 1,
      description: '',
    });
  };

  const handleRemoveTask = (index: number) => {
    setTemplateFormData({
      ...templateFormData,
      tasks: templateFormData.tasks.filter((_, i) => i !== index),
    });
  };

  const handleCompleteOnboardingTask = async (onboardingId: string, taskIndex: number) => {
    try {
      await onboardingApi.tracker.completeTask(onboardingId, taskIndex, {
        notes: `Completed by HR`,
      });
      await refreshOnboardingData();
      if (selectedOnboarding?.onboardingId === onboardingId) {
        const updated = await onboardingApi.tracker.getByOnboardingId(onboardingId);
        setSelectedOnboarding(updated.data);
      }
    } catch (err: any) {
      console.error('Failed to complete task:', err);
      setError(err.response?.data?.message || 'Failed to complete task');
    }
  };

  // Delete Template Handler
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      await onboardingApi.templates.delete(templateToDelete.templateId);
      setIsDeleteTemplateConfirmOpen(false);
      setTemplateToDelete(null);
      await fetchChecklistTemplates();
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      setError(err.response?.data?.message || 'Failed to delete template');
    }
  };

  // Apply Template to Onboarding Handler
  const handleApplyTemplate = async () => {
    if (!selectedOnboarding || !applyTemplateForm.templateId) {
      setError('Please select a template');
      return;
    }
    try {
      await onboardingApi.templates.applyToOnboarding(
        selectedOnboarding.onboardingId,
        applyTemplateForm.templateId,
        applyTemplateForm.startDate
      );
      setIsApplyTemplateModalOpen(false);
      setApplyTemplateForm({ templateId: '', startDate: new Date().toISOString().split('T')[0] });
      // Refresh the onboarding data
      const updated = await onboardingApi.tracker.getByOnboardingId(selectedOnboarding.onboardingId);
      setSelectedOnboarding(updated.data);
      await refreshOnboardingData();
    } catch (err: any) {
      console.error('Failed to apply template:', err);
      setError(err.response?.data?.message || 'Failed to apply template');
    }
  };

  // Upload Document Handler (ONB-007)
  const handleUploadDocument = async () => {
    if (!selectedOnboarding || !documentFormData.documentUrl || !documentFormData.fileName) {
      setError('Please fill in all document fields');
      return;
    }
    try {
      await onboardingApi.documents.upload({
        onboardingId: selectedOnboarding.onboardingId,
        documentType: documentFormData.documentType,
        filePath: documentFormData.documentUrl,
        documentName: documentFormData.fileName,
      });
      setIsUploadDocumentModalOpen(false);
      setDocumentFormData({ documentType: 'ID', documentUrl: '', fileName: '' });
      // Refresh compliance status
      const status = await onboardingApi.documents.getComplianceStatus(selectedOnboarding.onboardingId);
      setComplianceDocuments(status.data.uploadedDocuments || []);
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      setError(err.response?.data?.message || 'Failed to upload document');
    }
  };

  // Reserve Equipment Handler (ONB-012)
  const handleReserveEquipment = async () => {
    if (!selectedOnboarding || !resourceFormData.itemName) {
      setError('Please enter equipment name');
      return;
    }
    try {
      await onboardingApi.reservations.reserveEquipment(selectedOnboarding.onboardingId, {
        itemName: resourceFormData.itemName,
        notes: resourceFormData.notes,
        requestedBy: user?.id || 'system',
      });
      setIsReserveResourceModalOpen(false);
      setResourceFormData({ ...resourceFormData, itemName: '', notes: '' });
      // Refresh reservations
      const reservations = await onboardingApi.reservations.getAll(selectedOnboarding.onboardingId);
      setAllReservations(reservations.data);
    } catch (err: any) {
      console.error('Failed to reserve equipment:', err);
      setError(err.response?.data?.message || 'Failed to reserve equipment');
    }
  };

  // Reserve Desk Handler (ONB-012)
  const handleReserveDesk = async () => {
    if (!selectedOnboarding) {
      setError('No onboarding selected');
      return;
    }
    try {
      await onboardingApi.reservations.reserveDesk(selectedOnboarding.onboardingId, {
        building: resourceFormData.building || undefined,
        floor: resourceFormData.floor || undefined,
        requestedBy: user?.id || 'system',
      });
      setIsReserveResourceModalOpen(false);
      setResourceFormData({ ...resourceFormData, building: '', floor: '' });
      // Refresh reservations
      const reservations = await onboardingApi.reservations.getAll(selectedOnboarding.onboardingId);
      setAllReservations(reservations.data);
    } catch (err: any) {
      console.error('Failed to reserve desk:', err);
      setError(err.response?.data?.message || 'Failed to reserve desk');
    }
  };

  // Reserve Access Card Handler (ONB-012)
  const handleReserveAccessCard = async () => {
    if (!selectedOnboarding) {
      setError('No onboarding selected');
      return;
    }
    try {
      await onboardingApi.reservations.reserveAccessCard(selectedOnboarding.onboardingId, {
        accessLevel: resourceFormData.accessLevel,
        areas: resourceFormData.areas.length > 0 ? resourceFormData.areas : undefined,
        requestedBy: user?.id || 'system',
      });
      setIsReserveResourceModalOpen(false);
      setResourceFormData({ ...resourceFormData, accessLevel: 'standard', areas: [] });
      // Refresh reservations
      const reservations = await onboardingApi.reservations.getAll(selectedOnboarding.onboardingId);
      setAllReservations(reservations.data);
    } catch (err: any) {
      console.error('Failed to reserve access card:', err);
      setError(err.response?.data?.message || 'Failed to reserve access card');
    }
  };

  // Provision Access Handler (ONB-009)
  const handleProvisionAccess = async () => {
    if (!selectedOnboarding || provisionAccessForm.systems.length === 0) {
      setError('Please select at least one system');
      return;
    }
    try {
      await onboardingApi.provisioning.requestAccess(selectedOnboarding.onboardingId, {
        systems: provisionAccessForm.systems,
        requestedBy: user?.id || 'system',
        priority: provisionAccessForm.priority,
      });
      setIsProvisionAccessModalOpen(false);
      setProvisionAccessForm({ systems: [], priority: 'normal' });
      // Refresh provisioning status
      const status = await onboardingApi.provisioning.getStatus(selectedOnboarding.onboardingId);
      setProvisioning(status.data);
    } catch (err: any) {
      console.error('Failed to provision access:', err);
      setError(err.response?.data?.message || 'Failed to provision access');
    }
  };

  // Send Task Reminder Handler (ONB-005)
  const handleSendReminder = async (onboardingId: string, taskIndex: number) => {
    try {
      await onboardingApi.reminders.sendTaskReminder(onboardingId, taskIndex);
      setError(null);
      alert('Reminder sent successfully!');
    } catch (err: any) {
      console.error('Failed to send reminder:', err);
      setError(err.response?.data?.message || 'Failed to send reminder');
    }
  };

  // Initiate Payroll Handler (ONB-018)
  const handleInitiatePayroll = async () => {
    if (!selectedOnboarding) return;
    try {
      await onboardingApi.payroll.initiate(selectedOnboarding.onboardingId, {
        employeeId: selectedOnboarding.employeeId,
        contractId: selectedOnboarding.contractId,
      });
      alert('Payroll initiation triggered successfully!');
    } catch (err: any) {
      console.error('Failed to initiate payroll:', err);
      setError(err.response?.data?.message || 'Failed to initiate payroll');
    }
  };

  // Process Signing Bonus Handler (ONB-019)
  const handleProcessSigningBonus = async () => {
    if (!selectedOnboarding) return;
    try {
      await onboardingApi.signingBonus.process(selectedOnboarding.onboardingId, {
        employeeId: selectedOnboarding.employeeId,
        contractId: selectedOnboarding.contractId,
      });
      alert('Signing bonus processed successfully!');
    } catch (err: any) {
      console.error('Failed to process signing bonus:', err);
      setError(err.response?.data?.message || 'Failed to process signing bonus');
    }
  };

  // Load data when selecting an onboarding and switching tabs
  useEffect(() => {
    const loadOnboardingData = async () => {
      if (selectedOnboarding && currentView === 'onboarding') {
        try {
          // Load compliance status for documents tab
          const complianceStatus = await onboardingApi.documents.getComplianceStatus(selectedOnboarding.onboardingId);
          setComplianceDocuments(complianceStatus.data.uploadedDocuments || []);

          // Load reservations for resources tab
          const reservationsData = await onboardingApi.reservations.getAll(selectedOnboarding.onboardingId);
          setAllReservations(reservationsData.data);

          // Load provisioning status
          const provisioningData = await onboardingApi.provisioning.getStatus(selectedOnboarding.onboardingId);
          setProvisioning(provisioningData.data);
        } catch (err) {
          console.error('Failed to load onboarding details:', err);
        }
      }
    };
    loadOnboardingData();
  }, [selectedOnboarding, currentView]);

  const getStatusColor = (category: string) => {
    switch (category) {
      case 'Docs':
        return 'bg-blue-50 text-blue-600';
      case 'Assets':
        return 'bg-green-50 text-green-600';
      case 'Access':
        return 'bg-purple-50 text-purple-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Docs':
        return <FileText className="w-4 h-4" />;
      case 'Assets':
        return <Package className="w-4 h-4" />;
      case 'Access':
        return <Key className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const columnColors: Record<PipelineColumn, string> = {
    Applied: 'bg-slate-100 border-slate-300',
    Interview: 'bg-blue-50 border-blue-300',
    Offer: 'bg-amber-50 border-amber-300',
    Hired: 'bg-green-50 border-green-300',
    Rejected: 'bg-red-50 border-red-300',
  };

  const jobStatusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    published: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
  };

  return (
    <RouteGuard
      requiredRoles={['System Admin', 'HR Admin', 'HR Manager', 'HR Employee', 'Recruiter', 'Dept. Employee']}
      requiredFeatures={['manageRecruitment', 'viewCandidates', 'assistRecruitment', 'viewRecruitment']}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Recruitment</h1>
            <p className="text-slate-600">Manage hiring, onboarding, and offboarding</p>
          </div>

          {/* Main View Tabs */}
          <div className="flex gap-2">
            {['pipeline', 'onboarding', 'offboarding'].map((view) => {
              // Hide onboarding tab if user doesn't have access
              if (view === 'onboarding' && !canViewOnboarding) return null;
              // Hide offboarding tab if user doesn't have access
              if (view === 'offboarding' && !canViewOffboarding) return null;

              return (
                <button
                  key={view}
                  onClick={() => setCurrentView(view as typeof currentView)}
                  className={`px-4 py-2 rounded-lg transition-colors capitalize ${currentView === view
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  {view}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ==================== PIPELINE VIEW ==================== */}
        {currentView === 'pipeline' && (
          <div className="space-y-6">
            {/* Pipeline Sub-tabs */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1 flex-wrap">
                {[
                  { key: 'candidates', label: 'Candidates', icon: Users },
                  { key: 'jobs', label: 'Jobs', icon: Briefcase },
                  { key: 'interviews', label: 'Interviews', icon: Calendar },
                  { key: 'offers', label: 'Offers', icon: Gift },
                  { key: 'stages', label: 'Hiring Stages', icon: Award },
                  { key: 'referrals', label: 'Referrals', icon: Star },
                  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPipelineTab(key as typeof pipelineTab)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pipelineTab === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={refreshData}
                disabled={isLoading}
                className="ml-auto flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* ========== CANDIDATES TAB ========== */}
            {pipelineTab === 'candidates' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-900">Candidate Pipeline</h2>
                  <button
                    onClick={() => setIsCandidateModalOpen(true)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Candidate
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {columns.map((column) => {
                      const columnApps = getApplicationsByColumn(column);
                      return (
                        <div key={column} className={`p-4 rounded-lg border-2 ${columnColors[column]}`}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">{column}</h3>
                            <span className="px-2 py-1 bg-white rounded-full text-sm text-slate-700">
                              {columnApps.length}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {columnApps.map((app) => (
                              <div
                                key={app._id}
                                className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setIsDetailModalOpen(true);
                                }}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-slate-900 text-sm">
                                    {/* Display candidate ID or name, with fallback to application ID */}
                                    {(() => {
                                      const candidateId = app.candidateId;
                                      // If candidateId is a populated object with firstName/lastName
                                      if (typeof candidateId === 'object' && candidateId !== null) {
                                        const candidate = candidateId as any;
                                        if (candidate.firstName || candidate.lastName) {
                                          return `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
                                        }
                                        // Object with _id
                                        if (candidate._id) {
                                          return String(candidate._id).slice(-6).toUpperCase();
                                        }
                                      }
                                      // If candidateId is a string
                                      if (typeof candidateId === 'string' && candidateId) {
                                        return candidateId.slice(-6).toUpperCase();
                                      }
                                      // Fallback to application ID
                                      return `App: ${app._id.slice(-6).toUpperCase()}`;
                                    })()}
                                  </p>
                                </div>
                                <p className="text-xs text-slate-600 mb-2">
                                  {getStageDisplayName(app.currentStage)}
                                </p>
                                <p className="text-xs text-slate-500 mb-3">
                                  {new Date(app.createdAt).toLocaleDateString()}
                                </p>

                                {column !== 'Hired' && column !== 'Rejected' && (
                                  <select
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const target = e.target.value as PipelineColumn;
                                      if (target && target !== column) {
                                        handleMoveApplication(app._id, target);
                                        e.target.value = ''; // Reset dropdown
                                      }
                                    }}
                                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    defaultValue=""
                                  >
                                    <option value="" disabled>Move to...</option>
                                    {columns.filter(c => c !== column).map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            ))}

                            {columnApps.length === 0 && (
                              <p className="text-sm text-slate-400 text-center py-4">
                                No candidates
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========== JOBS TAB ========== */}
            {pipelineTab === 'jobs' && (
              <div className="space-y-6">
                {/* Templates Section */}
                <Card
                  title="Job Templates"
                  action={
                    (isHRManager() || isSystemAdmin()) && (
                      <button
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800"
                      >
                        + New Template
                      </button>
                    )
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <div key={template._id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow relative">
                        <button
                          onClick={() => handleDeleteJobTemplate(template._id)}
                          className="absolute top-2 right-2 p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <h4 className="font-semibold text-slate-900 mb-2 pr-8">{template.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Building2 className="w-4 h-4" />
                          {template.department}
                        </div>
                        {template.skills && template.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                            {template.skills.length > 3 && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                                +{template.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <p className="text-slate-500 col-span-3 text-center py-8">No templates created yet</p>
                    )}
                  </div>
                </Card>

                {/* Requisitions Section */}
                <Card
                  title="Job Requisitions"
                  action={
                    <button
                      onClick={() => setIsJobModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800"
                    >
                      + New Requisition
                    </button>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Openings</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Location</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map((job) => (
                          <tr key={job._id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium text-slate-900">{job.requisitionId}</td>
                            <td className="py-3 px-4 text-slate-600">{job.openings}</td>
                            <td className="py-3 px-4 text-slate-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location || 'N/A'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${jobStatusColors[job.publishStatus]}`}>
                                {job.publishStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button className="p-1.5 text-slate-400 hover:text-slate-600" title="Preview">
                                  <Eye className="w-4 h-4" />
                                </button>
                                {job.publishStatus === 'draft' && (
                                  <button
                                    onClick={() => handlePublishJob(job._id)}
                                    className="p-1.5 text-green-500 hover:text-green-700"
                                    title="Publish"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                )}
                                {job.publishStatus === 'published' && (
                                  <button
                                    onClick={() => handleCloseJob(job._id)}
                                    className="p-1.5 text-red-500 hover:text-red-700"
                                    title="Close"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteJob(job._id)}
                                  className="p-1.5 text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  <XIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {jobs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500">
                              No job requisitions created yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ========== INTERVIEWS TAB ========== */}
            {pipelineTab === 'interviews' && (
              <Card title="Interview Schedule (REC-010, REC-021)">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>REC-021:</strong> Coordinate interview panels - assign members, manage availability, and collect centralized feedback/scoring.
                    Applications in &quot;Interview&quot; stage: {applications.filter(a => a.currentStage === ApplicationStage.DEPARTMENT_INTERVIEW || a.currentStage === ApplicationStage.HR_INTERVIEW).length}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Application</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Stage</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Method</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Panel</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map((interview) => (
                        <tr key={interview._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {getIdString(interview.applicationId) ? getIdString(interview.applicationId).slice(-6).toUpperCase() : `Int: ${interview._id.slice(-6).toUpperCase()}`}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {getStageDisplayName(interview.stage)}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(interview.scheduledDate).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded capitalize">
                              {interview.method}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {interview.panel && interview.panel.length > 0 ? (
                              <span className="text-xs text-slate-600">
                                {interview.panel.length} member(s)
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">No panel</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={interview.status} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedInterview(interview);
                                  setPanelForm({ panelIds: interview.panel?.map(p => getIdString(p)).join(', ') || '' });
                                  setIsPanelModalOpen(true);
                                }}
                                className="text-sm text-purple-600 hover:text-purple-800"
                                title="Manage Panel"
                              >
                                <Users className="w-4 h-4 inline" /> Panel
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedInterview(interview);
                                  setIsFeedbackModalOpen(true);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Feedback
                              </button>
                              {interview.status === 'scheduled' && (
                                <>
                                  <button
                                    onClick={() => handleCompleteInterview(interview._id)}
                                    className="text-sm text-green-600 hover:text-green-800"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleCancelInterview(interview._id)}
                                    className="text-sm text-red-600 hover:text-red-800"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {interviews.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            No interviews scheduled
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ========== OFFERS TAB ========== */}
            {pipelineTab === 'offers' && (
              <Card
                title="Offer Management (REC-014, REC-018)"
                action={
                  <button
                    onClick={() => setIsOfferModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800"
                  >
                    + Create Offer
                  </button>
                }
              >
                <p className="text-sm text-slate-600 mb-4">
                  Manage job offers, collect e-signatures, and track candidate responses.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Application</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Salary</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Deadline</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Response</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.map((offer) => (
                        <tr key={offer._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {getIdString(offer.applicationId) ? getIdString(offer.applicationId).slice(-6).toUpperCase() : `Off: ${offer._id.slice(-6).toUpperCase()}`}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{offer.role}</td>
                          <td className="py-3 px-4 text-slate-600">
                            ${offer.grossSalary.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {new Date(offer.deadline).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={offer.applicantResponse} />
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={offer.finalStatus} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedOffer(offer);
                                  setIsOfferActionsModalOpen(true);
                                }}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                title="Respond / Sign"
                              >
                                <PenLine className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {offers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            No offers created
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ========== HIRING STAGES TAB (REC-004) ========== */}
            {pipelineTab === 'stages' && (
              <div className="space-y-6">
                {/* Default System Stages */}
                <Card title="System Default Stages">
                  <p className="text-sm text-slate-600 mb-4">
                    These are the default application stages. Create custom templates below to override.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {hiringStages.length > 0 ? (
                      hiringStages.map((stage) => (
                        <div key={stage.stage} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900">{getStageDisplayName(stage.stage)}</h4>
                            <span className="text-sm text-slate-500">Order: {stage.order}</span>
                          </div>
                          <div className="w-full bg-slate-300 rounded-full h-2.5 mb-2">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all"
                              style={{ width: `${stage.progress}%` }}
                            />
                          </div>
                          <p className="text-sm text-slate-600">{stage.progress}% complete</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-4 text-center py-8 text-slate-500">
                        <Award className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>Loading default stages...</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Display application counts per stage - only active applications */}
                <Card title="Current Active Applications by Stage">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.values(ApplicationStage).map((stage) => {
                      const count = applications.filter(a =>
                        a.currentStage === stage &&
                        a.status !== ApplicationStatus.REJECTED &&
                        a.status !== ApplicationStatus.HIRED
                      ).length;
                      return (
                        <div key={stage} className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-2xl font-bold text-slate-900">{count}</p>
                          <p className="text-sm text-slate-600">{getStageDisplayName(stage)}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}

            {/* ========== REFERRALS TAB (REC-030) ========== */}
            {pipelineTab === 'referrals' && (
              <Card
                title="Referral Management (REC-030)"
                action={
                  <button
                    onClick={() => setIsReferralModalOpen(true)}
                    className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                  >
                    <Star className="w-4 h-4 inline mr-1" />
                    Tag as Referral
                  </button>
                }
              >
                <p className="text-sm text-slate-600 mb-4">
                  Tag candidates as referrals to give them higher priority in interview scheduling.
                  Referral candidates are highlighted in the pipeline.
                </p>

                {/* Referral Applications List */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Application</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Candidate</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Stage</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Referral</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.filter(app => app.isReferral).length > 0 ? (
                        applications.filter(app => app.isReferral).map((app) => (
                          <tr key={app._id} className="border-b border-slate-100 hover:bg-yellow-50">
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {getIdString(app._id).slice(-6).toUpperCase()}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {(() => {
                                const candidateId = app.candidateId;
                                if (typeof candidateId === 'object' && candidateId !== null) {
                                  const candidate = candidateId as any;
                                  if (candidate.firstName || candidate.lastName) {
                                    return `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
                                  }
                                  if (candidate._id) return String(candidate._id).slice(-6).toUpperCase();
                                }
                                if (typeof candidateId === 'string' && candidateId) return candidateId.slice(-6).toUpperCase();
                                return `App: ${app._id.slice(-6).toUpperCase()}`;
                              })()}
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={getStageDisplayName(app.currentStage)} />
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={app.status} />
                            </td>
                            <td className="py-3 px-4">
                              <span className="flex items-center gap-1 text-yellow-600">
                                <Star className="w-4 h-4 fill-current" />
                                Referral
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            <Star className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p>No referral applications yet</p>
                            <p className="text-sm mt-1">Use the "Tag as Referral" button to mark candidates</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ========== ANALYTICS TAB ========== */}
            {pipelineTab === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-slate-900">{applications.length}</p>
                    <p className="text-slate-600 mt-1">Total Applications</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {applications.filter(a => a.status === ApplicationStatus.HIRED).length}
                    </p>
                    <p className="text-slate-600 mt-1">Hired</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {jobs.filter(j => j.publishStatus === 'published').length}
                    </p>
                    <p className="text-slate-600 mt-1">Open Positions</p>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-600">
                      {interviews.filter(i => i.status === 'scheduled').length}
                    </p>
                    <p className="text-slate-600 mt-1">Pending Interviews</p>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {currentView === 'onboarding' && (
          <div className="space-y-6">
            {/* Onboarding Sub-tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {[
                  { key: 'tracker', label: 'Tracker', icon: CheckCircle2 },
                  { key: 'templates', label: 'Templates', icon: FileText },
                  { key: 'documents', label: 'Documents', icon: FileText },
                  { key: 'resources', label: 'Resources', icon: Package },
                  { key: 'contracts', label: 'Contracts (ONB-002)', icon: Briefcase },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setOnboardingTab(key as typeof onboardingTab)}
                    className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${onboardingTab === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={refreshOnboardingData}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* ========== TRACKER TAB ========== */}
            {onboardingTab === 'tracker' && (
              <div className="space-y-4">
                <Card title="Onboarding Tracker">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Employee</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Tasks</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Progress</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Filter: only show valid employees (with names) and deduplicate by employeeId - keep most recent */}
                        {onboardings
                          .filter(o => o.employeeName && o.employeeName !== 'Unknown')
                          .reduce((unique, current) => {
                            const existing = unique.find(o => o.employeeId === current.employeeId);
                            if (!existing) {
                              unique.push(current);
                            } else {
                              // Keep the one with more tasks or more recent (higher totalTasks)
                              const existingIdx = unique.indexOf(existing);
                              if (current.totalTasks > existing.totalTasks) {
                                unique[existingIdx] = current;
                              }
                            }
                            return unique;
                          }, [] as typeof onboardings)
                          .map((onboarding) => (
                            <tr key={onboarding.onboardingId} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {onboarding.employeeName}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    ID: {onboarding.employeeNumber || onboarding.employeeId.slice(-8).toUpperCase()}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {onboarding.completedTasks}/{onboarding.totalTasks} completed
                              </td>
                              <td className="py-3 px-4">
                                <StatusBadge status={onboarding.progressPercentage === 100 ? 'Completed' : 'In Progress'} />
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[100px]">
                                    <div
                                      className="bg-green-600 h-2 rounded-full"
                                      style={{ width: `${onboarding.progressPercentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm text-slate-600">{onboarding.progressPercentage}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => setSelectedOnboarding(onboarding)}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        {onboardings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500">
                              No onboarding records found. Click Refresh to load data.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Selected Onboarding Details */}
                {selectedOnboarding && (
                  <Card title={`Onboarding Details - ${selectedOnboarding.employeeName || selectedOnboarding.employeeId.slice(-6).toUpperCase()}`}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div>
                          <label className="text-sm text-slate-500">Employee ID</label>
                          <p className="font-medium text-slate-900 font-mono">{selectedOnboarding.employeeId.slice(-8)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-slate-500">Contract ID</label>
                          <p className="font-medium text-slate-900 font-mono">{selectedOnboarding.contractId.slice(-8)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-slate-500">Completed</label>
                          <StatusBadge status={selectedOnboarding.completed ? 'Completed' : 'In Progress'} />
                        </div>
                        <div>
                          <label className="text-sm text-slate-500">Overdue Tasks</label>
                          <p className={`font-medium ${selectedOnboarding.overdueTasks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {selectedOnboarding.overdueTasks}
                          </p>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900 mb-3">Tasks ({(selectedOnboarding.tasks || []).length})</h3>
                      <div className="space-y-3">
                        {(selectedOnboarding.tasks || []).map((task, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`p-2 rounded-lg ${task.department === 'HR' ? 'bg-blue-50 text-blue-600' :
                                task.department === 'IT' ? 'bg-purple-50 text-purple-600' :
                                  task.department === 'Admin' ? 'bg-green-50 text-green-600' :
                                    task.department === 'Legal' ? 'bg-amber-50 text-amber-600' :
                                      'bg-slate-50 text-slate-600'
                                }`}>
                                {task.department === 'HR' ? <Users className="w-4 h-4" /> :
                                  task.department === 'IT' ? <Key className="w-4 h-4" /> :
                                    task.department === 'Admin' ? <Package className="w-4 h-4" /> :
                                      <FileText className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <p className="text-slate-900 font-medium">{task.name}</p>
                                <p className="text-sm text-slate-500">Department: {task.department}</p>
                                {task.deadline && (
                                  <p className="text-sm text-slate-500">
                                    Due: {new Date(task.deadline).toLocaleDateString()}
                                  </p>
                                )}
                                {task.notes && (
                                  <p className="text-sm text-slate-400 italic">{task.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={task.status} />
                              {task.status === OnboardingTaskStatus.COMPLETED && (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              )}
                              {task.status !== OnboardingTaskStatus.COMPLETED && (
                                <>
                                  <button
                                    onClick={() => handleSendReminder(selectedOnboarding.onboardingId, index)}
                                    className="text-sm text-amber-600 hover:text-amber-800"
                                    title="Send Reminder (ONB-005)"
                                  >
                                    <Bell className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCompleteOnboardingTask(selectedOnboarding.onboardingId, index)}
                                    className="text-sm text-green-600 hover:text-green-800"
                                  >
                                    Mark Complete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-800 font-medium">Onboarding Progress</p>
                            <p className="text-green-600">
                              {selectedOnboarding.completedTasks}/{selectedOnboarding.totalTasks} tasks completed
                            </p>
                          </div>
                          <div className="text-green-600 text-2xl font-bold">
                            {selectedOnboarding.progressPercentage}%
                          </div>
                        </div>
                        <div className="mt-3 w-full bg-green-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${selectedOnboarding.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => setSelectedOnboarding(null)}
                          className="px-4 py-2 text-slate-600 hover:text-slate-800"
                        >
                          Close Details
                        </button>
                      </div>

                      {/* Apply Template Button (ONB-001) */}
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 className="font-semibold text-slate-900 mb-3">Apply Checklist Template (ONB-001)</h4>
                        <button
                          onClick={() => setIsApplyTemplateModalOpen(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Apply Template to Onboarding
                        </button>
                      </div>

                      {/* Account Provisioning Panel (ONB-013) */}
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <Key className="w-5 h-5 text-blue-600" />
                          Account Provisioning & Access Control (ONB-013)
                        </h4>
                        <p className="text-sm text-slate-600 mb-4">
                          Schedule automated account provisioning (SSO/email/tools) on start date and revocation on exit.
                          Cancel onboarding for "no-show" scenarios.
                        </p>
                        <AccountProvisioningPanel
                          onboarding={selectedOnboarding}
                          onRefresh={async () => {
                            await refreshOnboardingData();
                            if (selectedOnboarding) {
                              try {
                                const updated = await onboardingApi.tracker.getByOnboardingId(selectedOnboarding.onboardingId);
                                setSelectedOnboarding(updated.data);
                              } catch (err) {
                                console.error('Failed to refresh selected onboarding:', err);
                              }
                            }
                          }}
                          onSuccess={(message: string) => {
                            setError(null);
                            alert('✅ ' + message);
                          }}
                          onError={(message: string) => {
                            setError(message);
                          }}
                        />
                      </div>
                    </div>

                  </Card>
                )}
              </div>
            )}

            {/* ========== TEMPLATES TAB ========== */}
            {onboardingTab === 'templates' && (
              <Card
                title="Checklist Templates"
                action={
                  <button
                    onClick={() => setIsCreateTemplateModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800"
                  >
                    + Create Template
                  </button>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {checklistTemplates.map((template) => (
                    <div key={template.templateId} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{template.name}</h3>
                          {template.departmentId && (
                            <p className="text-sm text-slate-600">Dept: {template.departmentId}</p>
                          )}
                        </div>
                        {template.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{(template.tasks || []).length} tasks</p>
                      <div className="space-y-1">
                        {(template.tasks || []).slice(0, 3).map((task, idx) => (
                          <div key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {task.name} <span className="text-slate-400">({task.department})</span>
                          </div>
                        ))}
                        {(template.tasks || []).length > 3 && (
                          <p className="text-sm text-slate-500 italic">
                            +{(template.tasks || []).length - 3} more tasks
                          </p>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                        <button
                          onClick={() => {
                            setTemplateToDelete(template);
                            setIsDeleteTemplateConfirmOpen(true);
                          }}
                          className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {checklistTemplates.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-slate-500">
                      No templates found. Click &quot;+ Create Template&quot; to get started!
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ========== DOCUMENTS TAB (HR Verification) ========== */}
            {onboardingTab === 'documents' && (
              <Card
                title="Document Verification (ONB-007)"
              >
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>ONB-007:</strong> New hires upload their documents (ID, contracts, certifications) from their candidate portal.
                      As HR, you can <strong>view and verify</strong> the documents they have submitted.
                    </p>
                  </div>

                  {!selectedOnboarding ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-amber-900">
                        <strong>Note:</strong> Please select an employee from the Tracker tab first to view their uploaded documents.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-slate-900 font-medium">
                            {selectedOnboarding.employeeName}
                          </p>
                          <p className="text-sm text-slate-500">
                            Employee ID: {selectedOnboarding.employeeNumber || selectedOnboarding.employeeId.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <StatusBadge status={selectedOnboarding.progressPercentage === 100 ? 'Completed' : 'In Progress'} />
                      </div>

                      {/* Documents Uploaded by New Hire */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-slate-900">Documents Submitted by New Hire</h4>
                        {complianceDocuments.length > 0 ? (
                          <div className="space-y-2">
                            {complianceDocuments.map((doc: any, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-6 h-6 text-blue-500" />
                                  <div>
                                    <p className="font-medium text-slate-900">{doc.fileName || doc.documentType}</p>
                                    <p className="text-sm text-slate-500">Type: {doc.documentType}</p>
                                    {doc.uploadedAt && (
                                      <p className="text-xs text-slate-400">
                                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <StatusBadge status={doc.verified ? 'Verified' : 'Pending Review'} />
                                  {!doc.verified && (
                                    <button
                                      onClick={async () => {
                                        try {
                                          await onboardingApi.documents.verify(doc._id, {
                                            verified: true,
                                            verifiedBy: user?.id || 'hr'
                                          });
                                          // Refresh documents
                                          const docsRes = await onboardingApi.documents.getByOnboarding(selectedOnboarding.onboardingId);
                                          setComplianceDocuments(docsRes.data);
                                        } catch (err) {
                                          console.error('Failed to verify document:', err);
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      Verify
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg bg-slate-50">
                            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-slate-500">No documents uploaded by this employee yet.</p>
                            <p className="text-sm text-slate-400 mt-1">
                              The new hire can upload documents from their candidate portal.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ========== RESOURCES TAB ========== */}
            {onboardingTab === 'resources' && (
              <Card
                title="Resource Management (ONB-009, ONB-012)"
                action={
                  selectedOnboarding && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsProvisionAccessModalOpen(true)}
                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Provision Access
                      </button>
                      <button
                        onClick={() => {
                          setResourceFormData({ ...resourceFormData, type: 'equipment' });
                          setIsReserveResourceModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        Reserve Resource
                      </button>
                    </div>
                  )
                }
              >
                <div className="space-y-4">
                  <p className="text-slate-600">
                    Reserve and track equipment, desk assignments, and access cards for new hires.
                  </p>

                  {!selectedOnboarding ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-amber-900">
                        <strong>Note:</strong> Please select an onboarding record from the Tracker tab first to manage resources.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-900 text-sm">
                          <strong>Selected:</strong> {selectedOnboarding.employeeName || selectedOnboarding.employeeId.slice(-6).toUpperCase()}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Equipment Section */}
                        <div className="p-4 border border-slate-200 rounded-lg">
                          <Package className="w-8 h-8 text-blue-600 mb-2" />
                          <h3 className="font-semibold text-slate-900">Equipment</h3>
                          <p className="text-sm text-slate-600 mt-1 mb-3">Laptops, monitors, accessories</p>
                          {allReservations?.equipment?.length > 0 ? (
                            <div className="space-y-2">
                              {allReservations.equipment.map((item: any, idx: number) => (
                                <div key={idx} className="text-sm p-2 bg-blue-50 rounded">
                                  <p className="font-medium">{item.itemName}</p>
                                  <StatusBadge status={item.status === 'pending' ? 'Reserved' : (item.status || 'Reserved')} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">No equipment reserved</p>
                          )}
                        </div>

                        {/* Desk Section */}
                        <div className="p-4 border border-slate-200 rounded-lg">
                          <Building2 className="w-8 h-8 text-green-600 mb-2" />
                          <h3 className="font-semibold text-slate-900">Desk & Workspace</h3>
                          <p className="text-sm text-slate-600 mt-1 mb-3">Office space assignments</p>
                          {allReservations?.desk ? (
                            <div className="text-sm p-2 bg-green-50 rounded">
                              <p className="font-medium">{allReservations.desk.building || 'Main Building'}</p>
                              <p className="text-slate-500">Floor: {allReservations.desk.floor || 'TBD'}</p>
                              <StatusBadge status={allReservations.desk.status === 'pending' ? 'Reserved' : (allReservations.desk.status || 'Reserved')} />
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">No desk assigned</p>
                          )}
                        </div>

                        {/* Access Card Section */}
                        <div className="p-4 border border-slate-200 rounded-lg">
                          <Key className="w-8 h-8 text-purple-600 mb-2" />
                          <h3 className="font-semibold text-slate-900">Access Cards</h3>
                          <p className="text-sm text-slate-600 mt-1 mb-3">Building and area access</p>
                          {allReservations?.accessCard ? (
                            <div className="text-sm p-2 bg-purple-50 rounded">
                              <p className="font-medium">Level: {allReservations.accessCard.accessLevel || 'standard'}</p>
                              <StatusBadge status={allReservations.accessCard.status === 'pending' ? 'Reserved' : (allReservations.accessCard.status || 'Reserved')} />
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400">No access card assigned</p>
                          )}
                        </div>
                      </div>

                      {/* System Provisioning Status */}
                      {provisioning && (
                        <div className="mt-4 p-4 border border-slate-200 rounded-lg">
                          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-600" />
                            System Provisioning Status
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {provisioning.items?.map((item, idx: number) => (
                              <div key={idx} className="text-sm p-2 bg-slate-50 rounded flex items-center justify-between">
                                <span>{item.system}</span>
                                <StatusBadge status={item.status === 'completed' ? 'Provisioned' : item.status} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions for ONB-018, ONB-019 */}
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <h4 className="font-semibold text-slate-900 mb-3">Payroll & Benefits Actions</h4>
                        <div className="flex gap-3">
                          <button
                            onClick={handleInitiatePayroll}
                            className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Initiate Payroll (ONB-018)
                          </button>
                          <button
                            onClick={handleProcessSigningBonus}
                            className="px-3 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 flex items-center gap-2"
                          >
                            <Gift className="w-4 h-4" />
                            Process Signing Bonus (ONB-019)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ========== CONTRACTS TAB (ONB-002) ========== */}
            {onboardingTab === 'contracts' && (
              <Card title="Signed Contracts & Employee Profile Creation (ONB-002)">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>ONB-002:</strong> Access signed contract details and create employee profiles from accepted offers.
                      Select a contract below to view details or create an employee profile.
                    </p>
                  </div>

                  {/* Contracts Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Candidate</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Role</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Salary</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Signed</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {signedContracts.length > 0 ? (
                          signedContracts.map((contract) => (
                            <tr key={contract.contractId || contract._id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <p className="font-medium text-slate-900">{contract.candidateName || 'Unknown'}</p>
                                <p className="text-xs text-slate-500">ID: {(contract.candidateId || '').slice(-8).toUpperCase()}</p>
                              </td>
                              <td className="py-3 px-4 text-slate-600">{contract.role || 'N/A'}</td>
                              <td className="py-3 px-4 text-slate-600">
                                ${contract.grossSalary?.toLocaleString() || 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <StatusBadge status={contract.isFullySigned ? 'Signed' : 'Pending'} />
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedContract(contract);
                                      setIsContractDetailsModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                  {contract.isFullySigned && (
                                    <button
                                      onClick={() => {
                                        setSelectedContract(contract);
                                        setIsCreateEmployeeModalOpen(true);
                                      }}
                                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                                    >
                                      <UserPlus className="w-3 h-3" />
                                      Create Employee
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-500">
                              <Briefcase className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                              <p>No signed contracts found.</p>
                              <p className="text-sm text-slate-400">Contracts appear here after offers are accepted and signed.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Refresh Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        try {
                          const response = await recruitmentApi.contracts.getAll();
                          setSignedContracts(response.data || []);
                        } catch (err) {
                          console.error('Failed to fetch contracts:', err);
                        }
                      }}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Contracts
                    </button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {currentView === 'offboarding' && (
          <div className="space-y-6">
            {/* Link to full offboarding page with all features */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium">Full Offboarding Management</p>
                <p className="text-blue-600 text-sm">Access Exit Interviews, Clearance Tracking, and Settlement Management</p>
              </div>
              <a
                href="/offboarding"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Full Offboarding →
              </a>
            </div>

            {offboardingSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                {offboardingSuccess}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOffboardingForm({ ...offboardingForm, type: 'Resignation' });
                  setIsOffboardingModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Submit Resignation
              </button>
              <button
                onClick={() => {
                  setOffboardingForm({ ...offboardingForm, type: 'Termination' });
                  setIsOffboardingModalOpen(true);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Initiate Termination
              </button>
            </div>

            <Card title="Active Offboarding Cases">
              <div className="space-y-4">
                {isOffboardingLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading offboarding cases...</div>
                ) : offboardingCases.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No active offboarding cases</div>
                ) : (
                  offboardingCases.map((offboarding) => {
                    const isExpanded = expandedOffboardingCase === offboarding._id;
                    const checklist = offboardingChecklists[offboarding._id];
                    const progress = calculateChecklistProgress(checklist);

                    return (
                      <div
                        key={offboarding._id}
                        className="border border-slate-200 rounded-lg overflow-hidden"
                      >
                        <div className="p-4 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-slate-900 font-medium">Employee: {offboarding.employeeId}</h4>
                              <p className="text-slate-600 text-sm">
                                Termination - Date: {offboarding.terminationDate ? new Date(offboarding.terminationDate).toLocaleDateString() : 'Pending'}
                              </p>
                              <p className="text-slate-500 text-sm">Reason: {offboarding.reason}</p>
                              {offboarding.hrComments && (
                                <p className="text-slate-500 text-sm mt-1">HR Comments: {offboarding.hrComments}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={offboarding.status} />
                              <button
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedOffboardingCase(null);
                                    setEmployeePerformanceData(null);
                                  } else {
                                    setExpandedOffboardingCase(offboarding._id);
                                    if (!offboardingChecklists[offboarding._id]) {
                                      fetchOffboardingChecklist(offboarding._id);
                                    }
                                    // Automatically fetch performance data when expanding
                                    fetchEmployeePerformance(offboarding.employeeId);
                                  }
                                }}
                                className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                              >
                                {isExpanded ? 'Hide Details' : 'Manage Checklist'}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-slate-500">Created: </span>
                              <span className="text-slate-700">{new Date(offboarding.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Contract: </span>
                              <span className="text-slate-700 font-mono">{offboarding.contractId?.slice(-6) || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Checklist Progress Bar */}
                          {checklist && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-slate-600">Checklist Progress</span>
                                <span className={`text-xs font-semibold ${progress === 100 ? 'text-green-600' : 'text-blue-600'
                                  }`}>
                                  {progress}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expanded Checklist and Access Management */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
                            {/* Access Revocation Section */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold text-slate-900">Access Revocation</h5>
                                {checklist?.items?.find((item: any) => item.department === 'System_Access' && item.status === 'approved') ? (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Access Revoked
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => revokeAccessImmediately(offboarding.employeeId, offboarding._id)}
                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors"
                                  >
                                    Revoke Access Immediately
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">
                                {checklist?.items?.find((item: any) => item.department === 'System_Access' && item.status === 'approved')
                                  ? "System and IT access has been revoked for this employee."
                                  : "Immediately revoke all system and account access for security purposes."}
                              </p>
                            </div>

                            {/* Department Clearances Section */}
                            {checklist && checklist.items && checklist.items.length > 0 && (
                              <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <h5 className="font-semibold text-slate-900 mb-3">Department Exit Clearances</h5>
                                <div className="space-y-2">
                                  {checklist.items.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${item.status === 'approved' ? 'bg-green-500' :
                                          item.status === 'rejected' ? 'bg-red-500' :
                                            'bg-yellow-500'
                                          }`} />
                                        <div>
                                          <div className="font-medium text-slate-900">{item.department}</div>
                                          {item.comments && (
                                            <div className="text-xs text-slate-500 mt-1">{item.comments}</div>
                                          )}
                                        </div>
                                      </div>
                                      {item.status === 'pending' && (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleDepartmentSignOff(checklist._id, item.department, 'approved', offboarding._id)}
                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => handleDepartmentSignOff(checklist._id, item.department, 'rejected', offboarding._id)}
                                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                      {item.status !== 'pending' && (
                                        <span className={`text-xs font-medium ${item.status === 'approved' ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                          {item.status.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Checklist Section */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-semibold text-slate-900">Asset Recovery Checklist</h5>
                                {checklist && (
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <div className={`text-lg font-bold ${progress === 100 ? 'text-green-600' : 'text-blue-600'
                                        }`}>
                                        {progress}%
                                      </div>
                                      <div className="text-xs text-slate-500">Complete</div>
                                    </div>
                                    {progress === 100 && (
                                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                )}
                              </div>

                              {checklist === undefined ? (
                                <div className="text-center py-4 text-slate-500">Loading checklist...</div>
                              ) : checklist === null ? (
                                <div className="text-center py-4">
                                  <p className="text-slate-600 mb-3">No checklist created yet</p>
                                  <button
                                    onClick={() => createOffboardingChecklist(offboarding._id)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                                  >
                                    Create Checklist
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Equipment List */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h6 className="text-sm font-medium text-slate-700">IT Assets & Equipment</h6>
                                      {checklist.equipmentList && checklist.equipmentList.length > 0 && (
                                        <span className="text-xs text-slate-500">
                                          {checklist.equipmentList.filter((item: any) => item.returned).length} / {checklist.equipmentList.length} returned
                                        </span>
                                      )}
                                    </div>
                                    {checklist.equipmentList && checklist.equipmentList.length > 0 ? (
                                      <div className="space-y-2">
                                        {checklist.equipmentList.map((item: any, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                            <div className="flex items-center gap-3">
                                              <input
                                                type="checkbox"
                                                checked={item.returned}
                                                onChange={(e) => markEquipmentReturned(checklist._id, item.equipmentId || item.name, offboarding._id, e.target.checked)}
                                                className="w-4 h-4"
                                              />
                                              <div>
                                                <p className="text-sm text-slate-900">{item.name}</p>
                                                {item.equipmentId && (
                                                  <p className="text-xs text-slate-500">ID: {item.equipmentId}</p>
                                                )}
                                              </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${item.returned ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                              }`}>
                                              {item.returned ? 'Returned' : 'Pending'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-500">No equipment added yet</p>
                                    )}
                                  </div>

                                  {/* Add Equipment Form */}
                                  <div className="border-t border-slate-200 pt-3">
                                    <h6 className="text-sm font-medium text-slate-700 mb-2">Add Equipment</h6>
                                    <div className="space-y-2">
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={newEquipment.name}
                                          onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                                          placeholder="Equipment name (e.g., Laptop, Monitor, Keys)..."
                                          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded"
                                        />
                                        <button
                                          onClick={() => addEquipmentToChecklist(checklist._id, offboarding._id)}
                                          disabled={!newEquipment.name}
                                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 disabled:opacity-50"
                                        >
                                          Add
                                        </button>
                                      </div>
                                      <p className="text-xs text-slate-500">Equipment ID tracking is optional and managed internally</p>
                                    </div>
                                  </div>

                                  {/* ID Card Section */}
                                  <div className="border-t border-slate-200 pt-3">
                                    <div className="flex items-center justify-between">
                                      <h6 className="text-sm font-medium text-slate-700">Access Card / ID Badge</h6>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={checklist.cardReturned || false}
                                          onChange={(e) => {
                                            offboardingApi.clearance.updateAccessCardReturn(checklist._id, {
                                              returned: e.target.checked
                                            }).then(() => fetchOffboardingChecklist(offboarding._id));
                                          }}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-sm text-slate-600">Returned</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Final Settlement Section */}
                            {checklist && progress === 100 && (
                              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <h5 className="font-semibold text-slate-900">Ready for Final Settlement</h5>
                                  </div>
                                  <button
                                    onClick={() => triggerFinalSettlement(offboarding._id, checklist._id)}
                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 font-medium transition-colors flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Trigger Final Settlement
                                  </button>
                                </div>
                                <p className="text-sm text-slate-700 mb-2">All clearances complete. Trigger final pay calculation and benefits termination.</p>
                                <ul className="text-xs text-slate-600 space-y-1 ml-6">
                                  <li className="list-disc">Unused leave encashment calculation</li>
                                  <li className="list-disc">Final salary processing & deductions</li>
                                  <li className="list-disc">Benefits termination notification</li>
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Offboarding Wizard Modal */}
        <Modal
          isOpen={isOffboardingModalOpen}
          onClose={() => {
            setIsOffboardingModalOpen(false);
            setEmployeePerformanceData(null);
          }}
          title={offboardingForm.type === 'Termination' ? 'Initiate Termination Review' : 'Submit Resignation'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 mb-2">Employee ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={offboardingForm.employeeId}
                  onChange={(e) => setOffboardingForm({ ...offboardingForm, employeeId: e.target.value })}
                  placeholder={user?.id ? `Your ID: ${user.id}` : 'Enter Employee ID...'}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {offboardingForm.type === 'Termination' && (
                  <button
                    onClick={() => fetchEmployeePerformance(offboardingForm.employeeId || user?.id || '')}
                    disabled={isLoadingPerformance || !(offboardingForm.employeeId || user?.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingPerformance ? 'Loading...' : 'Check Performance'}
                  </button>
                )}
              </div>
              {!offboardingForm.employeeId && user?.id && (
                <p className="text-xs text-slate-500 mt-1">Will use your ID ({user.id}) if you leave this empty</p>
              )}
            </div>

            {/* Performance Data Display for Termination */}
            {offboardingForm.type === 'Termination' && employeePerformanceData && (
              <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                <h4 className="font-semibold text-slate-900 mb-3">Performance Review Data</h4>
                {employeePerformanceData.hasPerformanceData ? (
                  <div className="space-y-3">
                    {employeePerformanceData.latestAppraisal && (
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Latest Appraisal</span>
                          {employeePerformanceData.latestAppraisal.publishedAt && (
                            <span className="text-xs text-slate-500">
                              {new Date(employeePerformanceData.latestAppraisal.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">Rating: </span>
                            <span className={`font-semibold ${employeePerformanceData.latestAppraisal.overallRating === 'Excellent' ? 'text-green-600' :
                              employeePerformanceData.latestAppraisal.overallRating === 'Good' ? 'text-blue-600' :
                                employeePerformanceData.latestAppraisal.overallRating === 'Needs Improvement' ? 'text-orange-600' :
                                  'text-red-600'
                              }`}>
                              {employeePerformanceData.latestAppraisal.overallRating || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Score: </span>
                            <span className="font-semibold text-slate-900">
                              {employeePerformanceData.latestAppraisal.totalScore || 'N/A'}
                            </span>
                          </div>
                        </div>
                        {employeePerformanceData.latestAppraisal.managerComments && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Manager Comments:</p>
                            <p className="text-sm text-slate-700">{employeePerformanceData.latestAppraisal.managerComments}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {employeePerformanceData.allRecords.length > 1 && (
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-2">Performance History</p>
                        <div className="space-y-1">
                          {employeePerformanceData.allRecords.slice(0, 3).map((record: any, idx: number) => (
                            <div key={record.id} className="text-xs text-slate-600 flex justify-between">
                              <span>{record.overallRating || 'N/A'}</span>
                              <span>{record.publishedAt ? new Date(record.publishedAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          ))}
                        </div>
                        {employeePerformanceData.allRecords.length > 3 && (
                          <p className="text-xs text-slate-500 mt-1">+{employeePerformanceData.allRecords.length - 3} more records</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No performance data available for this employee</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-slate-700 mb-2">Contract ID (Optional)</label>
              <input
                type="text"
                value={offboardingForm.contractId}
                onChange={(e) => setOffboardingForm({ ...offboardingForm, contractId: e.target.value })}
                placeholder="Enter Contract ID (24-character MongoDB ID)..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty to use default contract</p>
            </div>

            <div>
              <label className="block text-slate-700 mb-2">Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="Resignation"
                    checked={offboardingForm.type === 'Resignation'}
                    onChange={(e) => setOffboardingForm({ ...offboardingForm, type: e.target.value as 'Resignation' })}
                    className="text-blue-600"
                    disabled
                  />
                  <span className="text-slate-400">Resignation</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="Termination"
                    checked={offboardingForm.type === 'Termination'}
                    onChange={(e) => setOffboardingForm({ ...offboardingForm, type: e.target.value as 'Termination' })}
                    className="text-blue-600"
                    disabled
                  />
                  <span className="text-slate-400">Termination</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">Type is set by the button you clicked</p>
            </div>

            <div>
              <label className="block text-slate-700 mb-2">Last Working Day</label>
              <input
                type="date"
                value={offboardingForm.lastWorkingDay}
                onChange={(e) => setOffboardingForm({ ...offboardingForm, lastWorkingDay: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {offboardingForm.type === 'Termination' && (
              <div>
                <label className="block text-slate-700 mb-2">Termination Reason</label>
                <select
                  value={offboardingForm.reason}
                  onChange={(e) => setOffboardingForm({ ...offboardingForm, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason...</option>
                  <optgroup label="Performance-Based">
                    <option value="Consistently poor performance reviews">Consistently poor performance reviews</option>
                    <option value="Failed to meet performance improvement plan">Failed to meet performance improvement plan</option>
                    <option value="Below expectations despite warnings">Below expectations despite warnings</option>
                    <option value="Repeated performance issues">Repeated performance issues</option>
                  </optgroup>
                  <optgroup label="Conduct-Based">
                    <option value="Violation of company policies">Violation of company policies</option>
                    <option value="Misconduct">Misconduct</option>
                    <option value="Insubordination">Insubordination</option>
                    <option value="Attendance issues">Attendance issues</option>
                  </optgroup>
                  <optgroup label="Business-Based">
                    <option value="Position elimination">Position elimination</option>
                    <option value="Restructuring">Restructuring</option>
                    <option value="Budget constraints">Budget constraints</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="Other">Other (specify in comments)</option>
                  </optgroup>
                </select>
              </div>
            )}

            {offboardingForm.type === 'Resignation' && (
              <div>
                <label className="block text-slate-700 mb-2">Reason for Resignation</label>
                <textarea
                  value={offboardingForm.reason}
                  onChange={(e) => setOffboardingForm({ ...offboardingForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason for resignation..."
                />
              </div>
            )}

            {offboardingForm.type === 'Termination' && (
              <div>
                <label className="block text-slate-700 mb-2">Additional Comments</label>
                <textarea
                  value={offboardingForm.comments}
                  onChange={(e) => setOffboardingForm({ ...offboardingForm, comments: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional comments for the termination review..."
                />
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-slate-900 mb-2">Offboarding Checklist</h4>
              <ul className="space-y-1 text-slate-700">
                <li>• Asset recovery (laptop, access cards, etc.)</li>
                <li>• Access revocation (email, systems, buildings)</li>
                <li>• Exit interview scheduling</li>
                <li>• Final payroll processing</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsOffboardingModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isOffboardingLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOffboarding}
                disabled={isOffboardingLoading || !offboardingForm.lastWorkingDay || !offboardingForm.reason || (!offboardingForm.employeeId && !user?.id)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOffboardingLoading ? 'Submitting...' : 'Start Offboarding Process'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Application Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Application Details"
          size="md"
        >
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-500">Candidate ID</label>
                  <p className="font-medium text-slate-900 font-mono text-lg">
                    {selectedApplication.candidateId ? getIdString(selectedApplication.candidateId).slice(-6).toUpperCase() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Current Stage</label>
                  <p className="font-medium text-slate-900">{getStageDisplayName(selectedApplication.currentStage)}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-500">Status</label>
                  <StatusBadge status={selectedApplication.status} />
                </div>
                <div>
                  <label className="text-sm text-slate-500">Applied Date</label>
                  <p className="font-medium text-slate-900">{new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedApplication.status !== ApplicationStatus.REJECTED && selectedApplication.status !== ApplicationStatus.HIRED && (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setInterviewForm({
                        ...interviewForm,
                        applicationId: selectedApplication._id,
                      });
                      setIsDetailModalOpen(false);
                      setIsScheduleInterviewModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Schedule Interview
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Template Modal */}
        <Modal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          title="Create Job Template"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={templateForm.title}
                onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
              <input
                type="text"
                value={templateForm.department}
                onChange={(e) => setTemplateForm({ ...templateForm, department: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Engineering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Job description..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma-separated)</label>
              <input
                type="text"
                value={templateForm.skills}
                onChange={(e) => setTemplateForm({ ...templateForm, skills: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., JavaScript, React, Node.js"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Qualifications (comma-separated)</label>
              <input
                type="text"
                value={templateForm.qualifications}
                onChange={(e) => setTemplateForm({ ...templateForm, qualifications: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Bachelor's degree, 5+ years experience"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Create Template
              </button>
            </div>
          </div>
        </Modal>

        {/* Job Requisition Modal */}
        <Modal
          isOpen={isJobModalOpen}
          onClose={() => setIsJobModalOpen(false)}
          title="Create Job Requisition"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Requisition ID *</label>
              <input
                type="text"
                value={jobForm.requisitionId}
                onChange={(e) => setJobForm({ ...jobForm, requisitionId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., REQ-2024-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template (Optional)</label>
              <select
                value={jobForm.templateId}
                onChange={(e) => setJobForm({ ...jobForm, templateId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t._id} value={t._id}>{t.title} - {t.department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Number of Openings *</label>
              <input
                type="number"
                min={1}
                value={jobForm.openings}
                onChange={(e) => setJobForm({ ...jobForm, openings: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., New York, NY or Remote"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hiring Manager ID *</label>
              <input
                type="text"
                value={jobForm.hiringManagerId}
                onChange={(e) => setJobForm({ ...jobForm, hiringManagerId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={user?.id || 'Enter hiring manager ID'}
              />
              <p className="text-xs text-slate-500 mt-1">Your ID: {user?.id || 'Not logged in'}</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsJobModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJob}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              >
                Create Requisition
              </button>
            </div>
          </div>
        </Modal>

        {/* Add Candidate/Application Modal */}
        <Modal
          isOpen={isCandidateModalOpen}
          onClose={() => setIsCandidateModalOpen(false)}
          title="Add Application"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Candidate ID *</label>
              <input
                type="text"
                value={candidateForm.candidateId}
                onChange={(e) => setCandidateForm({ ...candidateForm, candidateId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 675b1234567890abcdef1234"
                pattern="[0-9a-fA-F]{24}"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter MongoDB ObjectId (24 hex characters)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Requisition *</label>
              <select
                value={candidateForm.jobRequisitionId}
                onChange={(e) => setCandidateForm({ ...candidateForm, jobRequisitionId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a job...</option>
                {jobs.filter(j => j.publishStatus === 'published').map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.requisitionId} - {job.openings} openings
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Job ObjectId: {candidateForm.jobRequisitionId || 'Not selected'}
              </p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <p className="text-sm text-amber-900 font-medium mb-2">⚠️ Important:</p>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>Candidate ID must be a valid <strong>MongoDB ObjectId</strong></li>
                <li>Format: 24 hexadecimal characters (0-9, a-f)</li>
                <li>Example: <code className="bg-amber-100 px-1 rounded">675b1234567890abcdef1234</code></li>
                <li>NOT human-readable IDs like "CAND001" or "REQ-2025-003"</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsCandidateModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateApplication}
                disabled={!candidateForm.candidateId || !candidateForm.jobRequisitionId}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Application
              </button>
            </div>
          </div>
        </Modal>

        {/* Schedule Interview Modal */}
        <Modal
          isOpen={isScheduleInterviewModalOpen}
          onClose={() => setIsScheduleInterviewModalOpen(false)}
          title="Schedule Interview"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Application ID</label>
              <input
                type="text"
                value={interviewForm.applicationId}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interview Stage *</label>
              <select
                value={interviewForm.stage}
                onChange={(e) => setInterviewForm({ ...interviewForm, stage: e.target.value as ApplicationStage })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={ApplicationStage.SCREENING}>Screening</option>
                <option value={ApplicationStage.DEPARTMENT_INTERVIEW}>Department Interview</option>
                <option value={ApplicationStage.HR_INTERVIEW}>HR Interview</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date & Time *</label>
              <input
                type="datetime-local"
                value={interviewForm.scheduledDate}
                onChange={(e) => setInterviewForm({ ...interviewForm, scheduledDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interview Method *</label>
              <select
                value={interviewForm.method}
                onChange={(e) => setInterviewForm({ ...interviewForm, method: e.target.value as InterviewMethod })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={InterviewMethod.VIDEO}>Video Call</option>
                <option value={InterviewMethod.ONSITE}>On-site</option>
                <option value={InterviewMethod.PHONE}>Phone</option>
              </select>
            </div>
            {interviewForm.method === InterviewMethod.VIDEO && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Video Link</label>
                <input
                  type="url"
                  value={interviewForm.videoLink}
                  onChange={(e) => setInterviewForm({ ...interviewForm, videoLink: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://meet.google.com/xxx or https://zoom.us/j/xxx"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interview Panel (Optional)</label>
              <input
                type="text"
                value={interviewForm.panel}
                onChange={(e) => setInterviewForm({ ...interviewForm, panel: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter interviewer ObjectIds separated by commas"
              />
              <p className="text-xs text-slate-500 mt-1">
                e.g., 675b1234567890abcdef1234, 675b9876543210fedcba4321
              </p>
              <p className="text-xs text-amber-600 mt-1">
                <strong>Note:</strong> Feedback can only be submitted by interviewers in this panel.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setIsScheduleInterviewModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={!interviewForm.applicationId || !interviewForm.scheduledDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </Modal>

        {/* Feedback Modal */}
        <Modal
          isOpen={isFeedbackModalOpen}
          onClose={() => {
            setIsFeedbackModalOpen(false);
            setSelectedInterview(null);
            setFeedbackForm({ interviewerId: '', score: 50, comments: '' });
          }}
          title="Submit Interview Feedback"
          size="md"
        >
          {selectedInterview && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interview Details</label>
                <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                  <p className="text-sm text-slate-600">
                    Application: <span className="font-medium">{getIdString(selectedInterview.applicationId).slice(-6).toUpperCase()}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Stage: <span className="font-medium">{getStageDisplayName(selectedInterview.stage)}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Date: <span className="font-medium">{new Date(selectedInterview.scheduledDate).toLocaleString()}</span>
                  </p>
                  {selectedInterview.panel && selectedInterview.panel.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-sm text-slate-600 font-medium mb-1">Interview Panel:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedInterview.panel.map((panelId, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-mono">
                            {getIdString(panelId).slice(-6).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interviewer ID *</label>
                <input
                  type="text"
                  value={feedbackForm.interviewerId}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, interviewerId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter interviewer MongoDB ObjectId (must be in panel above)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Your ID: {user?.id || 'Not logged in - will use placeholder'}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  <strong>Note:</strong> Must be one of the panel members listed above.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Score (0-100) *</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={feedbackForm.score}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, score: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-lg font-medium text-slate-900 w-12 text-center">
                    {feedbackForm.score}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
                <textarea
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your feedback comments..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsFeedbackModalOpen(false);
                    setSelectedInterview(null);
                    setFeedbackForm({ interviewerId: '', score: 50, comments: '' });
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Create Offer Modal */}
        <Modal
          isOpen={isOfferModalOpen}
          onClose={() => {
            setIsOfferModalOpen(false);
            setOfferForm({
              applicationId: '',
              grossSalary: 0,
              signingBonus: 0,
              benefits: '',
              offerExpiry: '',
            });
          }}
          title="Create Offer"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Application *</label>
              <select
                value={offerForm.applicationId}
                onChange={(e) => setOfferForm({ ...offerForm, applicationId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an application...</option>
                {applications
                  .filter(a => a.status === ApplicationStatus.IN_PROCESS || a.currentStage === ApplicationStage.OFFER)
                  .map((app) => {
                    // Get candidate display text with fallback
                    let candidateDisplay = '';
                    const candidateId = app.candidateId;
                    if (typeof candidateId === 'object' && candidateId !== null) {
                      const candidate = candidateId as any;
                      if (candidate.firstName || candidate.lastName) {
                        candidateDisplay = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
                      } else if (candidate._id) {
                        candidateDisplay = String(candidate._id).slice(-6).toUpperCase();
                      }
                    } else if (typeof candidateId === 'string' && candidateId) {
                      candidateDisplay = candidateId.slice(-6).toUpperCase();
                    }
                    // Fallback to application ID if no candidate info
                    if (!candidateDisplay) {
                      candidateDisplay = `App: ${app._id.slice(-6).toUpperCase()}`;
                    }
                    return (
                      <option key={app._id} value={app._id}>
                        {candidateDisplay} - {getStageDisplayName(app.currentStage)}
                      </option>
                    );
                  })}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Only showing applications in process or at offer stage
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gross Salary *</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={offerForm.grossSalary || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setOfferForm({ ...offerForm, grossSalary: val === '' ? 0 : parseInt(val, 10) });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 75000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Signing Bonus (Optional)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={offerForm.signingBonus || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setOfferForm({ ...offerForm, signingBonus: val === '' ? 0 : parseInt(val, 10) });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Benefits (Optional)</label>
              <textarea
                value={offerForm.benefits}
                onChange={(e) => setOfferForm({ ...offerForm, benefits: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Health insurance, 401k, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Offer Expiry Date (Optional)</label>
              <input
                type="date"
                value={offerForm.offerExpiry}
                onChange={(e) => setOfferForm({ ...offerForm, offerExpiry: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsOfferModalOpen(false);
                  setOfferForm({
                    applicationId: '',
                    grossSalary: 0,
                    signingBonus: 0,
                    benefits: '',
                    offerExpiry: '',
                  });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOffer}
                disabled={!offerForm.applicationId || !offerForm.grossSalary}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Offer
              </button>
            </div>
          </div>
        </Modal>

        {/* REC-018: Offer Actions Modal (Respond/Sign) */}
        <Modal
          isOpen={isOfferActionsModalOpen}
          onClose={() => {
            setIsOfferActionsModalOpen(false);
            setSelectedOffer(null);
            setOfferResponseForm({ response: 'accepted', notes: '' });
            setOfferSignForm({ signerId: '', role: 'candidate' });
          }}
          title="Offer Actions (REC-018)"
          size="md"
        >
          {selectedOffer && (
            <div className="space-y-6">
              {/* Offer Summary */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Offer Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-slate-600">Application:</span> {getIdString(selectedOffer.applicationId).slice(-6).toUpperCase()}</p>
                  <p><span className="text-slate-600">Role:</span> {selectedOffer.role}</p>
                  <p><span className="text-slate-600">Salary:</span> ${selectedOffer.grossSalary.toLocaleString()}</p>
                  <p><span className="text-slate-600">Status:</span> {selectedOffer.finalStatus}</p>
                  <p><span className="text-slate-600">Response:</span> {selectedOffer.applicantResponse}</p>
                </div>
              </div>

              {/* Approve Offer Section - Only show when status is pending */}
              {selectedOffer.finalStatus === 'pending' && (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-medium text-slate-900 mb-3">Approve Offer (Required First)</h4>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                    <p className="text-sm text-amber-800">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      This offer must be approved before the candidate can respond. As an HR Manager, approve it to send to the candidate.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const approverId = user?.id || '000000000000000000000000';
                          await recruitmentApi.offers.approve(selectedOffer._id, {
                            employeeId: approverId,
                            status: 'approved',
                            comment: 'Approved by HR'
                          });
                          alert('✅ Offer approved! The candidate can now respond.');
                          setIsOfferActionsModalOpen(false);
                          await fetchOffers();
                        } catch (err: any) {
                          console.error('Failed to approve offer:', err);
                          setError(err.response?.data?.message || 'Failed to approve offer');
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Offer
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const approverId = user?.id || '000000000000000000000000';
                          await recruitmentApi.offers.approve(selectedOffer._id, {
                            employeeId: approverId,
                            status: 'rejected',
                            comment: 'Rejected by HR'
                          });
                          alert('Offer rejected.');
                          setIsOfferActionsModalOpen(false);
                          await fetchOffers();
                        } catch (err: any) {
                          console.error('Failed to reject offer:', err);
                          setError(err.response?.data?.message || 'Failed to reject offer');
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Offer
                    </button>
                  </div>
                </div>
              )}

              {/* Sign Offer Section - Only show when offer is approved and candidate has accepted */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-medium text-slate-900 mb-3">E-Signature</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Signer ID *</label>
                    <input
                      type="text"
                      value={offerSignForm.signerId}
                      onChange={(e) => setOfferSignForm({ ...offerSignForm, signerId: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="MongoDB ObjectId (24 hex characters)"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter the MongoDB ObjectId of the person signing
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                      value={offerSignForm.role}
                      onChange={(e) => setOfferSignForm({ ...offerSignForm, role: e.target.value as any })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="candidate">Candidate</option>
                      <option value="hr">HR</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSignOffer}
                    disabled={!offerSignForm.signerId}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <PenLine className="w-4 h-4" />
                    Sign Offer
                  </button>
                </div>
              </div>

              {/* REC-029: Pre-boarding Trigger Section */}
              {selectedOffer.applicantResponse === 'accepted' && (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-medium text-slate-900 mb-3">Pre-boarding (REC-029)</h4>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                    <p className="text-sm text-green-800">
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                      Offer has been accepted. You can now trigger pre-boarding tasks.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        // Trigger pre-boarding by creating contract and notifying onboarding module
                        console.log('Triggering pre-boarding for offer:', selectedOffer._id);
                        await recruitmentApi.contracts.create(selectedOffer._id);
                        alert('✅ Pre-boarding tasks triggered! Contract created and onboarding module notified.');
                        setIsOfferActionsModalOpen(false);
                      } catch (err: any) {
                        console.error('Failed to trigger pre-boarding:', err);
                        setError(err.response?.data?.message || 'Failed to trigger pre-boarding');
                      }
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Trigger Pre-boarding Tasks
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* REC-030: Create Referral Modal */}
        <Modal
          isOpen={isReferralModalOpen}
          onClose={() => {
            setIsReferralModalOpen(false);
            setReferralForm({ referringEmployeeId: '', candidateId: '', role: '', level: '' });
          }}
          title="Tag Candidate as Referral (REC-030)"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <Star className="w-4 h-4 inline mr-1 fill-yellow-500 text-yellow-500" />
                Referral candidates get priority in interview scheduling per BR 14/25.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Referring Employee ID *</label>
              <input
                type="text"
                value={referralForm.referringEmployeeId}
                onChange={(e) => setReferralForm({ ...referralForm, referringEmployeeId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="MongoDB ObjectId of the referring employee"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Candidate ID *</label>
              <input
                type="text"
                value={referralForm.candidateId}
                onChange={(e) => setReferralForm({ ...referralForm, candidateId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="MongoDB ObjectId of the candidate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role (Optional)</label>
              <input
                type="text"
                value={referralForm.role}
                onChange={(e) => setReferralForm({ ...referralForm, role: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Level (Optional)</label>
              <input
                type="text"
                value={referralForm.level}
                onChange={(e) => setReferralForm({ ...referralForm, level: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Senior, Mid, Junior"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsReferralModalOpen(false);
                  setReferralForm({ referringEmployeeId: '', candidateId: '', role: '', level: '' });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReferral}
                disabled={!referralForm.referringEmployeeId || !referralForm.candidateId}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                Tag as Referral
              </button>
            </div>
          </div>
        </Modal>

        {/* REC-022: Rejection Modal with Templates */}
        <Modal
          isOpen={isRejectionModalOpen}
          onClose={() => {
            setIsRejectionModalOpen(false);
            setRejectionApplicationId('');
            setRejectionForm({ template: 'standard', customMessage: '', sendNotification: true });
          }}
          title="Reject Application (REC-022)"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Select a rejection template to ensure consistent and respectful communication with candidates.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Template *</label>
              <select
                value={rejectionForm.template}
                onChange={(e) => setRejectionForm({ ...rejectionForm, template: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Standard Rejection</option>
                <option value="after_interview">After Interview - Not Selected</option>
                <option value="position_filled">Position Filled</option>
                <option value="custom">Custom Message</option>
              </select>
            </div>

            {rejectionForm.template === 'custom' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Message *</label>
                <textarea
                  value={rejectionForm.customMessage}
                  onChange={(e) => setRejectionForm({ ...rejectionForm, customMessage: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={5}
                  placeholder="Enter your custom rejection message..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message Preview</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                  {rejectionTemplates[rejectionForm.template as keyof typeof rejectionTemplates]}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendNotification"
                checked={rejectionForm.sendNotification}
                onChange={(e) => setRejectionForm({ ...rejectionForm, sendNotification: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="sendNotification" className="text-sm text-slate-700">
                Send email notification to candidate
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsRejectionModalOpen(false);
                  setRejectionApplicationId('');
                  setRejectionForm({ template: 'standard', customMessage: '', sendNotification: true });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                disabled={rejectionForm.template === 'custom' && !rejectionForm.customMessage}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>

        {/* REC-021: Panel Management Modal */}
        <Modal
          isOpen={isPanelModalOpen}
          onClose={() => {
            setIsPanelModalOpen(false);
            setPanelForm({ panelIds: '' });
          }}
          title="Manage Interview Panel (REC-021)"
          size="md"
        >
          {selectedInterview && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <Users className="w-4 h-4 inline mr-1" />
                  Assign panel members to coordinate availability and centralize feedback collection.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Interview Details</h4>
                <div className="text-sm">
                  <p><span className="text-slate-600">Application:</span> {getIdString(selectedInterview.applicationId).slice(-6).toUpperCase()}</p>
                  <p><span className="text-slate-600">Stage:</span> {getStageDisplayName(selectedInterview.stage)}</p>
                  <p><span className="text-slate-600">Date:</span> {new Date(selectedInterview.scheduledDate).toLocaleString()}</p>
                  <p><span className="text-slate-600">Current Panel:</span> {selectedInterview.panel?.length || 0} member(s)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Panel Member IDs</label>
                <textarea
                  value={panelForm.panelIds}
                  onChange={(e) => setPanelForm({ panelIds: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter comma-separated MongoDB ObjectIds of panel members"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Example: 507f1f77bcf86cd799439011, 507f1f77bcf86cd799439012
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsPanelModalOpen(false);
                    setPanelForm({ panelIds: '' });
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignPanel}
                  disabled={!panelForm.panelIds.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Assign Panel
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Create Checklist Template Modal */}
        <Modal
          isOpen={isCreateTemplateModalOpen}
          onClose={() => {
            setIsCreateTemplateModalOpen(false);
            setTemplateFormData({ name: '', departmentId: '', isDefault: false, tasks: [] });
            setNewTask({ name: '', department: '', category: 'HR', daysFromStart: 1, description: '' });
          }}
          title="Create Checklist Template"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Engineering Onboarding"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department ID (Optional)</label>
                <input
                  type="text"
                  value={templateFormData.departmentId}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, departmentId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., engineering"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={templateFormData.isDefault}
                onChange={(e) => setTemplateFormData({ ...templateFormData, isDefault: e.target.checked })}
                className="rounded border-slate-300"
              />
              <label htmlFor="isDefault" className="text-sm text-slate-700">Set as default template</label>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-900 mb-3">Add Tasks</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Task name *"
                />
                <input
                  type="text"
                  value={newTask.department}
                  onChange={(e) => setNewTask({ ...newTask, department: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Department (e.g., HR, IT) *"
                />
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Admin">Admin</option>
                  <option value="Legal">Legal</option>
                  <option value="Training">Training</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={newTask.daysFromStart}
                  onChange={(e) => setNewTask({ ...newTask, daysFromStart: parseInt(e.target.value) || 1 })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Days from start"
                />
              </div>
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Description (optional)"
                />
                <button
                  onClick={handleAddTask}
                  disabled={!newTask.name || !newTask.department}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Task
                </button>
              </div>
            </div>

            {templateFormData.tasks.length > 0 && (
              <div className="border border-slate-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-slate-900 mb-2">Tasks ({templateFormData.tasks.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {templateFormData.tasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <div>
                        <span className="font-medium text-sm">{task.name}</span>
                        <span className="text-xs text-slate-500 ml-2">({task.department}, Day {task.daysFromStart})</span>
                      </div>
                      <button
                        onClick={() => handleRemoveTask(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setIsCreateTemplateModalOpen(false);
                  setTemplateFormData({ name: '', departmentId: '', isDefault: false, tasks: [] });
                  setNewTask({ name: '', department: '', category: 'HR', daysFromStart: 1, description: '' });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChecklistTemplate}
                disabled={!templateFormData.name || templateFormData.tasks.length === 0}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Template
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Template Confirmation Modal */}
        <Modal
          isOpen={isDeleteTemplateConfirmOpen}
          onClose={() => {
            setIsDeleteTemplateConfirmOpen(false);
            setTemplateToDelete(null);
          }}
          title="Delete Template"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              Are you sure you want to delete the template <strong>&quot;{templateToDelete?.name}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteTemplateConfirmOpen(false);
                  setTemplateToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Template
              </button>
            </div>
          </div>
        </Modal>

        {/* Apply Template Modal */}
        <Modal
          isOpen={isApplyTemplateModalOpen}
          onClose={() => {
            setIsApplyTemplateModalOpen(false);
            setApplyTemplateForm({ templateId: '', startDate: new Date().toISOString().split('T')[0] });
          }}
          title="Apply Template to Onboarding"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Template *</label>
              <select
                value={applyTemplateForm.templateId}
                onChange={(e) => setApplyTemplateForm({ ...applyTemplateForm, templateId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a template...</option>
                {checklistTemplates.map((template) => (
                  <option key={template.templateId} value={template.templateId}>
                    {template.name} ({(template.tasks || []).length} tasks)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={applyTemplateForm.startDate}
                onChange={(e) => setApplyTemplateForm({ ...applyTemplateForm, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsApplyTemplateModalOpen(false);
                  setApplyTemplateForm({ templateId: '', startDate: new Date().toISOString().split('T')[0] });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyTemplate}
                disabled={!applyTemplateForm.templateId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Apply Template
              </button>
            </div>
          </div>
        </Modal>

        {/* Upload Document Modal (ONB-007) */}
        <Modal
          isOpen={isUploadDocumentModalOpen}
          onClose={() => {
            setIsUploadDocumentModalOpen(false);
            setDocumentFormData({ documentType: 'ID', documentUrl: '', fileName: '' });
          }}
          title="Upload Compliance Document"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Type *</label>
              <select
                value={documentFormData.documentType}
                onChange={(e) => setDocumentFormData({ ...documentFormData, documentType: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ID">ID Document</option>
                <option value="contract">Contract</option>
                <option value="certificate">Certificate</option>
                <option value="tax_form">Tax Form</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document URL *</label>
              <input
                type="url"
                value={documentFormData.documentUrl}
                onChange={(e) => setDocumentFormData({ ...documentFormData, documentUrl: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">File Name *</label>
              <input
                type="text"
                value={documentFormData.fileName}
                onChange={(e) => setDocumentFormData({ ...documentFormData, fileName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., passport.pdf"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsUploadDocumentModalOpen(false);
                  setDocumentFormData({ documentType: 'ID', documentUrl: '', fileName: '' });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                disabled={!documentFormData.documentUrl || !documentFormData.fileName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Upload Document
              </button>
            </div>
          </div>
        </Modal>

        {/* Reserve Resource Modal (ONB-012) */}
        <Modal
          isOpen={isReserveResourceModalOpen}
          onClose={() => {
            setIsReserveResourceModalOpen(false);
            setResourceFormData({ type: 'equipment', itemName: '', notes: '', building: '', floor: '', accessLevel: 'standard', areas: [] });
          }}
          title="Reserve Resource"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resource Type *</label>
              <select
                value={resourceFormData.type}
                onChange={(e) => setResourceFormData({ ...resourceFormData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="equipment">Equipment</option>
                <option value="desk">Desk & Workspace</option>
                <option value="access_card">Access Card</option>
              </select>
            </div>

            {resourceFormData.type === 'equipment' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={resourceFormData.itemName}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, itemName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., MacBook Pro 14-inch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={resourceFormData.notes}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
              </>
            )}

            {resourceFormData.type === 'desk' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Building</label>
                  <input
                    type="text"
                    value={resourceFormData.building}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, building: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Main Building"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Floor</label>
                  <input
                    type="text"
                    value={resourceFormData.floor}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, floor: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 3rd Floor"
                  />
                </div>
              </>
            )}

            {resourceFormData.type === 'access_card' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Access Level</label>
                <select
                  value={resourceFormData.accessLevel}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, accessLevel: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="elevated">Elevated</option>
                  <option value="full">Full Access</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsReserveResourceModalOpen(false);
                  setResourceFormData({ type: 'equipment', itemName: '', notes: '', building: '', floor: '', accessLevel: 'standard', areas: [] });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (resourceFormData.type === 'equipment') handleReserveEquipment();
                  else if (resourceFormData.type === 'desk') handleReserveDesk();
                  else if (resourceFormData.type === 'access_card') handleReserveAccessCard();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reserve Resource
              </button>
            </div>
          </div>
        </Modal>

        {/* Provision Access Modal (ONB-009) */}
        <Modal
          isOpen={isProvisionAccessModalOpen}
          onClose={() => {
            setIsProvisionAccessModalOpen(false);
            setProvisionAccessForm({ systems: [], priority: 'normal' });
          }}
          title="Provision System Access"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Systems to Provision *</label>
              <div className="space-y-2">
                {['Email', 'Slack', 'JIRA', 'GitHub', 'Confluence', 'Payroll System', 'HR Portal'].map((system) => (
                  <label key={system} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={provisionAccessForm.systems.includes(system)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProvisionAccessForm({
                            ...provisionAccessForm,
                            systems: [...provisionAccessForm.systems, system],
                          });
                        } else {
                          setProvisionAccessForm({
                            ...provisionAccessForm,
                            systems: provisionAccessForm.systems.filter((s) => s !== system),
                          });
                        }
                      }}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{system}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={provisionAccessForm.priority}
                onChange={(e) => setProvisionAccessForm({ ...provisionAccessForm, priority: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsProvisionAccessModalOpen(false);
                  setProvisionAccessForm({ systems: [], priority: 'normal' });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProvisionAccess}
                disabled={provisionAccessForm.systems.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Provision Access
              </button>
            </div>
          </div>
        </Modal>

        {/* ONB-002: Contract Details Modal */}
        <Modal
          isOpen={isContractDetailsModalOpen}
          onClose={() => setIsContractDetailsModalOpen(false)}
          title="Contract Details (ONB-002)"
        >
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Contract ID</p>
                  <p className="font-medium">{selectedContract.contractId || selectedContract._id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Candidate ID</p>
                  <p className="font-medium">{selectedContract.candidateId?.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="font-medium">{selectedContract.role || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Gross Salary</p>
                  <p className="font-medium text-green-600">${selectedContract.grossSalary?.toLocaleString() || 'N/A'}</p>
                </div>
                {selectedContract.signingBonus > 0 && (
                  <div>
                    <p className="text-sm text-slate-500">Signing Bonus</p>
                    <p className="font-medium text-amber-600">${selectedContract.signingBonus?.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">Benefits</p>
                  <p className="font-medium">{selectedContract.benefits || 'Standard'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Signature Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    {selectedContract.employeeSignedAt ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                    <span>Employee Signed: {selectedContract.employeeSignedAt ? new Date(selectedContract.employeeSignedAt).toLocaleDateString() : 'Pending'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedContract.employerSignedAt ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300" />
                    )}
                    <span>Employer Signed: {selectedContract.employerSignedAt ? new Date(selectedContract.employerSignedAt).toLocaleDateString() : 'Pending'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsContractDetailsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
                {selectedContract.isFullySigned && (
                  <button
                    onClick={() => {
                      setIsContractDetailsModalOpen(false);
                      setIsCreateEmployeeModalOpen(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Employee Profile
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* ONB-002: Create Employee Profile Modal */}
        <Modal
          isOpen={isCreateEmployeeModalOpen}
          onClose={() => setIsCreateEmployeeModalOpen(false)}
          title="Create Employee Profile (ONB-002)"
        >
          <div className="space-y-4">
            {selectedContract && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-blue-800 text-sm">
                  Creating employee profile from contract: <strong>{selectedContract.role}</strong>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={createEmployeeForm.department}
                onChange={(e) => setCreateEmployeeForm({ ...createEmployeeForm, department: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
              <input
                type="text"
                value={createEmployeeForm.position}
                onChange={(e) => setCreateEmployeeForm({ ...createEmployeeForm, position: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={createEmployeeForm.startDate}
                onChange={(e) => setCreateEmployeeForm({ ...createEmployeeForm, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Manager ID (Optional)</label>
              <input
                type="text"
                value={createEmployeeForm.managerId}
                onChange={(e) => setCreateEmployeeForm({ ...createEmployeeForm, managerId: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty if unknown"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setIsCreateEmployeeModalOpen(false);
                  setCreateEmployeeForm({
                    department: '',
                    position: '',
                    startDate: new Date().toISOString().split('T')[0],
                    managerId: '',
                  });
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedContract) return;
                  try {
                    const contractId = selectedContract.contractId || selectedContract._id;
                    await onboardingApi.contracts.createEmployee(contractId, {
                      department: createEmployeeForm.department,
                      position: createEmployeeForm.position,
                      startDate: createEmployeeForm.startDate,
                      managerId: createEmployeeForm.managerId || undefined,
                    });
                    alert('Employee profile created successfully!');
                    setIsCreateEmployeeModalOpen(false);
                    setCreateEmployeeForm({
                      department: '',
                      position: '',
                      startDate: new Date().toISOString().split('T')[0],
                      managerId: '',
                    });
                    // Refresh contracts
                    const response = await recruitmentApi.contracts.getAll();
                    setSignedContracts(response.data || []);
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Failed to create employee profile');
                  }
                }}
                disabled={!createEmployeeForm.department || !createEmployeeForm.position}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Employee
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}