'use client'

import { useEffect, useState } from 'react';
import { employeeProfileApi } from '@/services/api';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  department?: string;
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeProfileApi.getAll();
      setEmployees(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch employees');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading employees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchEmployees}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Employees</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Add Employee
        </button>
      </div>

      <div className="grid gap-4">
        {employees.length === 0 ? (
          <div className="text-center p-8 bg-slate-50 rounded-lg">
            <p className="text-slate-600">No employees found</p>
          </div>
        ) : (
          employees.map((employee) => (
            <div key={employee._id} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-slate-600">{employee.email}</p>
                  {employee.position && (
                    <p className="text-sm text-slate-500 mt-1">
                      {employee.position} {employee.department && `- ${employee.department}`}
                    </p>
                  )}
                </div>
                <button className="text-blue-600 hover:text-blue-800">
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
