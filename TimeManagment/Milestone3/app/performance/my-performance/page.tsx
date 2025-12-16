"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature } from "@/utils/roleAccess";
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
  employeeViewedAt?: string;
  employeeAcknowledgedAt?: string;
  ratings?: Array<{
    criterionKey: string;
    criterionTitle?: string;
    score: number;
    comments?: string;
  }>;
};

export default function MyPerformancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const canViewOwnPerformance = user ? hasFeature(user.roles, "viewOwnPerformance") : false;
  
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycleId, setCycleId] = useState("");
  const [cycles, setCycles] = useState<Array<{ _id?: string; id?: string; name?: string; title?: string }>>([]);
  const [selectedRecord, setSelectedRecord] = useState<PerformanceRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    if (!loading && user) {
      loadCycles();
    }
  }, [user, loading]);

  const loadCycles = async () => {
    try {
      setLoadingCycles(true);
      const res = await PerformanceApi.listCycles();
      setCycles(res.data || []);
    } catch (err: any) {
      console.error("Failed to load cycles:", err);
    } finally {
      setLoadingCycles(false);
    }
  };

  const loadRecords = async () => {
    if (!cycleId) {
      setError("Please enter or select a Cycle ID to load your performance records");
      return;
    }

    if (!user?._id) {
      setError("User not found");
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
      
      // Filter to show only the current user's records
      const myRecords = allRecords.filter((record: PerformanceRecord) => {
        const recordEmployeeId = record.employeeProfileId?._id || record.employeeProfileId;
        const userId = user._id;
        return String(recordEmployeeId) === String(userId);
      });
      
      // For department employees, only show published records
      const canViewAllPerformance = user ? hasFeature(user.roles, "viewAllPerformance") : false;
      const filteredRecords = !canViewAllPerformance
        ? myRecords.filter((r: PerformanceRecord) => r.status === "HR_PUBLISHED")
        : myRecords;
      
      if (allRecords.length === 0) {
        setError(`No performance records found for this cycle. Records are created when your manager submits your evaluation.`);
      } else if (myRecords.length === 0) {
        setError(`No performance records found for you in this cycle. Found ${allRecords.length} record(s) for other employees.`);
      } else if (filteredRecords.length === 0 && myRecords.length > 0) {
        const statuses = [...new Set(myRecords.map((r: PerformanceRecord) => r.status || "NO_STATUS"))];
        setError(`Found ${myRecords.length} record(s) for you, but none are published yet. Status(es): ${statuses.join(", ")}. Only published records are visible.`);
      } else {
        setError(null);
      }
      
      setRecords(filteredRecords);
    } catch (err: any) {
      console.error("Error loading records:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load your performance records");
      setRecords([]);
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "MANAGER_SUBMITTED":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "HR_PUBLISHED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "EMPLOYEE_ACKNOWLEDGED":
        return "bg-teal-500/20 text-teal-400 border-teal-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <RouteGuard 
      requiredRoute="/performance" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "HR Employee", "department head", "department employee"]}
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
                  My Performance
                </h1>
                <p className="text-text-muted text-lg">
                  View your performance evaluation results and appraisal history.
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push("/performance")}>
                Back to Performance Hub
              </Button>
            </header>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <Card title="Load Your Performance Records">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="label">Cycle</label>
                  <select
                    className="input"
                    value={cycleId}
                    onChange={(e) => setCycleId(e.target.value)}
                  >
                    <option value="">Select a cycle...</option>
                    {cycles.map((cycle) => {
                      const id = cycle._id || cycle.id || "";
                      return (
                        <option key={id} value={id}>
                          {cycle.name || cycle.title || id}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <Input
                  label="Or Enter Cycle ID"
                  value={cycleId}
                  onChange={(e) => setCycleId(e.target.value)}
                  placeholder="Enter Cycle ID"
                />
                <Button onClick={loadRecords} isLoading={loadingData} className="w-full md:w-auto">
                  Load My Records
                </Button>
              </div>
            </Card>

            {records.length > 0 && (
              <Card title={`Your Performance Records (${records.length})`}>
                {filterStatus && (
                  <div className="mb-4">
                    <label className="label">Filter by Status</label>
                    <select
                      className="input"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="DRAFT">Draft</option>
                      <option value="MANAGER_SUBMITTED">Manager Submitted</option>
                      <option value="HR_PUBLISHED">Published</option>
                      <option value="EMPLOYEE_ACKNOWLEDGED">Acknowledged</option>
                    </select>
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
                                  {record.cycleName || `Cycle ${idx + 1}`}
                                </p>
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(record.status || "")}`}>
                                  {record.status || "N/A"}
                                </span>
                              </div>
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
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(id);
                                    alert("Appraisal ID copied to clipboard!");
                                  }}
                                  className="ml-2 text-primary hover:text-primary-light text-xs underline"
                                >
                                  Copy
                                </button>
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
                title={`Performance Details: ${selectedRecord.cycleName || "Appraisal"}`}
                className="fixed inset-4 md:inset-8 z-50 overflow-y-auto bg-background border-2 border-primary"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-text font-semibold text-lg mb-2">
                        {selectedRecord.cycleName || "Performance Appraisal"}
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
                        {selectedRecord.cycleId && (
                          <p className="text-text-muted text-sm">
                            <span className="font-medium">Cycle ID:</span>{" "}
                            <span className="font-mono text-xs">{selectedRecord.cycleId}</span>
                          </p>
                        )}
                        {selectedRecord.status && (
                          <p className="text-text-muted text-sm">
                            <span className="font-medium">Status:</span>{" "}
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeClass(selectedRecord.status)}`}>
                              {selectedRecord.status}
                            </span>
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
                      <h4 className="text-text font-semibold mb-3">Manager Summary</h4>
                      <p className="text-text-muted whitespace-pre-wrap">{selectedRecord.managerSummary}</p>
                    </div>
                  )}

                  {/* Strengths */}
                  {selectedRecord.strengths && (
                    <div>
                      <h4 className="text-text font-semibold mb-3">Strengths</h4>
                      <p className="text-text-muted whitespace-pre-wrap">{selectedRecord.strengths}</p>
                    </div>
                  )}

                  {/* Improvement Areas */}
                  {selectedRecord.improvementAreas && (
                    <div>
                      <h4 className="text-text font-semibold mb-3">Areas for Improvement</h4>
                      <p className="text-text-muted whitespace-pre-wrap">{selectedRecord.improvementAreas}</p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    {selectedRecord.managerSubmittedAt && (
                      <div>
                        <p className="text-text-muted text-sm">Manager Submitted</p>
                        <p className="text-text">{new Date(selectedRecord.managerSubmittedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedRecord.hrPublishedAt && (
                      <div>
                        <p className="text-text-muted text-sm">Published</p>
                        <p className="text-text">{new Date(selectedRecord.hrPublishedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedRecord.employeeViewedAt && (
                      <div>
                        <p className="text-text-muted text-sm">You Viewed</p>
                        <p className="text-text">{new Date(selectedRecord.employeeViewedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedRecord.employeeAcknowledgedAt && (
                      <div>
                        <p className="text-text-muted text-sm">You Acknowledged</p>
                        <p className="text-text">{new Date(selectedRecord.employeeAcknowledgedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-border">
                    <Button
                      variant="primary"
                      onClick={() => {
                        const id = selectedRecord._id || selectedRecord.id || "";
                        if (id) {
                          router.push(`/performance/disputes?cycleId=${selectedRecord.cycleId || cycleId}&appraisalId=${id}`);
                        }
                      }}
                    >
                      Submit Dispute
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRecord(null)}
                    >
                      Close
                    </Button>
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

