
import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const AdminDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('metrics');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // User filters
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // User creation form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });

  // Delete confirmation
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/admin/stats');
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      let query = '?';

      if (roleFilter) query += `role=${encodeURIComponent(roleFilter)}&`;
      if (statusFilter) query += `status=${encodeURIComponent(statusFilter)}&`;
      if (searchQuery) query += `search=${encodeURIComponent(searchQuery)}&`;

      const data = await apiRequest(`/admin/users${query}`);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    }
  };

  const fetchExams = async () => {
    try {
      const data = await apiRequest('/admin/exams');
      setExams(data.exams || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchResults = async () => {
    try {
      const data = await apiRequest('/admin/results');
      setResults(data.attempts || []);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAdminData = async () => {
    await Promise.all([fetchStats(), fetchUsers(), fetchExams(), fetchResults()]);
  };

  useEffect(() => {
    const initAdmin = async () => {
      setLoading(true);
      await refreshAdminData();
      setLoading(false);
    };

    initAdmin();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [roleFilter, statusFilter, searchQuery]);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMsg('');

    if (
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.password
    ) {
      setError('Please fill in all fields.');
      return;
    }

    if (newUser.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setCreatingUser(true);

    try {
      const response = await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim().toLowerCase(),
          password: newUser.password,
          role: newUser.role,
        }),
      });

      setSuccessMsg(response.message || 'Account created successfully.');

      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'student',
      });

      setShowCreateForm(false);

      await refreshAdminData();
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    setError('');
    setSuccessMsg('');

    try {
      const response = await apiRequest(
        `/admin/users/${targetUser._id}/toggle-status`,
        { method: 'PATCH' }
      );

      setSuccessMsg(response.message || 'User status updated.');
      await fetchUsers();
      await fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;

    setError('');
    setSuccessMsg('');

    try {
      const response = await apiRequest(`/admin/users/${deleteUserTarget._id}`, {
        method: 'DELETE',
      });

      setSuccessMsg(response.message || 'User deleted successfully.');
      setDeleteUserTarget(null);

      await fetchUsers();
      await fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid var(--slate-300)',
    borderRadius: 'var(--radius-md)',
    marginTop: '0.35rem',
    boxSizing: 'border-box',
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--slate-200)',
        }}
      >
        <div>
          <span className="badge badge-danger" style={{ marginBottom: '0.4rem' }}>
            System Administrator
          </span>

          <h1 style={{ fontSize: '1.85rem', color: 'var(--slate-900)' }}>
            ExamEase Administration Control
          </h1>

          <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem' }}>
            Platform overview, user accounts, and examination performance logs.
          </p>
        </div>

        {/* Navigation tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--slate-200)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            flexWrap: 'wrap',
            gap: '0.25rem',
          }}
        >
          {[
            ['metrics', 'System Metrics'],
            ['users', `Manage Users (${users.length})`],
            ['exams', `All Exams (${exams.length})`],
            ['results', `All Submissions (${results.length})`],
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError('');
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: activeTab === tab ? 'white' : 'transparent',
                color:
                  activeTab === tab
                    ? 'var(--primary-700)'
                    : 'var(--slate-700)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <span>✓</span>
          <div>{successMsg}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <div>{error}</div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setError('')}
            style={{ marginLeft: 'auto' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 0',
            color: 'var(--slate-500)',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading administration metrics...
        </div>
      ) : activeTab === 'metrics' ? (
        /* SYSTEM METRICS */
        <div>
          {stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="grid-cols-4">
                <div className="card" style={{ borderLeft: '4px solid var(--primary-600)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                    Total Users
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
                    {stats.users.total}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                    {stats.users.students} Students • {stats.users.teachers} Teachers
                  </span>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--warning-500)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                    Total Exams
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
                    {stats.exams.total}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                    {stats.exams.published} Published • {stats.exams.draft} Drafts
                  </span>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--accent-teal)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                    Exam Attempts
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0.25rem 0' }}>
                    {stats.attempts.total}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                    {stats.attempts.completed} Completed
                  </span>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--success-500)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                    Overall Pass Rate
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success-700)', margin: '0.25rem 0' }}>
                    {stats.attempts.passRate}%
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                    Avg Score: {stats.attempts.averageScorePercentage}%
                  </span>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  Administrative Quick Controls
                </h3>

                <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  Manage accounts, inspect examinations, and review test submissions.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="btn btn-secondary btn-sm"
                  >
                    Manage Student & Teacher Accounts →
                  </button>

                  <button
                    onClick={() => setActiveTab('exams')}
                    className="btn btn-secondary btn-sm"
                  >
                    Inspect All Exams →
                  </button>

                  <button
                    onClick={() => setActiveTab('results')}
                    className="btn btn-secondary btn-sm"
                  >
                    Browse All Submissions →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'users' ? (
        /* USER MANAGEMENT */
        <div>
          <div
            className="card"
            style={{
              marginBottom: '1.5rem',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                User Accounts
              </h2>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>
                Create accounts and manage existing students and teachers.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setError('');
                setSuccessMsg('');
                setShowCreateForm((current) => !current);
              }}
            >
              {showCreateForm ? 'Cancel' : '+ Create Student / Teacher'}
            </button>
          </div>

          {showCreateForm && (
            <form
              className="card"
              onSubmit={handleCreateUser}
              style={{ marginBottom: '1.5rem' }}
            >
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                Create a New Account
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                }}
              >
                <label>
                  Full Name
                  <input
                    className="form-input"
                    style={inputStyle}
                    type="text"
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={(event) =>
                      setNewUser({ ...newUser, name: event.target.value })
                    }
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  Email Address
                  <input
                    className="form-input"
                    style={inputStyle}
                    type="email"
                    placeholder="Enter email address"
                    value={newUser.email}
                    onChange={(event) =>
                      setNewUser({ ...newUser, email: event.target.value })
                    }
                    autoComplete="email"
                    required
                  />
                </label>

                <label>
                  Temporary Password
                  <input
                    className="form-input"
                    style={inputStyle}
                    type="password"
                    placeholder="At least 6 characters"
                    value={newUser.password}
                    onChange={(event) =>
                      setNewUser({ ...newUser, password: event.target.value })
                    }
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                </label>

                <label>
                  Account Type
                  <select
                    className="form-select"
                    style={{ ...inputStyle, backgroundColor: 'white' }}
                    value={newUser.role}
                    onChange={(event) =>
                      setNewUser({ ...newUser, role: event.target.value })
                    }
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  marginTop: '1.25rem',
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creating Account...' : 'Create Account'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={creatingUser}
                  onClick={() =>
                    setNewUser({
                      name: '',
                      email: '',
                      password: '',
                      role: 'student',
                    })
                  }
                >
                  Clear Form
                </button>
              </div>

              <p
                style={{
                  color: 'var(--slate-500)',
                  fontSize: '0.85rem',
                  marginTop: '1rem',
                }}
              >
                The account will be created as active. Share the login details
                securely with the person who will use the account.
              </p>
            </form>
          )}

          {/* User filters */}
          <div
            className="card"
            style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <div style={{ minWidth: '140px' }}>
              <select
                className="form-select"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div style={{ minWidth: '140px' }}>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Deactivated</option>
              </select>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((account) => {
                      const isSelf = user?._id === account._id;

                      return (
                        <tr key={account._id}>
                          <td>
                            <strong>{account.name}</strong>
                            {isSelf && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--slate-500)',
                                  marginLeft: '0.4rem',
                                }}
                              >
                                (You)
                              </span>
                            )}
                          </td>

                          <td style={{ color: 'var(--slate-600)' }}>
                            {account.email}
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                account.role === 'admin'
                                  ? 'badge-danger'
                                  : account.role === 'teacher'
                                  ? 'badge-warning'
                                  : 'badge-primary'
                              }`}
                            >
                              {account.role}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                account.isActive ? 'badge-success' : 'badge-slate'
                              }`}
                            >
                              {account.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>

                          <td style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                            {account.createdAt
                              ? new Date(account.createdAt).toLocaleDateString()
                              : '—'}
                          </td>

                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleToggleUserStatus(account)}
                                disabled={isSelf}
                                className={`btn btn-sm ${
                                  account.isActive ? 'btn-secondary' : 'btn-success'
                                }`}
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                              >
                                {account.isActive ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                onClick={() => setDeleteUserTarget(account)}
                                disabled={isSelf}
                                className="btn btn-sm btn-outline-danger"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'exams' ? (
        /* ALL EXAMS */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Submissions</th>
                  <th>Avg Score</th>
                </tr>
              </thead>

              <tbody>
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      No exams found.
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam._id}>
                      <td><strong>{exam.title}</strong></td>
                      <td>{exam.teacherId?.name || 'Unknown Teacher'}</td>
                      <td>
                        <span className={`badge ${exam.isPublished ? 'badge-success' : 'badge-slate'}`}>
                          {exam.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{exam.durationMinutes} Mins</td>
                      <td>{exam.questions?.length || 0}</td>
                      <td>{exam.stats?.totalAttempts || 0}</td>
                      <td><strong>{exam.stats?.averagePercentage || 0}%</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ALL SUBMISSIONS */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Exam Title</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Result</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  results.map((attempt) => (
                    <tr key={attempt._id}>
                      <td><strong>{attempt.studentId?.name || 'Unknown Student'}</strong></td>
                      <td>{attempt.examId?.title || 'Unknown Exam'}</td>
                      <td>
                        <span
                          className={`badge ${
                            attempt.status === 'submitted'
                              ? 'badge-success'
                              : attempt.status === 'expired'
                              ? 'badge-warning'
                              : 'badge-primary'
                          }`}
                        >
                          {attempt.status}
                        </span>
                      </td>
                      <td>
                        {attempt.totalMarksObtained ?? 0} / {attempt.maxPossibleMarks ?? 0}
                      </td>
                      <td><strong>{attempt.percentage ?? 0}%</strong></td>
                      <td>
                        <span className={`badge ${attempt.isPassed ? 'badge-success' : 'badge-danger'}`}>
                          {attempt.isPassed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                        {attempt.submitTime
                          ? new Date(attempt.submitTime).toLocaleString()
                          : 'In Progress'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION */}
      <ConfirmModal
        isOpen={Boolean(deleteUserTarget)}
        isDanger={true}
        title="Delete User Account?"
        message={`Are you sure you want to permanently delete user "${deleteUserTarget?.name}" (${deleteUserTarget?.email})? This action cannot be undone.`}
        confirmText="Yes, Delete User"
        cancelText="Cancel"
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteUserTarget(null)}
      />
    </div>
  );
};
