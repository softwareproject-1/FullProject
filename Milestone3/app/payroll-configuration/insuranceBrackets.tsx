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
} from "lucide-react";
import { InsuranceBracket, ConfigStatus } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function InsuranceBrackets() {
  const [brackets, setBrackets] = useState<InsuranceBracket[]>([]);
  const [name, setName] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [employeeRate, setEmployeeRate] = useState("");
  const [employerRate, setEmployerRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { user, loading: authLoading } = useAuth();
  const roles = useMemo(() => user?.roles || [], [user]);
  const isPayrollSpecialist = roles.includes("Payroll Specialist");
  const isHRManager = roles.includes("HR Manager");
  const canEditBrackets = isPayrollSpecialist || isHRManager;

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
  const [statusChangeBracketId, setStatusChangeBracketId] = useState<
    string | null
  >(null);
  const [newStatus, setNewStatus] = useState<"draft" | "approved" | "rejected">(
    "approved"
  );

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBracketId, setEditBracketId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMinSalary, setEditMinSalary] = useState("");
  const [editMaxSalary, setEditMaxSalary] = useState("");
  const [editEmployeeRate, setEditEmployeeRate] = useState("");
  const [editEmployerRate, setEditEmployerRate] = useState("");

  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBracket, setSelectedBracket] =
    useState<InsuranceBracket | null>(null);

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

  const fetchBrackets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/insurance-brackets`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBrackets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch insurance brackets");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("You must be logged in to manage insurance brackets.");
      setBrackets([]);
      return;
    }
    setError(null);
    fetchBrackets();
  }, [authLoading, user, fetchBrackets]);

  const createBracket = async () => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to create insurance brackets.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText(
        "You do not have permission to create insurance brackets."
      );
      setMessageModalOpen(true);
      return;
    }
    if (!name || !minSalary || !maxSalary || !employeeRate || !employerRate)
      return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/insurance-brackets`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          minSalary: Number(minSalary),
          maxSalary: Number(maxSalary),
          employeeRate: Number(employeeRate),
          employerRate: Number(employerRate),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName("");
      setMinSalary("");
      setMaxSalary("");
      setEmployeeRate("");
      setEmployerRate("");
      fetchBrackets();
      setMessageType("success");
      setMessageText("Insurance bracket created successfully!");
      setMessageModalOpen(true);
    } catch (err: any) {
      console.error(err);
      setMessageType("error");
      setMessageText(
        extractMessage(err) || "Failed to create insurance bracket"
      );
      setMessageModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const openAddBracketModal = () => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to create insurance brackets.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText("Only Payroll Specialists can create insurance brackets.");
      setMessageModalOpen(true);
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleViewBracket = (bracket: InsuranceBracket) => {
    setSelectedBracket(bracket);
    setIsViewModalOpen(true);
  };

  const startEditBracket = (bracket: InsuranceBracket) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to edit insurance brackets.");
      setMessageModalOpen(true);
      return;
    }
    if (!canEditBrackets) {
      setMessageType("error");
      setMessageText(
        "Only Payroll Specialists or HR Managers can edit insurance brackets."
      );
      setMessageModalOpen(true);
      return;
    }
    if (bracket.status !== "draft") return;
    setEditBracketId(bracket._id);
    setEditName(bracket.name || "");
    setEditMinSalary(String(bracket.minSalary ?? ""));
    setEditMaxSalary(String(bracket.maxSalary ?? ""));
    setEditEmployeeRate(String(bracket.employeeRate ?? ""));
    setEditEmployerRate(String(bracket.employerRate ?? ""));
    setIsEditModalOpen(true);
  };

  const handleSubmitEditBracket = async () => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to edit insurance brackets.");
      setMessageModalOpen(true);
      return;
    }
    if (!canEditBrackets) {
      setMessageType("error");
      setMessageText(
        "Only Payroll Specialists or HR Managers can edit insurance brackets."
      );
      setMessageModalOpen(true);
      return;
    }
    if (!editBracketId || !editName.trim()) return;

    try {
      const res = await fetch(
        `${API_BASE}/insurance-brackets/${editBracketId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            minSalary: Number(editMinSalary),
            maxSalary: Number(editMaxSalary),
            employeeRate: Number(editEmployeeRate),
            employerRate: Number(editEmployerRate),
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setBrackets(
        brackets.map((b) =>
          b._id === editBracketId
            ? {
                ...b,
                name: editName.trim(),
                minSalary: Number(editMinSalary),
                maxSalary: Number(editMaxSalary),
                employeeRate: Number(editEmployeeRate),
                employerRate: Number(editEmployerRate),
              }
            : b
        )
      );
      setMessageType("success");
      setMessageText("Insurance bracket updated successfully!");
      setMessageModalOpen(true);
      setIsEditModalOpen(false);
      setEditBracketId(null);
    } catch (err: any) {
      console.error(err);
      setMessageType("error");
      setMessageText(
        extractMessage(err) || "Failed to update insurance bracket"
      );
      setMessageModalOpen(true);
    }
  };

  const handleChangeStatus = (bracketId: string, currentStatus: string) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to change statuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isHRManager) {
      setMessageType("error");
      setMessageText("You do not have permission to change this status.");
      setMessageModalOpen(true);
      return;
    }
    setStatusChangeBracketId(bracketId);
    setNewStatus(currentStatus === "draft" ? "approved" : "rejected");
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatusChange = async () => {
    if (!statusChangeBracketId) return;
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to change statuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isHRManager) {
      setMessageType("error");
      setMessageText("You do not have permission to approve brackets.");
      setMessageModalOpen(true);
      return;
    }

    const res = await fetch(
      `${API_BASE}/insurance-brackets/${statusChangeBracketId}/status`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = "Failed to update bracket status";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      setMessageType("error");
      setMessageText(errorMessage);
      setMessageModalOpen(true);
      setIsStatusModalOpen(false);
      setStatusChangeBracketId(null);
      return;
    }

    setBrackets(
      brackets.map((b) =>
        b._id === statusChangeBracketId
          ? { ...b, status: newStatus as ConfigStatus }
          : b
      )
    );
    setMessageType("success");
    setMessageText(
      `Insurance bracket status changed to ${newStatus} successfully!`
    );
    setMessageModalOpen(true);
    setIsStatusModalOpen(false);
    setStatusChangeBracketId(null);
  };

  const deleteBracket = async (id: string) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to delete insurance brackets.");
      setMessageModalOpen(true);
      return;
    }
    if (!isHRManager) {
      setMessageType("error");
      setMessageText("Only HR Managers can delete insurance brackets.");
      setMessageModalOpen(true);
      return;
    }

    setConfirmMessage(
      "Are you sure you want to delete this insurance bracket?"
    );
    setConfirmAction(() => async () => {
      const res = await fetch(`${API_BASE}/insurance-brackets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to delete insurance bracket";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        setMessageType("error");
        setMessageText(errorMessage);
        setMessageModalOpen(true);
        setIsConfirmModalOpen(false);
        return;
      }

      setBrackets(brackets.filter((b) => b._id !== id));
      setMessageType("success");
      setMessageText("Insurance bracket deleted successfully!");
      setMessageModalOpen(true);
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  // ----- FILTER -----
  const filteredBrackets = brackets.filter((b) => {
    const matchesSearch = b.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Insurance Brackets
          </h1>
          <p className="text-slate-600">
            Manage employee insurance brackets and rates
          </p>
        </div>
        {isPayrollSpecialist && (
          <button
            onClick={openAddBracketModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Bracket
          </button>
        )}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by bracket name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-lg shadow p-6">
        {filteredBrackets.length === 0 ? (
          <p className="text-gray-500">No insurance brackets found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Salary Range
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Employee %
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Employer %
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBrackets.map((b) => {
                const isDraft = b.status === "draft";
                const isRejected = b.status === "rejected";

                return (
                  <tr
                    key={b._id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {b.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {b.minSalary} - {b.maxSalary}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {b.employeeRate}%
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {b.employerRate}%
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          b.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : b.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleViewBracket(b)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isDraft && (
                        <>
                          {canEditBrackets && (
                            <button
                              onClick={() => startEditBracket(b)}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isHRManager && (
                            <button
                              onClick={() =>
                                handleChangeStatus(b._id, b.status)
                              }
                              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                              title="Change Status"
                            >
                              ✓
                            </button>
                          )}
                          {isHRManager && (
                            <button
                              onClick={() => deleteBracket(b._id)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {isRejected && isHRManager && (
                        <button
                          onClick={() => handleChangeStatus(b._id, b.status)}
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                          title="Change Status"
                        >
                          ✓
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setName("");
          setMinSalary("");
          setMaxSalary("");
          setEmployeeRate("");
          setEmployerRate("");
        }}
        title="Add Insurance Bracket"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Min Salary
              </label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min salary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Salary
              </label>
              <input
                type="number"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Max salary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Employee %
              </label>
              <input
                type="number"
                value={employeeRate}
                onChange={(e) => setEmployeeRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Employee rate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Employer %
              </label>
              <input
                type="number"
                value={employerRate}
                onChange={(e) => setEmployerRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Employer rate"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setName("");
                setMinSalary("");
                setMaxSalary("");
                setEmployeeRate("");
                setEmployerRate("");
              }}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await createBracket();
                setIsAddModalOpen(false);
              }}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Create Bracket
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      {selectedBracket && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Insurance Bracket Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Name</p>
                <p className="font-medium text-slate-900">
                  {selectedBracket.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Salary Range</p>
                <p className="font-medium text-slate-900">
                  {selectedBracket.minSalary} - {selectedBracket.maxSalary}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Employee %</p>
                <p className="font-medium text-slate-900">
                  {selectedBracket.employeeRate}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Employer %</p>
                <p className="font-medium text-slate-900">
                  {selectedBracket.employerRate}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedBracket.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : selectedBracket.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {selectedBracket.status.charAt(0).toUpperCase() +
                    selectedBracket.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Insurance Bracket"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Name
            </label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Min Salary
              </label>
              <input
                type="number"
                value={editMinSalary}
                onChange={(e) => setEditMinSalary(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min salary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Max Salary
              </label>
              <input
                type="number"
                value={editMaxSalary}
                onChange={(e) => setEditMaxSalary(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Max salary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Employee %
              </label>
              <input
                type="number"
                value={editEmployeeRate}
                onChange={(e) => setEditEmployeeRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Employee rate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Employer %
              </label>
              <input
                type="number"
                value={editEmployerRate}
                onChange={(e) => setEditEmployerRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Employer rate"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitEditBracket}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
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
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <p className="text-slate-900">{confirmMessage}</p>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmAction) confirmAction();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
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
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            )}
            <p className="text-slate-900">{messageText}</p>
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setMessageModalOpen(false)}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                messageType === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusChangeBracketId(null);
        }}
        title="Change Insurance Bracket Status"
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
                setStatusChangeBracketId(null);
              }}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitStatusChange}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Status
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
