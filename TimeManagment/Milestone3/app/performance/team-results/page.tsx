"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RouteGuard from "@/components/RouteGuard";
import { hasFeature } from "@/utils/roleAccess";
import { PerformanceApi } from "@/utils/performanceApi";

type PerformanceRecord = {
  _id?: string;
  id?: string;
  employeeProfileId?: string;
  employeeName?: string;
  employeeNumber?: string;
  cycleId?: string;
  cycleName?: string;
  templateId?: string;
  templateName?: string;
  totalScore?: number;
  overallRatingLabel?: string;
  managerSummary?: string;
  strengths?: string;
  improvementAreas?: string;
  status?: string;
  hrPublishedAt?: string;
  managerSubmittedAt?: string;
  ratings?: Array<{
    criterionKey: string;
    criterionTitle?: string;
    score: number;
    comments?: string;
  }>;
};

export default function TeamResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Check role-based access (RouteGuard handles route access, this is just for feature checks)
  const canViewTeamPerformance = user ? hasFeature(user.roles, "viewTeamPerformance") : false;
  
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycleId, setCycleId] = useState("");
  const [cycles, setCycles] = useState<Array<{ _id?: string; id?: string; name?: string; title?: string }>>([]);
  const [selectedRecord, setSelectedRecord] = useState<PerformanceRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>(""); // Show all by default, user can filter

  // Load available cycles on mount
  useEffect(() => {
    if (!loading && user) {
      loadCycles();
    }
  }, [user, loading]);

  // Debug: Log when records change
  useEffect(() => {
    console.log("Records state updated:", records.length, records);
    console.log("Filter status:", filterStatus);
    console.log("Filtered count:", records.filter(r => !filterStatus || r.status === filterStatus).length);
  }, [records, filterStatus]);

  const loadCycles = async () => {
    try {
      setLoadingCycles(true);
      const res = await PerformanceApi.listCycles();
      setCycles(res.data || []);
    } catch (err: any) {
      console.error("Failed to load cycles:", err);
      // Don't show error to user, just log it
    } finally {
      setLoadingCycles(false);
    }
  };

  const loadRecords = async () => {
    if (!cycleId) {
      setError("Please enter a Cycle ID to load records");
      return;
    }

    try {
      setLoadingData(true);
      setError(null);
      const res = await PerformanceApi.listRecordsForCycle(cycleId);
      
      // Handle different response structures
      let allRecords: PerformanceRecord[] = [];
      if (Array.isArray(res.data)) {
        allRecords = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        allRecords = res.data.data;
      } else if (res.data?.records && Array.isArray(res.data.records)) {
        allRecords = res.data.records;
      }
      
      console.log("Raw API response:", res);
      console.log("All records loaded:", allRecords.length);
      
      // Filter records based on role
      // HR roles can see all, department heads can see published + their own submitted records
      const canViewAllPerformance = user ? hasFeature(user.roles, "viewAllPerformance") : false;
      let filteredRecords: PerformanceRecord[] = [];
      
      if (canViewAllPerformance) {
        // HR roles see all records
        filteredRecords = allRecords;
      } else if (canViewTeamPerformance) {
        // Department Heads can see:
        // 1. Published records (HR_PUBLISHED)
        // 2. Records they submitted (MANAGER_SUBMITTED) - so they can verify their submissions
        filteredRecords = allRecords.filter((r: PerformanceRecord) => 
          r.status === "HR_PUBLISHED" || 
          r.status === "MANAGER_SUBMITTED" ||
          r.status === "EMPLOYEE_ACKNOWLEDGED"
        );
      } else {
        // Other roles see all (fallback)
        filteredRecords = allRecords;
      }
      
      console.log("Filtered records:", filteredRecords.length);
      console.log("Records after filter:", filteredRecords);
      
      if (allRecords.length === 0) {
        // Check if the cycle has assignments (which would indicate records should exist)
        try {
          const assignmentsRes = await PerformanceApi.listAssignmentsForCycle(cycleId);
          const assignments = assignmentsRes.data || [];
          if (assignments.length === 0) {
            setError(`No performance records found for this cycle. This cycle has no employee assignments. Records are created when managers submit evaluations.`);
          } else {
            setError(`No performance records found for this cycle. Found ${assignments.length} assignment(s), but no evaluations have been submitted yet. Records are created when managers complete and submit employee evaluations.`);
          }
        } catch (assignErr: any) {
          // If we can't check assignments, just show the basic error
          setError(`No performance records found for this cycle. This could mean: (1) No evaluations have been submitted yet, (2) The cycle has no employee assignments, or (3) Records haven't been created. Records are created when managers submit employee evaluations.`);
        }
      } else if (filteredRecords.length === 0 && allRecords.length > 0) {
        // Check what statuses exist
        const statuses = [...new Set(allRecords.map((r: PerformanceRecord) => r.status || "NO_STATUS"))];
        const hasManagerSubmitted = allRecords.some((r: PerformanceRecord) => r.status === "MANAGER_SUBMITTED");
        const hasPublished = allRecords.some((r: PerformanceRecord) => r.status === "HR_PUBLISHED");
        
        if (canViewTeamPerformance && !canViewAllPerformance) {
          if (hasManagerSubmitted && !hasPublished) {
            setError(`Found ${allRecords.length} record(s) for this cycle. Your evaluations have been submitted (status: MANAGER_SUBMITTED) and are waiting for HR to publish them. Once published, they will appear here.`);
          } else {
            setError(`Found ${allRecords.length} record(s) for this cycle, but none match the visible statuses. Record statuses found: ${statuses.join(", ")}. Department heads can see: HR_PUBLISHED, MANAGER_SUBMITTED, and EMPLOYEE_ACKNOWLEDGED records.`);
          }
        } else {
          setError(`Found ${allRecords.length} record(s), but none match the current filter. Available statuses: ${statuses.join(", ")}. Try changing the status filter.`);
        }
      } else {
        // Clear any previous errors if we have records
        setError(null);
      }
      
      setRecords(filteredRecords);
    } catch (err: any) {
      console.error("Error loading records:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load performance records");
      setRecords([]);
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      MANAGER_SUBMITTED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      HR_PUBLISHED: "bg-green-500/20 text-green-400 border-green-500/30",
      ARCHIVED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return statusClasses[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  return (
    <RouteGuard 
      requiredRoute="/performance" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "department head"]}
    >
      {loading ? (
        <main className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-text-muted text-lg">Loading...</p>
          </div>
        </main>
      ) : (
        <main className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                  Team Performance Results
                </h1>
                <p className="text-text-muted text-lg">
                  {canViewTeamPerformance 
                    ? "View published appraisal results and performance history for your team."
                    : "View performance evaluation results."}
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push("/performance")}>
                Back to Performance Hub
              </Button>
            </header>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 space-y-2">
                <p className="font-semibold">No Records Found</p>
                <p>{error}</p>
                {error.includes("evaluations have been submitted") && (
                  <div className="mt-3 pt-3 border-t border-red-500/30">
                    <p className="text-sm mb-2">To create records for this cycle:</p>
                    <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                      <li>Go to the <strong>Cycles & Assignments</strong> page</li>
                      <li>Click <strong>"Evaluate Employees"</strong> on this cycle</li>
                      <li>Complete and submit evaluations for your team members</li>
                      <li>Return here to view the submitted records</li>
                    </ol>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => router.push(`/performance/cycles/${cycleId}/evaluate`)}
                    >
                      Go to Evaluation Page
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Card title="Load Performance Records by Cycle">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="label">Select Cycle</label>
                  <select
                    className="input"
                    value={cycleId}
                    onChange={(e) => setCycleId(e.target.value)}
                    disabled={loadingCycles}
                  >
                    <option value="">-- Select a Cycle --</option>
                    {cycles.map((cycle) => {
                      const id = cycle._id || cycle.id || "";
                      const name = cycle.name || cycle.title || `Cycle ${id.substring(0, 8)}`;
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                  {loadingCycles && (
                    <p className="text-xs text-text-muted mt-1">Loading cycles...</p>
                  )}
                  {!loadingCycles && cycles.length === 0 && (
                    <p className="text-xs text-text-muted mt-1">No cycles available</p>
                  )}
                </div>
                <div>
                  <label className="label">Status Filter</label>
                  <select
                    className="input"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="HR_PUBLISHED">Published Only</option>
                    <option value="MANAGER_SUBMITTED">Submitted</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
                <Button 
                  onClick={loadRecords} 
                  isLoading={loadingData} 
                  disabled={!cycleId}
                  className="w-full md:w-auto"
                >
                  Load Records
                </Button>
              </div>
              {cycleId && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-blue-400">
                  <strong>Selected Cycle ID:</strong> {cycleId}
                </div>
              )}
            </Card>

            {loadingData && (
              <Card>
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-text-muted">Loading records...</p>
                </div>
              </Card>
            )}

            {!loadingData && records.length === 0 && !error && (
              <Card>
                <div className="text-center py-8">
                  <p className="text-text-muted">No records loaded. Select a Cycle from the dropdown above and click "Load Records" to view performance data.</p>
                </div>
              </Card>
            )}

            {!loadingData && records.length > 0 && (
              <Card title={`Performance Records (${records.filter(r => !filterStatus || r.status === filterStatus).length} of ${records.length} shown)`}>
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400 mb-4">
                    Debug: Total records: {records.length}, Filter: "{filterStatus || 'All'}", 
                    Showing: {records.filter(r => !filterStatus || r.status === filterStatus).length}
                    {records.length > 0 && (
                      <span>, Statuses: {[...new Set(records.map(r => r.status || 'NO_STATUS'))].join(', ')}</span>
                    )}
                  </div>
                )}
                {records.filter(r => !filterStatus || r.status === filterStatus).length === 0 && (
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 mb-4">
                    No records match the selected status filter "{filterStatus || 'All'}". 
                    {records.length > 0 && (
                      <span> Available statuses: {[...new Set(records.map(r => r.status || 'NO_STATUS'))].join(', ')}</span>
                    )}
                    Try selecting "All Statuses" or a different filter.
                  </div>
                )}
                <div className="space-y-4">
                  {records
                    .filter(r => !filterStatus || r.status === filterStatus)
                    .map((record, idx) => {
                      const id = record._id || record.id || idx.toString();
                      return (
                        <div
                          key={id}
                          className="p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition cursor-pointer"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="text-text font-semibold">
                                  {record.employeeName || `Employee ${idx + 1}`}
                                </p>
                                {record.employeeNumber && (
                                  <span className="text-text-muted text-sm">
                                    ({record.employeeNumber})
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(record.status || "")}`}>
                                  {record.status || "N/A"}
                                </span>
                              </div>
                              {record.cycleName && (
                                <p className="text-text-muted text-sm">Cycle: {record.cycleName}</p>
                              )}
                              {record.totalScore !== undefined && (
                                <p className="text-text-muted text-sm">
                                  Total Score: <span className="text-text font-medium">{record.totalScore}</span>
                                  {record.overallRatingLabel && (
                                    <span className="ml-2">({record.overallRatingLabel})</span>
                                  )}
                                </p>
                              )}
                              {record.hrPublishedAt && (
                                <p className="text-text-muted text-sm">
                                  Published: {new Date(record.hrPublishedAt).toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-text-muted text-xs mt-1">
                                <span className="font-medium">Appraisal ID:</span>{" "}
                                <span className="font-mono">{id}</span>
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecord(record);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            )}

            {selectedRecord && (
              <Card 
                title={`Performance Details: ${selectedRecord.employeeName || "Employee"}`}
                className="fixed inset-4 md:inset-8 z-50 overflow-y-auto bg-background border-2 border-primary"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-text font-semibold text-lg mb-2">
                        {selectedRecord.employeeName || "Employee"}
                        {selectedRecord.employeeNumber && (
                          <span className="text-text-muted text-sm ml-2">
                            ({selectedRecord.employeeNumber})
                          </span>
                        )}
                      </h3>
                      <div className="space-y-1 mb-3">
                        <p className="text-text-muted text-sm">
                          <span className="font-medium">Appraisal ID:</span>{" "}
                          <span className="text-primary font-mono text-xs bg-primary/10 px-2 py-1 rounded">
                            {selectedRecord._id || selectedRecord.id || "N/A"}
                          </span>
                          <button
                            onClick={() => {
                              const id = selectedRecord._id || selectedRecord.id || "";
                              if (id) {
                                navigator.clipboard.writeText(id);
                                alert("Appraisal ID copied to clipboard!");
                              }
                            }}
                            className="ml-2 text-primary hover:text-primary-light text-xs underline"
                          >
                            Copy
                          </button>
                        </p>
                        {selectedRecord.cycleName && (
                          <p className="text-text-muted text-sm">Cycle: {selectedRecord.cycleName}</p>
                        )}
                        {selectedRecord.cycleId && (
                          <p className="text-text-muted text-sm">
                            <span className="font-medium">Cycle ID:</span>{" "}
                            <span className="font-mono text-xs">{selectedRecord.cycleId}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRecord(null)}
                    >
                      Close
                    </Button>
                  </div>

                  {/* Ratings */}
                  {selectedRecord.ratings && selectedRecord.ratings.length > 0 && (
                    <div>
                      <h4 className="text-text font-semibold mb-3">Performance Ratings</h4>
                      <div className="space-y-3">
                        {selectedRecord.ratings.map((rating, idx) => (
                          <div key={idx} className="p-3 bg-background rounded border border-border">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-text font-medium">
                                {rating.criterionTitle || rating.criterionKey}
                              </p>
                              <span className="text-primary font-semibold">
                                Score: {rating.score}
                              </span>
                            </div>
                            {rating.comments && (
                              <p className="text-text-muted text-sm mt-2">{rating.comments}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {selectedRecord.managerSummary && (
                    <div>
                      <h4 className="text-text font-semibold mb-2">Manager Summary</h4>
                      <p className="text-text">{selectedRecord.managerSummary}</p>
                    </div>
                  )}

                  {/* Strengths */}
                  {selectedRecord.strengths && (
                    <div>
                      <h4 className="text-text font-semibold mb-2">Strengths</h4>
                      <p className="text-text">{selectedRecord.strengths}</p>
                    </div>
                  )}

                  {/* Improvement Areas */}
                  {selectedRecord.improvementAreas && (
                    <div>
                      <h4 className="text-text font-semibold mb-2">Areas for Improvement</h4>
                      <p className="text-text">{selectedRecord.improvementAreas}</p>
                    </div>
                  )}

                  {/* Overall Score */}
                  {selectedRecord.totalScore !== undefined && (
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-text font-semibold">Overall Score:</span>
                        <span className="text-primary text-xl font-bold">
                          {selectedRecord.totalScore}
                          {selectedRecord.overallRatingLabel && (
                            <span className="ml-2 text-base">({selectedRecord.overallRatingLabel})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {selectedRecord.managerSubmittedAt && (
                      <div>
                        <span className="text-text-muted">Submitted:</span>
                        <span className="text-text ml-2">
                          {new Date(selectedRecord.managerSubmittedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedRecord.hrPublishedAt && (
                      <div>
                        <span className="text-text-muted">Published:</span>
                        <span className="text-text ml-2">
                          {new Date(selectedRecord.hrPublishedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      )}
    </RouteGuard>
  );
}

