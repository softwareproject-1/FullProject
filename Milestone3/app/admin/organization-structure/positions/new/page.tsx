"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPosition, getAllDepartments } from "@/utils/organizationStructureApi";
import { isSystemAdmin } from "@/utils/roleUtils";
import { Department } from "@/utils/organizationStructureApi";

export default function CreatePositionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    departmentId: "",
    departmentName: "",
    reportsToPositionId: "",
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
    if (user && isSystemAdmin(user.roles)) {
      fetchDepartments();
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const response = await getAllDepartments();
      setDepartments(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
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
      setLoading(true);
      setError(null);
      
      if (!formData.departmentId && !formData.departmentName) {
        setError("Either Department ID or Department Name must be provided");
        setLoading(false);
        return;
      }
      
      const payload: any = {
        code: formData.code,
        title: formData.title,
      };
      
      if (formData.description) {
        payload.description = formData.description;
      }
      
      if (formData.departmentId) {
        payload.departmentId = formData.departmentId;
      } else if (formData.departmentName) {
        payload.departmentName = formData.departmentName;
      }
      
      if (formData.reportsToPositionId) {
        payload.reportsToPositionId = formData.reportsToPositionId;
      }

      await createPosition(payload);
      router.push("/admin/organization-structure/positions");
    } catch (err: any) {
      console.error("Error creating position:", err);
      setError(err.response?.data?.message || "Failed to create position");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isSystemAdmin(user.roles)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
              Create Position
            </h1>
            <p className="text-text-muted text-base md:text-lg">
              Add a new position to the organization
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
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Position Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., POS-ENG-001"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Position Title</Label>
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
                  className="input min-h-[100px]"
                  placeholder="Enter position description..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department (Select or Enter Name)</Label>
                <select
                  id="departmentId"
                  className="input"
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
                <p className="text-text-muted text-xs mt-1">OR</p>
                <div className="space-y-2 mt-2">
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
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Position"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

