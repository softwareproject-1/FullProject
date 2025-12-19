"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RouteGuard from "@/components/RouteGuard";
import { listEmployeeProfiles, archiveEmployeeProfile, reactivateEmployeeProfile, getEmployeeProfileById, EmployeeProfile, EmployeeProfileFilter } from "@/utils/employeeProfileApi";
import { candidateApi, Candidate, CandidateFilter } from "@/utils/candidateApi";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";

export default function EmployeeProfileListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmployeeProfileFilter>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [candidateFilters, setCandidateFilters] = useState<CandidateFilter>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/admin/employee-profile") : false;
  const canViewAllEmployees = user ? hasFeature(user.roles, "viewAllEmployees") : false;
  const canViewOwnProfile = user ? hasFeature(user.roles, "viewOwnProfile") : false;
  const canCreateEmployee = user ? hasFeature(user.roles, "createEmployee") : false;
  const canArchiveEmployee = user ? hasFeature(user.roles, "archiveEmployees") : false;
  const canEditEmployee = user ? hasFeature(user.roles, "editEmployee") : false;
  const canAssignRoles = user ? hasFeature(user.roles, "assignRoles") : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;
  const isRecruiter = user ? hasRole(user.roles, SystemRole.RECRUITER) : false;
  const canViewCandidates = user ? hasFeature(user.roles, "viewCandidates") : false;
  const canCreateCandidate = user ? hasFeature(user.roles, "createCandidate") : false;
  const canEditCandidate = user ? hasFeature(user.roles, "editCandidate") : false;
  const isLegalPolicyAdmin = user ? hasRole(user.roles, SystemRole.LEGAL_POLICY_ADMIN) : false;
  const isFinanceStaff = user ? hasRole(user.roles, SystemRole.FINANCE_STAFF) : false;
  const isDepartmentEmployee = user ? hasRole(user.roles, SystemRole.DEPARTMENT_EMPLOYEE) : false;
  const isDepartmentHead = user ? hasRole(user.roles, SystemRole.DEPARTMENT_HEAD) : false;
  const canViewTeamEmployees = user ? hasFeature(user.roles, "viewTeamEmployees") : false;
  
  // State for department head's department
  const [userDepartmentId, setUserDepartmentId] = useState<string | null>(null);
  const [loadingDepartment, setLoadingDepartment] = useState(false);

  // Redirect department employees to their own profile
  useEffect(() => {
    if (!authLoading && user && canAccess && isDepartmentEmployee && !canViewAllEmployees && user._id) {
      router.replace(`/admin/employee-profile/${user._id}`);
      return;
    }
  }, [authLoading, user, canAccess, isDepartmentEmployee, canViewAllEmployees, router]);

  // Fetch department head's department when they log in
  useEffect(() => {
    const fetchUserDepartment = async () => {
      if (!authLoading && user && isDepartmentHead && canViewTeamEmployees && user._id && !userDepartmentId) {
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
          console.log("Department Head's Department ID:", deptId);
        } catch (err: any) {
          console.error("Error fetching user department:", err);
          setError("Failed to load your department information");
        } finally {
          setLoadingDepartment(false);
        }
      }
    };

    fetchUserDepartment();
  }, [authLoading, user, isDepartmentHead, canViewTeamEmployees, userDepartmentId]);

  // Fetch data when filters or user changes
  useEffect(() => {
    if (!authLoading && user && canAccess) {
      if (isRecruiter && canViewCandidates) {
        // Recruiters can view candidates even without viewAllEmployees
        fetchCandidates();
      } else if (canViewAllEmployees) {
        // Other roles need viewAllEmployees to see employees
        fetchEmployees();
      } else if (isDepartmentHead && canViewTeamEmployees) {
        // Department heads can view team employees in their department
        // Wait for department ID to be loaded (or if loading failed, still try to show message)
        if (!loadingDepartment) {
          fetchEmployees();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    candidateFilters.page, 
    candidateFilters.limit, 
    candidateFilters.sortBy, 
    candidateFilters.sortOrder,
    filters.page, 
    filters.limit, 
    filters.sortBy, 
    filters.sortOrder, 
    searchTerm, 
    statusFilter, 
    user?._id, 
    authLoading, 
    canAccess, 
    isRecruiter,
    canViewAllEmployees,
    canViewCandidates,
    isDepartmentHead,
    canViewTeamEmployees,
    userDepartmentId,
    loadingDepartment
  ]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      const updatedFilters = {
        ...candidateFilters,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      };
      console.log("Fetching candidates with filters:", updatedFilters);
      const response = await candidateApi.listCandidates(updatedFilters);
      console.log("Candidates response:", response);
      
      // Handle different response formats
      if (response && Array.isArray(response)) {
        // If response is directly an array
        setCandidates(response);
        setTotalCount(response.length);
        setTotalPages(1);
        setCurrentPage(1);
        console.log(`Loaded ${response.length} candidates`);
      } else if (response?.data && Array.isArray(response.data)) {
        // If response has data property
        setCandidates(response.data);
        setTotalCount(response.meta?.total || response.data.length);
        setTotalPages(response.meta?.totalPages || 1);
        setCurrentPage(response.meta?.page || 1);
        console.log(`Loaded ${response.data.length} candidates`);
      } else {
        console.warn("Unexpected response format:", response);
        setCandidates([]);
        setTotalCount(0);
        setError("Unexpected response format from server. Please check backend logs.");
      }
    } catch (err: any) {
      console.error("Error fetching candidates:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      });
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || "Failed to fetch candidates. Please check the backend server logs.";
      setError(errorMessage);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const updatedFilters: EmployeeProfileFilter = {
        ...filters,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      };
      
      // If user is a department head, filter by their department
      if (isDepartmentHead && canViewTeamEmployees && userDepartmentId) {
        updatedFilters.departmentIds = [userDepartmentId];
      }
      
      const response = await listEmployeeProfiles(updatedFilters);
      
      if (Array.isArray(response)) {
        setEmployees(response);
        setTotalCount(response.length);
      } else if (response.data && Array.isArray(response.data)) {
        setEmployees(response.data);
        setTotalCount(response.total || response.data.length);
        setTotalPages(response.totalPages || 1);
        setCurrentPage(response.page || 1);
      } else {
        setEmployees([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      console.error("Error fetching employees:", err);
      setError(err.response?.data?.message || "Failed to fetch employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (employeeId: string) => {
    if (!confirm("Are you sure you want to deactivate this employee profile?")) {
      return;
    }

    try {
      setArchivingId(employeeId);
      setError(null);
      await archiveEmployeeProfile(employeeId, "Deactivated by System Admin");
      await fetchEmployees();
    } catch (err: any) {
      console.error("Error deactivating employee:", err);
      setError(err.response?.data?.message || "Failed to deactivate employee");
    } finally {
      setArchivingId(null);
    }
  };

  const handleReactivate = async (employeeId: string) => {
    if (!confirm("Are you sure you want to reactivate this employee profile?")) {
      return;
    }

    try {
      setReactivatingId(employeeId);
      setError(null);
      await reactivateEmployeeProfile(employeeId, "Reactivated by System Admin");
      await fetchEmployees();
    } catch (err: any) {
      console.error("Error reactivating employee:", err);
      setError(err.response?.data?.message || "Failed to reactivate employee");
    } finally {
      setReactivatingId(null);
    }
  };

  const handleSearch = () => {
    if (isRecruiter) {
      setCandidateFilters(prev => ({ ...prev, page: 1 }));
      // fetchCandidates will be called by useEffect when candidateFilters changes
    } else {
      setFilters(prev => ({ ...prev, page: 1 }));
      // fetchEmployees will be called by useEffect when filters changes
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    if (isRecruiter) {
      setCandidateFilters(prev => ({ ...prev, page: 1 }));
      // fetchCandidates will be called by useEffect
    } else {
      setFilters(prev => ({ ...prev, page: 1 }));
      // fetchEmployees will be called by useEffect
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (isRecruiter) {
      setCandidateFilters(prev => ({ ...prev, page: newPage }));
      // fetchCandidates will be called by useEffect when candidateFilters changes
    } else {
      setFilters(prev => ({ ...prev, page: newPage }));
      // fetchEmployees will be called by useEffect when filters changes
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      // Employee statuses
      ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
      INACTIVE: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      ON_LEAVE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      SUSPENDED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      RETIRED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      PROBATION: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      TERMINATED: "bg-red-500/20 text-red-400 border-red-500/30",
      // Candidate statuses
      APPLIED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      SCREENING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      INTERVIEW: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      OFFER_SENT: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      OFFER_ACCEPTED: "bg-green-500/20 text-green-400 border-green-500/30",
      HIRED: "bg-green-600/20 text-green-500 border-green-600/30",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
      WITHDRAWN: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return statusClasses[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  if (authLoading || loading || (isDepartmentHead && loadingDepartment)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">
            {isDepartmentHead && loadingDepartment ? "Loading department information..." : "Loading employees..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/admin/employee-profile" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "HR Employee", "Payroll Manager", "Payroll Specialist", "Recruiter", "Legal & Policy Admin", "Finance Staff", "department head", "Department Head", "Department head", "department employee", "Department Employee"]}
    >
      {!user || !canAccess ? null : !canViewAllEmployees && isDepartmentEmployee ? (
        // Department employees should be redirected to their own profile
        // This is a fallback in case redirect didn't work
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600 text-lg">Redirecting to your profile...</p>
          </div>
        </div>
      ) : isDepartmentHead && canViewTeamEmployees && !loadingDepartment && !userDepartmentId ? (
        // Department head but no department assigned (only show after loading is complete)
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <p className="text-slate-600 text-lg">No department assigned. Please contact your administrator.</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  {isRecruiter ? "Candidate Management" : isDepartmentHead ? "Team Members" : "Employee Profiles"}
                </h1>
                <p className="text-slate-600 text-base md:text-lg">
                  {isRecruiter 
                    ? (canCreateCandidate ? "Manage and view all candidates" : "View candidates")
                    : isDepartmentHead
                    ? "View team members in your department"
                    : (canCreateEmployee ? "Manage and view all employee profiles" : "View employee profiles")
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {isRecruiter && canCreateCandidate && (
                  <Button
                    onClick={() => router.push("/admin/employee-profile/candidates/new")}
                    variant="default"
                  >
                    Create Candidate
                  </Button>
                )}
                {!isRecruiter && canCreateEmployee && (isSystemAdmin || isHRAdmin) && (
                  <Button
                    onClick={() => router.push("/admin/employee-profile/new")}
                    variant="default"
                  >
                    Create Employee
                  </Button>
                )}
                {(isSystemAdmin || isHRAdmin) && (
                  <Button
                    onClick={() => router.push(isSystemAdmin ? "/admin" : "/hr-manager")}
                    variant="outline"
                    className="bg-white text-slate-900 border-slate-300 hover:bg-slate-100"
                  >
                    Back to Dashboard
                  </Button>
                )}
                {hasFeature(user.roles, "manageChangeRequests") && (
                  <Button
                    onClick={() => router.push("/admin/employee-profile/change-requests")}
                    variant="default"
                  >
                    View Change Requests
                  </Button>
                )}
              </div>
            </div>

        {/* Filters */}
        <Card className="mb-6 bg-white">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name, employee number, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="statusFilter">Status Filter</Label>
                <select
                  id="statusFilter"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                >
                <option value="">All Statuses</option>
                {isRecruiter ? (
                  <>
                    <option value="APPLIED">Applied</option>
                    <option value="SCREENING">Screening</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFER_SENT">Offer Sent</option>
                    <option value="OFFER_ACCEPTED">Offer Accepted</option>
                    <option value="HIRED">Hired</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </>
                ) : (
                  <>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="RETIRED">Retired</option>
                    <option value="PROBATION">Probation</option>
                    <option value="TERMINATED">Terminated</option>
                  </>
                )}
              </select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} variant="default" className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Employees/Candidates Table */}
        <Card className="bg-white">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    {isRecruiter ? (
                      <>
                        <th className="text-left p-4 text-slate-900 font-semibold">Candidate Number</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Name</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Email</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Status</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Application Date</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left p-4 text-slate-900 font-semibold">Employee Number</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Name</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Email</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Status</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Date of Hire</th>
                        <th className="text-left p-4 text-slate-900 font-semibold">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
              <tbody>
                {isRecruiter ? (
                  candidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-slate-600">
                        No candidates found
                      </td>
                    </tr>
                  ) : (
                    candidates.map((candidate) => (
                      <tr key={candidate._id || candidate.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-900">{candidate.candidateNumber || "-"}</td>
                        <td className="p-4 text-slate-900">
                          {candidate.firstName} {candidate.middleName} {candidate.lastName}
                        </td>
                        <td className="p-4 text-slate-600">{candidate.personalEmail || "-"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(candidate.status || "")}`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600">
                          {candidate.applicationDate ? new Date(candidate.applicationDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => router.push(`/admin/employee-profile/candidates/${candidate._id || candidate.id}`)}
                              variant="outline"
                              className="text-xs px-3 py-1"
                            >
                              View
                            </Button>
                            {canEditCandidate && (
                              <Button
                                onClick={() => router.push(`/admin/employee-profile/candidates/${candidate._id || candidate.id}/edit`)}
                                variant="default"
                                className="text-xs px-3 py-1"
                              >
                                Edit
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  employees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-slate-600">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    employees.map((employee) => (
                      <tr key={employee._id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-900">{employee.employeeNumber}</td>
                        <td className="p-4 text-slate-900">
                          {employee.firstName} {employee.middleName} {employee.lastName}
                        </td>
                        <td className="p-4 text-slate-600">{employee.workEmail || employee.personalEmail || "-"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(employee.status)}`}>
                            {employee.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600">
                          {employee.dateOfHire ? new Date(employee.dateOfHire).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => router.push(`/admin/employee-profile/${employee._id}`)}
                              variant="outline"
                              className="text-xs px-3 py-1 bg-white text-slate-900 border-slate-300 hover:bg-slate-100"
                            >
                              {isFinanceStaff ? "View Employee Finance Data" : isLegalPolicyAdmin ? "View Compliance Data" : "View"}
                            </Button>
                            {canEditEmployee && (
                              <Button
                                onClick={() => router.push(`/admin/employee-profile/${employee._id}/edit`)}
                                variant="default"
                                className="text-xs px-3 py-1"
                              >
                                Edit
                              </Button>
                            )}
                            {canArchiveEmployee && (
                              <>
                                {employee.status === "ACTIVE" ? (
                                  <Button
                                    onClick={() => handleArchive(employee._id)}
                                    variant="outline"
                                    className="text-xs px-3 py-1"
                                    disabled={archivingId === employee._id || archivingId !== null || reactivatingId !== null}
                                  >
                                    {archivingId === employee._id ? "Deactivating..." : "Deactivate"}
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleReactivate(employee._id)}
                                    variant="default"
                                    className="text-xs px-3 py-1"
                                    disabled={reactivatingId === employee._id || archivingId !== null || reactivatingId !== null}
                                  >
                                    {reactivatingId === employee._id ? "Reactivating..." : "Reactivate"}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <p className="text-slate-600 text-sm">
                  Showing page {currentPage} of {totalPages} ({totalCount} total {isRecruiter ? "candidates" : "employees"})
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </div>
      )}
    </RouteGuard>
  );
}

