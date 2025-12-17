"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPositionById, Position } from "@/utils/organizationStructureApi";
import { isSystemAdmin } from "@/utils/roleUtils";

export default function PositionDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const positionId = params?.id as string;
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    }
  }, [positionId, user]);

  const fetchPosition = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPositionById(positionId);
      setPosition(response);
    } catch (err: any) {
      console.error("Error fetching position:", err);
      setError(err.response?.data?.message || "Failed to fetch position");
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <Card className="max-w-md w-full text-center bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push("/admin/organization-structure/positions")} variant="outline">
                Back to List
              </Button>
              <Button onClick={fetchPosition} variant="default">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <Card className="max-w-md w-full text-center bg-white">
          <CardHeader>
            <CardTitle className="text-slate-900">Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Position not found</p>
            <Button onClick={() => router.push("/admin/organization-structure/positions")} variant="default">
              Back to List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Position Details
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              View position information
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/admin/organization-structure/positions")}
              variant="outline"
            >
              Back to List
            </Button>
            <Button
              onClick={() => router.push(`/admin/organization-structure/positions/${positionId}/edit`)}
              variant="default"
            >
              Edit Position
            </Button>
          </div>
        </div>

        {/* Position Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-600 text-sm">Code</label>
                  <p className="text-slate-900 font-medium font-mono">{position.code}</p>
                </div>
                <div>
                  <label className="text-slate-600 text-sm">Title</label>
                  <p className="text-slate-900 font-medium">{position.title}</p>
                </div>
                <div>
                  <label className="text-slate-600 text-sm">Status</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded text-sm font-medium border ${
                      position.isActive
                        ? "bg-green-500/20 text-green-600 border-green-500/30"
                        : "bg-gray-500/20 text-gray-600 border-gray-500/30"
                    }`}>
                      {position.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900">Organizational Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-600 text-sm">Department ID</label>
                  <p className="text-slate-900 font-medium font-mono">{position.departmentId || "-"}</p>
                </div>
                {position.reportsToPositionId && (
                  <div>
                    <label className="text-slate-600 text-sm">Reports To Position ID</label>
                    <p className="text-slate-900 font-medium font-mono">{position.reportsToPositionId}</p>
                  </div>
                )}
                {position.description && (
                  <div>
                    <label className="text-slate-600 text-sm">Description</label>
                    <p className="text-slate-900 font-medium whitespace-pre-wrap">{position.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-slate-900">Timestamps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {position.createdAt && (
                  <div>
                    <label className="text-slate-600 text-sm">Created At</label>
                    <p className="text-slate-900 font-medium">
                      {new Date(position.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {position.updatedAt && (
                  <div>
                    <label className="text-slate-600 text-sm">Last Updated</label>
                    <p className="text-slate-900 font-medium">
                      {new Date(position.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

