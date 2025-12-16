"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { recordApprovalDecision, updateStructureRequestStatus, StructureChangeRequest } from "@/utils/organizationStructureApi";
import { isSystemAdmin } from "@/utils/roleUtils";
import axiosInstance from "@/utils/ApiClient";

export default function StructureChangeRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("SUBMITTED");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approvalComments, setApprovalComments] = useState<{ [key: string]: string }>({});
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string>("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (!isSystemAdmin(user.roles)) {
        router.replace("/unauthorized");
      }
    }
  }, [user, authLoading, router]);

  // Note: There's no GET endpoint for listing change requests yet
  // This page provides functionality to approve/reject requests by ID
  // In a real scenario, you would add a GET /organization-structure/change-requests endpoint

  const handleApprove = async (requestId: string) => {
    if (!user?._id) {
      setError("User ID not available");
      return;
    }

    try {
      setProcessingId(requestId);
      setError(null);
      await recordApprovalDecision(requestId, {
        decision: "APPROVED",
        approverId: user._id,
        comments: approvalComments[requestId] || "",
      });
      setShowApprovalModal(null);
      setApprovalComments(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
      // Optionally refresh if we had a list endpoint
    } catch (err: any) {
      console.error("Error approving change request:", err);
      setError(err.response?.data?.message || "Failed to approve change request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user?._id) {
      setError("User ID not available");
      return;
    }

    if (!approvalComments[requestId]?.trim()) {
      setError("Please provide comments for rejection");
      return;
    }

    try {
      setProcessingId(requestId);
      setError(null);
      await recordApprovalDecision(requestId, {
        decision: "REJECTED",
        approverId: user._id,
        comments: approvalComments[requestId],
      });
      setShowApprovalModal(null);
      setApprovalComments(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    } catch (err: any) {
      console.error("Error rejecting change request:", err);
      setError(err.response?.data?.message || "Failed to reject change request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      setProcessingId(requestId);
      setError(null);
      await updateStructureRequestStatus(requestId, {
        status: newStatus,
        summary: `Status updated to ${newStatus} by System Admin`,
      });
      // Optionally refresh if we had a list endpoint
    } catch (err: any) {
      console.error("Error updating request status:", err);
      setError(err.response?.data?.message || "Failed to update request status");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      SUBMITTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      UNDER_REVIEW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
      REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
      CANCELED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      IMPLEMENTED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return statusClasses[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading change requests...</p>
        </div>
      </div>
    );
  }

  if (!user || !isSystemAdmin(user.roles)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
              Structure Change Requests
            </h1>
            <p className="text-text-muted text-base md:text-lg">
              Approve or reject organizational structure change requests
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-text text-sm">
              <strong>Note:</strong> To approve or reject a change request, you need the request ID. 
              Use the form below to manage individual requests, or contact the development team to add a list endpoint.
            </p>
          </div>
        </Card>

        {/* Manual Request ID Input */}
        <Card title="Manage Change Request by ID" className="mb-6">
          <div className="space-y-4">
            <Input
              label="Change Request ID"
              placeholder="Enter MongoDB ObjectId of the change request"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (requestId) {
                    setShowApprovalModal(requestId);
                  } else {
                    setError("Please enter a request ID");
                  }
                }}
                variant="primary"
                disabled={!requestId}
              >
                Manage Request
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && (
          <Card title={`Manage Change Request: ${showApprovalModal}`} className="mb-6">
            <div className="space-y-4">
              <div className="mb-4 w-full">
                <label className="label">Comments</label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Enter comments for approval/rejection..."
                  value={approvalComments[showApprovalModal] || ""}
                  onChange={(e) => setApprovalComments(prev => ({
                    ...prev,
                    [showApprovalModal]: e.target.value
                  }))}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(showApprovalModal)}
                  variant="primary"
                  isLoading={processingId === showApprovalModal}
                  disabled={processingId !== null}
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(showApprovalModal)}
                  variant="outline"
                  isLoading={processingId === showApprovalModal}
                  disabled={processingId !== null || !approvalComments[showApprovalModal]?.trim()}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setShowApprovalModal(null);
                    setApprovalComments(prev => {
                      const newState = { ...prev };
                      delete newState[showApprovalModal];
                      return newState;
                    });
                  }}
                  variant="outline"
                  disabled={processingId !== null}
                >
                  Cancel
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-text-muted text-sm mb-2">Or update status directly:</p>
                <div className="flex flex-wrap gap-2">
                  {["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELED", "IMPLEMENTED"].map((status) => (
                    <Button
                      key={status}
                      onClick={() => handleUpdateStatus(showApprovalModal, status)}
                      variant="outline"
                      className="text-xs"
                      isLoading={processingId === showApprovalModal}
                      disabled={processingId !== null}
                    >
                      Set {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card title="Instructions">
          <div className="space-y-2 text-text-muted text-sm">
            <p>1. Enter the Change Request ID (MongoDB ObjectId) in the form above</p>
            <p>2. Click "Manage Request" to open the approval interface</p>
            <p>3. Add comments (required for rejection)</p>
            <p>4. Click "Approve" or "Reject" to record your decision</p>
            <p>5. Alternatively, use the status buttons to update the request status directly</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

