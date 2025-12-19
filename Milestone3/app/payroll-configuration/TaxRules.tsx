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
  getTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
  updateTaxRuleStatus,
} from "@/lib/api";
import type { TaxRule, CreateTaxRuleDto } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";

export function TaxRules() {
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTaxRule, setSelectedTaxRule] = useState<TaxRule | null>(null);
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
  const [statusChangeTaxRuleId, setStatusChangeTaxRuleId] = useState<
    string | null
  >(null);
  const [newStatus, setNewStatus] = useState<"draft" | "approved" | "rejected">(
    "approved"
  );

  const { user, loading: authLoading } = useAuth();
  const roles = useMemo(() => user?.roles || [], [user]);
  const isPayrollManager = roles.includes("Payroll Manager");
  const isLegalPolicyAdmin = roles.includes("Legal & Policy Admin");

  const [formData, setFormData] = useState<Partial<CreateTaxRuleDto>>({
    name: "",
    description: "",
    rate: 0,
  });

  const rateFieldLabel = "Rate (%) *";

  const formatCurrency = (value?: number) =>
    typeof value === "number" ? `$${value.toLocaleString()}` : "N/A";
  const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString() : "N/A";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      setMessageType("error");
      setMessageText("You must be logged in to manage tax rules.");
      setMessageModalOpen(true);
      return;
    }
    loadTaxRules();
  }, [authLoading, user]);

  const loadTaxRules = async () => {
    setIsLoading(true);
    try {
      const data = await getTaxRules();
      setTaxRules(data);
    } catch (error) {
      console.error("Error loading tax rules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTaxRule = () => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to manage tax rules.");
      setMessageModalOpen(true);
      return;
    }
    if (!isLegalPolicyAdmin) {
      setMessageType("error");
      setMessageText("Only Legal & Policy Admin can create tax rules.");
      setMessageModalOpen(true);
      return;
    }
    setSelectedTaxRule(null);
    setFormData({ name: "", description: "", rate: 0 });
    setIsModalOpen(true);
  };

  const handleEditTaxRule = (taxRule: TaxRule) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to manage tax rules.");
      setMessageModalOpen(true);
      return;
    }
    if (!isLegalPolicyAdmin) {
      setMessageType("error");
      setMessageText("Only Legal & Policy Admin can edit tax rules.");
      setMessageModalOpen(true);
      return;
    }
    setSelectedTaxRule(taxRule);
    setFormData({ name: taxRule.name, description: taxRule.description, rate: taxRule.rate });
    setIsModalOpen(true);
  };

  const handleViewTaxRule = (taxRule: TaxRule) => {
    setSelectedTaxRule(taxRule);
    setIsViewModalOpen(true);
  };

  const handleDeleteTaxRule = async (id: string) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to delete tax rules.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("Only Payroll Managers can delete tax rules.");
      setMessageModalOpen(true);
      return;
    }
    setConfirmMessage("Are you sure you want to delete this tax rule?");
    setConfirmAction(() => async () => {
      const result = await deleteTaxRule(id);
      if (result.success) {
        setTaxRules(taxRules.filter((p) => p._id !== id));
        setMessageType("success");
        setMessageText("Tax rule deleted successfully!");
        setMessageModalOpen(true);
      } else {
        setMessageType("error");
        setMessageText(
          `Error: ${result.message || "Failed to delete tax rule"}`
        );
        setMessageModalOpen(true);
      }
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  const handleChangeStatus = (taxRuleId: string, currentStatus: string) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to change statuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("You do not have permission to approve tax rules.");
      setMessageModalOpen(true);
      return;
    }
    setStatusChangeTaxRuleId(taxRuleId);
    setNewStatus(currentStatus === "draft" ? "approved" : "rejected");
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatusChange = async () => {
    if (!statusChangeTaxRuleId) return;
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to change statuses.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("You do not have permission to approve tax rules.");
      setMessageModalOpen(true);
      return;
    }

    try {
      const result = await updateTaxRuleStatus(
        statusChangeTaxRuleId,
        newStatus
      );

      if (result.data) {
        setTaxRules(
          taxRules.map((p) =>
            p._id === statusChangeTaxRuleId
              ? { ...p, status: newStatus as "draft" | "approved" | "rejected" }
              : p
          )
        );
        setMessageType("success");
        setMessageText(`Tax rule status changed to ${newStatus} successfully!`);
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
      setStatusChangeTaxRuleId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to manage tax rules.");
      setMessageModalOpen(true);
      return;
    }
    if (!isLegalPolicyAdmin) {
      setMessageType("error");
      setMessageText("Only Legal & Policy Admin can modify tax rules.");
      setMessageModalOpen(true);
      return;
    }

    if ((formData.rate ?? 0) < 0) {
      setMessageType("error");
      setMessageText("Rate must be greater than or equal to 0.");
      setMessageModalOpen(true);
      return;
    }

    // no brackets validation: backend schema doesn't support brackets

    setIsSaving(true);

    try {
      if (selectedTaxRule?._id) {
        const payload: any = {
          name: formData.name,
          description: formData.description,
          rate: formData.rate,
        };
        const result = await updateTaxRule(selectedTaxRule._id, payload);
        if (result.data) {
          setTaxRules(
            taxRules.map((p) =>
              p._id === selectedTaxRule._id ? result.data! : p
            )
          );
          setIsModalOpen(false);
          setSelectedTaxRule(null);
          setMessageType("success");
          setMessageText("Tax rule updated successfully!");
          setMessageModalOpen(true);
        } else {
          setMessageType("error");
          setMessageText(
            `Error: ${result.error || "Failed to update tax rule"}`
          );
          setMessageModalOpen(true);
        }
      } else {
        const payload: any = {
          name: formData.name,
          description: formData.description,
          rate: formData.rate,
        };
        const result = await createTaxRule(payload);
        if (result.data) {
          setTaxRules([...taxRules, result.data]);
          setIsModalOpen(false);
          setMessageType("success");
          setMessageText("Tax rule created successfully!");
          setMessageModalOpen(true);
        } else {
          setMessageType("error");
          setMessageText(
            `Error: ${result.error || "Failed to create tax rule"}`
          );
          setMessageModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Error saving tax rule:", error);
      setMessageType("error");
      setMessageText("An unexpected error occurred. Please try again.");
      setMessageModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTaxRules = taxRules.filter((taxRule) => {
    const matchesSearch = taxRule.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || taxRule.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  //   const filteredTaxRules = taxRules.filter((taxRule) => {
  //   const name = taxRule.name ?? "";

  //   const matchesSearch = name
  //     .toLowerCase()
  //     .includes(searchTerm.toLowerCase());

  //   const matchesStatus =
  //     filterStatus === "all" || taxRule.status === filterStatus;

  //   return matchesSearch && matchesStatus;
  // });

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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Tax Rules</h1>
          <p className="text-slate-600">
            Manage tax calculation rules and rates.
          </p>
        </div>
        {isLegalPolicyAdmin && (
          <button
            onClick={handleAddTaxRule}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Tax Rule
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

      {/* Tax Rules Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-slate-600">
            Loading tax rules...
          </div>
        ) : filteredTaxRules.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            No tax rules found.{" "}
            {taxRules.length === 0 &&
              "Create your first tax rule to get started."}
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
                    Rate
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
                {filteredTaxRules.map((taxRule) => (
                  <tr
                    key={taxRule._id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {taxRule.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {taxRule.rate}%
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(
                          taxRule.status
                        )}`}
                      >
                        {taxRule.status.charAt(0).toUpperCase() +
                          taxRule.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleViewTaxRule(taxRule)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {taxRule.status === "draft" && (
                        <>
                          {isLegalPolicyAdmin && (
                            <button
                              onClick={() => handleEditTaxRule(taxRule)}
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isPayrollManager && (
                            <button
                              onClick={() =>
                                handleChangeStatus(taxRule._id, taxRule.status)
                              }
                              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                              title="Change Status"
                            >
                              ✓
                            </button>
                          )}
                          {isPayrollManager && (
                            <button
                              onClick={() => handleDeleteTaxRule(taxRule._id)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      {taxRule.status === "rejected" && isPayrollManager && (
                        <button
                          onClick={() =>
                            handleChangeStatus(taxRule._id, taxRule.status)
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
          title={selectedTaxRule ? "Edit Tax Rule" : "Add Tax Rule"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Federal Income Tax"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter description"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* taxType removed - backend now uses simplified DTO */}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {rateFieldLabel}
              </label>
              <input
                type="number"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: Number(e.target.value) })
                }
                placeholder="0"
                step="0.01"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* exemption field removed - not part of current DTO */}

            {/* Brackets removed to match backend schema (no brackets field) */}

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
                {isSaving ? "Saving..." : selectedTaxRule ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Modal */}
      {selectedTaxRule && isViewModalOpen && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Tax Rule Details"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Name</p>
              <p className="font-medium text-slate-900">
                {selectedTaxRule.name}
              </p>
            </div>
            {selectedTaxRule.description && (
              <div>
                <p className="text-sm text-slate-600">Description</p>
                <p className="text-slate-900">{selectedTaxRule.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-600">Rate</p>
              <p className="font-medium text-slate-900">{selectedTaxRule.rate}%</p>
            </div>
            {/* Brackets view removed to match backend schema (no brackets field) */}
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(
                  selectedTaxRule.status
                )}`}
              >
                {selectedTaxRule.status.charAt(0).toUpperCase() +
                  selectedTaxRule.status.slice(1)}
              </span>
            </div>

            {/* Created/Approved metadata removed from details per request */}

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
          setStatusChangeTaxRuleId(null);
        }}
        title="Change Tax Rule Status"
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
                setStatusChangeTaxRuleId(null);
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
