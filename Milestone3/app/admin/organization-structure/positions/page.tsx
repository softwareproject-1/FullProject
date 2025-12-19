"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RouteGuard from "@/components/RouteGuard";
import { getAllPositions, deactivatePosition, reactivatePosition, Position } from "@/utils/organizationStructureApi";
import { canAccessRoute, hasFeature, hasRole, SystemRole } from "@/utils/roleAccess";

export default function PositionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

  // System Admin can manage, HR Employee can view (read-only)
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const canManagePositions = user ? hasFeature(user.roles, "createPositions") : false;
  const canViewOrganizationalCharts = user ? hasFeature(user.roles, "viewOrganizationalCharts") : false;

  useEffect(() => {
    if (!authLoading && user && (isSystemAdmin || canViewOrganizationalCharts)) {
      fetchPositions();
    }
  }, [user, authLoading, isSystemAdmin, canViewOrganizationalCharts]);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllPositions();
      setPositions(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error("Error fetching positions:", err);
      setError(err.response?.data?.message || "Failed to fetch positions");
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (positionId: string) => {
    if (!confirm("Are you sure you want to deactivate this position?")) {
      return;
    }

    try {
      setDeactivatingId(positionId);
      setError(null);
      await deactivatePosition(positionId, "Deactivated by System Admin");
      await fetchPositions();
    } catch (err: any) {
      console.error("Error deactivating position:", err);
      setError(err.response?.data?.message || "Failed to deactivate position");
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleReactivate = async (positionId: string) => {
    if (!confirm("Are you sure you want to reactivate this position?")) {
      return;
    }

    try {
      setReactivatingId(positionId);
      setError(null);
      await reactivatePosition(positionId, "Reactivated by System Admin");
      await fetchPositions();
    } catch (err: any) {
      console.error("Error reactivating position:", err);
      setError(err.response?.data?.message || "Failed to reactivate position");
    } finally {
      setReactivatingId(null);
    }
  };

  const filteredPositions = positions.filter((pos) =>
    pos.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 text-lg">Loading positions...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard 
      requiredRoute="/admin/organization-structure" 
      requiredRoles={["System Admin"]}
    >
      {loading || authLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600 text-lg">Loading...</p>
          </div>
        </div>
      ) : !user ? null : (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Positions
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              {canManagePositions ? "Manage organizational positions" : "View organizational positions (read-only)"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/admin")}
              variant="outline"
            >
              Back to Dashboard
            </Button>
            {canManagePositions && (
              <Button
                onClick={() => router.push("/admin/organization-structure/positions/new")}
                variant="default"
              >
                Create Position
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-white">
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="searchPositions">Search Positions</Label>
              <Input
                id="searchPositions"
                placeholder="Search by title or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Positions Table */}
        <Card className="bg-white">
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left p-4 text-slate-900 font-semibold">Code</th>
                    <th className="text-left p-4 text-slate-900 font-semibold">Title</th>
                    <th className="text-left p-4 text-slate-900 font-semibold">Description</th>
                    <th className="text-left p-4 text-slate-900 font-semibold">Department ID</th>
                    <th className="text-left p-4 text-slate-900 font-semibold">Status</th>
                    <th className="text-left p-4 text-slate-900 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPositions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-slate-600">
                        {searchTerm ? "No positions found matching your search" : "No positions found"}
                      </td>
                    </tr>
                  ) : (
                    filteredPositions.map((position) => (
                      <tr key={position._id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-900 font-mono text-sm">{position.code}</td>
                        <td className="p-4 text-slate-900 font-medium">{position.title}</td>
                        <td className="p-4 text-slate-600 text-sm">{position.description || "-"}</td>
                        <td className="p-4 text-slate-600 text-sm font-mono">{position.departmentId || "-"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${
                            position.isActive
                              ? "bg-green-500/20 text-green-600 border-green-500/30"
                              : "bg-gray-500/20 text-gray-600 border-gray-500/30"
                          }`}>
                            {position.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => router.push(`/admin/organization-structure/positions/${position._id}`)}
                              variant="outline"
                              className="text-xs px-3 py-1"
                            >
                              View
                            </Button>
                            {canManagePositions && (
                              <>
                                <Button
                                  onClick={() => router.push(`/admin/organization-structure/positions/${position._id}/edit`)}
                                  variant="default"
                                  className="text-xs px-3 py-1"
                                >
                                  Edit
                                </Button>
                                {position.isActive ? (
                                  <Button
                                    onClick={() => handleDeactivate(position._id)}
                                    variant="outline"
                                    className="text-xs px-3 py-1"
                                    disabled={deactivatingId === position._id || deactivatingId !== null || reactivatingId !== null}
                                  >
                                    {deactivatingId === position._id ? "Deactivating..." : "Deactivate"}
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => handleReactivate(position._id)}
                                    variant="default"
                                    className="text-xs px-3 py-1"
                                    disabled={reactivatingId === position._id || deactivatingId !== null || reactivatingId !== null}
                                  >
                                    {reactivatingId === position._id ? "Reactivating..." : "Reactivate"}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
      )}
    </RouteGuard>
  );
}

