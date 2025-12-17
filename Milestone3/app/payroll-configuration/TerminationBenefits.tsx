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
  getTerminationBenefits,
  createTerminationBenefit,
  updateTerminationBenefit,
  deleteTerminationBenefit,
  updateTerminationBenefitStatus,
} from "@/lib/api";
import type {
  TerminationBenefit,
  CreateTerminationBenefitDto,
} from "@/lib/types";
import { Modal } from "@/components/Modal";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";

export function TerminationBenefits() {
  const [benefits, setBenefits] = useState<TerminationBenefit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] =
    useState<TerminationBenefit | null>(null);
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
  const [statusChangeBenefitId, setStatusChangeBenefitId] = useState<
    string | null
  >(null);
  const [newStatus, setNewStatus] = useState<"draft" | "approved" | "rejected">(
    "approved"
  );

  const { user, loading: authLoading } = useAuth();
  const roles = useMemo(() => user?.roles || [], [user]);
  const isPayrollManager = roles.includes("Payroll Manager");
  const isPayrollSpecialist = roles.includes("Payroll Specialist");

  const [formData, setFormData] = useState<CreateTerminationBenefitDto>({
    name: "",
    amount: 0,
    terms: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      setMessageType("error");
      setMessageText("You must be logged in to manage termination benefits.");
      setMessageModalOpen(true);
      return;
    }
    loadBenefits();
  }, [authLoading, user]);

  const loadBenefits = async () => {
    setIsLoading(true);
    try {
      const data = await getTerminationBenefits();
      setBenefits(data);
    } catch (error) {
      console.error("Error loading termination benefits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBenefit = () => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to create termination benefits.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText(
        "Only Payroll Specialists can create termination benefits."
      );
      setMessageModalOpen(true);
      return;
    }
    setSelectedBenefit(null);
    setFormData({
      name: "",
      amount: 0,
      terms: "",
    });
    setIsModalOpen(true);
  };

  const handleEditBenefit = (benefit: TerminationBenefit) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to edit termination benefits.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText("Only Payroll Specialists can edit termination benefits.");
      setMessageModalOpen(true);
      return;
    }
    if (benefit.status !== "draft") return;
    setSelectedBenefit(benefit);
    setFormData({
      name: benefit.name,
      amount: benefit.amount,
      terms: benefit.terms,
    });
    setIsModalOpen(true);
  };

  const handleViewBenefit = (benefit: TerminationBenefit) => {
    setSelectedBenefit(benefit);
    setIsViewModalOpen(true);
  };

  const handleDeleteBenefit = (benefit: TerminationBenefit) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to delete termination benefits.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("Only Payroll Managers can delete termination benefits.");
      setMessageModalOpen(true);
      return;
    }
    setConfirmMessage(
      `Are you sure you want to delete "${benefit.name}"? This action cannot be undone.`
    );
    setConfirmAction(() => async () => {
      try {
        const result = await deleteTerminationBenefit(benefit._id);
        if (result.success) {
          setBenefits(benefits.filter((b) => b._id !== benefit._id));
          setMessageType("success");
          setMessageText("Termination benefit deleted successfully!");
        } else {
          setMessageType("error");
          setMessageText(
            result.error || "Failed to delete termination benefit"
          );
        }
      } catch (error) {
        setMessageType("error");
        setMessageText("An error occurred while deleting the benefit");
      } finally {
        setIsConfirmModalOpen(false);
        setMessageModalOpen(true);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleChangeStatus = (benefitId: string, currentStatus: string) => {
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
    setStatusChangeBenefitId(benefitId);
    setNewStatus(currentStatus === "draft" ? "approved" : "draft");
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatusChange = async () => {
    if (!statusChangeBenefitId) return;
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

    try {
      const result = await updateTerminationBenefitStatus(
        statusChangeBenefitId,
        newStatus
      );
      if (result.data) {
        setBenefits(
          benefits.map((b) =>
            b._id === statusChangeBenefitId ? result.data! : b
          )
        );
        setMessageType("success");
        setMessageText("Status updated successfully!");
      } else {
        setMessageType("error");
        setMessageText(result.error || "Failed to update status");
      }
    } catch (error) {
      setMessageType("error");
      setMessageText("An error occurred while updating the status");
    } finally {
      setIsStatusModalOpen(false);
      setStatusChangeBenefitId(null);
      setMessageModalOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to manage termination benefits.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText(
        "You do not have permission to modify termination benefits."
      );
      setMessageModalOpen(true);
      return;
    }
    setIsSaving(true);

    try {
      if (selectedBenefit) {
        const result = await updateTerminationBenefit(
          selectedBenefit._id,
          formData
        );
        if (result.data) {
          setBenefits(
            benefits.map((b) =>
              b._id === selectedBenefit._id ? result.data! : b
            )
          );
          setIsModalOpen(false);
          setSelectedBenefit(null);
          setMessageType("success");
          setMessageText("Termination benefit updated successfully!");
          setMessageModalOpen(true);
        } else {
          setMessageType("error");
          setMessageText(
            `Error: ${result.error || "Failed to update termination benefit"}`
          );
          setMessageModalOpen(true);
        }
      } else {
        const result = await createTerminationBenefit(formData);
        if (result.data) {
          setBenefits([...benefits, result.data]);
          setIsModalOpen(false);
          setMessageType("success");
          setMessageText("Termination benefit created successfully!");
          setMessageModalOpen(true);
        } else {
          setMessageType("error");
          setMessageText(
            `Error: ${result.error || "Failed to create termination benefit"}`
          );
          setMessageModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Error saving termination benefit:", error);
      setMessageType("error");
      setMessageText("An unexpected error occurred. Please try again.");
      setMessageModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBenefits = benefits.filter((benefit) => {
    const matchesSearch = benefit.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || benefit.status === filterStatus;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Termination & Resignation Benefits
          </h1>
          <p className="text-slate-600">
            Manage termination and resignation compensation and benefits terms.
          </p>
        </div>
        {isPayrollSpecialist && (
          <button
            onClick={handleAddBenefit}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Benefit
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
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

      {/* Benefits Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-slate-600">
            Loading termination benefits...
          </div>
        ) : filteredBenefits.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            No termination benefits found.{" "}
            {benefits.length === 0 &&
              "Create your first benefit to get started."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Name
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
                {filteredBenefits.map((benefit) => (
                  <tr
                    key={benefit._id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {benefit.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      ${benefit.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(
                          benefit.status
                        )}`}
                      >
                        {benefit.status.charAt(0).toUpperCase() +
                          benefit.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleViewBenefit(benefit)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {benefit.status === "draft" && (
                        <>
                          {isPayrollSpecialist && (
                            <button
                              onClick={() => handleEditBenefit(benefit)}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isPayrollManager && (
                            <button
                              onClick={() => handleDeleteBenefit(benefit)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {isPayrollManager && benefit.status !== "approved" && (
                        <button
                          onClick={() =>
                            handleChangeStatus(benefit._id, benefit.status)
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          selectedBenefit
            ? "Edit Termination Benefit"
            : "Add Termination Benefit"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Benefit Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., End of Service Gratuity"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: Number(e.target.value) })
              }
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Terms & Conditions
            </label>
            <textarea
              value={formData.terms || ""}
              onChange={(e) =>
                setFormData({ ...formData, terms: e.target.value })
              }
              placeholder="Enter terms and conditions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
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
              {isSaving ? "Saving..." : selectedBenefit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {selectedBenefit && isViewModalOpen && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Termination Benefit Details"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Name</p>
              <p className="font-medium text-slate-900">
                {selectedBenefit.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600">Amount</p>
              <p className="font-medium text-slate-900">
                ${selectedBenefit.amount.toLocaleString()}
              </p>
            </div>

            {selectedBenefit.terms && (
              <div>
                <p className="text-sm text-slate-600">Terms & Conditions</p>
                <p className="text-slate-900">{selectedBenefit.terms}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-slate-600">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(
                  selectedBenefit.status
                )}`}
              >
                {selectedBenefit.status.charAt(0).toUpperCase() +
                  selectedBenefit.status.slice(1)}
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
          setStatusChangeBenefitId(null);
        }}
        title="Change Benefit Status"
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
                setStatusChangeBenefitId(null);
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
