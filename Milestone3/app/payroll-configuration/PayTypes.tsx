"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  getPayTypes,
  createPayType,
  updatePayType,
  deletePayType,
  updatePayTypeStatus,
} from "@/lib/api";
import type { PayType, CreatePayTypeDto } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";

export function PayTypes() {
  const [payTypes, setPayTypes] = useState<PayType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayType, setSelectedPayType] = useState<PayType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
  const [statusChangePayTypeId, setStatusChangePayTypeId] = useState<
    string | null
  >(null);
  const [newStatus, setNewStatus] = useState<"draft" | "approved" | "rejected">(
    "approved"
  );

  // Role checking
  const [isPayrollManager, setIsPayrollManager] = useState(false);
  const [isPayrollSpecialist, setIsPayrollSpecialist] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const roles = useMemo(() => user?.roles || [], [user]);

  const [formData, setFormData] = useState<CreatePayTypeDto>({
    type: "Hourly",
    amount: 6000,
  });

  useEffect(() => {
    setIsPayrollManager(roles.includes("Payroll Manager"));
    setIsPayrollSpecialist(roles.includes("Payroll Specialist"));
  }, [roles]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      setMessageType("error");
      setMessageText("You must be logged in to manage pay types.");
      setMessageModalOpen(true);
      return;
    }
    loadPayTypes();
  }, [authLoading, user]);

  const loadPayTypes = async () => {
    setIsLoading(true);
    try {
      const data = await getPayTypes();
      setPayTypes(data);
    } catch (error) {
      console.error("Error loading pay types:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayType = () => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to create pay types.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText("Only Payroll Specialists can create pay types.");
      setMessageModalOpen(true);
      return;
    }
    setSelectedPayType(null);
    setFormData({
      type: "Hourly",
      amount: 6000,
    });
    setIsModalOpen(true);
  };

  const handleEditPayType = (payType: PayType) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to edit pay types.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText("Only Payroll Specialists can edit pay types.");
      setMessageModalOpen(true);
      return;
    }
    if (payType.status !== "draft") return;
    setSelectedPayType(payType);
    setFormData({
      type: payType.type,
      amount: payType.amount,
    });
    setIsModalOpen(true);
  };

  const handleViewPayType = (payType: PayType) => {
    setSelectedPayType(payType);
    setIsViewModalOpen(true);
  };

  const handleDeletePayType = async (id: string) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to delete pay types.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("Only Payroll Managers can delete pay types.");
      setMessageModalOpen(true);
      return;
    }
    setConfirmMessage("Are you sure you want to delete this pay type?");
    setConfirmAction(() => async () => {
      const result = await deletePayType(id);
      if (result.success) {
        setPayTypes(payTypes.filter((p) => p._id !== id));
        setMessageType("success");
        setMessageText("Pay type deleted successfully!");
        setMessageModalOpen(true);
      } else {
        setMessageType("error");
        setMessageText(
          `Error: ${result.message || "Failed to delete pay type"}`
        );
        setMessageModalOpen(true);
      }
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  const handleChangeStatus = (payTypeId: string, currentStatus: string) => {
    setStatusChangePayTypeId(payTypeId);
    setNewStatus(currentStatus === "draft" ? "approved" : "rejected");
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatusChange = async () => {
    if (!statusChangePayTypeId) return;

    try {
      const result = await updatePayTypeStatus(
        statusChangePayTypeId,
        newStatus
      );

      if (result.data) {
        setPayTypes(
          payTypes.map((p) =>
            p._id === statusChangePayTypeId
              ? { ...p, status: newStatus as "draft" | "approved" | "rejected" }
              : p
          )
        );
        setMessageType("success");
        setMessageText(`Pay type status changed to ${newStatus} successfully!`);
        setMessageModalOpen(true);
      } else {
        setMessageType("error");
        setMessageText(`Error: ${result.error || "Failed to update status"}`);
        setMessageModalOpen(true);
      }
    } catch (error) {
      console.error("Error changing status:", error);
      setMessageType("error");
      setMessageText("An unexpected error occurred. Please try again.");
      setMessageModalOpen(true);
    } finally {
      setIsStatusModalOpen(false);
      setStatusChangePayTypeId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to modify pay types.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText("Only Payroll Specialists can modify pay types.");
      setMessageModalOpen(true);
      return;
    }
    // Client-side duplicate prevention: check existing pay types by `type`
    const newType = (formData.type || "").trim().toLowerCase();
    if (selectedPayType?._id) {
      if (
        payTypes.some(
          (p) => p._id !== selectedPayType._id && (p.type || "").trim().toLowerCase() === newType
        )
      ) {
        setMessageType("error");
        setMessageText("Pay type already exists (no duplicates allowed)");
        setMessageModalOpen(true);
        return;
      }
    } else {
      if (payTypes.some((p) => (p.type || "").trim().toLowerCase() === newType)) {
        setMessageType("error");
        setMessageText("Pay type already exists (no duplicates allowed)");
        setMessageModalOpen(true);
        return;
      }
    }

    setIsSaving(true);

    try {
      if (selectedPayType?._id) {
        const result = await updatePayType(selectedPayType._id, formData);
        if (result.data) {
          setPayTypes(
            payTypes.map((p) =>
              p._id === selectedPayType._id ? result.data! : p
            )
          );
          setIsModalOpen(false);
          setSelectedPayType(null);
          setMessageType("success");
          setMessageText("Pay type updated successfully!");
          setMessageModalOpen(true);
        } else {
          setMessageType("error");
          setMessageText(
            `Error: ${result.error || "Failed to update pay type"}`
          );
          setMessageModalOpen(true);
        }
      } else {
        const result = await createPayType(formData);
        if (result.data) {
          setPayTypes([...payTypes, result.data]);
          setIsModalOpen(false);
          setMessageType("success");
          setMessageText("Pay type created successfully!");
          setMessageModalOpen(true);
        } else {
          setMessageType("error");
          setMessageText(
            `Error: ${result.error || "Failed to create pay type"}`
          );
          setMessageModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Error saving pay type:", error);
      setMessageType("error");
      setMessageText("An unexpected error occurred. Please try again.");
      setMessageModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPayTypes = payTypes.filter((payType) => {
    const matchesSearch = payType.type
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || payType.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const employmentPayTypes = [
    { value: "Hourly", label: "Hourly" },
    { value: "Daily", label: "Daily" },
    { value: "Weekly", label: "Weekly" },
    { value: "Monthly", label: "Monthly" },
    { value: "Contract-based", label: "Contract-based" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Pay Types</h1>
          <p className="text-slate-600">
            Manage pay types for different salary components.
          </p>
        </div>
        {isPayrollSpecialist && (
          <button
            onClick={handleAddPayType}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Pay Type
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Pay Types Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-slate-600">
            Loading pay types...
          </div>
        ) : filteredPayTypes.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            No pay types found.{" "}
            {payTypes.length === 0 &&
              "Create your first pay type to get started."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Type
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
                {filteredPayTypes.map((payType) => (
                  <tr
                    key={payType._id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {payType.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      ${payType.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(
                          payType.status
                        )}`}
                      >
                        {payType.status.charAt(0).toUpperCase() +
                          payType.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleViewPayType(payType)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {payType.status === "draft" && (
                        <>
                          {isPayrollSpecialist && (
                            <button
                              onClick={() => handleEditPayType(payType)}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isPayrollManager && (
                            <button
                              onClick={() =>
                                handleChangeStatus(payType._id, payType.status)
                              }
                              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                              title="Change Status"
                            >
                              ✓
                            </button>
                          )}
                          {isPayrollManager && (
                            <button
                              onClick={() => handleDeletePayType(payType._id)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {payType.status === "rejected" && isPayrollManager && (
                        <button
                          onClick={() =>
                            handleChangeStatus(payType._id, payType.status)
                          }
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                          title="Change Status"
                        >
                          ✓
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedPayType ? "Edit Pay Type" : "Add Pay Type"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {employmentPayTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount (min 6000) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
                placeholder="6000"
                min="6000"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : selectedPayType ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Modal */}
      {selectedPayType && isViewModalOpen && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Pay Type Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Type</p>
                <p className="font-medium text-slate-900">
                  {selectedPayType.type}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Amount</p>
                <p className="font-medium text-slate-900">
                  ${selectedPayType.amount.toLocaleString()}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(
                  selectedPayType.status
                )}`}
              >
                {selectedPayType.status.charAt(0).toUpperCase() +
                  selectedPayType.status.slice(1)}
              </span>
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
                if (confirmAction) {
                  confirmAction();
                }
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
          setStatusChangePayTypeId(null);
        }}
        title="Change Pay Type Status"
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
                setStatusChangePayTypeId(null);
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
