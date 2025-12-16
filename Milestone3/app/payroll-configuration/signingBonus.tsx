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
import { SigningBonus } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function SigningBonuses() {
  const [bonuses, setBonuses] = useState<SigningBonus[]>([]);
  const [positionName, setPositionName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Confirmation Modal States
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  // Message Modal States
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [messageText, setMessageText] = useState("");

  // Status Change Modal States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusChangeBonusId, setStatusChangeBonusId] = useState<string | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<"draft" | "approved" | "rejected">(
    "approved"
  );

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBonusId, setEditBonusId] = useState<string | null>(null);
  const [editPositionName, setEditPositionName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<SigningBonus | null>(null);

  // Add Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const roles = useMemo(() => user?.roles || [], [user]);
  const isPayrollManager = roles.includes("Payroll Manager");
  const isPayrollSpecialist = roles.includes("Payroll Specialist");

  const extractMessage = (err: any) => {
    if (typeof err?.message === "string") {
      try {
        const parsed = JSON.parse(err.message);
        return parsed?.message || err.message;
      } catch (e) {
        return err.message;
      }
    }
    return "An error occurred";
  };

  // ----- FETCH ALL SIGNING BONUSES -----
  const fetchBonuses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/signing-bonuses`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBonuses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch signing bonuses");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("You must be logged in to manage signing bonuses.");
      setBonuses([]);
      return;
    }
    setError(null);
    fetchBonuses();
  }, [authLoading, user, fetchBonuses]);

  // ----- CREATE SIGNING BONUS -----
  const createBonus = async () => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to create signing bonuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText("You do not have permission to create signing bonuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!positionName.trim() || !amount.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/signing-bonuses`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positionName: positionName.trim(),
          amount: Number(amount),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setPositionName("");
      setAmount("");
      fetchBonuses();
      setMessageType("success");
      setMessageText("Signing bonus created successfully!");
      setMessageModalOpen(true);
    } catch (err: any) {
      console.error(err);
      setMessageType("error");
      setMessageText(extractMessage(err) || "Failed to create signing bonus");
      setMessageModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // ----- UPDATE SIGNING BONUS -----
  const handleViewBonus = (bonus: SigningBonus) => {
    setSelectedBonus(bonus);
    setIsViewModalOpen(true);
  };

  const startEditBonus = (bonus: SigningBonus) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to edit signing bonuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText("You do not have permission to edit signing bonuses.");
      setMessageModalOpen(true);
      return;
    }
    if (bonus.status !== "draft") return;
    setEditBonusId(bonus._id || null);
    setEditPositionName(bonus.positionName || "");
    setEditAmount(String(bonus.amount ?? ""));
    setIsEditModalOpen(true);
  };

  const handleSubmitEditBonus = async () => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to edit signing bonuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText("You do not have permission to edit signing bonuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!editBonusId || !editPositionName.trim() || !editAmount.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/signing-bonuses/${editBonusId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positionName: editPositionName.trim(),
          amount: Number(editAmount),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setBonuses(
        bonuses.map((b) =>
          b._id === editBonusId
            ? {
                ...b,
                positionName: editPositionName.trim(),
                amount: Number(editAmount),
              }
            : b
        )
      );
      setMessageType("success");
      setMessageText("Signing bonus updated successfully!");
      setMessageModalOpen(true);
      setIsEditModalOpen(false);
      setEditBonusId(null);
    } catch (err: any) {
      console.error(err);
      setMessageType("error");
      setMessageText(extractMessage(err) || "Failed to update signing bonus");
      setMessageModalOpen(true);
    }
  };

  // ----- HANDLE STATUS CHANGE -----
  const handleChangeStatus = (bonusId: string, currentStatus: string) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to change statuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("You do not have permission to change this status.");
      setMessageModalOpen(true);
      return;
    }
    setStatusChangeBonusId(bonusId);
    setNewStatus(currentStatus === "draft" ? "approved" : "rejected");
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatusChange = async () => {
    if (!statusChangeBonusId) return;
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to change statuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("You do not have permission to change this status.");
      setMessageModalOpen(true);
      return;
    }

    const res = await fetch(
      `${API_BASE}/signing-bonuses/${statusChangeBonusId}/status`,
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
      let errorMessage = "Failed to update signing bonus status";
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
      setStatusChangeBonusId(null);
      return;
    }

    setBonuses(
      bonuses.map((b) =>
        b._id === statusChangeBonusId
          ? { ...b, status: newStatus as "draft" | "approved" | "rejected" }
          : b
      )
    );
    setMessageType("success");
    setMessageText(
      `Signing bonus status changed to ${newStatus} successfully!`
    );
    setMessageModalOpen(true);
    setIsStatusModalOpen(false);
    setStatusChangeBonusId(null);
  };

  // ----- DELETE BONUS -----
  const handleDeleteBonus = async (id: string) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to delete signing bonuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("Only Payroll Managers can delete signing bonuses.");
      setMessageModalOpen(true);
      return;
    }

    setConfirmMessage("Are you sure you want to delete this signing bonus?");
    setConfirmAction(() => async () => {
      const res = await fetch(`${API_BASE}/signing-bonuses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to delete signing bonus";
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

      setBonuses(bonuses.filter((b) => b._id !== id));
      setMessageType("success");
      setMessageText("Signing bonus deleted successfully!");
      setMessageModalOpen(true);
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  // ----- FILTER -----
  const filteredBonuses = bonuses.filter((b) => {
    const matchesSearch = b.positionName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ----- RENDER -----
  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Signing Bonuses
          </h1>
          <p className="text-slate-600">
            Manage signing bonuses for different positions
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Bonus
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by position name..."
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

      {/* LIST OF BONUSES */}
      <div className="bg-white rounded-lg shadow p-6">
        {filteredBonuses.length === 0 ? (
          <p className="text-gray-500">No signing bonuses found.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Amount
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
              {filteredBonuses.map((b) => {
                const id = b._id;
                if (!id) return null;

                const isDraft = b.status === "draft";
                const isRejected = b.status === "rejected";

                return (
                  <tr
                    key={id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {b.positionName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {b.amount}
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
                        onClick={() => handleViewBonus(b)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isDraft && (
                        <>
                          <button
                            onClick={() => startEditBonus(b)}
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isPayrollManager && (
                            <button
                              onClick={() => handleChangeStatus(id, b.status)}
                              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                              title="Change Status"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBonus(id)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {isRejected && isPayrollManager && (
                        <button
                          onClick={() => handleChangeStatus(id, b.status)}
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
          setPositionName("");
          setAmount("");
        }}
        title="Add Signing Bonus"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Position Name
            </label>
            <input
              value={positionName}
              onChange={(e) => setPositionName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Position name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Amount"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setPositionName("");
                setAmount("");
              }}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await createBonus();
                setIsAddModalOpen(false);
              }}
              disabled={loading || !positionName || !amount}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Create Bonus
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      {selectedBonus && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Signing Bonus Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Position</p>
                <p className="font-medium text-slate-900">
                  {selectedBonus.positionName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Amount</p>
                <p className="font-medium text-slate-900">
                  ${selectedBonus.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedBonus.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : selectedBonus.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {selectedBonus.status.charAt(0).toUpperCase() +
                    selectedBonus.status.slice(1)}
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
        title="Edit Signing Bonus"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Position Name
            </label>
            <input
              value={editPositionName}
              onChange={(e) => setEditPositionName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Position name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Amount"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitEditBonus}
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
          setStatusChangeBonusId(null);
        }}
        title="Change Signing Bonus Status"
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
                setStatusChangeBonusId(null);
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
