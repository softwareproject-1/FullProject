"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import RouteGuard from "@/components/RouteGuard";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";
import { PerformanceApi } from "@/utils/performanceApi";

type Template = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
};

type Criterion = {
  key: string;
  title: string;
  details?: string;
  weight?: number;
  maxScore?: number;
  required?: boolean;
};

type FormData = {
  name: string;
  description: string;
  templateType: string;
  ratingScale: {
    type: string;
    min: number;
    max: number;
    step?: number;
    labels?: string[];
  };
  criteria: Criterion[];
};

export default function TemplatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Check role-based access
  const canAccess = user ? canAccessRoute(user.roles, "/performance/templates") : false;
  const canCreateTemplates = user ? hasFeature(user.roles, "createAppraisalTemplates") : false;
  const [items, setItems] = useState<Template[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [form, setForm] = useState<FormData>({ 
    name: "", 
    description: "",
    templateType: "ANNUAL",
    ratingScale: {
      type: "FIVE_POINT",
      min: 1,
      max: 5,
      step: 1,
      labels: []
    },
    criteria: []
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && canAccess) {
      loadTemplates();
    }
  }, [user, loading, canAccess]);

  const loadTemplates = async () => {
    try {
      setLoadingData(true);
      const res = await PerformanceApi.listTemplates();
      setItems(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load templates");
    } finally {
      setLoadingData(false);
    }
  };

  const loadTemplateForEdit = async (templateId: string) => {
    try {
      setError(null);
      const res = await PerformanceApi.getTemplate(templateId);
      const template = res.data || res;
      
      setForm({
        name: template.name || "",
        description: template.description || "",
        templateType: template.templateType || "ANNUAL",
        ratingScale: template.ratingScale || {
          type: "FIVE_POINT",
          min: 1,
          max: 5,
          step: 1,
          labels: []
        },
        criteria: template.criteria || []
      });
      setEditingTemplateId(templateId);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to load template");
    }
  };

  const cancelEdit = () => {
    setEditingTemplateId(null);
    setForm({ 
      name: "", 
      description: "",
      templateType: "ANNUAL",
      ratingScale: {
        type: "FIVE_POINT",
        min: 1,
        max: 5,
        step: 1,
        labels: []
      },
      criteria: [] as Criterion[]
    });
    setError(null);
  };

  const saveTemplate = async () => {
    if (!form.name) return setError("Name is required");
    if (!form.templateType) return setError("Template type is required");
    if (!form.ratingScale) return setError("Rating scale is required");
    if (!form.criteria || form.criteria.length === 0) return setError("At least one criterion is required");
    
    setSaving(true);
    setError(null);
    try {
      if (editingTemplateId) {
        // Update existing template
        await PerformanceApi.updateTemplate(editingTemplateId, {
          name: form.name,
          description: form.description || undefined,
          templateType: form.templateType,
          ratingScale: form.ratingScale,
          criteria: form.criteria,
        });
      } else {
        // Create new template
        await PerformanceApi.createTemplate({
          name: form.name,
          description: form.description || undefined,
          templateType: form.templateType,
          ratingScale: form.ratingScale,
          criteria: form.criteria,
        });
      }
      
      // Reset form
      setForm({ 
        name: "", 
        description: "",
        templateType: "ANNUAL",
        ratingScale: {
          type: "FIVE_POINT",
          min: 1,
          max: 5,
          step: 1,
          labels: []
        },
        criteria: [] as Criterion[]
      });
      setEditingTemplateId(null);
      await loadTemplates();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || (editingTemplateId ? "Failed to update template" : "Failed to create template");
      // Format validation errors if they're an array
      if (Array.isArray(err?.response?.data?.message)) {
        setError(err.response.data.message.join(", "));
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <RouteGuard 
      requiredRoute="/performance/templates" 
      requiredRoles={["System Admin", "HR Admin", "HR Manager", "HR Employee"]}
    >
      {loading || loadingData ? (
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600 text-lg">Loading templates...</p>
          </div>
        </main>
      ) : !user || !canAccess ? null : (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Appraisal Templates
                </h1>
                <p className="text-slate-600 text-lg">
                  {canCreateTemplates ? "Create and manage appraisal templates." : "View appraisal templates."}
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

            {canCreateTemplates && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle>{editingTemplateId ? "Edit Template" : "Create Template"}</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Template name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="templateType">Template Type</Label>
                      <select
                        id="templateType"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.templateType}
                        onChange={(e) => setForm((f) => ({ ...f, templateType: e.target.value }))}
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
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        name="description"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="text-slate-900 font-semibold mb-3">Rating Scale</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scaleType">Scale Type</Label>
                        <select
                          id="scaleType"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={form.ratingScale.type}
                          onChange={(e) => setForm((f) => ({ 
                            ...f, 
                            ratingScale: { 
                              ...f.ratingScale, 
                              type: e.target.value,
                              min: e.target.value === "THREE_POINT" ? 1 : e.target.value === "FIVE_POINT" ? 1 : 1,
                              max: e.target.value === "THREE_POINT" ? 3 : e.target.value === "FIVE_POINT" ? 5 : 10,
                            } 
                          }))}
                        >
                          <option value="THREE_POINT">Three Point (1-3)</option>
                          <option value="FIVE_POINT">Five Point (1-5)</option>
                          <option value="TEN_POINT">Ten Point (1-10)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minValue">Min Value</Label>
                        <Input
                          id="minValue"
                          type="number"
                          value={form.ratingScale.min}
                          onChange={(e) => setForm((f) => ({ 
                            ...f, 
                            ratingScale: { ...f.ratingScale, min: parseInt(e.target.value) || 1 } 
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxValue">Max Value</Label>
                        <Input
                          id="maxValue"
                          type="number"
                          value={form.ratingScale.max}
                          onChange={(e) => setForm((f) => ({ 
                            ...f, 
                            ratingScale: { ...f.ratingScale, max: parseInt(e.target.value) || 5 } 
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stepValue">Step (Optional)</Label>
                        <Input
                          id="stepValue"
                          type="number"
                          value={form.ratingScale.step || ""}
                          onChange={(e) => setForm((f) => ({ 
                            ...f, 
                            ratingScale: { ...f.ratingScale, step: e.target.value ? parseInt(e.target.value) : undefined } 
                          }))}
                          placeholder="e.g., 0.5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-slate-900 font-semibold">Evaluation Criteria</h3>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setForm((f) => ({ 
                          ...f, 
                          criteria: [...f.criteria, { key: `criterion_${Date.now()}`, title: "", weight: 0, required: false }] 
                        }))}
                      >
                        Add Criterion
                      </Button>
                    </div>
                    {form.criteria.length === 0 ? (
                      <p className="text-slate-600 text-sm">No criteria added. Click "Add Criterion" to add one.</p>
                    ) : (
                      <div className="space-y-3">
                        {form.criteria.map((criterion, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`key-${idx}`}>Key</Label>
                                <Input
                                  id={`key-${idx}`}
                                  value={criterion.key || ""}
                                  onChange={(e) => {
                                    const newCriteria = [...form.criteria];
                                    newCriteria[idx] = { ...newCriteria[idx], key: e.target.value };
                                    setForm((f) => ({ ...f, criteria: newCriteria }));
                                  }}
                                  placeholder="e.g., quality"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`title-${idx}`}>Title</Label>
                                <Input
                                  id={`title-${idx}`}
                                  value={criterion.title || ""}
                                  onChange={(e) => {
                                    const newCriteria = [...form.criteria];
                                    newCriteria[idx] = { ...newCriteria[idx], title: e.target.value };
                                    setForm((f) => ({ ...f, criteria: newCriteria }));
                                  }}
                                  placeholder="e.g., Quality of Work"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`details-${idx}`}>Details (Optional)</Label>
                                <Input
                                  id={`details-${idx}`}
                                  value={criterion.details || ""}
                                  onChange={(e) => {
                                    const newCriteria = [...form.criteria];
                                    newCriteria[idx] = { ...newCriteria[idx], details: e.target.value };
                                    setForm((f) => ({ ...f, criteria: newCriteria }));
                                  }}
                                  placeholder="Additional details"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`weight-${idx}`}>Weight (0-100)</Label>
                                  <Input
                                    id={`weight-${idx}`}
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={criterion.weight || ""}
                                    onChange={(e) => {
                                      const newCriteria = [...form.criteria];
                                      newCriteria[idx] = { ...newCriteria[idx], weight: e.target.value ? parseInt(e.target.value) : 0 };
                                      setForm((f) => ({ ...f, criteria: newCriteria }));
                                    }}
                                  />
                                </div>
                                <div className="flex items-end">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={criterion.required || false}
                                      onChange={(e) => {
                                        const newCriteria = [...form.criteria];
                                        newCriteria[idx] = { ...newCriteria[idx], required: e.target.checked };
                                        setForm((f) => ({ ...f, criteria: newCriteria }));
                                      }}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-slate-900 text-sm">Required</span>
                                  </label>
                                </div>
                              </div>
                              <div className="md:col-span-2 flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const newCriteria = form.criteria.filter((_, i) => i !== idx);
                                    setForm((f) => ({ ...f, criteria: newCriteria }));
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex gap-2">
                    {editingTemplateId && (
                      <Button 
                        variant="outline" 
                        onClick={cancelEdit} 
                        disabled={saving}
                        className="w-full md:w-auto"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      disabled={saving} 
                      onClick={saveTemplate} 
                      className="w-full md:w-auto"
                    >
                      {saving ? "Saving..." : editingTemplateId ? "Update Template" : "Create Template"}
                    </Button>
                  </div>
                  {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                </div>
                </CardContent>
              </Card>
            )}

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Existing Templates</CardTitle>
          </CardHeader>
          <CardContent>
          {items.length === 0 ? (
            <p className="text-slate-600 text-sm">No templates found.</p>
          ) : (
            <div className="space-y-3">
              {items.map((tpl, idx) => (
                <div
                  key={tpl._id || tpl.id || idx}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-500/50 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-slate-900 font-semibold">{tpl.title || tpl.name || "Untitled"}</p>
                      <p className="text-slate-600 text-sm">
                        {tpl.description || "No description"}
                      </p>
                    </div>
                    {canCreateTemplates && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => loadTemplateForEdit(tpl._id || tpl.id || "")}
                          className="text-xs px-3 py-1"
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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

