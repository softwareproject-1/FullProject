"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDepartment } from "@/utils/organizationStructureApi";
import { isSystemAdmin } from "@/utils/roleUtils";
import { useEffect } from "react";

export default function CreateDepartmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    headPositionId: "",
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const payload: any = {
        code: formData.code,
        name: formData.name,
      };
      
      if (formData.description) {
        payload.description = formData.description;
      }
      
      if (formData.headPositionId) {
        payload.headPositionId = formData.headPositionId;
      }

      await createDepartment(payload);
      router.push("/admin/organization-structure/departments");
    } catch (err: any) {
      console.error("Error creating department:", err);
      setError(err.response?.data?.message || "Failed to create department");
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
              Create Department
            </h1>
            <p className="text-text-muted text-base md:text-lg">
              Add a new department to the organization
            </p>
          </div>
          <Button
            onClick={() => router.push("/admin/organization-structure/departments")}
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
                <Label htmlFor="code">Department Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., DEPT-ENG"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Engineering"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="input min-h-[100px]"
                  placeholder="Enter department description..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="headPositionId">Head Position ID (Optional)</Label>
                <Input
                  id="headPositionId"
                  placeholder="MongoDB ObjectId of the head position"
                  value={formData.headPositionId}
                  onChange={(e) => handleInputChange("headPositionId", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <Button
                type="button"
                onClick={() => router.push("/admin/organization-structure/departments")}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Department"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

