"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature } from "@/utils/roleAccess";
import { PerformanceApi } from "@/utils/performanceApi";

type Dispute = {
  _id?: string;
  id?: string;
  title?: string;
  status?: string;
  cycleId?: string;
  description?: string;
  reason?: string;
  details?: string;
  appraisalId?: string;
  assignmentId?: string;
  raisedByEmployeeId?: string;
  submittedAt?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  resolvedByEmployeeId?: string;
};

type Cycle = {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  status?: string;
  description?: string;
};

function DisputesPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [cycleId, setCycleId] = useState("");
  const [items, setItems] = useState<Dispute[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resolvePayload, setResolvePayload] = useState<{ [key: string]: string }>({});
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  
  // Submit dispute form state
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [submitFormData, setSubmitFormData] = useState({
    cycleId: "",
    assignmentId: "",
    appraisalId: "",
    reason: "",
    details: "",
  });

  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/performance/disputes") : false;
  const canResolveDisputes = user ? hasFeature(user.roles, "resolveDisputes") : false;
  const canSubmitDisputes = user ? hasFeature(user.roles, "submitDisputes") : false;

  // Load cycles on mount
  useEffect(() => {
    if (!loading && user && canAccess) {
      loadCycles();
    }
  }, [user, loading, canAccess]);

  // Load URL parameters on mount
  useEffect(() => {
    try {
      const urlCycleId = searchParams?.get('cycleId');
      const urlAppraisalId = searchParams?.get('appraisalId');
      
      if (urlCycleId) {
        const trimmedCycleId = urlCycleId.trim();
        setCycleId(trimmedCycleId);
        setSubmitFormData(prev => ({ ...prev, cycleId: trimmedCycleId }));
      }
      
      if (urlAppraisalId) {
        setSubmitFormData(prev => ({ ...prev, appraisalId: urlAppraisalId }));
        setShowSubmitForm(true); // Auto-open form if appraisal ID is provided
      }
    } catch (err) {
      console.error("Error processing URL parameters:", err);
      // Don't set error state, just log it - this shouldn't break the page
    }
  }, [searchParams]);

  const loadCycles = async () => {
    try {
      setLoadingCycles(true);
      const res = await PerformanceApi.listCycles();
      
      // Handle different response structures
      let allCycles: Cycle[] = [];
      if (Array.isArray(res.data)) {
        allCycles = res.data;
      } else if (Array.isArray(res)) {
        allCycles = res;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        allCycles = res.data.data;
      }
      
      // Filter out archived cycles
      const availableCycles = allCycles.filter(
        cycle => cycle.status !== "ARCHIVED" && cycle.status !== "DELETED"
      );
      
      setCycles(availableCycles);
    } catch (err: any) {
      console.error("Error loading cycles:", err);
      setCycles([]);
    } finally {
      setLoadingCycles(false);
    }
  };

  const loadDisputes = async () => {
    if (!cycleId) {
      setError("Please select a cycle to load disputes");
      return;
    }
    
    // Trim the cycleId to remove any whitespace
    const trimmedCycleId = cycleId.trim();
    if (!trimmedCycleId) {
      setError("Please select a valid cycle");
      return;
    }
    
    try {
      setLoadingData(true);
      setError(null);
      const res = await PerformanceApi.listDisputesForCycle(trimmedCycleId);
      
      console.log('Disputes API response:', res);
      console.log('Response data:', res.data);
      
      // Handle different response structures
      let disputes: Dispute[] = [];
      if (Array.isArray(res.data)) {
        disputes = res.data;
      } else if (Array.isArray(res)) {
        disputes = res;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        disputes = res.data.data;
      } else if (res.data?.disputes && Array.isArray(res.data.disputes)) {
        disputes = res.data.disputes;
      }
      
      console.log('Parsed disputes:', disputes);
      setItems(disputes);
      
      if (disputes.length === 0) {
        setError(`No disputes found for cycle ID: ${trimmedCycleId}`);
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error('Error loading disputes:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      setError(err?.response?.data?.message || err.message || "Failed to load disputes");
      setItems([]);
    } finally {
      setLoadingData(false);
    }
  };

  const resolveDispute = async (id: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await PerformanceApi.resolveDispute(id, { resolution: resolvePayload[id] || "Resolved" });
      
      // Show success message
      setSuccessMessage("Dispute resolved successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Clear the resolution input for this dispute
      setResolvePayload((p) => {
        const newPayload = { ...p };
        delete newPayload[id];
        return newPayload;
      });
      
      await loadDisputes();
    } catch (err: any) {
      console.error("Error resolving dispute:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to resolve dispute";
      setError(errorMessage);
    }
  };

  // Helper function to validate MongoDB ObjectId format
  const isValidObjectId = (id: string): boolean => {
    if (!id || typeof id !== 'string') return false;
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id.trim());
  };

  const submitDispute = async () => {
    // Validate required fields - Only Appraisal ID and Reason are required
    // Cycle ID and Assignment ID are optional (backend will retrieve from appraisal)
    if (!submitFormData.appraisalId || !submitFormData.reason) {
      setError("Appraisal ID and Reason are required");
      return;
    }
    
    if (!user?._id) {
      setError("User not found");
      return;
    }

    // Validate ObjectId formats for provided IDs
    const invalidIds: string[] = [];
    
    // Only validate cycleId if provided
    if (submitFormData.cycleId && !isValidObjectId(submitFormData.cycleId)) {
      invalidIds.push("Cycle ID");
    }
    
    // Only validate assignmentId if provided
    if (submitFormData.assignmentId && !isValidObjectId(submitFormData.assignmentId)) {
      invalidIds.push("Assignment ID");
    }
    
    // Appraisal ID is required, so always validate
    if (!isValidObjectId(submitFormData.appraisalId)) {
      invalidIds.push("Appraisal ID");
    }
    
    // User ID is required, so always validate
    if (!isValidObjectId(user._id)) {
      invalidIds.push("User ID");
    }

    if (invalidIds.length > 0) {
      setError(`Invalid ID format for: ${invalidIds.join(', ')}. All IDs must be valid 24-character hex strings.`);
      return;
    }

    try {
      setSubmittingDispute(true);
      setError(null);
      setSuccessMessage(null);
      
      // Build request payload - only include cycleId and assignmentId if provided
      const disputePayload: any = {
        appraisalId: submitFormData.appraisalId.trim(),
        raisedByEmployeeId: String(user._id).trim(),
        reason: submitFormData.reason.trim(),
        details: submitFormData.details?.trim() || undefined,
      };
      
      // Only include optional fields if they're provided and valid
      if (submitFormData.cycleId && isValidObjectId(submitFormData.cycleId)) {
        disputePayload.cycleId = submitFormData.cycleId.trim();
      }
      if (submitFormData.assignmentId && isValidObjectId(submitFormData.assignmentId)) {
        disputePayload.assignmentId = submitFormData.assignmentId.trim();
      }
      
      await PerformanceApi.createDispute(disputePayload);
      
      // Show success message
      setSuccessMessage("Dispute submitted successfully! Your dispute has been recorded and will be reviewed by HR.");
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      // Reset form
      setSubmitFormData({
        cycleId: "",
        assignmentId: "",
        appraisalId: "",
        reason: "",
        details: "",
      });
      setShowSubmitForm(false);
      
      // Reload disputes if cycleId is available
      if (submitFormData.cycleId) {
        setCycleId(submitFormData.cycleId);
        await loadDisputes();
      }
    } catch (err: any) {
      console.error("Error submitting dispute:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to submit dispute";
      
      // Handle validation errors
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(", "));
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmittingDispute(false);
    }
  };

  // Don't render until auth is loaded
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/performance/disputes" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "department employee"]}
    >
      {!user || !canAccess ? null : (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Appraisal Disputes
                </h1>
                <p className="text-slate-600 text-lg">
                  {canResolveDisputes ? "View and resolve disputes per appraisal cycle." : "View and submit disputes per appraisal cycle."}
                </p>
              </div>
              <div className="flex gap-2">
                {canSubmitDisputes && (
                  <Button 
                    variant="default" 
                    onClick={() => setShowSubmitForm(!showSubmitForm)}
                  >
                    {showSubmitForm ? "Cancel" : "Submit Dispute"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => router.push("/performance")}>
                  Back to Performance Hub
                </Button>
              </div>
            </header>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-green-400 font-semibold mb-1">✓ {successMessage}</h3>
                    <p className="text-slate-900 text-sm">
                      You can view the status of your dispute below once you load disputes for the cycle.
                    </p>
                  </div>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="text-slate-600 hover:text-slate-900 transition-colors text-lg"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {canSubmitDisputes && showSubmitForm && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Submit New Dispute</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-600 text-sm">
                    <p className="font-semibold mb-1">Where to find your Appraisal ID:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Go to <strong>Team Performance Results</strong> page</li>
                      <li>Enter your Cycle ID and load records</li>
                      <li>Click on your appraisal record to view details</li>
                      <li>The <strong>Appraisal ID</strong> will be displayed (you can copy it)</li>
                    </ul>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/performance/team-results")}
                      className="mt-2 text-xs"
                    >
                      Go to Team Performance Results
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cycleId">Cycle ID (Optional)</Label>
                      <Input
                        id="cycleId"
                        value={submitFormData.cycleId}
                        onChange={(e) => setSubmitFormData({ ...submitFormData, cycleId: e.target.value })}
                        placeholder="Enter Cycle ID (will be retrieved from appraisal if not provided)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignmentId">Assignment ID (Optional)</Label>
                      <Input
                        id="assignmentId"
                        value={submitFormData.assignmentId}
                        onChange={(e) => setSubmitFormData({ ...submitFormData, assignmentId: e.target.value })}
                        placeholder="Enter Assignment ID (will be retrieved from appraisal if not provided)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appraisalId">Appraisal ID *</Label>
                      <Input
                        id="appraisalId"
                        value={submitFormData.appraisalId}
                        onChange={(e) => setSubmitFormData({ ...submitFormData, appraisalId: e.target.value })}
                        placeholder="Enter Appraisal ID (find it in Team Performance Results)"
                        required
                      />
                      <p className="text-slate-600 text-xs mt-1">
                        The Appraisal ID is the unique identifier of the completed performance review you want to dispute.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason *</Label>
                      <Input
                        id="reason"
                        value={submitFormData.reason}
                        onChange={(e) => setSubmitFormData({ ...submitFormData, reason: e.target.value })}
                        placeholder="Enter reason for dispute"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="details">Details (Optional)</Label>
                      <textarea
                        id="details"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        value={submitFormData.details}
                        onChange={(e) => setSubmitFormData({ ...submitFormData, details: e.target.value })}
                        placeholder="Enter additional details about the dispute"
                      />
                    </div>
                    <Button 
                      onClick={submitDispute} 
                      variant="default" 
                      disabled={submittingDispute}
                      className="w-full"
                    >
                      {submittingDispute ? "Submitting..." : "Submit Dispute"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Load Disputes by Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="cycleSelect">Cycle</Label>
                <Select
                  value={cycleId}
                  onValueChange={(value) => setCycleId(value)}
                  disabled={loadingCycles}
                >
                  <SelectTrigger id="cycleSelect" className="w-full">
                    <SelectValue placeholder={loadingCycles ? "Loading cycles..." : "Select a cycle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {loadingCycles ? "Loading..." : "No cycles available"}
                      </div>
                    ) : (
                      cycles.map((cycle) => {
                        const id = (cycle._id || cycle.id || "").toString();
                        // Skip cycles with empty or invalid IDs
                        if (!id || id.trim() === "") {
                          return null;
                        }
                        const name = cycle.name || cycle.title || "Untitled Cycle";
                        return (
                          <SelectItem key={id} value={id}>
                            {name} {cycle.status ? `(${cycle.status})` : ""}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={loadDisputes} disabled={loadingData || !cycleId} className="w-full md:w-auto md:col-span-1">
                {loadingData ? "Loading..." : "Load Disputes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Disputes{items.length > 0 ? ` (${items.length})` : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-slate-600 text-sm">Loading disputes...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-600 text-sm">
                  {cycleId 
                    ? `No disputes found for the selected cycle. Submit a dispute to see it here.`
                    : "No disputes loaded. Select a cycle and click 'Load Disputes'."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((dsp, idx) => {
                  const id = dsp._id || dsp.id || idx.toString();
                  return (
                    <div
                      key={id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-500/50 transition"
                    >
                      <div className="flex flex-col gap-2">
                        <p className="text-slate-900 font-semibold">{dsp.title || dsp.reason || "Dispute"}</p>
                        <p className="text-slate-600 text-sm">Status: {dsp.status || "N/A"}</p>
                        <p className="text-slate-600 text-sm">Cycle: {dsp.cycleId || cycleId}</p>
                        {dsp.reason && (
                          <p className="text-slate-600 text-sm">Reason: {dsp.reason}</p>
                        )}
                        {dsp.details && (
                          <p className="text-slate-600 text-sm">Details: {dsp.details}</p>
                        )}
                        {dsp.resolutionSummary && (
                          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-600 font-semibold text-sm mb-1">Resolution:</p>
                            <p className="text-slate-900 text-sm">{dsp.resolutionSummary}</p>
                            {dsp.resolvedAt && (
                              <p className="text-slate-600 text-xs mt-2">
                                Resolved on: {new Date(dsp.resolvedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                        {canResolveDisputes && dsp.status !== 'RESOLVED' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                            <div className="space-y-2">
                              <Label htmlFor={`resolve-${id}`}>Resolution Notes</Label>
                              <Input
                                id={`resolve-${id}`}
                                name={`resolve-${id}`}
                                value={resolvePayload[id] || ""}
                                onChange={(e) =>
                                  setResolvePayload((p) => ({
                                    ...p,
                                    [id]: e.target.value,
                                  }))
                                }
                                placeholder="Enter resolution notes"
                              />
                            </div>
                            <Button onClick={() => resolveDispute(id)} variant="default" className="w-full md:w-auto">
                              Resolve Dispute
                            </Button>
                          </div>
                        )}
                        {!canResolveDisputes && dsp.status === 'OPEN' && (
                          <p className="text-slate-600 text-xs italic">
                            This dispute is pending resolution by HR Admin or HR Manager.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </main>
      )}
    </RouteGuard>
  );
}

export default function DisputesPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600 text-lg">Loading disputes page...</p>
          </div>
        </div>
      }
    >
      <DisputesPageContent />
    </Suspense>
  );
}

