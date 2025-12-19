"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  
  // Appraisal records for employee
  const [availableAppraisals, setAvailableAppraisals] = useState<Array<{
    _id: string;
    id?: string;
    cycleId?: string;
    cycleName?: string;
    totalScore?: number;
    overallRatingLabel?: string;
    status?: string;
    hrPublishedAt?: string;
    managerSubmittedAt?: string;
    employeeName?: string;
    isMyRecord?: boolean;
  }>>([]);
  const [loadingAppraisals, setLoadingAppraisals] = useState(false);

  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/performance/disputes") : false;
  const canResolveDisputes = user ? hasFeature(user.roles, "resolveDisputes") : false;
  const canSubmitDisputes = user ? hasFeature(user.roles, "submitDisputes") : false;
  const canViewAllPerformance = user ? hasFeature(user.roles, "viewAllPerformance") : false;

  // Load cycles on mount
  useEffect(() => {
    if (!loading && user && canAccess) {
      loadCycles();
    }
  }, [user, loading, canAccess]);

  // Load available appraisals when submit form is shown
  useEffect(() => {
    if (showSubmitForm && canSubmitDisputes && user?._id) {
      loadAvailableAppraisals();
    }
  }, [showSubmitForm, canSubmitDisputes, user?._id]);

  // Helper function to validate MongoDB ObjectId format
  const isValidObjectId = (id: string): boolean => {
    if (!id || typeof id !== 'string') return false;
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id.trim());
  };

  // Load URL parameters on mount
  useEffect(() => {
    try {
      const urlCycleId = searchParams?.get('cycleId');
      const urlAppraisalId = searchParams?.get('appraisalId');
      
      // Only set cycleId in the cycle selector, NOT in the form's appraisalId field
      if (urlCycleId) {
        const trimmedCycleId = urlCycleId.trim();
        setCycleId(trimmedCycleId);
        // Only set cycleId in form if it's a valid ObjectId and not being used as appraisalId
        if (isValidObjectId(trimmedCycleId)) {
          setSubmitFormData(prev => ({ ...prev, cycleId: trimmedCycleId }));
        }
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

  const loadAvailableAppraisals = async () => {
    if (!user?._id) {
      return;
    }

    try {
      setLoadingAppraisals(true);
      setError(null);
      
      const canViewAllPerformance = user ? hasFeature(user.roles, "viewAllPerformance") : false;
      
      // Load all cycles first
      const cyclesRes = await PerformanceApi.listCycles();
      let allCycles: Cycle[] = [];
      if (Array.isArray(cyclesRes.data)) {
        allCycles = cyclesRes.data;
      } else if (Array.isArray(cyclesRes)) {
        allCycles = cyclesRes;
      } else if (cyclesRes.data?.data && Array.isArray(cyclesRes.data.data)) {
        allCycles = cyclesRes.data.data;
      }
      
      // Filter active cycles
      const activeCycles = allCycles.filter(
        cycle => cycle.status !== "ARCHIVED" && cycle.status !== "DELETED"
      );
      
      // Load records for each cycle
      const allAppraisals: Array<{
        _id: string;
        id?: string;
        cycleId?: string;
        cycleName?: string;
        totalScore?: number;
        overallRatingLabel?: string;
        status?: string;
        hrPublishedAt?: string;
        managerSubmittedAt?: string;
        employeeName?: string;
        isMyRecord?: boolean;
      }> = [];
      
      for (const cycle of activeCycles) {
        const cycleId = cycle._id || cycle.id;
        if (!cycleId) continue;
        
        try {
          const recordsRes = await PerformanceApi.listRecordsForCycle(String(cycleId));
          
          let allRecords: any[] = [];
          if (Array.isArray(recordsRes.data)) {
            allRecords = recordsRes.data;
          } else if (recordsRes.data?.data && Array.isArray(recordsRes.data.data)) {
            allRecords = recordsRes.data.data;
          } else if (recordsRes.data?.records && Array.isArray(recordsRes.data.records)) {
            allRecords = recordsRes.data.records;
          }
          
          // Filter records based on role access
          let filteredRecords: any[] = [];
          
          if (canViewAllPerformance) {
            // HR/Admin can see all published records
            filteredRecords = allRecords.filter((record: any) => 
              record.status === "HR_PUBLISHED" || record.status === "PUBLISHED"
            );
          } else {
            // Department employees can only see their own published records
            filteredRecords = allRecords.filter((record: any) => {
              const recordEmployeeId = record.employeeProfileId?._id || record.employeeProfileId;
              const userId = user._id;
              const isMyRecord = String(recordEmployeeId) === String(userId);
              const isPublished = record.status === "HR_PUBLISHED" || record.status === "PUBLISHED";
              return isMyRecord && isPublished;
            });
          }
          
          // Add cycle name and employee info to each record
          filteredRecords.forEach((record: any) => {
            const recordEmployeeId = record.employeeProfileId?._id || record.employeeProfileId;
            const userId = user._id;
            const isMyRecord = String(recordEmployeeId) === String(userId);
            
            // Get employee name if available
            let employeeName = "";
            if (record.employeeProfileId) {
              if (typeof record.employeeProfileId === 'object') {
                const firstName = record.employeeProfileId.firstName || '';
                const lastName = record.employeeProfileId.lastName || '';
                employeeName = [firstName, lastName].filter(Boolean).join(' ').trim();
              }
            }
            
            allAppraisals.push({
              _id: record._id || record.id,
              id: record.id || record._id,
              cycleId: String(cycleId),
              cycleName: cycle.name || cycle.title || "Untitled Cycle",
              totalScore: record.totalScore,
              overallRatingLabel: record.overallRatingLabel,
              status: record.status,
              hrPublishedAt: record.hrPublishedAt,
              managerSubmittedAt: record.managerSubmittedAt,
              employeeName: employeeName || (isMyRecord ? "You" : "Employee"),
              isMyRecord: isMyRecord,
            });
          });
        } catch (err) {
          console.error(`Error loading records for cycle ${cycleId}:`, err);
          // Continue with other cycles
        }
      }
      
      // Sort by cycle name and then by score (highest first)
      allAppraisals.sort((a, b) => {
        if (a.cycleName !== b.cycleName) {
          return (a.cycleName || '').localeCompare(b.cycleName || '');
        }
        return (b.totalScore || 0) - (a.totalScore || 0);
      });
      
      setAvailableAppraisals(allAppraisals);
    } catch (err: any) {
      console.error("Error loading available appraisals:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load available appraisals");
      setAvailableAppraisals([]);
    } finally {
      setLoadingAppraisals(false);
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

    // Check if the selected appraisal from the dropdown is published
    if (submitFormData.appraisalId) {
      const selectedAppraisal = availableAppraisals.find(a => 
        (a._id || a.id) === submitFormData.appraisalId
      );
      
      if (selectedAppraisal && selectedAppraisal.status) {
        const status = selectedAppraisal.status;
        if (status !== 'HR_PUBLISHED' && status !== 'PUBLISHED') {
          setError(
            `This appraisal record is not yet published (status: ${status}). You can only submit disputes for published appraisals. Please wait until HR publishes the appraisal.`
          );
          return;
        }
      }
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
      
      const response = await PerformanceApi.createDispute(disputePayload);
      
      // Get dispute ID from response if available
      const disputeId = response?.data?._id || response?.data?.id || (response as any)?._id || (response as any)?.id || "N/A";
      
      // Show success message with dispute ID
      setSuccessMessage(`Dispute submitted successfully! Your dispute has been recorded (ID: ${disputeId.substring(0, 8)}...) and will be reviewed by HR.`);
      
      // Reset form
      setSubmitFormData({
        cycleId: "",
        assignmentId: "",
        appraisalId: "",
        reason: "",
        details: "",
      });
      setShowSubmitForm(false);
      
      // Reload disputes if cycleId is available (from form or appraisal record)
      const cycleToLoad = submitFormData.cycleId || (response?.data?.cycleId ? String(response.data.cycleId) : null);
      if (cycleToLoad) {
        setCycleId(cycleToLoad);
        // Wait a moment for the backend to process, then load disputes
        setTimeout(async () => {
          await loadDisputes();
        }, 1000);
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {showSubmitForm ? "Cancel" : "Submit Dispute"}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/performance")}
                  className="text-slate-900 border-slate-300 hover:bg-slate-100"
                >
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
              <div className="p-4 bg-green-500/20 border-2 border-green-500/50 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-green-700 font-bold text-lg mb-2 flex items-center gap-2">
                      <span className="text-2xl">✓</span>
                      Success!
                    </h3>
                    <p className="text-slate-900 font-medium mb-1">{successMessage}</p>
                    <p className="text-slate-700 text-sm">
                      You can view the status of your dispute below. Select the cycle and click "Load Disputes" to see it.
                    </p>
                  </div>
                  <button
                    onClick={() => setSuccessMessage(null)}
                    className="text-slate-600 hover:text-slate-900 transition-colors text-xl font-bold px-2"
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
                    <p className="font-semibold mb-1">Available Appraisal Records:</p>
                    <p className="text-xs mb-2">
                      Select an appraisal record from the list below, or manually enter the Appraisal ID if you have it.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="appraisalSelect">Select Appraisal Record *</Label>
                      {loadingAppraisals ? (
                        <div className="p-4 border border-slate-300 rounded-lg text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                          <p className="text-slate-600 text-sm">Loading your appraisal records...</p>
                        </div>
                      ) : availableAppraisals.length === 0 ? (
                        <div className="p-4 border border-slate-300 rounded-lg bg-slate-50">
                          <p className="text-slate-600 text-sm mb-2">
                            No published appraisal records found for you. You can only dispute published appraisals.
                          </p>
                          <p className="text-slate-600 text-xs">
                            If you have an Appraisal ID, you can enter it manually below.
                          </p>
                        </div>
                      ) : (
                        <Select
                          value={submitFormData.appraisalId}
                          onValueChange={(value) => {
                            const selectedAppraisal = availableAppraisals.find(a => (a._id || a.id) === value);
                            const newCycleId = selectedAppraisal?.cycleId || submitFormData.cycleId;
                            setSubmitFormData({
                              ...submitFormData,
                              appraisalId: value,
                              cycleId: newCycleId,
                              assignmentId: "", // Clear assignment when appraisal changes
                            });
                            // If cycle ID changed, assignments will be loaded via useEffect
                          }}
                        >
                          <SelectTrigger id="appraisalSelect" className="w-full">
                            <SelectValue placeholder="Select an appraisal record..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[400px]">
                            {availableAppraisals.map((appraisal) => {
                              const id = appraisal._id || appraisal.id || "";
                              const displayName = `${appraisal.cycleName || "Cycle"} - ${appraisal.employeeName || ""} - Score: ${appraisal.totalScore || "N/A"} - ${appraisal.overallRatingLabel || "No Rating"}`;
                              return (
                                <SelectItem key={id} value={id}>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-medium text-slate-900">{displayName}</span>
                                      {appraisal.isMyRecord && (
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                          Mine
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-600 font-medium">Appraisal ID:</span>
                                      <span className="text-xs text-slate-900 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{id}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                      {availableAppraisals.length > 0 && (
                        <p className="text-slate-600 text-xs mt-1">
                          Found {availableAppraisals.length} published appraisal record(s) available for dispute.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appraisalId">Or Enter Appraisal ID Manually</Label>
                      <div className="flex gap-2">
                        <Input
                          id="appraisalId"
                          value={submitFormData.appraisalId}
                          onChange={(e) => setSubmitFormData({ ...submitFormData, appraisalId: e.target.value })}
                          onBlur={async (e) => {
                            // When user finishes entering appraisal ID, fetch the record to get cycle ID
                            const enteredId = e.target.value.trim();
                            if (enteredId && isValidObjectId(enteredId) && !submitFormData.cycleId) {
                              try {
                                const recordRes = await PerformanceApi.getRecord(enteredId);
                                const record = recordRes.data || recordRes;
                                if (record) {
                                  const recordCycleId = record.cycleId?._id || record.cycleId || record.cycleId?.id;
                                  const recordAssignmentId = record.assignmentId?._id || record.assignmentId || record.assignmentId?.id;
                                  
                                  if (recordCycleId) {
                                    setSubmitFormData(prev => ({
                                      ...prev,
                                      cycleId: String(recordCycleId),
                                      assignmentId: recordAssignmentId ? String(recordAssignmentId) : prev.assignmentId,
                                    }));
                                  }
                                }
                              } catch (err: any) {
                                console.error("Error fetching appraisal record:", err);
                                // Don't show error to user, they can still submit manually
                              }
                            }
                          }}
                          placeholder="Enter Appraisal ID manually if not in the list above"
                        />
                        {submitFormData.appraisalId && isValidObjectId(submitFormData.appraisalId) && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              // Fetch appraisal record to auto-fill cycle ID and assignment ID
                              try {
                                setError(null);
                                const recordRes = await PerformanceApi.getRecord(submitFormData.appraisalId.trim());
                                const record = recordRes.data || recordRes;
                                
                                if (!record) {
                                  setError("Appraisal record not found. Please verify the Appraisal ID is correct.");
                                  return;
                                }
                                
                                // Extract cycle ID - handle different data structures
                                let recordCycleId: string | null = null;
                                if (record.cycleId) {
                                  if (typeof record.cycleId === 'object' && record.cycleId !== null) {
                                    recordCycleId = String(record.cycleId._id || record.cycleId.id || record.cycleId);
                                  } else {
                                    recordCycleId = String(record.cycleId);
                                  }
                                }
                                
                                // Extract assignment ID - handle different data structures
                                let recordAssignmentId: string | null = null;
                                if (record.assignmentId) {
                                  if (typeof record.assignmentId === 'object' && record.assignmentId !== null) {
                                    recordAssignmentId = String(record.assignmentId._id || record.assignmentId.id || record.assignmentId);
                                  } else {
                                    recordAssignmentId = String(record.assignmentId);
                                  }
                                }
                                
                                // Update form with retrieved data
                                setSubmitFormData(prev => ({
                                  ...prev,
                                  cycleId: recordCycleId || prev.cycleId,
                                  assignmentId: recordAssignmentId || prev.assignmentId,
                                }));
                                
                                // Check if assignment ID was found
                                if (!recordAssignmentId) {
                                  setError("Assignment ID is required. Could not retrieve it from the appraisal record. Please enter it manually or contact HR.");
                                } else {
                                  setError(null);
                                }
                                
                                // Also update the cycle selector if cycle ID was found
                                if (recordCycleId) {
                                  setCycleId(recordCycleId);
                                  // Update form cycle ID so assignments can be loaded
                                  setSubmitFormData(prev => ({
                                    ...prev,
                                    cycleId: String(recordCycleId),
                                  }));
                                }
                              } catch (err: any) {
                                console.error("Error fetching appraisal record:", err);
                                const errorMsg = err?.response?.data?.message || err?.message || "Could not fetch appraisal record. Please verify the Appraisal ID is correct.";
                                setError(errorMsg);
                              }
                            }}
                            className="text-slate-900 border-slate-300 hover:bg-slate-100 whitespace-nowrap"
                          >
                            Load Details
                          </Button>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs mt-1">
                        The Appraisal ID is the unique identifier of the completed performance review you want to dispute.
                      </p>
                      <p className="text-amber-600 text-xs mt-1 font-medium">
                        ⚠️ Note: You can only dispute published appraisals (status: HR_PUBLISHED). If the appraisal hasn't been published yet, you'll receive an error when submitting.
                      </p>
                      {submitFormData.appraisalId && isValidObjectId(submitFormData.appraisalId) && (
                        <p className="text-blue-600 text-xs mt-1">
                          💡 Tip: Click "Load Details" to automatically fill the Cycle ID and Assignment ID from this appraisal record.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cycleId">Cycle ID (Optional - Auto-filled if selected above)</Label>
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
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={submitDispute} 
                        variant="default" 
                        disabled={submittingDispute || !submitFormData.appraisalId || !submitFormData.reason}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
                        size="lg"
                      >
                        {submittingDispute ? (
                          <>
                            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                            Submitting...
                          </>
                        ) : (
                          "Submit Dispute"
                        )}
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowSubmitForm(false);
                          setSubmitFormData({
                            cycleId: "",
                            assignmentId: "",
                            appraisalId: "",
                            reason: "",
                            details: "",
                          });
                          setError(null);
                        }}
                        variant="outline"
                        disabled={submittingDispute}
                        className="text-slate-900 border-slate-300 hover:bg-slate-100"
                      >
                        Cancel
                      </Button>
                    </div>
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
            <CardTitle className="text-slate-900">
              {canSubmitDisputes && !canResolveDisputes ? "My Disputes" : "Disputes"}
              {items.length > 0 ? ` (${items.filter((dsp) => {
                if (canSubmitDisputes && !canResolveDisputes && user?._id) {
                  const disputeEmployeeId = String(dsp.raisedByEmployeeId || (dsp.raisedByEmployeeId as any)?._id || '');
                  const currentUserId = String(user._id);
                  return disputeEmployeeId === currentUserId;
                }
                return true;
              }).length})` : ''}
            </CardTitle>
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
                {items
                  .filter((dsp) => {
                    // For employees, only show their own disputes
                    if (canSubmitDisputes && !canResolveDisputes && user?._id) {
                      const disputeEmployeeId = String(dsp.raisedByEmployeeId || (dsp.raisedByEmployeeId as any)?._id || '');
                      const currentUserId = String(user._id);
                      return disputeEmployeeId === currentUserId;
                    }
                    // For HR/Admin, show all disputes
                    return true;
                  })
                  .map((dsp, idx) => {
                  const id = dsp._id || dsp.id || idx.toString();
                  const isMyDispute = canSubmitDisputes && !canResolveDisputes && user?._id && 
                    String(dsp.raisedByEmployeeId || (dsp.raisedByEmployeeId as any)?._id || '') === String(user._id);
                  return (
                    <div
                      key={id}
                      className={`p-4 rounded-lg border transition ${
                        isMyDispute 
                          ? "bg-blue-50 border-blue-300 hover:border-blue-500" 
                          : "bg-slate-50 border-slate-200 hover:border-blue-500/50"
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <p className="text-slate-900 font-semibold text-lg">{dsp.title || dsp.reason || "Dispute"}</p>
                          {isMyDispute && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              My Dispute
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="text-slate-600">
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-0.5 rounded ${
                              dsp.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                              dsp.status === 'OPEN' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {dsp.status || "N/A"}
                            </span>
                          </span>
                          {dsp.submittedAt && (
                            <span className="text-slate-600">
                              <span className="font-medium">Submitted:</span> {new Date(dsp.submittedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {dsp.reason && (
                          <div className="mt-2">
                            <p className="text-slate-700 font-medium text-sm mb-1">Reason:</p>
                            <p className="text-slate-900 text-sm bg-white p-2 rounded border border-slate-200">{dsp.reason}</p>
                          </div>
                        )}
                        {dsp.details && (
                          <div className="mt-2">
                            <p className="text-slate-700 font-medium text-sm mb-1">Details:</p>
                            <p className="text-slate-900 text-sm bg-white p-2 rounded border border-slate-200 whitespace-pre-wrap">{dsp.details}</p>
                          </div>
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

