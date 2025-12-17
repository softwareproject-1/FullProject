"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle,
  Database,
  Eye,
  Search,
} from "lucide-react";

import {
  getCompanySettings,
  createCompanySettings,
  updateCompanySettings,
  deleteCompanySettings,
  createManualBackup,
} from "@/lib/api";

import type {
  CompanyWideSettings,
  CreateCompanyWideSettingsDto,
} from "@/lib/types";

import { Modal } from "@/components/Modal";
import { Card } from "@/components/Card";
import { useAuth } from "@/contexts/AuthContext";

export default function CompanyWideSettingsPage() {
  const [settings, setSettings] = useState<CompanyWideSettings[]>([]);
  const [selected, setSelected] = useState<CompanyWideSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const [messageOpen, setMessageOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] =
    useState<CompanyWideSettings | null>(null);

  const [formData, setFormData] = useState<CreateCompanyWideSettingsDto>({
    payDate: "",
    timeZone: "",
    currency: "EGP",
  });

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  // View Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewSetting, setViewSetting] = useState<CompanyWideSettings | null>(
    null
  );

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Role checking
  const [isPayrollManager, setIsPayrollManager] = useState(false);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const roles = useMemo(() => user?.roles || [], [user]);

  useEffect(() => {
    setIsPayrollManager(roles.includes("Payroll Manager"));
    setIsSystemAdmin(roles.includes("System Admin"));
  }, [roles]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      setMessage("You must be logged in to view company settings.");
      setMessageType("error");
      setMessageOpen(true);
      return;
    }
    loadSettings();
  }, [authLoading, user]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getCompanySettings();
      setSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    if (!user) {
      setMessage("You must be logged in to create company settings.");
      setMessageType("error");
      setMessageOpen(true);
      return;
    }
    if (!isSystemAdmin) {
      setMessage("Only System Admins can create company settings.");
      setMessageType("error");
      setMessageOpen(true);
      return;
    }
    setSelected(null);
    setFormData({ payDate: "", timeZone: "", currency: "EGP" });
    setIsModalOpen(true);
  };

  const openEdit = (item: CompanyWideSettings) => {
    if (!user) {
      setMessage("You must be logged in to edit company settings.");
      setMessageType("error");
      setMessageOpen(true);
      return;
    }
    if (!isSystemAdmin) {
      setMessage("Only System Admins can edit company settings.");
      setMessageType("error");
      setMessageOpen(true);
      return;
    }
    setSelected(item);
    setFormData({
      payDate: item.payDate ? item.payDate.split("T")[0] : "",
      timeZone: item.timeZone,
      currency: item.currency,
    });
    setIsModalOpen(true);
  };

  const openView = (item: CompanyWideSettings) => {
    setViewSetting(item);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setMessage("You must be logged in to modify company settings.");
      setMessageType("error");
      setMessageOpen(true);
      return;
    }
    if (!isSystemAdmin) {
      setMessage("Only System Admins can modify company settings.");
      setMessageType("error");
      setMessageOpen(true);
      return;
    }

    setIsSaving(true);

    try {
      if (selected) {
        const res = await updateCompanySettings(selected._id, formData);
        if (res.data) {
          await loadSettings();
          setMessage("Settings updated successfully");
          setMessageType("success");
        } else {
          throw new Error(res.error);
        }
      } else {
        const res = await createCompanySettings(formData);
        if (res.data) {
          await loadSettings();
          setMessage("Settings created successfully");
          setMessageType("success");
        } else {
          throw new Error(res.error);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setMessage(err.message || "Operation failed");
      setMessageType("error");
    } finally {
      setIsSaving(false);
      setMessageOpen(true);
    }
  };

  const requestDelete = (item: CompanyWideSettings) => {
    if (!user) {
      setMessage("You must be logged in to delete company settings.");
      setMessageType("error");
      setMessageOpen(true);
      return;
    }
    if (!isPayrollManager) {
      setMessage("Only Payroll Managers can delete company settings.");
      setMessageType("error");
      setMessageOpen(true);
      return;
    }
    setPendingDelete(item);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      setIsConfirmOpen(false);
      return;
    }
    const res = await deleteCompanySettings(pendingDelete._id);
    if (res.success) {
      setSettings(settings.filter((s) => s._id !== pendingDelete._id));
      setMessage("Deleted successfully");
      setMessageType("success");
    } else {
      setMessage(res.message || "Delete failed");
      setMessageType("error");
    }
    setPendingDelete(null);
    setIsConfirmOpen(false);
    setMessageOpen(true);
  };

  const handleBackup = async () => {
    try {
      const res = await createManualBackup();
      if (res.data) {
        setMessage("Backup started successfully");
        setMessageType("success");
      } else {
        setMessage(res.error || "Backup failed");
        setMessageType("error");
      }
    } catch (err: any) {
      setMessage(err.message || "Backup failed");
      setMessageType("error");
    }
    setMessageOpen(true);
  };

  const filteredSettings = settings.filter((s) => {
    const timeZone = s.timeZone ? s.timeZone.toLowerCase() : "";
    const currency = s.currency ? s.currency.toLowerCase() : "";
    const dateStr = s.payDate ? new Date(s.payDate).toLocaleDateString() : "";

    const term = searchTerm.toLowerCase();

    const matchesSearch =
      timeZone.includes(term) ||
      currency.includes(term) ||
      dateStr.includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Company Wide Settings</h1>
          <p className="text-slate-600">Manage payroll-wide configuration.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleBackup}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <Database className="w-4 h-4" />
            Create Backup
          </button>

          {isSystemAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Settings
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by timezone, currency, or date..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <p className="p-6 text-center">Loading...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left">Pay Date</th>
                <th className="px-6 py-3 text-left">Time Zone</th>
                <th className="px-6 py-3 text-left">Currency</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No settings found
                  </td>
                </tr>
              ) : (
                filteredSettings.map((s, idx) => (
                  <tr
                    key={
                      s._id || `${s.payDate}-${s.timeZone}-${s.currency}-${idx}`
                    }
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">{formatDate(s.payDate)}</td>
                    <td className="px-6 py-4">{s.timeZone}</td>
                    <td className="px-6 py-4">{s.currency}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openView(s)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isSystemAdmin && (
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isPayrollManager && (
                          <button
                            onClick={() => requestDelete(s)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selected ? "Edit Settings" : "Create Settings"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="date"
              required
              value={formData.payDate}
              onChange={(e) =>
                setFormData({ ...formData, payDate: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            />

            <input
              type="text"
              required
              placeholder="Time Zone"
              value={formData.timeZone}
              onChange={(e) =>
                setFormData({ ...formData, timeZone: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            />

            <input
              disabled
              value="EGP"
              className="w-full border px-3 py-2 rounded bg-slate-100"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Settings Details"
      >
        {viewSetting && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Pay Date</p>
                <p className="font-medium text-slate-900">
                  {formatDate(viewSetting.payDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Time Zone</p>
                <p className="font-medium text-slate-900">
                  {viewSetting.timeZone}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Currency</p>
                <p className="font-medium text-slate-900">
                  {viewSetting.currency}
                </p>
              </div>
            </div>

            {viewSetting.createdAt && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  Created: {new Date(viewSetting.createdAt).toLocaleString()}
                </p>
                {viewSetting.updatedAt && (
                  <p className="text-xs text-slate-500">
                    Updated: {new Date(viewSetting.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Message Modal */}
      <Modal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        title={messageType === "success" ? "Success" : "Error"}
      >
        <div className="flex gap-3 items-start">
          {messageType === "success" ? (
            <CheckCircle className="text-green-600" />
          ) : (
            <AlertCircle className="text-red-600" />
          )}
          <p>{message}</p>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setPendingDelete(null);
        }}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete
            {pendingDelete?.timeZone
              ? ` ${pendingDelete.timeZone}`
              : " this setting"}
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsConfirmOpen(false);
                setPendingDelete(null);
              }}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
