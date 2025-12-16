"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature } from "@/utils/roleAccess";
import { PerformanceApi } from "@/utils/performanceApi";

type Cycle = {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  status?: string;
  description?: string;
};

type FormData = {
  name: string;
  description: string;
  cycleType: string;
  startDate: string;
  endDate: string;
  managerDueDate?: string;
  employeeAcknowledgementDueDate?: string;
};

export default function CyclesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/performance/cycles") : false;
  const canManageCycles = user ? hasFeature(user.roles, "manageAppraisalCycles") : false;
  const canAssistCycles = user ? hasFeature(user.roles, "assistAppraisalCycles") : false;
  const canEvaluateEmployees = user ? hasFeature(user.roles, "evaluateEmployees") : false;
  const [items, setItems] = useState<Cycle[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [form, setForm] = useState<FormData>({ 
    name: "", 
    description: "",
    cycleType: "ANNUAL",
    startDate: "",
    endDate: "",
    managerDueDate: "",
    employeeAcknowledgementDueDate: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!loading && user && canAccess) {
      loadCycles();
    }
  }, [user, loading, canAccess]);

  const loadCycles = async () => {
    try {
      setLoadingData(true);
      setError(null);
      console.log("Loading cycles...");
      const res = await PerformanceApi.listCycles();
      console.log("Cycles API response:", res);
      
      // Handle different response structures
      let cycles: Cycle[] = [];
      if (Array.isArray(res.data)) {
        cycles = res.data;
      } else if (Array.isArray(res)) {
        cycles = res;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        cycles = res.data.data;
      }
      
      console.log("Parsed cycles:", cycles.length, cycles);
      setItems(cycles);
      
      if (cycles.length === 0) {
        setError("No appraisal cycles found. Create a new cycle to get started.");
      }
    } catch (err: any) {
      console.error("Error loading cycles:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        code: err.code,
      });
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || !err.response) {
        setError("Cannot connect to the server. Please check: (1) Backend server is running, (2) API URL is correct, (3) Network connection is active.");
      } else {
        setError(err?.response?.data?.message || err.message || "Failed to load cycles");
      }
      setItems([]);
    } finally {
      setLoadingData(false);
    }
  };


  const createCycle = async () => {
    if (!form.name) return setError("Name is required");
    if (!form.cycleType) return setError("Cycle type is required");
    if (!form.startDate) return setError("Start date is required");
    if (!form.endDate) return setError("End date is required");
    
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        name: form.name,
        description: form.description || undefined,
        cycleType: form.cycleType,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };
      
      if (form.managerDueDate) {
        payload.managerDueDate = new Date(form.managerDueDate).toISOString();
      }
      if (form.employeeAcknowledgementDueDate) {
        payload.employeeAcknowledgementDueDate = new Date(form.employeeAcknowledgementDueDate).toISOString();
      }
      
      await PerformanceApi.createCycle(payload);
      setForm({ 
        name: "", 
        description: "",
        cycleType: "ANNUAL",
        startDate: "",
        endDate: "",
        managerDueDate: "",
        employeeAcknowledgementDueDate: ""
      });
      await loadCycles();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || "Failed to create cycle";
      if (Array.isArray(errorMessage)) {
        setError(errorMessage.join(", "));
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setStatusUpdate((s) => ({ ...s, [id]: status || s[id] || "" }));
    try {
      await PerformanceApi.setCycleStatus(id, status);
      await loadCycles();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to update status");
    }
  };

  return (
    <RouteGuard 
      requiredRoute="/performance/cycles" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "HR Employee", "department head"]}
    >
      {loading || loadingData ? (
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600 text-lg">Loading cycles...</p>
          </div>
        </main>
      ) : !user || !canAccess ? null : (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Appraisal Cycles
                </h1>
                <p className="text-slate-600 text-lg">
                  {canManageCycles 
                    ? "Create and manage appraisal cycles." 
                    : canAssistCycles 
                    ? "View cycles and assist in setup under HR Manager supervision." 
                    : canEvaluateEmployees 
                    ? "View cycles and evaluate employees." 
                    : "View appraisal cycles."}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => router.push("/performance")}
                className="bg-white text-slate-900 border-slate-300 hover:bg-slate-100"
              >
                Back to Performance Hub
              </Button>
            </header>

            {canManageCycles && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-slate-900">Create Cycle</CardTitle>
                </CardHeader>
                <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cycleName">Name</Label>
                <Input
                  id="cycleName"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Cycle name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycleType">Cycle Type</Label>
                <select
                  id="cycleType"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                  value={form.cycleType}
                  onChange={(e) => setForm((f) => ({ ...f, cycleType: e.target.value }))}
                  required
                >
                  <option value="ANNUAL">Annual</option>
                  <option value="SEMI_ANNUAL">Semi-Annual</option>
                  <option value="PROBATIONARY">Probationary</option>
                  <option value="PROJECT">Project</option>
                  <option value="AD_HOC">Ad Hoc</option>
                </select>
              </div>
              <div className="mb-4 w-full space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] bg-white text-slate-900"
                  name="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerDueDate">Manager Due Date (Optional)</Label>
                <Input
                  id="managerDueDate"
                  type="date"
                  value={form.managerDueDate || ""}
                  onChange={(e) => setForm((f) => ({ ...f, managerDueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeAckDueDate">Employee Acknowledgement Due Date (Optional)</Label>
                <Input
                  id="employeeAckDueDate"
                  type="date"
                  value={form.employeeAcknowledgementDueDate || ""}
                  onChange={(e) => setForm((f) => ({ ...f, employeeAcknowledgementDueDate: e.target.value }))}
                />
              </div>
            </div>

            {canManageCycles && (
                  <div className="border-t border-slate-200 pt-4">
                    <Button disabled={saving} onClick={createCycle} className="w-full md:w-auto">
                      {saving ? "Creating..." : "Create Cycle"}
                    </Button>
                  </div>
                )}
                {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
              </div>
                </CardContent>
            </Card>
            )}

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Existing Cycles</CardTitle>
          </CardHeader>
          <CardContent>
          {error && items.length === 0 && (
            <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 mb-4">
              <p className="font-semibold mb-2">⚠️ {error}</p>
              {canManageCycles && (
                <p className="text-sm">Use the form above to create your first appraisal cycle.</p>
              )}
            </div>
          )}
          {items.length === 0 && !error && (
            <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400">
              <p className="text-sm">No cycles found. {canManageCycles ? "Create a new cycle using the form above." : "Contact HR to create appraisal cycles."}</p>
            </div>
          )}
          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((cycle, idx) => {
                const id = (cycle._id || cycle.id || "").toString();
                return (
                  <div
                    key={id || idx}
                    className="p-4 bg-white rounded-lg border border-slate-300 hover:border-blue-500 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="text-slate-900 font-semibold">{cycle.title || cycle.name || "Untitled"}</p>
                        <p className="text-slate-600 text-sm mb-1">Status: {cycle.status || "N/A"}</p>
                        <p className="text-slate-600 text-sm">{cycle.description || "No description"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canManageCycles && (
                          <Button
                            variant="default"
                            onClick={() => router.push(`/performance/cycles/${id}/assignments`)}
                            className="text-xs px-3"
                          >
                            Create Assignments
                          </Button>
                        )}
                        {canEvaluateEmployees && (
                          <Button
                            variant="default"
                            onClick={() => router.push(`/performance/cycles/${id}/evaluate`)}
                            className="text-xs px-3"
                          >
                            Evaluate Employees
                          </Button>
                        )}
                        {canManageCycles && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => updateStatus(id, "ACTIVE")}
                              className="text-xs px-3 bg-white text-slate-900 border-slate-300 hover:bg-slate-100"
                            >
                              Set ACTIVE
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => updateStatus(id, "ARCHIVED")}
                              className="text-xs px-3 bg-white text-slate-900 border-slate-300 hover:bg-slate-100"
                            >
                              Archive
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => updateStatus(id, "DELETED")}
                              className="text-xs px-3 bg-white text-slate-900 border-slate-300 hover:bg-slate-100"
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
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

