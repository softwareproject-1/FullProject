'use client'

import { useState } from 'react';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Edit2, Mail, Phone, MapPin, Briefcase, Calendar, User } from 'lucide-react';
import { mockEmployees } from '../../lib/api';

export default function EmployeeProfile() {
  const [currentView, setCurrentView] = useState<'my-profile' | 'manager-view'>('my-profile');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee] = useState(mockEmployees[0]); // Current user
  const [editForm, setEditForm] = useState({
    phone: selectedEmployee.phone,
    address: selectedEmployee.address,
  });

  const teamMembers = mockEmployees.filter(emp => emp.managerId === selectedEmployee.id);

  const handleSaveEdit = () => {
    // In real app, call API to update
    console.log('Saving updates:', editForm);
    setIsEditModalOpen(false);
  };

  const columns = [
    {
      header: 'Employee',
      accessor: (row: typeof mockEmployees[0]) => (
        <div className="flex items-center gap-3">
          <img src={row.photo} alt={row.name} className="w-8 h-8 rounded-full" />
          <div>
            <p className="text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.employeeId}</p>
          </div>
        </div>
      ),
    },
    { header: 'Position', accessor: 'position' as const },
    { header: 'Department', accessor: 'department' as const },
    { header: 'Email', accessor: 'email' as const },
    {
      header: 'Status',
      accessor: (row: typeof mockEmployees[0]) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Employee Profile</h1>
          <p className="text-slate-600">Manage personal information and view team members</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('my-profile')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'my-profile'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setCurrentView('manager-view')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'manager-view'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Manager View
          </button>
        </div>
      </div>

      {currentView === 'my-profile' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <div className="text-center">
              <img
                src={selectedEmployee.photo}
                alt={selectedEmployee.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-slate-100"
              />
              <h2 className="text-slate-900 mb-1">{selectedEmployee.name}</h2>
              <p className="text-slate-600 mb-2">{selectedEmployee.position}</p>
              <StatusBadge status={selectedEmployee.status} />
              
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="mt-6 w-full bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </Card>

          {/* Details Cards */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Email</p>
                    <p className="text-slate-900">{selectedEmployee.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Phone</p>
                    <p className="text-slate-900">{selectedEmployee.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Address</p>
                    <p className="text-slate-900">{selectedEmployee.address}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Employment Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Employee ID</p>
                    <p className="text-slate-900">{selectedEmployee.employeeId}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Department</p>
                    <p className="text-slate-900">{selectedEmployee.department}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Join Date</p>
                    <p className="text-slate-900">{new Date(selectedEmployee.joinDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Reports To</p>
                    <p className="text-slate-900">{selectedEmployee.managerName || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card title={`Team Members (${teamMembers.length})`}>
          <DataTable data={teamMembers} columns={columns} />
        </Card>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-slate-700 mb-2">Phone Number</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-slate-700 mb-2">Address</label>
            <textarea
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}