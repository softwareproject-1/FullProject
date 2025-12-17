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
  getPayrollPolicies,
  createPayrollPolicy,
  updatePayrollPolicy,
  deletePayrollPolicy,
  updatePayrollPolicyStatus,
} from "@/lib/api";
import type { PayrollPolicy, CreatePayrollPolicyDto } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";

export function PayrollPolicies() {
  const [policies, setPolicies] = useState<PayrollPolicy[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PayrollPolicy | null>(
    null
  );
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
  const [statusChangePolicyId, setStatusChangePolicyId] = useState<
    string | null
  >(null);
  const [newStatus, setNewStatus] = useState<"draft" | "approved" | "rejected">(
    "approved"
  );

  // Role checking
  const [isPayrollManager, setIsPayrollManager] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const roles = useMemo(() => user?.roles || [], [user]);

  const [formData, setFormData] = useState<CreatePayrollPolicyDto>({
    policyName: "",
    policyType: "Misconduct",
    description: "",
    effectiveDate: "",
    ruleDefinition: {
      percentage: 0,
      fixedAmount: 0,
      thresholdAmount: 0,
    },
    applicability: "All Employees",
  });

  useEffect(() => {
    setIsPayrollManager(roles.includes("Payroll Manager"));
  }, [roles]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      setMessageType("error");
      setMessageText("You must be logged in to manage payroll policies.");
      setMessageModalOpen(true);
      return;
    }
    loadPolicies();
  }, [authLoading, user]);

  const loadPolicies = async () => {
    setIsLoading(true);
    try {
      const data = await getPayrollPolicies();
      setPolicies(data);
    } catch (error) {
      console.error("Error loading policies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPolicy = () => {
    setSelectedPolicy(null);
    setFormData({
      policyName: "",
      policyType: "Misconduct",
      description: "",
      effectiveDate: "",
      ruleDefinition: {
        percentage: 0,
        fixedAmount: 0,
        thresholdAmount: 0,
      },
      applicability: "All Employees",
    });
    setIsModalOpen(true);
  };

  const handleEditPolicy = (policy: PayrollPolicy) => {
    setSelectedPolicy(policy);
    setFormData({
      policyName: policy.policyName,
      policyType: policy.policyType,
      description: policy.description,
      effectiveDate: policy.effectiveDate,
      ruleDefinition: policy.ruleDefinition,
      applicability: policy.applicability,
    });
    setIsModalOpen(true);
  };

  const handleViewPolicy = (policy: PayrollPolicy) => {
    setSelectedPolicy(policy);
    setIsViewModalOpen(true);
  };

  const handleDeletePolicy = async (id: string) => {
    if (!user) {
      setMessageType("error");
      setMessageText("You must be logged in to delete payroll policies.");
      setMessageModalOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("Only Payroll Managers can delete payroll policies.");
      setMessageModalOpen(true);
      return;
    }
    setConfirmMessage("Are you sure you want to delete this policy?");
    setConfirmAction(() => async () => {
      const result = await deletePayrollPolicy(id);
      if (result.success) {
        setPolicies(policies.filter((p) => p._id !== id));
        setMessageType("success");
        setMessageText("Policy deleted successfully!");
        setMessageModalOpen(true);
      } else {
        setMessageType("error");
        setMessageText(`Error: ${result.message || "Failed to delete policy"}`);
        setMessageModalOpen(true);
      }
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  const handleChangeStatus = (policyId: string, currentStatus: string) => {
    setStatusChangePolicyId(policyId);
    setNewStatus(currentStatus === "draft" ? "approved" : "rejected");
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatusChange = async () => {
    if (!statusChangePolicyId) return;

    try {
      const result = await updatePayrollPolicyStatus(
        statusChangePolicyId,
        newStatus
      );

      if (result.data) {
        setPolicies(
          policies.map((p) =>
            p._id === statusChangePolicyId
              ? { ...p, status: newStatus as "draft" | "approved" | "rejected" }
              : p
          )
        );
        setMessageType("success");
        setMessageText(`Policy status changed to ${newStatus} successfully!`);
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
      setStatusChangePolicyId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (selectedPolicy?._id) {
        const result = await updatePayrollPolicy(selectedPolicy._id, formData);
        if (result.data) {
          setPolicies(
            policies.map((p) =>
              p._id === selectedPolicy._id ? result.data! : p
            )
          );
          setIsModalOpen(false);
          setSelectedPolicy(null);
          setMessageType("success");
          setMessageText("Policy updated successfully!");
          setMessageModalOpen(true);
        } else {
          setMessageType("error");
          setMessageText(`Error: ${result.error || "Failed to update policy"}`);
          setMessageModalOpen(true);
        }
      } else {
        const result = await createPayrollPolicy(formData);
        if (result.data) {
          setPolicies([...policies, result.data]);
          setIsModalOpen(false);
          setMessageType("success");
          setMessageText("Policy created successfully!");
          setMessageModalOpen(true);
        } else {
          setMessageType("error");
          setMessageText(`Error: ${result.error || "Failed to create policy"}`);
          setMessageModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Error saving policy:", error);
      setMessageType("error");
      setMessageText("An unexpected error occurred. Please try again.");
      setMessageModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // const filteredPolicies = policies.filter((policy) => {
  //   const matchesSearch = policy.policyName
  //     .toLowerCase()
  //     .includes(searchTerm.toLowerCase());
  //   const matchesType =
  //     filterType === "all" || policy.policyType === filterType;
  //   const matchesStatus =
  //     filterStatus === "all" || policy.status === filterStatus;
  //   return matchesSearch && matchesType && matchesStatus;
  // });
const filteredPolicies = policies.filter((policy) => {
  const policyName = policy.policyName ?? "";

  const matchesSearch = policyName
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  const matchesType =
    filterType === "all" || policy.policyType === filterType;

  const matchesStatus =
    filterStatus === "all" || policy.status === filterStatus;

  return matchesSearch && matchesType && matchesStatus;
});

  const policyTypes = [
    { value: "Misconduct", label: "Misconduct" },
    { value: "Deduction", label: "Deduction" },
    { value: "Allowance", label: "Allowance" },
    { value: "Benefit", label: "Benefit" },
    { value: "Leave", label: "Leave" },
  ];

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
            Payroll Policies
          </h1>
          <p className="text-slate-600">
            Manage misconduct penalties and other payroll policies.
          </p>
        </div>
        <button
          onClick={handleAddPolicy}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Policy
        </button>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by policy name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">All Types</option>
            {policyTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
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

      {/* Policies Table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-slate-600">
            Loading policies...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            No policies found.{" "}
            {policies.length === 0 &&
              "Create your first policy to get started."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Policy Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Effective Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((policy) => (
                  <tr
                    key={policy._id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {policy.policyName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {
                        policyTypes.find((t) => t.value === policy.policyType)
                          ?.label
                      }
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(policy.status)}`}
                      >
                        {policy.status.charAt(0).toUpperCase() +
                          policy.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(policy.effectiveDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleViewPolicy(policy)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {policy.status === "draft" && (
                        <>
                          <button
                            onClick={() => handleEditPolicy(policy)}
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isPayrollManager && (
                            <button
                              onClick={() =>
                                handleChangeStatus(policy._id, policy.status)
                              }
                              className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                              title="Change Status"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePolicy(policy._id)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {policy.status === "rejected" && isPayrollManager && (
                        <button
                          onClick={() =>
                            handleChangeStatus(policy._id, policy.status)
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
        title={selectedPolicy ? "Edit Policy" : "Add New Policy"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Policy Name
            </label>
            <input
              type="text"
              value={formData.policyName}
              onChange={(e) =>
                setFormData({ ...formData, policyName: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Policy Type
            </label>
            <select
              value={formData.policyType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  policyType: e.target
                    .value as CreatePayrollPolicyDto["policyType"],
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {policyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) =>
                  setFormData({ ...formData, effectiveDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Applicability
              </label>
              <select
                value={formData.applicability}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    applicability: e.target
                      .value as CreatePayrollPolicyDto["applicability"],
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Employees">All Employees</option>
                <option value="Full Time Employees">Full Time Employees</option>
                <option value="Part Time Employees">Part Time Employees</option>
                <option value="Contractors">Contractors</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium text-slate-900">Rule Definition</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Percentage (%)
              </label>
              <input
                type="number"
                value={formData.ruleDefinition.percentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ruleDefinition: {
                      ...formData.ruleDefinition,
                      percentage: parseFloat(e.target.value),
                    },
                  })
                }
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fixed Amount
              </label>
              <input
                type="number"
                value={formData.ruleDefinition.fixedAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ruleDefinition: {
                      ...formData.ruleDefinition,
                      fixedAmount: parseFloat(e.target.value),
                    },
                  })
                }
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Threshold Amount
              </label>
              <input
                type="number"
                value={formData.ruleDefinition.thresholdAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ruleDefinition: {
                      ...formData.ruleDefinition,
                      thresholdAmount: parseFloat(e.target.value),
                    },
                  })
                }
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isSaving
                ? "Saving..."
                : selectedPolicy
                  ? "Update Policy"
                  : "Create Policy"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {selectedPolicy && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Policy Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Policy Name</p>
                <p className="font-medium text-slate-900">
                  {selectedPolicy.policyName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Policy Type</p>
                <p className="font-medium text-slate-900">
                  {
                    policyTypes.find(
                      (t) => t.value === selectedPolicy.policyType
                    )?.label
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(
                    selectedPolicy.status
                  )}`}
                >
                  {selectedPolicy.status.charAt(0).toUpperCase() +
                    selectedPolicy.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-600">Applicability</p>
                <p className="font-medium text-slate-900">
                  {selectedPolicy.applicability.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Effective Date</p>
                <p className="font-medium text-slate-900">
                  {new Date(selectedPolicy.effectiveDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-600">Description</p>
              <p className="text-slate-900">{selectedPolicy.description}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-3">
                Rule Definition
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-600">Percentage</p>
                  <p className="font-medium text-slate-900">
                    {selectedPolicy.ruleDefinition.percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Fixed Amount</p>
                  <p className="font-medium text-slate-900">
                    ${selectedPolicy.ruleDefinition.fixedAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Threshold</p>
                  <p className="font-medium text-slate-900">
                    ${selectedPolicy.ruleDefinition.thresholdAmount.toFixed(2)}
                  </p>
                </div>
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
          setStatusChangePolicyId(null);
        }}
        title="Change Policy Status"
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
                setStatusChangePolicyId(null);
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
