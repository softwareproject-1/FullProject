// "use client";

// import { useEffect, useState } from "react";

// interface Allowance {
//   _id: string;
//   name: string;
//   amount: number;
//   status: "Draft" | "Approved"; // Added status field
// }

// const API_BASE = "http://localhost:3001";
// const JWT_TOKEN = process.env.NEXT_PUBLIC_PAYROLL_SPECIALIST_TOKEN;

// export default function Allowances() {
//   const [allowances, setAllowances] = useState<Allowance[]>([]);
//   const [name, setName] = useState("");
//   const [amount, setAmount] = useState(""); // string to safely handle input
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchAllowances = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/allowances`);
//       const data = await res.json();
//       setAllowances(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Failed to fetch allowances", err);
//       setError("Failed to fetch allowances");
//     }
//   };

//   useEffect(() => {
//     fetchAllowances();
//   }, []);

//   const createAllowance = async () => {
//     if (!name.trim() || !amount.trim()) return;

//     setLoading(true);
//     setError(null);
//     try {
//       const res = await fetch(`${API_BASE}/allowances`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: name.trim(),
//           amount: Number(amount),
//           status: "Draft", // Always Draft on creation
//         }),
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         console.error("Failed to create allowance:", text);
//         setError("Failed to create allowance");
//         return;
//       }

//       setName("");
//       setAmount("");
//       fetchAllowances();
//     } catch (err) {
//       console.error("Failed to create allowance", err);
//       setError("Failed to create allowance");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateAllowance = async (id: string, status: string) => {
//     if (status !== "Draft") return; // Only allow editing if draft
//     const newAmount = prompt("Enter new amount:");
//     if (!newAmount) return;

//     try {
//       const res = await fetch(`${API_BASE}/allowances/${id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ amount: Number(newAmount) }),
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         console.error("Failed to update allowance:", text);
//         setError("Failed to update allowance");
//         return;
//       }

//       fetchAllowances();
//     } catch (err) {
//       console.error("Failed to update allowance", err);
//       setError("Failed to update allowance");
//     }
//   };

//   const deleteAllowance = async (id: string) => {
//     if (!confirm("Delete this allowance?")) return;

//     try {
//       const res = await fetch(`${API_BASE}/allowances/${id}`, {
//         method: "DELETE",
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         console.error("Failed to delete allowance:", text);
//         setError("Failed to delete allowance");
//         return;
//       }

//       fetchAllowances();
//     } catch (err) {
//       console.error("Failed to delete allowance", err);
//       setError("Failed to delete allowance");
//     }
//   };

//   return (
//     <div>
//       <h1 className="text-3xl font-bold text-slate-900 mb-2">Allowances</h1>
//       <p className="text-slate-600 mb-6">
//         Manage employee allowances and benefits.
//       </p>

//       {error && <p className="text-red-600 mb-4">{error}</p>}

//       {/* Add Allowance */}
//       <div className="bg-white rounded-lg shadow p-6 mb-6">
//         <h2 className="text-lg font-semibold mb-4">Add Allowance</h2>

//         <div className="flex gap-4">
//           <input
//             className="border rounded px-3 py-2 w-1/2"
//             placeholder="Allowance name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//           />

//           <input
//             className="border rounded px-3 py-2 w-1/4"
//             type="number"
//             placeholder="Amount"
//             value={amount}
//             onChange={(e) => setAmount(e.target.value)}
//           />

//           <button
//             onClick={createAllowance}
//             disabled={loading || !name.trim() || !amount.trim()}
//             className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
//           >
//             Add
//           </button>
//         </div>
//       </div>

//       {/* List */}
//       <div className="bg-white rounded-lg shadow p-6">
//         {allowances.length === 0 ? (
//           <p className="text-gray-500">No allowances found.</p>
//         ) : (
//           <table className="w-full border-collapse">
//             <thead>
//               <tr className="border-b">
//                 <th className="py-2 text-left">Name</th>
//                 <th className="py-2 text-left">Amount</th>
//                 <th className="py-2 text-left">Status</th>
//                 <th className="py-2 text-left">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Array.isArray(allowances) &&
//                 allowances.map((a) => (
//                   <tr key={a._id} className="border-b">
//                     <td className="py-2">{a.name}</td>
//                     <td className="py-2">{a.amount}</td>
//                     <td className="py-2">{a.status}</td>
//                     <td className="py-2 space-x-3">
//                       <button
//                         onClick={() => updateAllowance(a._id, a.status)}
//                         disabled={a.status !== "Draft"}
//                         className={`${
//                           a.status === "Draft"
//                             ? "text-blue-600 hover:underline"
//                             : "text-gray-400 cursor-not-allowed"
//                         }`}
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => deleteAllowance(a._id)}
//                         className="text-red-600 hover:underline"
//                       >
//                         Delete
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }
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
import { Allowance } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type AllowanceStatus = Allowance["status"];

const normalizeStatus = (status?: string | null): AllowanceStatus => {
  const normalized = (status || "draft").toLowerCase();
  if (normalized === "approved" || normalized === "rejected") {
    return normalized as AllowanceStatus;
  }
  return "draft";
};

const statusBadgeColor = (status: AllowanceStatus) => {
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

const formatStatus = (status: AllowanceStatus) =>
  status.charAt(0).toUpperCase() + status.slice(1);

export default function Allowances() {
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [name, setName] = useState("");
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
  const [statusChangeAllowanceId, setStatusChangeAllowanceId] = useState<
    string | null
  >(null);
  const [newStatus, setNewStatus] = useState<"draft" | "approved" | "rejected">(
    "approved"
  );

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAllowanceId, setEditAllowanceId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");

  // View Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAllowance, setSelectedAllowance] = useState<Allowance | null>(
    null
  );

  // Add Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const roles = useMemo(() => user?.roles || [], [user]);
  const isPayrollManager = roles.includes("Payroll Manager");
  const isPayrollSpecialist = roles.includes("Payroll Specialist");
  const selectedAllowanceStatus = normalizeStatus(selectedAllowance?.status);

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

  // ----- FETCH ALL ALLOWANCES -----
  const fetchAllowances = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/allowances`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAllowances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch allowances");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("You must be logged in to manage allowances");
      return;
    }
    fetchAllowances();
  }, [authLoading, user, fetchAllowances]);

  // ----- CREATE ALLOWANCE (Specialist) -----
  const createAllowance = async () => {
    if (!name.trim() || !amount.trim()) return;
    setLoading(true);
    setError(null);

    if (!isPayrollSpecialist) {
      setMessageType("error");
      setMessageText("You do not have permission to create allowances.");
      setMessageModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/allowances`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          amount: Number(amount),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setName("");
      setAmount("");
      fetchAllowances();
      setMessageType("success");
      setMessageText("Allowance created successfully!");
      setMessageModalOpen(true);
    } catch (err: any) {
      console.error(err);
      setMessageType("error");
      setMessageText(extractMessage(err) || "Failed to create allowance");
      setMessageModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // ----- UPDATE ALLOWANCE (Specialist) -----
  const handleViewAllowance = (allowance: Allowance) => {
    setSelectedAllowance(allowance);
    setIsViewModalOpen(true);
  };

  const startEditAllowance = (allowance: Allowance) => {
    if (!isPayrollSpecialist || allowance.status !== "draft") return;
    setEditAllowanceId(allowance._id);
    setEditName(allowance.name || "");
    setEditAmount(String(allowance.amount ?? ""));
    setIsEditModalOpen(true);
  };

  const handleSubmitEditAllowance = async () => {
    if (!editAllowanceId || !editName.trim() || !editAmount.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/allowances/${editAllowanceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName.trim(),
          amount: Number(editAmount),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      setAllowances(
        allowances.map((a) =>
          a._id === editAllowanceId
            ? { ...a, name: editName.trim(), amount: Number(editAmount) }
            : a
        )
      );
      setMessageType("success");
      setMessageText("Allowance updated successfully!");
      setMessageModalOpen(true);
      setIsEditModalOpen(false);
      setEditAllowanceId(null);
    } catch (err: any) {
      console.error(err);
      setMessageType("error");
      setMessageText(extractMessage(err) || "Failed to update allowance");
      setMessageModalOpen(true);
    }
  };

  // ----- HANDLE STATUS CHANGE (Manager) -----
  const handleChangeStatus = (allowanceId: string, currentStatus: string) => {
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("Only Payroll Managers can change allowance status.");
      setMessageModalOpen(true);
      return;
    }
    setStatusChangeAllowanceId(allowanceId);
    setNewStatus(currentStatus === "draft" ? "approved" : "rejected");
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatusChange = async () => {
    if (!statusChangeAllowanceId) return;

    const res = await fetch(
      `${API_BASE}/allowances/${statusChangeAllowanceId}/status`,
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
      let errorMessage = "Failed to update allowance status";
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
      setStatusChangeAllowanceId(null);
      return;
    }

    setAllowances(
      allowances.map((a) =>
        a._id === statusChangeAllowanceId
          ? { ...a, status: newStatus as "draft" | "approved" | "rejected" }
          : a
      )
    );
    setMessageType("success");
    setMessageText(`Allowance status changed to ${newStatus} successfully!`);
    setMessageModalOpen(true);
    setIsStatusModalOpen(false);
    setStatusChangeAllowanceId(null);
  };

  // ----- DELETE ALLOWANCE (Manager) -----
  const handleDeleteAllowance = async (id: string) => {
    if (!isPayrollManager) {
      setMessageType("error");
      setMessageText("Only Payroll Managers can delete allowances.");
      setMessageModalOpen(true);
      return;
    }
    setConfirmMessage("Are you sure you want to delete this allowance?");
    setConfirmAction(() => async () => {
      const res = await fetch(`${API_BASE}/allowances/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to delete allowance";
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

      setAllowances(allowances.filter((a) => a._id !== id));
      setMessageType("success");
      setMessageText("Allowance deleted successfully!");
      setMessageModalOpen(true);
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  // ----- FILTER -----
  const filteredAllowances = allowances.filter((a) => {
    const matchesSearch = a.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const status = normalizeStatus(a.status);
    const matchesStatus = filterStatus === "all" || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ----- RENDER -----
  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Allowances</h1>
          <p className="text-slate-600">
            Manage employee allowances and benefits
          </p>
        </div>
        {isPayrollSpecialist && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Allowance
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
            placeholder="Search by allowance name..."
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

      {/* LIST OF ALLOWANCES */}
      <div className="bg-white rounded-lg shadow p-6">
        {filteredAllowances.length === 0 ? (
          <p className="text-gray-500">No allowances found.</p>
        ) : (
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
              {filteredAllowances.map((a) => {
                const id = a._id;
                if (!id) return null;

                const status = normalizeStatus(a.status);
                const isDraft = status === "draft";
                const isRejected = status === "rejected";

                return (
                  <tr
                    key={id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {a.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {a.amount}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(status)}`}
                      >
                        {formatStatus(status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleViewAllowance(a)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isDraft && isPayrollSpecialist && (
                        <button
                          onClick={() => startEditAllowance(a)}
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {isPayrollManager && (isDraft || isRejected) && (
                        <button
                          onClick={() => handleChangeStatus(a._id, status)}
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 transition-colors"
                          title="Change Status"
                        >
                          ✓
                        </button>
                      )}
                      {isDraft && isPayrollManager && (
                        <button
                          onClick={() => handleDeleteAllowance(a._id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
          setAmount("");
        }}
        title="Add Allowance"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Allowance Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Allowance name"
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
                setName("");
                setAmount("");
              }}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await createAllowance();
                if (isPayrollSpecialist) {
                  setIsAddModalOpen(false);
                }
              }}
              disabled={loading || !name || !amount || !isPayrollSpecialist}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Create Allowance
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      {selectedAllowance && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Allowance Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Name</p>
                <p className="font-medium text-slate-900">
                  {selectedAllowance.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Amount</p>
                <p className="font-medium text-slate-900">
                  ${selectedAllowance.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(selectedAllowanceStatus)}`}
                >
                  {formatStatus(selectedAllowanceStatus)}
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
        title="Edit Allowance"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Allowance Name
            </label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Allowance name"
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
              onClick={handleSubmitEditAllowance}
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
          setStatusChangeAllowanceId(null);
        }}
        title="Change Allowance Status"
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
                setStatusChangeAllowanceId(null);
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
