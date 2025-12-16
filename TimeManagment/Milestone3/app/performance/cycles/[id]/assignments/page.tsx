"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";
import { PerformanceApi } from "@/utils/performanceApi";
import { listEmployeeProfiles } from "@/utils/employeeProfileApi";
import { getAllPositions } from "@/utils/organizationStructureApi";

type Employee = {
  _id?: string;
  id?: string;
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  departmentId?: string;
  departmentName?: string;
  positionId?: string;
  positionName?: string;
  managerId?: string;
  managerName?: string;
};

type Template = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
};

type Cycle = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
};

type AssignmentForm = {
  employeeProfileId: string;
  managerProfileId: string;
  departmentId: string;
  positionId?: string;
  dueDate?: string;
};

type ExistingAssignment = {
  _id?: string;
  id?: string;
  employeeProfileId?: string | { _id?: string; firstName?: string; lastName?: string; employeeNumber?: string };
  employeeName?: string;
  employeeNumber?: string;
  templateId?: string | { _id?: string; name?: string };
  templateName?: string;
  status?: string;
  dueDate?: string;
  assignedAt?: string;
};

export default function CreateAssignmentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const cycleId = params?.id as string;

  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/performance/cycles") : false;
  const canManageCycles = user ? hasFeature(user.roles, "manageAppraisalCycles") : false;
  const canDeleteAssignments = user ? hasFeature(user.roles, "deleteAssignments") : false;
  const canUpdateAssignmentStatus = user ? hasFeature(user.roles, "updateAssignmentStatus") : false;
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<ExistingAssignment[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<AssignmentForm[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingExistingAssignments, setLoadingExistingAssignments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!loading && user && canAccess && canManageCycles && cycleId) {
      loadCycle();
      loadTemplates();
      loadExistingAssignments();
    }
  }, [user, loading, canAccess, canManageCycles, cycleId]);

  const loadCycle = async () => {
    try {
      const res = await PerformanceApi.getCycle(cycleId);
      setCycle(res.data || res);
    } catch (err: any) {
      console.error("Failed to load cycle:", err);
      setError("Failed to load cycle information");
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await PerformanceApi.listTemplates();
      setTemplates(res.data || []);
    } catch (err: any) {
      console.error("Failed to load templates:", err);
      setError("Failed to load templates");
    } finally {
      setLoadingData(false);
    }
  };

  const loadExistingAssignments = async () => {
    try {
      setLoadingExistingAssignments(true);
      const res = await PerformanceApi.listAssignmentsForCycle(cycleId);
      const assignmentsList = res.data || res || [];
      
      // Normalize assignment data - handle populated fields
      const normalizedAssignments: ExistingAssignment[] = await Promise.all(
        assignmentsList.map(async (assignment: any) => {
          // Handle employeeProfileId - can be ObjectId string or populated object
          let employeeName = assignment.employeeName;
          let employeeNumber = assignment.employeeNumber;
          let employeeId = "";
          
          if (assignment.employeeProfileId) {
            if (typeof assignment.employeeProfileId === 'object' && assignment.employeeProfileId !== null) {
              // Populated object
              employeeId = String(assignment.employeeProfileId._id || assignment.employeeProfileId);
              employeeName = assignment.employeeProfileId.firstName && assignment.employeeProfileId.lastName
                ? `${assignment.employeeProfileId.firstName} ${assignment.employeeProfileId.lastName}`.trim()
                : employeeName || "Unknown Employee";
              employeeNumber = assignment.employeeProfileId.employeeNumber || employeeNumber;
            } else {
              // String ID - need to fetch employee details
              employeeId = String(assignment.employeeProfileId);
              try {
                const employeeRes = await listEmployeeProfiles({});
                const employees = Array.isArray(employeeRes) ? employeeRes : (employeeRes.data || []);
                const employee = employees.find((emp: any) => 
                  String(emp._id || emp.id) === employeeId
                );
                if (employee) {
                  employeeName = employee.firstName && employee.lastName
                    ? `${employee.firstName} ${employee.lastName}`.trim()
                    : employee.fullName || "Unknown Employee";
                  employeeNumber = employee.employeeNumber || employeeNumber;
                }
              } catch (err) {
                console.warn("Could not fetch employee details for assignment:", err);
              }
            }
          }
          
          // Handle templateId - can be ObjectId string or populated object
          let templateName = assignment.templateName;
          if (assignment.templateId) {
            if (typeof assignment.templateId === 'object' && assignment.templateId !== null) {
              templateName = assignment.templateId.name || assignment.templateId.title || templateName || "Unknown Template";
            } else {
              // String ID - try to find in templates list
              const templateId = String(assignment.templateId);
              const template = templates.find(t => String(t._id || t.id) === templateId);
              if (template) {
                templateName = template.name || template.title || "Unknown Template";
              }
            }
          }
          
          return {
            _id: assignment._id || assignment.id,
            id: assignment._id || assignment.id,
            employeeProfileId: employeeId || assignment.employeeProfileId,
            employeeName,
            employeeNumber,
            templateId: typeof assignment.templateId === 'object' 
              ? String(assignment.templateId._id || assignment.templateId)
              : String(assignment.templateId || ""),
            templateName,
            status: assignment.status,
            dueDate: assignment.dueDate,
            assignedAt: assignment.assignedAt,
          };
        })
      );
      
      setExistingAssignments(normalizedAssignments);
    } catch (err: any) {
      console.error("Failed to load existing assignments:", err);
      // Don't set error here - it's not critical if we can't load existing assignments
      setExistingAssignments([]);
    } finally {
      setLoadingExistingAssignments(false);
    }
  };

  const loadEmployees = async () => {
    if (!selectedTemplateId) {
      setError("Please select a template first");
      return;
    }

    try {
      setLoadingEmployees(true);
      setError(null);
      console.log("Loading employees...");
      
      const response = await listEmployeeProfiles({
        status: "ACTIVE", // Only active employees
        limit: 1000, // Load all employees
      });
      
      // Fetch position and department details for employees that need it
      // We'll need to get positions separately since listEmployeeProfiles might not populate them

      console.log("Employee API response:", response);
      console.log("Employee API response type:", typeof response);
      console.log("Is array?", Array.isArray(response));

      let employeeList: Employee[] = [];
      if (Array.isArray(response)) {
        employeeList = response;
      } else if (response.data && Array.isArray(response.data)) {
        employeeList = response.data;
      } else {
        console.warn("Unexpected response structure:", response);
        setError("Unexpected response format from server");
        return;
      }
      
      console.log("Employee list count:", employeeList.length);
      if (employeeList.length > 0) {
        console.log("First employee raw:", JSON.stringify(employeeList[0], null, 2));
        console.log("First employee primaryDepartmentId:", employeeList[0].primaryDepartmentId);
        console.log("First employee primaryDepartmentId type:", typeof employeeList[0].primaryDepartmentId);
      }

      // Fetch all positions to map position IDs to names
      let positionsMap: { [key: string]: string } = {};
      try {
        const positionsRes = await getAllPositions();
        const positionsList = Array.isArray(positionsRes) ? positionsRes : (positionsRes.data || []);
        positionsList.forEach((pos: any) => {
          const posId = String(pos._id || pos.id || '');
          if (posId) {
            positionsMap[posId] = pos.title || pos.name || 'Unknown Position';
          }
        });
      } catch (err) {
        console.warn("Could not load positions, will use employee data only:", err);
      }

      // Enrich employee data with names
      // Backend uses primaryDepartmentId and primaryPositionId, and may or may not populate them
      const enrichedEmployees = employeeList.map((emp: any) => {
        // Extract department ID - handle both populated object { _id, name } and string ID
        let deptId = "";
        if (emp.primaryDepartmentId) {
          if (typeof emp.primaryDepartmentId === 'object' && emp.primaryDepartmentId !== null) {
            // Populated object: { _id: ObjectId or string, name: "..." }
            deptId = String(emp.primaryDepartmentId._id || emp.primaryDepartmentId);
          } else {
            // String ID
            deptId = String(emp.primaryDepartmentId);
          }
        }
        
        // Fallback to other field names if primaryDepartmentId didn't work
        if (!deptId) {
          if (emp.departmentId) {
            deptId = typeof emp.departmentId === 'object' 
              ? String(emp.departmentId._id || emp.departmentId)
              : String(emp.departmentId);
          } else if (emp.department) {
            deptId = typeof emp.department === 'object'
              ? String(emp.department._id || emp.department)
              : String(emp.department);
          }
        }
        
        const deptName = emp.primaryDepartmentId?.name || emp.departmentId?.name || 
                        emp.department?.name || "No Department";
        
        // Extract position ID - same logic
        let posId = "";
        if (emp.primaryPositionId) {
          if (typeof emp.primaryPositionId === 'object' && emp.primaryPositionId !== null) {
            posId = String(emp.primaryPositionId._id || emp.primaryPositionId);
          } else {
            posId = String(emp.primaryPositionId);
          }
        }
        if (!posId) {
          if (emp.positionId) {
            posId = typeof emp.positionId === 'object'
              ? String(emp.positionId._id || emp.positionId)
              : String(emp.positionId);
          } else if (emp.position) {
            posId = typeof emp.position === 'object'
              ? String(emp.position._id || emp.position)
              : String(emp.position);
          }
        }
        // Get position name - check if primaryPositionId is populated or use positionsMap
        let posName = "No Position";
        if (emp.primaryPositionId) {
          if (typeof emp.primaryPositionId === 'object' && emp.primaryPositionId !== null) {
            // Populated object - check for title or name
            posName = emp.primaryPositionId.title || emp.primaryPositionId.name || "No Position";
          } else if (posId && positionsMap[posId]) {
            // String ID - look up in positionsMap
            posName = positionsMap[posId];
          }
        }
        // Fallback to other position fields or positionsMap
        if (posName === "No Position") {
          if (emp.positionId) {
            if (typeof emp.positionId === 'object' && emp.positionId !== null) {
              posName = emp.positionId.title || emp.positionId.name || "No Position";
            } else if (positionsMap[String(emp.positionId)]) {
              posName = positionsMap[String(emp.positionId)];
            }
          } else if (emp.position) {
            if (typeof emp.position === 'object' && emp.position !== null) {
              posName = emp.position.title || emp.position.name || "No Position";
            } else if (positionsMap[String(emp.position)]) {
              posName = positionsMap[String(emp.position)];
            }
          } else if (posId && positionsMap[posId]) {
            // Use the extracted posId to look up in positionsMap
            posName = positionsMap[posId];
          }
        }
        
        // Manager might be in supervisorPositionId or managerId
        const mgrId = emp.managerId?._id || emp.managerId || 
                     emp.supervisorPositionId?._id || emp.supervisorPositionId || "";
        const mgrName = emp.managerId?.fullName || emp.manager?.fullName || "N/A";
        
        return {
          _id: emp._id || emp.id,
          id: emp._id || emp.id,
          employeeNumber: emp.employeeNumber,
          firstName: emp.firstName,
          lastName: emp.lastName,
          fullName: emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || `Employee ${emp.employeeNumber || ""}`,
          departmentId: deptId,
          departmentName: deptName,
          positionId: posId,
          positionName: posName,
          managerId: mgrId,
          managerName: mgrName,
        };
      });
      
      // Debug: Log first employee's department data structure
      if (employeeList.length > 0) {
        console.log("Sample employee raw data:", employeeList[0]);
        console.log("Sample employee primaryDepartmentId:", employeeList[0].primaryDepartmentId);
        console.log("Sample employee enriched:", enrichedEmployees[0]);
      }

      console.log("Enriched employees:", enrichedEmployees.length);
      console.log("Enriched employees list:", enrichedEmployees);
      
      // Filter out employees without department (they can't be assigned)
      // Check for both truthy value and non-empty string
      const employeesWithDepartment = enrichedEmployees.filter(emp => {
        const hasDept = emp.departmentId && emp.departmentId !== "" && emp.departmentId.trim() !== "";
        if (!hasDept) {
          console.warn("Filtered employee without department:", {
            id: emp._id || emp.id,
            name: emp.fullName,
            departmentId: emp.departmentId
          });
        }
        return hasDept;
      });
      
      console.log("Total employees loaded:", enrichedEmployees.length);
      console.log("Employees with department:", employeesWithDepartment.length);
      console.log("Employees with department list:", employeesWithDepartment);
      
      // Log employees without departments for debugging
      const employeesWithoutDept = enrichedEmployees.filter(emp => !emp.departmentId || emp.departmentId === "");
      if (employeesWithoutDept.length > 0) {
        console.warn("Employees without departments (filtered out):", employeesWithoutDept);
      }
      
      setEmployees(employeesWithDepartment);
      
      if (enrichedEmployees.length === 0) {
        setError("No active employees found. Please ensure there are employees with ACTIVE status in the system.");
      } else if (employeesWithDepartment.length === 0) {
        setError(`Found ${enrichedEmployees.length} active employee(s), but none have a department assigned. Employees must have a primaryDepartmentId to be assigned to appraisal cycles. Check browser console (F12) for details.`);
      } else if (employeesWithDepartment.length < enrichedEmployees.length) {
        console.warn(`Filtered out ${enrichedEmployees.length - employeesWithDepartment.length} employee(s) without departments`);
      }
    } catch (err: any) {
      console.error("Error loading employees:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code,
      });
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || !err.response) {
        setError("Cannot connect to the server. Please check: (1) Backend server is running, (2) API URL is correct, (3) Network connection is active.");
      } else {
        setError(err?.response?.data?.message || err.message || "Failed to load employees. Check your connection.");
      }
    } finally {
      setLoadingEmployees(false);
    }
  };

  const toggleEmployeeSelection = (employeeId: string, employee: Employee) => {
    const newSelection = new Set(selectedEmployeeIds);
    if (newSelection.has(employeeId)) {
      newSelection.delete(employeeId);
      // Remove from assignments
      setAssignments(prev => prev.filter(a => a.employeeProfileId !== employeeId));
    } else {
      // Validate employee has required fields before adding
      if (!employee.departmentId) {
        setError(`Cannot add ${employee.fullName}: Missing department information. Please ensure the employee has a department assigned in their profile.`);
        return;
      }
      
      // Check if this employee is already in assignments (prevent duplicates)
      const alreadyExists = assignments.some(a => a.employeeProfileId === employeeId);
      if (alreadyExists) {
        setError(`Employee ${employee.fullName} is already selected.`);
        return;
      }
      
      newSelection.add(employeeId);
      // Add to assignments
      setAssignments(prev => [
        ...prev,
        {
          employeeProfileId: employeeId,
          managerProfileId: employee.managerId || user?._id || "",
          departmentId: employee.departmentId, // This should not be empty now
          positionId: employee.positionId || undefined,
          dueDate: dueDate || undefined,
        },
      ]);
    }
    setSelectedEmployeeIds(newSelection);
  };

  const handleCreateAssignments = async () => {
    if (!selectedTemplateId) {
      setError("Please select a template");
      return;
    }

    if (assignments.length === 0) {
      setError("Please select at least one employee");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Remove duplicates based on employeeProfileId to prevent creating duplicate assignments
      const uniqueAssignments = assignments.filter((assignment, index, self) =>
        index === self.findIndex((a) => a.employeeProfileId === assignment.employeeProfileId)
      );

      if (uniqueAssignments.length !== assignments.length) {
        console.warn(`Removed ${assignments.length - uniqueAssignments.length} duplicate assignment(s)`);
        setError(`Warning: Removed ${assignments.length - uniqueAssignments.length} duplicate assignment(s). Creating ${uniqueAssignments.length} assignment(s).`);
      }

      await PerformanceApi.createAssignment({
        cycleId: cycleId,
        templateId: selectedTemplateId,
        assignments: uniqueAssignments,
      });

      // Reload existing assignments to show the newly created ones
      await loadExistingAssignments();
      
      // Clear selection
      setSelectedEmployeeIds(new Set());
      setAssignments([]);
      setDueDate("");
      
      // Show success message instead of redirecting
      setError(null);
      // You could add a success state here if needed
    } catch (err: any) {
      console.error("Error creating assignments:", err);
      setError(err?.response?.data?.message || err.message || "Failed to create assignments");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingAssignmentId(assignmentId);
      setError(null);
      await PerformanceApi.deleteAssignment(assignmentId);
      // Reload existing assignments
      await loadExistingAssignments();
    } catch (err: any) {
      console.error("Error deleting assignment:", err);
      setError(err?.response?.data?.message || err.message || "Failed to delete assignment");
    } finally {
      setDeletingAssignmentId(null);
    }
  };

  const handleUpdateAssignmentStatus = async (assignmentId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(assignmentId);
      setError(null);
      await PerformanceApi.updateAssignmentStatus(assignmentId, newStatus);
      // Reload existing assignments
      await loadExistingAssignments();
    } catch (err: any) {
      console.error("Error updating assignment status:", err);
      setError(err?.response?.data?.message || err.message || "Failed to update assignment status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <RouteGuard
      requiredRoute="/performance/cycles"
      requiredRoles={["System Admin", "HR Admin", "HR Manager"]}
    >
      {loading || loadingData ? (
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-text-muted text-lg">Loading...</p>
          </div>
        </main>
      ) : !user || !canAccess || !canManageCycles ? null : (
        <main className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                  Create Employee Assignments
                </h1>
                <p className="text-text-muted text-lg">
                  Assign employees to appraisal cycle: {cycle?.name || cycle?.title || cycleId}
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push("/performance/cycles")}>
                Back to Cycles
              </Button>
            </header>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {/* Existing Assignments Section */}
            {existingAssignments.length > 0 && (
              <Card title={`Existing Assignments (${existingAssignments.length})`}>
                {loadingExistingAssignments ? (
                  <div className="text-center py-4">
                    <p className="text-text-muted">Loading existing assignments...</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2 border border-border rounded-lg p-4">
                    {existingAssignments.map((assignment, idx) => {
                      const id = assignment._id || assignment.id || idx.toString();
                      // Extract employee details - handle both populated and non-populated cases
                      const employeeName = assignment.employeeName || 
                        (assignment.employeeProfileId && typeof assignment.employeeProfileId === 'object' 
                          ? `${assignment.employeeProfileId.firstName || ''} ${assignment.employeeProfileId.lastName || ''}`.trim()
                          : '') || 
                        'Unknown Employee';
                      const employeeNumber = assignment.employeeNumber || 
                        (assignment.employeeProfileId && typeof assignment.employeeProfileId === 'object'
                          ? assignment.employeeProfileId.employeeNumber
                          : '') || '';
                      
                      // Extract template name
                      const templateName = assignment.templateName || 
                        (assignment.templateId && typeof assignment.templateId === 'object'
                          ? (assignment.templateId.name || assignment.templateId.title)
                          : '') || 
                        'Unknown Template';
                      
                      return (
                        <div
                          key={id}
                          className="p-3 rounded-lg border bg-background border-border hover:border-primary/50 transition"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-text font-semibold">
                                  {employeeName}
                                </p>
                                {employeeNumber && (
                                  <span className="text-text-muted text-sm">#{employeeNumber}</span>
                                )}
                              </div>
                              <div className="text-sm text-text-muted space-y-1">
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                  {templateName && (
                                    <span>Template: <span className="text-text">{templateName}</span></span>
                                  )}
                                  {assignment.status && (
                                    <span className={`px-2 py-1 rounded text-xs inline-block ${
                                      assignment.status === 'NOT_STARTED' ? 'bg-yellow-500/20 text-yellow-400' :
                                      assignment.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                                      assignment.status === 'SUBMITTED' ? 'bg-purple-500/20 text-purple-400' :
                                      assignment.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' :
                                      assignment.status === 'ACKNOWLEDGED' ? 'bg-teal-500/20 text-teal-400' :
                                      'bg-gray-500/20 text-gray-400'
                                    }`}>
                                      {assignment.status}
                                    </span>
                                  )}
                                </div>
                                {assignment.dueDate && (
                                  <p className="text-xs">
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                                {assignment.assignedAt && (
                                  <p className="text-xs">
                                    Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {(canDeleteAssignments || canUpdateAssignmentStatus || isHRAdmin || isSystemAdmin) && (
                              <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
                                {canUpdateAssignmentStatus && (isHRAdmin || isSystemAdmin) && (
                                  <div className="flex flex-col gap-1">
                                    <select
                                      value={assignment.status || 'NOT_STARTED'}
                                      onChange={(e) => handleUpdateAssignmentStatus(id, e.target.value)}
                                      disabled={updatingStatusId === id}
                                      className="text-xs px-2 py-1 rounded border border-border bg-background text-text"
                                    >
                                      <option value="NOT_STARTED">NOT_STARTED</option>
                                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                                      <option value="SUBMITTED">SUBMITTED</option>
                                      <option value="PUBLISHED">PUBLISHED</option>
                                      <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                                    </select>
                                    {updatingStatusId === id && (
                                      <span className="text-xs text-text-muted">Updating...</span>
                                    )}
                                  </div>
                                )}
                                {canDeleteAssignments && (isHRAdmin || isSystemAdmin) && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleDeleteAssignment(id)}
                                    disabled={deletingAssignmentId === id}
                                    className="text-xs px-3 py-1 bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                                  >
                                    {deletingAssignmentId === id ? "Deleting..." : "Delete"}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            <Card title={existingAssignments.length > 0 ? "Create New Assignments" : "Step 1: Select Template"}>
              <div className="space-y-4">
                <div>
                  <label className="label">Appraisal Template</label>
                  <select
                    className="input"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    <option value="">-- Select a Template --</option>
                    
                    {/* Existing Assignment Templates */}
                    {existingAssignments.length > 0 && (() => {
                      // Get unique template IDs from existing assignments
                      const existingTemplateIds = new Set(
                        existingAssignments
                          .map(assignment => {
                            if (typeof assignment.templateId === 'object' && assignment.templateId !== null) {
                              return String(assignment.templateId._id || assignment.templateId);
                            }
                            return String(assignment.templateId || '');
                          })
                          .filter(id => id && id !== '')
                      );
                      
                      // Get templates that are already used
                      const existingTemplates = templates.filter(template => {
                        const id = template._id || template.id || "";
                        return existingTemplateIds.has(id);
                      });
                      
                      // Get templates that are NOT yet used
                      const newTemplates = templates.filter(template => {
                        const id = template._id || template.id || "";
                        return !existingTemplateIds.has(id);
                      });
                      
                      return (
                        <>
                          {existingTemplates.length > 0 && (
                            <optgroup label="Existing Assignments">
                              {existingTemplates.map((template) => {
                                const id = template._id || template.id || "";
                                const name = template.name || template.title || `Template ${id.substring(0, 8)}`;
                                // Count how many assignments use this template
                                const assignmentCount = existingAssignments.filter(a => {
                                  const aTemplateId = typeof a.templateId === 'object' && a.templateId !== null
                                    ? String(a.templateId._id || a.templateId)
                                    : String(a.templateId || '');
                                  return aTemplateId === id;
                                }).length;
                                return (
                                  <option key={id} value={id}>
                                    {name} ({assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''})
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                          {newTemplates.length > 0 && (
                            <optgroup label="Available Templates (New)">
                              {newTemplates.map((template) => {
                                const id = template._id || template.id || "";
                                const name = template.name || template.title || `Template ${id.substring(0, 8)}`;
                                return (
                                  <option key={id} value={id}>
                                    {name}
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                        </>
                      );
                    })()}
                    
                    {/* If no existing assignments, show all templates normally */}
                    {existingAssignments.length === 0 && templates.map((template) => {
                      const id = template._id || template.id || "";
                      const name = template.name || template.title || `Template ${id.substring(0, 8)}`;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {selectedTemplateId && (
                  <Button onClick={loadEmployees} isLoading={loadingEmployees} variant="primary">
                    Load Employees
                  </Button>
                )}
              </div>
            </Card>

            {employees.length > 0 && (
              <>
                <Card title="Step 2: Select Employees and Set Due Date">
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="label">Due Date (Optional)</label>
                      <Input
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => {
                          setDueDate(e.target.value);
                          // Update all assignments with new due date
                          setAssignments(prev => prev.map(a => ({ ...a, dueDate: e.target.value || undefined })));
                        }}
                      />
                      <p className="text-xs text-text-muted mt-1">
                        Set a due date for all selected employees, or leave blank
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-blue-400">
                    <strong>{selectedEmployeeIds.size}</strong> employee(s) selected
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2 border border-border rounded-lg p-4">
                    {employees.map((employee) => {
                      const id = employee._id || employee.id || "";
                      if (!id) {
                        console.warn("Employee without ID found:", employee);
                        return null;
                      }
                      const isSelected = selectedEmployeeIds.has(id);
                      // Check if employee already has an assignment for this cycle
                      const hasExistingAssignment = existingAssignments.some(
                        (assignment) => String(assignment.employeeProfileId) === String(id)
                      );
                      
                      return (
                        <div
                          key={id}
                          className={`p-3 rounded-lg border transition ${
                            hasExistingAssignment
                              ? "bg-gray-500/10 border-gray-500/30 cursor-not-allowed opacity-60"
                              : isSelected
                              ? "bg-primary/20 border-primary cursor-pointer"
                              : "bg-background border-border hover:border-primary/50 cursor-pointer"
                          }`}
                          onClick={() => !hasExistingAssignment && toggleEmployeeSelection(id, employee)}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={hasExistingAssignment}
                              onChange={() => !hasExistingAssignment && toggleEmployeeSelection(id, employee)}
                              className="w-4 h-4"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                              <p className="text-text font-semibold">{employee.fullName}</p>
                                {hasExistingAssignment && (
                                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                    Already Assigned
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-text-muted space-x-4">
                                {employee.employeeNumber && (
                                  <span>#{employee.employeeNumber}</span>
                                )}
                                <span>Dept: {employee.departmentName}</span>
                                <span>Position: {employee.positionName}</span>
                                {employee.managerName && employee.managerName !== "N/A" && (
                                  <span>Manager: {employee.managerName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-text font-semibold">
                        Ready to create {selectedEmployeeIds.size} assignment(s)
                      </p>
                      <p className="text-text-muted text-sm">
                        Template: {templates.find(t => (t._id || t.id) === selectedTemplateId)?.name || "N/A"}
                      </p>
                    </div>
                    <Button
                      onClick={handleCreateAssignments}
                      isLoading={saving}
                      disabled={selectedEmployeeIds.size === 0 || !selectedTemplateId}
                      variant="primary"
                    >
                      Create Assignments
                    </Button>
                  </div>
                </Card>
              </>
            )}

            {employees.length === 0 && selectedTemplateId && !loadingEmployees && (
              <Card>
                <div className="text-center py-8">
                  <p className="text-text-muted">No employees found. Click "Load Employees" to fetch the employee list.</p>
                </div>
              </Card>
            )}
          </div>
        </main>
      )}
    </RouteGuard>
  );
}

