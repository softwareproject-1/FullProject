"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import RouteGuard from "@/components/RouteGuard";
import { getEmployeeProfileById, updateMyEmployeeProfile, EmployeeProfile } from "@/utils/employeeProfileApi";
import { canAccessRoute } from "@/utils/roleAccess";

export default function EmployeeProfilePage() {
  const { user, loading, checkAuth } = useAuth();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<{
    personalEmail?: string;
    mobilePhone?: string;
    homePhone?: string;
    gender?: 'MALE' | 'FEMALE';
    maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  }>({});

  const canAccess = user ? canAccessRoute(user.roles, "/employee/profile") : false;

  useEffect(() => {
    if (!loading && user && user._id) {
      if (canAccess) {
        loadEmployeeProfile();
      } else {
        // If user doesn't have access, stop loading and show error
        setLoadingData(false);
        setError("You do not have access to this page. Please contact your administrator.");
      }
    } else if (!loading && !user) {
      // User not logged in, stop loading
      setLoadingData(false);
    }
  }, [user, loading, canAccess]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loadingData) {
        console.warn("Profile loading timeout - stopping loading state");
        setLoadingData(false);
        if (!error) {
          setError("Loading is taking longer than expected. Please refresh the page.");
        }
      }
    }, 30000); // 30 second timeout

    return () => clearTimeout(timeout);
  }, [loadingData, error]);

  const loadEmployeeProfile = async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      if (!user || !user._id) {
        setError("User not found");
        setLoadingData(false);
        return;
      }

      const employeeData = await getEmployeeProfileById(user._id);
      console.log("Loaded employee data:", employeeData);
      setEmployee(employeeData);
      if (!employeeData) {
        setError("Employee profile not found");
      }
    } catch (err: any) {
      console.error("Error loading employee profile:", err);
      setError(err.response?.data?.message || err.message || "Failed to load employee profile. Please try again.");
      setEmployee(null);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await updateMyEmployeeProfile(formData);
      await loadEmployeeProfile();
      await checkAuth(); // Refresh auth context
      setEditing(false);
      setFormData({});
    } catch (err: any) {
      console.error("Error updating employee profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-muted text-lg">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/employee/profile"
    >
      {!user || !canAccess ? null : (
        <main className="min-h-screen bg-gradient-to-br from-background via-background-light to-background p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
                  My Profile
                </h1>
                <p className="text-text-muted text-lg">
                  View and update your personal information
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                >
                  Back to Dashboard
                </Button>
              </div>
            </header>

            {error && (
              <Card>
                <CardContent>
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400">
                    <p className="font-semibold mb-2">⚠️ {error}</p>
                    <Button
                      onClick={loadEmployeeProfile}
                      variant="outline"
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {employee && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Personal Information</CardTitle>
                    {!editing && (
                      <Button
                        onClick={() => {
                          setEditing(true);
                          setFormData({
                            personalEmail: employee.personalEmail,
                            mobilePhone: employee.mobilePhone,
                            homePhone: employee.homePhone,
                            gender: employee.gender,
                            maritalStatus: employee.maritalStatus,
                          });
                        }}
                        variant="default"
                        size="sm"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                {editing ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Personal Email</label>
                          <Input
                            type="email"
                            value={formData.personalEmail || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("personalEmail", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Mobile Phone</label>
                          <Input
                            value={formData.mobilePhone || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("mobilePhone", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Home Phone</label>
                          <Input
                            value={formData.homePhone || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("homePhone", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Gender</label>
                          <select
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.gender || ""}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange("gender", e.target.value)}
                          >
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Marital Status</label>
                          <select
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.maritalStatus || ""}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange("maritalStatus", e.target.value)}
                          >
                            <option value="">Select Status</option>
                            <option value="SINGLE">Single</option>
                            <option value="MARRIED">Married</option>
                            <option value="DIVORCED">Divorced</option>
                            <option value="WIDOWED">Widowed</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-4 border-t border-border">
                        <Button
                          type="button"
                          onClick={() => {
                            setEditing(false);
                            setFormData({});
                            setError(null);
                          }}
                          variant="outline"
                          disabled={saving}
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
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-text-muted text-sm">Employee Number</label>
                        <p className="text-text font-medium">{employee.employeeNumber}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Full Name</label>
                        <p className="text-text font-medium">
                          {employee.firstName} {employee.middleName} {employee.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Work Email</label>
                        <p className="text-text font-medium">{employee.workEmail || "-"}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Personal Email</label>
                        <p className="text-text font-medium">{employee.personalEmail || "-"}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Mobile Phone</label>
                        <p className="text-text font-medium">{employee.mobilePhone || "-"}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Home Phone</label>
                        <p className="text-text font-medium">{employee.homePhone || "-"}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Gender</label>
                        <p className="text-text font-medium">{employee.gender || "-"}</p>
                      </div>
                      <div>
                        <label className="text-text-muted text-sm">Marital Status</label>
                        <p className="text-text font-medium">{employee.maritalStatus || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      )}
    </RouteGuard>
  );
}

