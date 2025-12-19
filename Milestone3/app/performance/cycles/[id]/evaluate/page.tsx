"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";
import { PerformanceApi } from "@/utils/performanceApi";
import { getEmployeeProfileById } from "@/utils/employeeProfileApi";

type Assignment = {
  _id?: string;
  id?: string;
  employeeProfileId?: string;
  employeeName?: string;
  employeeNumber?: string;
  templateId?: string;
  templateName?: string;
  status?: string;
  dueDate?: string;
  employeeRoles?: string[]; // Added to track employee roles for filtering
  employeeDepartmentId?: string; // Added to track employee department for filtering
};

type RatingEntry = {
  key: string;
  title: string;
  ratingValue: number;
  comments?: string;
};

type EvaluationForm = {
  assignmentId: string;
  ratings: RatingEntry[];
  managerSummary?: string;
  strengths?: string;
  improvementAreas?: string;
};

export default function EvaluateEmployeesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const cycleId = params?.id as string;
  
  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/performance/cycles") : false;
  const canEvaluateEmployees = user ? hasFeature(user.roles, "evaluateEmployees") : false;
  const isDepartmentHead = user ? hasRole(user.roles, SystemRole.DEPARTMENT_HEAD) : false;
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const canEvaluateDepartmentHeads = isHRAdmin || isSystemAdmin; // Only HR Admin and System Admin can evaluate department heads
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [submittedAppraisalId, setSubmittedAppraisalId] = useState<string | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<'team' | 'department-heads'>('team'); // For HR Admin/System Admin
  
  // State for department head's department
  const [userDepartmentId, setUserDepartmentId] = useState<string | null>(null);
  const [loadingDepartment, setLoadingDepartment] = useState(false);

  // Fetch department head's department when they log in
  useEffect(() => {
    const fetchUserDepartment = async () => {
      if (!loading && user && isDepartmentHead && user._id && !userDepartmentId) {
        try {
          setLoadingDepartment(true);
          const userProfile = await getEmployeeProfileById(user._id, ['primaryDepartmentId']);
          
          // Extract department ID - handle both object and string formats
          let deptId: string | null = null;
          if (userProfile.primaryDepartmentId) {
            if (typeof userProfile.primaryDepartmentId === 'object' && userProfile.primaryDepartmentId !== null) {
              deptId = String((userProfile.primaryDepartmentId as any)._id || userProfile.primaryDepartmentId);
            } else {
              deptId = String(userProfile.primaryDepartmentId);
            }
          }
          
          setUserDepartmentId(deptId);
          console.log("Department Head's Department ID for evaluation:", deptId);
        } catch (err: any) {
          console.error("Error fetching user department:", err);
        } finally {
          setLoadingDepartment(false);
        }
      }
    };

    fetchUserDepartment();
  }, [loading, user, isDepartmentHead, userDepartmentId]);

  useEffect(() => {
    if (!loading && user && canAccess && canEvaluateEmployees && cycleId) {
      // For department heads, wait for department to be loaded
      if (isDepartmentHead && !canEvaluateDepartmentHeads) {
        if (!loadingDepartment && userDepartmentId !== null) {
          loadAssignments();
        }
      } else {
        loadAssignments();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, canAccess, canEvaluateEmployees, cycleId, evaluationMode, isDepartmentHead, loadingDepartment, userDepartmentId]);

  // Ensure key and title are always present in ratings (safety check)
  useEffect(() => {
    if (evaluationForm && evaluationForm.ratings) {
      const needsFix = evaluationForm.ratings.some((r, idx) => 
        !r.key || !r.title || r.key.trim() === '' || r.title.trim() === ''
      );
      
      if (needsFix) {
        console.warn('Fixing missing key/title in ratings');
        const fixedRatings = evaluationForm.ratings.map((r, idx) => ({
          ...r,
          key: (r.key && r.key.trim() !== '') ? r.key : `criterion_${idx + 1}`,
          title: (r.title && r.title.trim() !== '') ? r.title : `Criterion ${idx + 1}`,
        }));
        setEvaluationForm({ ...evaluationForm, ratings: fixedRatings });
      }
    }
  }, [evaluationForm]);

  const loadAssignments = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const res = await PerformanceApi.listAssignmentsForCycle(cycleId);
      const assignmentsData = res.data || [];
      
      // Fetch employee profiles to get names and roles
      const assignmentsWithNames = await Promise.all(
        assignmentsData.map(async (assignment: Assignment) => {
          if (assignment.employeeName) {
            // Already has name, but we still need to fetch profile to check roles
            // Return as is for now, we'll fetch roles separately if needed
            return assignment;
          }
          
          // Fetch employee profile to get name, roles, and department
          if (assignment.employeeProfileId) {
            try {
              const employeeProfile = await getEmployeeProfileById(String(assignment.employeeProfileId), ['primaryDepartmentId']);
              if (employeeProfile) {
                const firstName = employeeProfile.firstName || '';
                const middleName = employeeProfile.middleName || '';
                const lastName = employeeProfile.lastName || '';
                const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
                
                // Extract department ID
                let empDeptId: string | undefined = undefined;
                if (employeeProfile.primaryDepartmentId) {
                  if (typeof employeeProfile.primaryDepartmentId === 'object' && employeeProfile.primaryDepartmentId !== null) {
                    empDeptId = String((employeeProfile.primaryDepartmentId as any)._id || employeeProfile.primaryDepartmentId);
                  } else {
                    empDeptId = String(employeeProfile.primaryDepartmentId);
                  }
                }
                
                return {
                  ...assignment,
                  employeeName: fullName || employeeProfile.employeeNumber || `Employee ${String(assignment.employeeProfileId)}`,
                  employeeNumber: employeeProfile.employeeNumber || assignment.employeeNumber,
                  employeeRoles: employeeProfile.roles || [], // Store roles for filtering
                  employeeDepartmentId: empDeptId, // Store department ID for filtering
                };
              }
            } catch (err) {
              console.error(`Failed to fetch employee profile for ${assignment.employeeProfileId}:`, err);
            }
          }
          
          // Fallback if we couldn't fetch the profile
          return assignment;
        })
      );
      
      // Fetch roles and department for assignments that already have names but missing data
      const assignmentsWithRoles = await Promise.all(
        assignmentsWithNames.map(async (assignment: Assignment) => {
          // If we already have roles and department, return as is
          if ((assignment as any).employeeRoles && (assignment as any).employeeDepartmentId) {
            return assignment;
          }
          
          // Fetch employee profile to get missing data
          if (assignment.employeeProfileId) {
            try {
              const employeeProfile = await getEmployeeProfileById(String(assignment.employeeProfileId), ['primaryDepartmentId']);
              if (employeeProfile) {
                // Extract department ID
                let empDeptId: string | undefined = undefined;
                if (employeeProfile.primaryDepartmentId) {
                  if (typeof employeeProfile.primaryDepartmentId === 'object' && employeeProfile.primaryDepartmentId !== null) {
                    empDeptId = String((employeeProfile.primaryDepartmentId as any)._id || employeeProfile.primaryDepartmentId);
                  } else {
                    empDeptId = String(employeeProfile.primaryDepartmentId);
                  }
                }
                
                return {
                  ...assignment,
                  employeeRoles: (assignment as any).employeeRoles || employeeProfile.roles || [],
                  employeeDepartmentId: (assignment as any).employeeDepartmentId || empDeptId,
                };
              }
            } catch (err) {
              console.error(`Failed to fetch employee data for ${assignment.employeeProfileId}:`, err);
            }
          }
          
          return assignment;
        })
      );
      
      // Filter assignments based on user role and evaluation mode
      let filteredAssignments = assignmentsWithRoles;
      
      if (isDepartmentHead && !canEvaluateDepartmentHeads) {
        // Department Head: 
        // 1. Filter to only show employees from the same department
        // 2. Filter out self-assignments (cannot evaluate themselves)
        filteredAssignments = assignmentsWithRoles.filter((assignment: any) => {
          const employeeId = String(assignment.employeeProfileId || assignment.employeeProfileId?._id || '');
          const userId = String(user?._id || '');
          
          // Skip self-assignments
          if (employeeId === userId) {
            return false;
          }
          
          // If we have department IDs, check if employee is in the same department
          if (userDepartmentId && assignment.employeeDepartmentId) {
            return assignment.employeeDepartmentId === userDepartmentId;
          }
          
          // If no department ID match, exclude (safety check)
          return false;
        });
      } else if (canEvaluateDepartmentHeads && evaluationMode === 'department-heads') {
        // HR Admin/System Admin: Show only department heads
        filteredAssignments = assignmentsWithRoles.filter((assignment: any) => {
          const employeeRoles = assignment.employeeRoles || [];
          return employeeRoles.some((role: string) => 
            role.toLowerCase() === 'department head' || 
            role.toLowerCase() === 'departmenthead' ||
            role.toLowerCase() === SystemRole.DEPARTMENT_HEAD.toLowerCase()
          );
        });
      } else if (canEvaluateDepartmentHeads && evaluationMode === 'team') {
        // HR Admin/System Admin: Show all except department heads (normal team evaluation)
        filteredAssignments = assignmentsWithRoles.filter((assignment: any) => {
          const employeeRoles = assignment.employeeRoles || [];
          const isDeptHead = employeeRoles.some((role: string) => 
            role.toLowerCase() === 'department head' || 
            role.toLowerCase() === 'departmenthead' ||
            role.toLowerCase() === SystemRole.DEPARTMENT_HEAD.toLowerCase()
          );
          return !isDeptHead;
        });
      }
      
      setAssignments(filteredAssignments);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load assignments");
      setAssignments([]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      const res = await PerformanceApi.getTemplate(templateId);
      // Handle different response structures
      const template = res.data || res;
      console.log('Template response:', res);
      console.log('Template data:', template);
      return template;
    } catch (err: any) {
      console.error("Failed to load template:", err);
      return null;
    }
  };

  const handleStartEvaluation = async (assignment: Assignment) => {
    if (!assignment.templateId) {
      setError("Template ID is missing for this assignment");
      return;
    }

    try {
      const template = await loadTemplate(assignment.templateId);
      if (!template) {
        setError("Failed to load template");
        return;
      }

      console.log('Template data:', template);
      console.log('Template criteria:', template.criteria);

      // Initialize evaluation form with template criteria
      // CRITICAL: key and title MUST come from template, they are not user input
      const ratings: RatingEntry[] = (template.criteria || []).map((criterion: any, index: number) => {
        // Extract key and title from template criterion - these are REQUIRED
        const key = String(criterion?.key || criterion?.title || `criterion_${index + 1}`).trim();
        const title = String(criterion?.title || criterion?.key || `Criterion ${index + 1}`).trim();
        
        // Validate that we have non-empty values
        if (!key || key === '') {
          console.error(`Criterion ${index} has empty key!`, criterion);
        }
        if (!title || title === '') {
          console.error(`Criterion ${index} has empty title!`, criterion);
        }
        
        const ratingEntry: RatingEntry = {
          key: key || `criterion_${index + 1}`, // Always ensure non-empty
          title: title || `Criterion ${index + 1}`, // Always ensure non-empty
          ratingValue: 0, // User will fill this
          comments: "", // User will fill this
        };
        
        console.log(`Criterion ${index}:`, { 
          original: criterion, 
          extracted: { key, title },
          final: ratingEntry 
        });
        
        return ratingEntry;
      });
      
      console.log('Initialized ratings:', ratings);
      
      // Validate that all ratings have key and title before setting form
      const invalidRatings = ratings.filter(r => !r.key || !r.title || r.key.trim() === '' || r.title.trim() === '');
      if (invalidRatings.length > 0) {
        console.error('ERROR: Some ratings are missing key or title!', invalidRatings);
        setError(`Template error: Some criteria are missing required fields. Please contact support.`);
        return;
      }

      setEvaluationForm({
        assignmentId: assignment._id || assignment.id || "",
        ratings,
        managerSummary: "",
        strengths: "",
        improvementAreas: "",
      });

      setSelectedAssignment(assignment);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to start evaluation");
    }
  };

  const handleRatingChange = (index: number, field: 'ratingValue' | 'comments', value: string | number) => {
    if (!evaluationForm) return;

    const newRatings = [...evaluationForm.ratings];
    const currentRating = newRatings[index];
    
    // Ensure key and title are preserved when updating
    newRatings[index] = {
      ...currentRating, // Keep existing values first
      key: currentRating.key || `criterion_${index + 1}`, // Ensure key exists
      title: currentRating.title || `Criterion ${index + 1}`, // Ensure title exists
      [field]: value, // Update the specific field
    };

    setEvaluationForm({
      ...evaluationForm,
      ratings: newRatings,
    });
  };

  const handleSubmitEvaluation = async () => {
    if (!evaluationForm || !selectedAssignment) {
      setError("Evaluation form is not initialized");
      return;
    }

    // Validate all ratings have rating values (key and title should already be set from template)
    // First check if key/title are missing (this shouldn't happen, but let's fix it if it does)
    const missingKeyTitle = evaluationForm.ratings.filter((r, idx) => 
      !r.key || !r.title || r.key.trim() === '' || r.title.trim() === ''
    );
    
    if (missingKeyTitle.length > 0) {
      console.error('ERROR: Ratings missing key or title!', evaluationForm.ratings);
      // Try to fix it by regenerating from index
      const fixedRatings = evaluationForm.ratings.map((r, idx) => ({
        ...r,
        key: r.key && r.key.trim() !== '' ? r.key : `criterion_${idx + 1}`,
        title: r.title && r.title.trim() !== '' ? r.title : `Criterion ${idx + 1}`,
      }));
      setEvaluationForm({ ...evaluationForm, ratings: fixedRatings });
      setError('Fixed missing fields. Please try submitting again.');
      return;
    }
    
    // Now validate that all ratings have values
    const missingRatings = evaluationForm.ratings.filter(r => 
      !r.ratingValue || r.ratingValue === 0
    );
    
    if (missingRatings.length > 0) {
      setError(`Please provide rating values for all criteria. Missing ratings: ${missingRatings.map((_, idx) => idx + 1).join(', ')}`);
      return;
    }
    
    // Final validation before submission
    console.log('Submitting ratings:', evaluationForm.ratings);
    const finalValidation = evaluationForm.ratings.every(r => 
      r.key && r.key.trim() !== '' && 
      r.title && r.title.trim() !== '' && 
      r.ratingValue && r.ratingValue > 0
    );
    
    if (!finalValidation) {
      setError('Validation failed. Please ensure all fields are filled correctly.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Calculate total score
      const totalScore = evaluationForm.ratings.reduce((sum, r) => sum + (r.ratingValue || 0), 0);

      const response = await PerformanceApi.createRecord(selectedAssignment._id || selectedAssignment.id || "", {
        assignmentId: selectedAssignment._id || selectedAssignment.id || "",
        cycleId: cycleId,
        templateId: selectedAssignment.templateId || "",
        employeeProfileId: selectedAssignment.employeeProfileId || "",
        managerProfileId: user?._id || "",
        ratings: evaluationForm.ratings.map(r => {
          // Ensure key and title are non-empty strings
          const key = String(r.key || '').trim();
          const title = String(r.title || '').trim();
          
          if (!key || !title) {
            console.error('Invalid rating entry:', r);
            throw new Error(`Invalid rating entry: missing key or title`);
          }
          
          return {
            key: key,
            title: title,
            ratingValue: Number(r.ratingValue) || 0,
            comments: String(r.comments || '').trim(),
          };
        }),
        totalScore,
        managerSummary: evaluationForm.managerSummary || "",
        strengths: evaluationForm.strengths || "",
        improvementAreas: evaluationForm.improvementAreas || "",
        managerSubmittedAt: new Date().toISOString(),
      });

      // Get the appraisal record ID from the response
      const appraisalId = response.data?._id || response.data?.id || (response.data as any)?._id || (response.data as any)?.id || null;
      
      if (appraisalId) {
        setSubmittedAppraisalId(appraisalId);
        // Don't auto-dismiss - let user close it manually
        // Store in sessionStorage so it persists across page refreshes
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('lastSubmittedAppraisalId', appraisalId);
          sessionStorage.setItem('lastSubmittedAppraisalEmployee', selectedAssignment.employeeName || 'Employee');
        }
      }

      // Reset form and reload assignments
      setSelectedAssignment(null);
      setEvaluationForm(null);
      await loadAssignments();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to submit evaluation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RouteGuard 
      requiredRoute="/performance/cycles" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "department head"]}
    >
      {loading || loadingData ? (
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600 text-lg">Loading assignments...</p>
          </div>
        </main>
      ) : !user || !canAccess || !canEvaluateEmployees ? null : (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  {evaluationMode === 'department-heads' ? 'Evaluate Department Heads' : 'Evaluate Employees'}
                </h1>
                <p className="text-slate-600 text-lg">
                  {evaluationMode === 'department-heads' 
                    ? 'Evaluate department heads for this appraisal cycle'
                    : isDepartmentHead
                    ? 'Evaluate your team members for this appraisal cycle (excluding yourself)'
                    : 'Evaluate your team members for this appraisal cycle'}
                </p>
              </div>
              <div className="flex gap-2">
                {canEvaluateDepartmentHeads && (
                  <div className="flex gap-2 items-center bg-slate-100 rounded-lg p-1">
                    <Button
                      variant={evaluationMode === 'team' ? 'default' : 'outline'}
                      onClick={() => setEvaluationMode('team')}
                      className="text-xs px-3"
                    >
                      Team Members
                    </Button>
                    <Button
                      variant={evaluationMode === 'department-heads' ? 'default' : 'outline'}
                      onClick={() => setEvaluationMode('department-heads')}
                      className="text-xs px-3"
                    >
                      Department Heads
                    </Button>
                  </div>
                )}
                <Button variant="outline" onClick={() => router.push("/performance/cycles")}>
                  Back to Cycles
                </Button>
              </div>
            </header>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {submittedAppraisalId && (
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-green-400 font-semibold mb-2">✓ Evaluation Submitted Successfully!</h3>
                    <p className="text-text text-sm mb-2">
                      Your appraisal record has been created. Save this ID for your records.
                    </p>
                    <div className="bg-slate-50 rounded p-3 border border-green-500/30 mb-3">
                      <p className="text-slate-600 text-xs mb-1">Appraisal Record ID:</p>
                      <div className="flex items-center gap-2">
                        <p className="text-green-600 font-mono text-sm font-semibold break-all flex-1">
                          {submittedAppraisalId}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(submittedAppraisalId);
                            alert('Appraisal ID copied to clipboard!');
                          }}
                          className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-green-400 text-xs transition-colors"
                          title="Copy to clipboard"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs">
                      💡 You'll need this ID if you want to submit a dispute later. This message will stay visible until you close it.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSubmittedAppraisalId(null);
                      // Clear from sessionStorage when manually closed
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('lastSubmittedAppraisalId');
                        sessionStorage.removeItem('lastSubmittedAppraisalEmployee');
                      }
                    }}
                    className="text-slate-600 hover:text-slate-900 transition-colors text-lg"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {!selectedAssignment ? (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Employee Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-slate-600 text-sm mb-2">
                        {evaluationMode === 'department-heads' 
                          ? 'No department head assignments found for this cycle.'
                          : isDepartmentHead
                          ? 'No team member assignments found for this cycle, or you have already evaluated all available team members.'
                          : 'No assignments found for this cycle.'}
                      </p>
                      {isDepartmentHead && (
                        <p className="text-slate-500 text-xs italic">
                          Note: You cannot evaluate yourself. If you are in this cycle, you will not appear in the list.
                        </p>
                      )}
                      {canEvaluateDepartmentHeads && evaluationMode === 'team' && (
                        <p className="text-slate-500 text-xs italic">
                          Note: Department heads are excluded from team evaluation. Switch to "Department Heads" mode to evaluate them.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map((assignment, idx) => {
                        const id = assignment._id || assignment.id || idx.toString();
                        return (
                          <div
                            key={id}
                            className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-500/50 transition"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div>
                                <p className="text-slate-900 font-semibold">
                                  {assignment.employeeName || `Employee ${idx + 1}`}
                                </p>
                                {assignment.employeeNumber && (
                                  <p className="text-slate-600 text-sm">Employee #: {assignment.employeeNumber}</p>
                                )}
                                <p className="text-slate-600 text-sm">Status: {assignment.status || "N/A"}</p>
                                {assignment.dueDate && (
                                  <p className="text-slate-600 text-sm">
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="default"
                                onClick={() => handleStartEvaluation(assignment)}
                                disabled={assignment.status === "COMPLETED" || assignment.status === "SUBMITTED"}
                              >
                                {assignment.status === "COMPLETED" || assignment.status === "SUBMITTED"
                                  ? "Already Evaluated"
                                  : "Start Evaluation"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : evaluationForm && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Evaluate: {selectedAssignment.employeeName || "Employee"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Ratings Section */}
                    <div>
                      <h3 className="text-slate-900 font-semibold mb-4">Performance Ratings</h3>
                      <div className="space-y-4">
                        {evaluationForm.ratings.map((rating, idx) => {
                          // Ensure key and title are preserved - add hidden fields if needed
                          const displayTitle = rating.title || `Criterion ${idx + 1}`;
                          const displayKey = rating.key || `criterion_${idx + 1}`;
                          
                          return (
                            <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="mb-2">
                                <Label className="text-slate-900 font-medium">{displayTitle}</Label>
                                {/* Hidden fields to preserve key and title */}
                                <input type="hidden" value={displayKey} />
                                <input type="hidden" value={displayTitle} />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`rating-${idx}`}>Rating Value</Label>
                                  <Input
                                    id={`rating-${idx}`}
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={rating.ratingValue || ""}
                                    onChange={(e) => {
                                      const newValue = parseInt(e.target.value) || 0;
                                      // Preserve key and title when updating
                                      handleRatingChange(idx, 'ratingValue', newValue);
                                    }}
                                    placeholder="Enter rating (0-100)"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`comments-${idx}`}>Comments</Label>
                                  <Input
                                    id={`comments-${idx}`}
                                    value={rating.comments || ""}
                                    onChange={(e) => {
                                      // Preserve key and title when updating
                                      handleRatingChange(idx, 'comments', e.target.value);
                                    }}
                                    placeholder="Add comments..."
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Summary Section */}
                    <div className="border-t border-slate-200 pt-4">
                      <h3 className="text-slate-900 font-semibold mb-4">Evaluation Summary</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="managerSummary">Manager Summary</Label>
                          <textarea
                            id="managerSummary"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            value={evaluationForm.managerSummary || ""}
                            onChange={(e) => setEvaluationForm({
                              ...evaluationForm,
                              managerSummary: e.target.value,
                            })}
                            placeholder="Overall performance summary..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="strengths">Strengths</Label>
                          <textarea
                            id="strengths"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                            value={evaluationForm.strengths || ""}
                            onChange={(e) => setEvaluationForm({
                              ...evaluationForm,
                              strengths: e.target.value,
                            })}
                            placeholder="Key strengths..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="improvementAreas">Areas for Improvement</Label>
                          <textarea
                            id="improvementAreas"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                            value={evaluationForm.improvementAreas || ""}
                            onChange={(e) => setEvaluationForm({
                              ...evaluationForm,
                              improvementAreas: e.target.value,
                            })}
                            placeholder="Areas for improvement..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end border-t border-slate-200 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedAssignment(null);
                          setEvaluationForm(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        onClick={handleSubmitEvaluation}
                        disabled={saving}
                      >
                        {saving ? "Submitting..." : "Submit Evaluation"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      )}
    </RouteGuard>
  );
}

