"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  DollarSign,
} from "lucide-react";
import { PayGrade, ConfigStatus, Allowance } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Department/Position removed per backend scope

export default function PayGrades() {
  const [payGrades, setPayGrades] = useState<PayGrade[]>([]);
  const [availableAllowances, setAvailableAllowances] = useState<Allowance[]>(
    []
  );
  const [selectedAllowanceIds, setSelectedAllowanceIds] = useState<string[]>(
    []
  );
  const [selectedAllowancesTotal, setSelectedAllowancesTotal] = useState(0);
  const [editSelectedAllowanceIds, setEditSelectedAllowanceIds] = useState<
    string[]
  >([]);
  const [editSelectedAllowancesTotal, setEditSelectedAllowancesTotal] =
    useState(0);

  // Form states
  const [grade, setGrade] = useState("");
  // Removed departmentId/positionId from form
  const [baseSalary, setBaseSalary] = useState("");
  // Remove allowance selection; always use all approved allowances
  const [grossSalary, setGrossSalary] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { user, loading: authLoading } = useAuth();
  const roles = useMemo(() => user?.roles || [], [user]);
  const isPayrollManager = roles.includes("Payroll Manager");
  const isPayrollSpecialist = roles.includes("Payroll Specialist");

  // Message Modal States
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [messageText, setMessageText] = useState("");

  // Confirmation Modal States
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Status Change Modal States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusChangePayGradeId, setStatusChangePayGradeId] = useState<
    string | null
  >(null);
  const [newStatus, setNewStatus] = useState<"draft" | "approved" | "rejected">(
    "approved"
  );

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPayGradeId, setEditPayGradeId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState("");
  // Removed editDepartmentId/editPositionId
  const [editBaseSalary, setEditBaseSalary] = useState("");
  const [editGrossSalary, setEditGrossSalary] = useState("");

  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayGrade, setSelectedPayGrade] = useState<PayGrade | null>(
    null
  );

  // Add Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const extractMessage = (err: any) => {
    if (typeof err?.message === "string") {
      const normalize = (msg: string) =>
        /unauthorized|forbidden|role/i.test(msg)
          ? "User does not have the required role."
          : msg;

      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.message) return normalize(parsed.message);
      } catch (e) {
        /* ignore JSON parse failures */
      }
      return normalize(err.message);
    }
    return "An error occurred";
  };

  const sumSelectedAllowances = useCallback(
    (allowanceIds: string[]) => {
      if (!allowanceIds || allowanceIds.length === 0) return 0;
      const selectedSet = new Set(allowanceIds);
      return availableAllowances.reduce((sum, allowance) => {
        if (selectedSet.has(allowance._id)) {
          return sum + (allowance.amount || 0);
        }
        return sum;
      }, 0);
    },
    [availableAllowances]
  );

  const computeGrossSalary = useCallback(
    (base: string, allowanceIds: string[]) => {
      const baseNum = parseFloat(base) || 0;
      const allowancesSum = sumSelectedAllowances(allowanceIds);
      return {
        gross: (baseNum + allowancesSum).toFixed(2),
        allowancesSum,
      };
    },
    [sumSelectedAllowances]
  );

  // Auto-compute gross salary for add form
  useEffect(() => {
    const { gross, allowancesSum } = computeGrossSalary(
      baseSalary,
      selectedAllowanceIds
    );
    setGrossSalary(gross);
    setSelectedAllowancesTotal(allowancesSum);
  }, [baseSalary, selectedAllowanceIds, computeGrossSalary]);

  // Auto-compute gross salary for edit form
  useEffect(() => {
    const { gross, allowancesSum } = computeGrossSalary(
      editBaseSalary,
      editSelectedAllowanceIds
    );
    setEditGrossSalary(gross);
    setEditSelectedAllowancesTotal(allowancesSum);
  }, [editBaseSalary, editSelectedAllowanceIds, computeGrossSalary]);

  const fetchPayGrades = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/pay-grades`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPayGrades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(extractMessage(err));
    }
  }, []);

  // Removed fetchDepartments/fetchPositions

  const fetchAllowances = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/allowances`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const approved = Array.isArray(data)
        ? data.filter((a: Allowance) => a.status === "approved")
        : [];
      setAvailableAllowances(approved);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setSelectedAllowanceIds((prev) => {
      if (prev.length === 0) return prev;
      const validIds = prev.filter((id) =>
        availableAllowances.some((allowance) => allowance._id === id)
      );
      return validIds.length === prev.length ? prev : validIds;
    });
    setEditSelectedAllowanceIds((prev) => {
      if (prev.length === 0) return prev;
      const validIds = prev.filter((id) =>
        availableAllowances.some((allowance) => allowance._id === id)
      );
      return validIds.length === prev.length ? prev : validIds;
    });
  }, [availableAllowances]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("You must be logged in to manage pay grades.");
      setPayGrades([]);
      setAvailableAllowances([]);
      return;
    }
    setError(null);
    fetchPayGrades();
    fetchAllowances();
  }, [authLoading, user, fetchPayGrades, fetchAllowances]);

  const handleAdd = async () => {
    if (!user) {
      showMessage("error", "You must be logged in to create pay grades.");
      return;
    }
    if (!isPayrollSpecialist) {
      showMessage("error", "You do not have permission to create pay grades.");
      return;
    }
    if (!grade || !baseSalary || !grossSalary) {
      showMessage("error", "Please fill in all required fields.");
      return;
    }

    // Client-side duplicate prevention: check existing pay grades by name
    const normalizedNew = grade.trim().toLowerCase();
    if (payGrades.some((pg) => (pg.grade || "").trim().toLowerCase() === normalizedNew)) {
      showMessage("error", "Pay grade already exists (no duplicates allowed)");
      return;
    }

    const baseNum = parseFloat(baseSalary);
    const grossNum = parseFloat(grossSalary);
    if (isNaN(baseNum) || baseNum < 6000) {
      showMessage("error", "Base salary must be at least 6000.");
      return;
    }
    if (isNaN(grossNum) || grossNum < 6000) {
      showMessage("error", "Gross salary must be at least 6000.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        grade,
        baseSalary: baseNum,
        grossSalary: grossNum,
        allowanceIds: selectedAllowanceIds,
      };

      const res = await fetch(`${API_BASE}/pay-grades`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        let msg = raw;
        let parsed: any = null;
        try {
          parsed = JSON.parse(raw || "{}");
          msg = parsed?.message || parsed?.error || raw || "";
        } catch (e) {
          /* not JSON */
        }
        if (res.status === 409 || /duplicate|exists|e11000/i.test(String(msg))) {
          showMessage("error", "Pay grade already exists (no duplicates allowed)");
        } else {
          console.error("Create pay grade failed", { status: res.status, raw, parsed });
          showMessage(
            "error",
            `Server error (${res.status}): ${String(msg || raw || "No response body")}`
          );
        }
      } else {
        showMessage("success", "Pay grade created successfully!");
      }
      closeAddModal();
      fetchPayGrades();
    } catch (err) {
      console.error(err);
      showMessage("error", extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!user) {
      showMessage("error", "You must be logged in to edit pay grades.");
      return;
    }
    if (!isPayrollSpecialist) {
      showMessage("error", "You do not have permission to edit pay grades.");
      return;
    }
    if (!editPayGradeId) return;
    if (!editGrade || !editBaseSalary || !editGrossSalary) {
      showMessage("error", "Please fill in all required fields.");
      return;
    }

    // Client-side duplicate prevention: ensure no other pay grade has same name
    const normalizedEdit = editGrade.trim().toLowerCase();
    if (
      payGrades.some(
        (pg) => pg._id !== editPayGradeId && (pg.grade || "").trim().toLowerCase() === normalizedEdit
      )
    ) {
      showMessage("error", "Pay grade already exists (no duplicates allowed)");
      return;
    }

    const baseNum = parseFloat(editBaseSalary);
    const grossNum = parseFloat(editGrossSalary);
    if (isNaN(baseNum) || baseNum < 6000) {
      showMessage("error", "Base salary must be at least 6000.");
      return;
    }
    if (isNaN(grossNum) || grossNum < 6000) {
      showMessage("error", "Gross salary must be at least 6000.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        grade: editGrade,
        baseSalary: baseNum,
        grossSalary: grossNum,
        allowanceIds: editSelectedAllowanceIds,
      };

      const res = await fetch(`${API_BASE}/pay-grades/${editPayGradeId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const raw = await res.text().catch(() => "");
        let msg = raw;
        let parsed: any = null;
        try {
          parsed = JSON.parse(raw || "{}");
          msg = parsed?.message || parsed?.error || raw || "";
        } catch (e) {
          /* not JSON */
        }
        if (res.status === 409 || /duplicate|exists|e11000/i.test(String(msg))) {
          showMessage("error", "Pay grade already exists (no duplicates allowed)");
        } else {
          console.error("Update pay grade failed", { status: res.status, raw, parsed });
          showMessage(
            "error",
            `Server error (${res.status}): ${String(msg || raw || "No response body")}`
          );
        }
      } else {
        showMessage("success", "Pay grade updated successfully!");
      }
      closeEditModal();
      fetchPayGrades();
    } catch (err) {
      console.error(err);
      showMessage("error", extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      showMessage("error", "You must be logged in to delete pay grades.");
      return;
    }
    if (!isPayrollManager) {
      showMessage("error", "You do not have permission to delete pay grades.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/pay-grades/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      showMessage("success", "Pay grade deleted successfully!");
      fetchPayGrades();
    } catch (err) {
      console.error(err);
      showMessage("error", extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusChangePayGradeId) return;
    if (!user) {
      showMessage("error", "You must be logged in to change statuses.");
      return;
    }
    if (!isPayrollManager) {
      showMessage("error", "You do not have permission to approve pay grades.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/pay-grades/${statusChangePayGradeId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      showMessage("success", `Status changed to ${newStatus}!`);
      setIsStatusModalOpen(false);
      fetchPayGrades();
    } catch (err) {
      console.error(err);
      showMessage("error", extractMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    if (!user) {
      showMessage("error", "You must be logged in to create pay grades.");
      return;
    }
    if (!isPayrollSpecialist) {
      showMessage("error", "Only Payroll Specialists can create pay grades.");
      return;
    }
    resetAddForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (pg: PayGrade) => {
    if (!user) {
      showMessage("error", "You must be logged in to edit pay grades.");
      return;
    }
    if (!isPayrollSpecialist) {
      showMessage("error", "Only Payroll Specialists can edit pay grades.");
      return;
    }
    if (pg.status !== "draft") return;
    resetEditForm();
    setEditPayGradeId(pg._id);
    setEditGrade(pg.grade);
    // Department/Position removed
    setEditBaseSalary(pg.baseSalary.toString());
    setEditGrossSalary(pg.grossSalary.toString());
    if (pg.allowances && pg.allowances.length > 0) {
      const derivedIds = deriveAllowanceSelectionFromPayGrade(pg);
      if (derivedIds.length > 0) {
        setEditSelectedAllowanceIds(derivedIds);
      }
    }
    setIsEditModalOpen(true);
  };

  const openViewModal = (pg: PayGrade) => {
    setSelectedPayGrade(pg);
    setIsViewModalOpen(true);
  };

  const openStatusModal = (id: string) => {
    setStatusChangePayGradeId(id);
    setNewStatus("approved");
    setIsStatusModalOpen(true);
  };

  const openDeleteConfirm = (id: string) => {
    setConfirmMessage("Are you sure you want to delete this pay grade?");
    setConfirmAction(() => () => handleDelete(id));
    setIsConfirmModalOpen(true);
  };

  const toggleAllowanceSelection = (allowanceId: string) => {
    setSelectedAllowanceIds((prev) => {
      if (prev.includes(allowanceId)) {
        return prev.filter((id) => id !== allowanceId);
      }
      return [...prev, allowanceId];
    });
  };

  const toggleEditAllowanceSelection = (allowanceId: string) => {
    setEditSelectedAllowanceIds((prev) => {
      if (prev.includes(allowanceId)) {
        return prev.filter((id) => id !== allowanceId);
      }
      return [...prev, allowanceId];
    });
  };

  const deriveAllowanceSelectionFromPayGrade = useCallback(
    (pg: PayGrade) => {
      if (!pg.allowances || pg.allowances.length === 0) {
        return [];
      }

      const availableById = new Map(
        availableAllowances.map((allowance) => [allowance._id, allowance])
      );

      const matchedIds = pg.allowances
        .map((pgAllowance) => {
          if (pgAllowance._id && availableById.has(pgAllowance._id)) {
            return pgAllowance._id;
          }

          return (
            availableAllowances.find(
              (allowance) =>
                allowance.name === pgAllowance.name &&
                allowance.amount === pgAllowance.amount
            )?._id || null
          );
        })
        .filter((id): id is string => Boolean(id));

      return Array.from(new Set(matchedIds));
    },
    [availableAllowances]
  );

  const selectAllAllowances = () => {
    setSelectedAllowanceIds(availableAllowances.map((a) => a._id));
  };

  const clearAllAllowances = () => {
    setSelectedAllowanceIds([]);
  };

  const selectAllEditAllowances = () => {
    setEditSelectedAllowanceIds(availableAllowances.map((a) => a._id));
  };

  const clearAllEditAllowances = () => {
    setEditSelectedAllowanceIds([]);
  };

  const resetAddForm = () => {
    setGrade("");
    setBaseSalary("");
    setGrossSalary("");
    setSelectedAllowanceIds(availableAllowances.map((a) => a._id));
  };

  const resetEditForm = () => {
    setEditPayGradeId(null);
    setEditGrade("");
    setEditBaseSalary("");
    setEditGrossSalary("");
    setEditSelectedAllowanceIds([]);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetAddForm();
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    resetEditForm();
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessageType(type);
    setMessageText(text);
    setMessageModalOpen(true);
  };

  const filteredPayGrades = payGrades.filter((pg) => {
    const matchesSearch = pg.grade
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || pg.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  // const filteredPayGrades = payGrades.filter((pg) => {
  //   const grade = pg.grade ?? "";

  //   const matchesSearch = grade
  //     .toLowerCase()
  //     .includes(searchTerm.toLowerCase());

  //   const matchesStatus =
  //     filterStatus === "all" || pg.status === filterStatus;

  //   return matchesSearch && matchesStatus;
  // });

  const getStatusBadge = (status: ConfigStatus) => {
    const styles = {
      draft: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Pay Grades Configuration
            </h1>
            <p className="text-slate-600">
              Manage pay grades (Gross Salary = Base Pay + Allowances)
            </p>
          </div>
          {isPayrollSpecialist && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Pay Grade
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by grade..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Grade
                  </th>
                  {/* Department/Position columns removed */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Base Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPayGrades.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No pay grades found
                    </td>
                  </tr>
                ) : (
                  filteredPayGrades.map((pg) => (
                    <tr
                      key={pg._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {pg.grade}
                      </td>
                      {/* Department/Position cells removed */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        ${pg.baseSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                        ${(pg.grossSalary ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(pg.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewModal(pg)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {pg.status === "draft" && isPayrollSpecialist && (
                            <button
                              onClick={() => openEditModal(pg)}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isPayrollManager && pg.status === "draft" && (
                            <button
                              onClick={() => openDeleteConfirm(pg._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {isPayrollManager &&
                            (pg.status === "draft" ||
                              pg.status === "rejected") && (
                              <button
                                onClick={() => openStatusModal(pg._id)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                title="Change Status"
                              >
                                ✓
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        title="Add New Pay Grade"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Grade Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Junior TA, Mid TA, Senior TA"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>

          {/* Department/Position form controls removed */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Base Salary <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Minimum 6000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              min="6000"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Allowances
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Select which approved allowances should contribute to this grade's
              gross salary.
            </p>
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
              {availableAllowances.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No approved allowances available
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 justify-end text-xs text-blue-600">
                    <button
                      type="button"
                      onClick={selectAllAllowances}
                      className="hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-slate-400">|</span>
                    <button
                      type="button"
                      onClick={clearAllAllowances}
                      className="hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {availableAllowances.map((allowance) => (
                    <label
                      key={allowance._id}
                      className="flex items-center justify-between gap-4 rounded-md border border-transparent px-2 py-1 text-sm hover:border-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600"
                          checked={selectedAllowanceIds.includes(allowance._id)}
                          onChange={() =>
                            toggleAllowanceSelection(allowance._id)
                          }
                        />
                        {allowance.name}
                      </span>
                      <span className="font-medium">
                        ${allowance.amount.toLocaleString()}
                      </span>
                    </label>
                  ))}
                  <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-slate-200">
                    <span>Selected Total</span>
                    <span>${selectedAllowancesTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gross Salary (Auto-calculated){" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="Auto-computed"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={grossSalary}
                readOnly
                min="6000"
              />
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gross Salary = Base Salary + Sum of Selected Allowances
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={closeAddModal}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Pay Grade"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Pay Grade"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Grade Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Junior TA, Mid TA, Senior TA"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={editGrade}
              onChange={(e) => setEditGrade(e.target.value)}
            />
          </div>

          {/* Department/Position edit controls removed */}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Base Salary <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Minimum 6000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={editBaseSalary}
              onChange={(e) => setEditBaseSalary(e.target.value)}
              min="6000"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Allowances
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Update which allowances should remain part of this pay grade.
            </p>
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
              {availableAllowances.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No approved allowances available
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 justify-end text-xs text-blue-600">
                    <button
                      type="button"
                      onClick={selectAllEditAllowances}
                      className="hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-slate-400">|</span>
                    <button
                      type="button"
                      onClick={clearAllEditAllowances}
                      className="hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {availableAllowances.map((allowance) => (
                    <label
                      key={allowance._id}
                      className="flex items-center justify-between gap-4 rounded-md border border-transparent px-2 py-1 text-sm hover:border-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600"
                          checked={editSelectedAllowanceIds.includes(
                            allowance._id
                          )}
                          onChange={() =>
                            toggleEditAllowanceSelection(allowance._id)
                          }
                        />
                        {allowance.name}
                      </span>
                      <span className="font-medium">
                        ${allowance.amount.toLocaleString()}
                      </span>
                    </label>
                  ))}
                  <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-slate-200">
                    <span>Selected Total</span>
                    <span>${editSelectedAllowancesTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gross Salary (Auto-calculated){" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="Auto-computed"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editGrossSalary}
                readOnly
                min="6000"
              />
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gross Salary = Base Salary + Sum of Selected Allowances
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={closeEditModal}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Pay Grade"}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Pay Grade Details"
      >
        {selectedPayGrade && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Grade Name</p>
                <p className="font-medium text-slate-900">
                  {selectedPayGrade.grade}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                {getStatusBadge(selectedPayGrade.status)}
              </div>
              {/* Department/Position details removed */}
              <div>
                <p className="text-sm text-slate-500">Base Salary</p>
                <p className="font-medium text-slate-900">
                  ${selectedPayGrade.baseSalary.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Gross Salary</p>
                <p className="font-semibold text-lg text-green-600">
                  ${selectedPayGrade.grossSalary.toLocaleString()}
                </p>
              </div>
            </div>

            {selectedPayGrade.allowances &&
              selectedPayGrade.allowances.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Allowances</p>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                            Name
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedPayGrade.allowances.map((allowance) => (
                          <tr key={allowance._id}>
                            <td className="px-3 py-2 text-sm text-slate-700">
                              {allowance.name}
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-900 text-right font-medium">
                              ${allowance.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-semibold">
                          <td className="px-3 py-2 text-sm text-slate-900">
                            Total Allowances
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-900 text-right">
                            $
                            {selectedPayGrade.allowances
                              .reduce((sum, a) => sum + a.amount, 0)
                              .toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Calculation:</strong> $
                      {selectedPayGrade.baseSalary.toLocaleString()} (Base) + $
                      {selectedPayGrade.allowances
                        .reduce((sum, a) => sum + a.amount, 0)
                        .toLocaleString()}{" "}
                      (Allowances) = $
                      {selectedPayGrade.grossSalary.toLocaleString()} (Gross)
                    </p>
                  </div>
                </div>
              )}

            {selectedPayGrade.createdAt && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Created:{" "}
                  {new Date(selectedPayGrade.createdAt).toLocaleString()}
                </p>
                {selectedPayGrade.updatedAt && (
                  <p className="text-xs text-slate-500">
                    Updated:{" "}
                    {new Date(selectedPayGrade.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusChangePayGradeId(null);
        }}
        title="Change Pay Grade Status"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Status
            </label>
            <select
              value={newStatus}
              onChange={(e) =>
                setNewStatus(
                  e.target.value as "draft" | "approved" | "rejected"
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setIsStatusModalOpen(false);
                setStatusChangePayGradeId(null);
              }}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusChange}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Action"
      >
        <div className="space-y-4">
          <p className="text-slate-600">{confirmMessage}</p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmAction) confirmAction();
                setIsConfirmModalOpen(false);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* Message Modal */}
      <Modal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        title={messageType === "success" ? "Success" : "Error"}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {messageType === "success" ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <p
              className={
                messageType === "success" ? "text-green-700" : "text-red-700"
              }
            >
              {messageText}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setMessageModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
