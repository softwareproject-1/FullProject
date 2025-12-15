"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { getPositionById, updatePosition, getAllDepartments, Position, Department } from "@/utils/organizationStructureApi";
import { isSystemAdmin } from "@/utils/roleUtils";

export default function EditPositionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const positionId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    departmentId: "",
    departmentName: "",
    reportsToPositionId: "",
    isActive: true,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (!isSystemAdmin(user.roles)) {
        router.replace("/unauthorized");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && isSystemAdmin(user.roles) && positionId) {
      fetchPosition();
      fetchDepartments();
    }
  }, [positionId, user]);

  const fetchPosition = async () => {
    try {
      setLoading(true);
      setError(null);
      const position = await getPositionById(positionId);
      setFormData({
        title: position.title || "",
        description: position.description || "",
        departmentId: position.departmentId || "",
        departmentName: "",
        reportsToPositionId: position.reportsToPositionId || "",
        isActive: position.isActive !== undefined ? position.isActive : true,
      });
    } catch (err: any) {
      console.error("Error fetching position:", err);
      setError(err.response?.data?.message || "Failed to fetch position");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await getAllDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear the other department field when one is set
    if (field === "departmentId") {
      setFormData(prev => ({ ...prev, departmentName: "" }));
    } else if (field === "departmentName") {
      setFormData(prev => ({ ...prev, departmentId: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      const payload: any = {};
      
      if (formData.title) payload.title = formData.title;
      if (formData.description) payload.description = formData.description;
      if (formData.departmentId) payload.departmentId = formData.departmentId;
      if (formData.departmentName) payload.departmentName = formData.departmentName;
      if (formData.reportsToPositionId) payload.reportsToPositionId = formData.reportsToPositionId;
      payload.isActive = formData.isActive;

      await updatePosition(positionId, payload);
      router.push("/admin/organization-structure/positions");
    } catch (err: any) {
      console.error("Error updating position:", err);
      setError(err.response?.data?.message || "Failed to update position");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading position...</p>
        </div>
      </div>
    );
  }

  if (!user || !isSystemAdmin(user.roles)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Edit Position
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              Update position information
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/organization-structure/positions")}
            variant="outline"
          >
            Cancel
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Form */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Position Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Position Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Software Engineer"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="Enter position description..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department (Select or Enter Name)</Label>
                  <select
                    id="departmentId"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.departmentId}
                    onChange={(e) => handleInputChange("departmentId", e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-slate-600 text-xs mt-1">OR</p>
                  <div className="space-y-2">
                    <Label htmlFor="departmentName">Department Name</Label>
                    <Input
                      id="departmentName"
                      placeholder="Enter department name if not in list"
                      value={formData.departmentName}
                      onChange={(e) => handleInputChange("departmentName", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reportsToPositionId">Reports To Position ID (Optional)</Label>
                  <Input
                    id="reportsToPositionId"
                    placeholder="MongoDB ObjectId of the reporting position"
                    value={formData.reportsToPositionId}
                    onChange={(e) => handleInputChange("reportsToPositionId", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <Button
                  type="button"
                  onClick={() => router.push("/admin/organization-structure/positions")}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

