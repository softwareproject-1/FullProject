"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import RouteGuard from "@/components/RouteGuard";
import { getChangeRequests, processChangeRequest, ChangeRequest } from "@/utils/employeeProfileApi";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";

export default function ChangeRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // HR Manager should view all change requests by default, others can filter
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/admin/employee-profile/change-requests") : false;
  const canApproveChangeRequests = user ? hasFeature(user.roles, "approveChangeRequests") : false;
  const canManageChangeRequests = user ? hasFeature(user.roles, "manageChangeRequests") : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;
  const isHRManager = user ? hasRole(user.roles, SystemRole.HR_MANAGER) : false;
  const isHREmployee = user ? hasRole(user.roles, SystemRole.HR_EMPLOYEE) : false;

  useEffect(() => {
    if (!authLoading && user && canAccess) {
      fetchChangeRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, user, authLoading, canAccess]);

  const fetchChangeRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getChangeRequests(statusFilter || undefined);
      
      if (Array.isArray(response)) {
        setChangeRequests(response);
      } else if (response.data && Array.isArray(response.data)) {
        setChangeRequests(response.data);
      } else {
        setChangeRequests([]);
      }
    } catch (err: any) {
      console.error("Error fetching change requests:", err);
      setError(err.response?.data?.message || "Failed to fetch change requests");
      setChangeRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      setError(null);
      await processChangeRequest(requestId, "APPROVED");
      await fetchChangeRequests();
      setShowRejectModal(null);
      setRejectReason("");
    } catch (err: any) {
      console.error("Error approving change request:", err);
      setError(err.response?.data?.message || "Failed to approve change request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessingId(requestId);
      setError(null);
      await processChangeRequest(requestId, "REJECTED", rejectReason);
      await fetchChangeRequests();
      setShowRejectModal(null);
      setRejectReason("");
    } catch (err: any) {
      console.error("Error rejecting change request:", err);
      setError(err.response?.data?.message || "Failed to reject change request");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
      CANCELED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return statusClasses[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading change requests...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/admin/employee-profile/change-requests" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "HR Employee"]}
      requiredFeatures={["manageChangeRequests"]}
    >
      {!user || !canAccess ? null : (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Governance Change Requests
                </h1>
                <p className="text-slate-600 text-base md:text-lg">
                  {canApproveChangeRequests ? "Approve or reject employee profile change requests" : canManageChangeRequests ? "View and process employee profile change requests (data entry)" : "View employee profile change requests"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/admin/employee-profile")}
                  variant="outline"
                  className="bg-white text-slate-900 border-slate-300 hover:bg-slate-100"
                >
                  Back to Employee List
                </Button>
              </div>
            </div>

        {/* Filters */}
        <Card className="mb-6 bg-white">
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="statusFilter">Status Filter</Label>
                <select
                  id="statusFilter"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>
              <Button onClick={fetchChangeRequests} variant="default">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Change Requests List */}
        {changeRequests.length === 0 ? (
          <Card className="bg-white">
            <CardContent>
              <div className="text-center p-8 text-slate-600">
                No change requests found
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {changeRequests.map((request) => (
              <Card key={request._id} className="bg-white">
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">
                          Request ID: {request.requestId}
                        </h3>
                        <span className={`px-3 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-2">
                        Employee Profile ID: {request.employeeProfileId}
                      </p>
                      {request.employeeProfile && (
                        <p className="text-slate-900 text-sm mb-2">
                          Employee: {request.employeeProfile.firstName} {request.employeeProfile.lastName} ({request.employeeProfile.employeeNumber})
                        </p>
                      )}
                    </div>
                    {request.status === "PENDING" && canApproveChangeRequests && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(request.requestId)}
                          variant="default"
                          disabled={processingId === request.requestId || processingId !== null}
                        >
                          {processingId === request.requestId ? "Processing..." : "Approve"}
                        </Button>
                        <Button
                          onClick={() => setShowRejectModal(request.requestId)}
                          variant="outline"
                          disabled={processingId !== null}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="mb-2">
                      <label className="text-slate-600 text-sm font-semibold">Description:</label>
                      <p className="text-slate-900 mt-1">{request.requestDescription}</p>
                    </div>
                    {request.reason && (
                      <div className="mb-2">
                        <label className="text-slate-600 text-sm font-semibold">Reason:</label>
                        <p className="text-slate-900 mt-1">{request.reason}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {request.submittedAt && (
                        <div>
                          <label className="text-slate-600 text-sm">Submitted At:</label>
                          <p className="text-slate-900 text-sm">
                            {new Date(request.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {request.processedAt && (
                        <div>
                          <label className="text-slate-600 text-sm">Processed At:</label>
                          <p className="text-slate-900 text-sm">
                            {new Date(request.processedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reject Modal */}
                  {showRejectModal === request.requestId && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <Label htmlFor="rejectReason" className="mb-2">Rejection Reason (Required)</Label>
                      <textarea
                        id="rejectReason"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] mb-4"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReject(request.requestId)}
                          variant="outline"
                          disabled={!rejectReason.trim() || processingId === request.requestId || processingId !== null}
                        >
                          {processingId === request.requestId ? "Processing..." : "Confirm Rejection"}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowRejectModal(null);
                            setRejectReason("");
                          }}
                          variant="outline"
                          disabled={processingId !== null}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
      )}
    </RouteGuard>
  );
}

