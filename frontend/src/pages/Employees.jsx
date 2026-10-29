import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Mail,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { getEmployees, getErrorMessage } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import EmployeeModal from '../components/EmployeeModal';

export function Employees() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployees(query);
      setEmployees(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmployees(searchTerm);
  };

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val === '') {
      fetchEmployees('');
    }
  };

  return (
    <div>
      {/* Header surface with Search & Add Employee */}
      <div className="surface-card">
        <div className="surface-header">
          <div className="surface-title-group">
            <h2>Employees ({employees.length})</h2>
            <p>Active corporate staff registered in the organization</p>
          </div>

          <div className="toolbar">
            <form onSubmit={handleSearch} className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, email, department..."
                value={searchTerm}
                onChange={handleSearchInputChange}
                aria-label="Search employees"
              />
            </form>

            <button
              onClick={() => fetchEmployees(searchTerm)}
              className="btn btn-secondary"
              title="Refresh employee directory"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>

            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{ padding: '16px 24px' }}>
            <div className="alert-banner error">
              <AlertCircle size={18} />
              <div style={{ flex: 1 }}>{error}</div>
              <button onClick={() => fetchEmployees(searchTerm)} className="btn btn-secondary btn-sm">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <LoadingSpinner message="Loading employee directory..." />
        ) : employees.length === 0 ? (
          <EmptyState
            title={searchTerm ? 'No matching employees' : 'No employees added yet'}
            description={
              searchTerm
                ? `No employee records match the search query "${searchTerm}".`
                : 'Get started by creating the first employee profile in the system.'
            }
            actionLabel={searchTerm ? 'Clear Search' : 'Add Employee'}
            onAction={
              searchTerm
                ? () => {
                    setSearchTerm('');
                    fetchEmployees('');
                  }
                : () => setIsModalOpen(true)
            }
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee Name</th>
                  <th>Email Address</th>
                  <th>Department</th>
                  <th>Employee Type</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      #{emp.id}
                    </td>
                    <td>
                      <div className="cell-primary">{emp.name}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={14} color="var(--color-text-muted)" />
                        <span>{emp.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} color="var(--color-text-muted)" />
                        <span style={{ fontWeight: 500 }}>{emp.department}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background:
                            emp.employee_type === 'Admin'    ? '#fdf4ff' :
                            emp.employee_type === 'Employee' ? '#eff6ff' : '#f1f5f9',
                          color:
                            emp.employee_type === 'Admin'    ? '#9333ea' :
                            emp.employee_type === 'Employee' ? '#2563eb' : '#64748b',
                        }}
                      >
                        {emp.employee_type || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <Calendar size={14} color="var(--color-text-muted)" />
                        <span>{emp.created_at ? new Date(emp.created_at).toLocaleDateString() : '-'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEmployeeCreated={() => {
          fetchEmployees(searchTerm);
        }}
      />
    </div>
  );
}

export default Employees;
