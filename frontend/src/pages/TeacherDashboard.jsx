import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [submissionsModalExam, setSubmissionsModalExam] = useState(null);
  const [submissionsData, setSubmissionsData] = useState(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState(null);

  // Form State for creating/editing an exam
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    durationMinutes: 15,
    passPercentage: 40,
    startTime: '',
    endTime: '',
    isPublished: true,
    allowMultipleAttempts: false,
    showResultsImmediately: true,
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        marks: 2,
        explanation: '',
      },
    ],
  });

  const fetchTeacherExams = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/exams/my-exams');
      setExams(data.exams || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch examinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherExams();
  }, []);

  const openCreateModal = () => {
    setEditingExamId(null);
    setFormData({
      title: '',
      description: '',
      durationMinutes: 15,
      passPercentage: 40,
      startTime: '',
      endTime: '',
      isPublished: true,
      allowMultipleAttempts: false,
      showResultsImmediately: true,
      questions: [
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          marks: 2,
          explanation: '',
        },
      ],
    });
    setIsEditorOpen(true);
  };

  const openEditModal = (exam) => {
    setEditingExamId(exam._id);
    setFormData({
      title: exam.title,
      description: exam.description || '',
      durationMinutes: exam.durationMinutes,
      passPercentage: exam.passPercentage || 40,
      startTime: exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '',
      endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '',
      isPublished: exam.isPublished,
      allowMultipleAttempts: exam.allowMultipleAttempts,
      showResultsImmediately: exam.showResultsImmediately,
      questions: (exam.questions || []).map((q) => ({
        questionText: q.questionText,
        options: [...q.options],
        correctOptionIndex: q.correctOptionIndex,
        marks: q.marks || 1,
        explanation: q.explanation || '',
      })),
    });
    setIsEditorOpen(true);
  };

  // Add question to form
  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          marks: 2,
          explanation: '',
        },
      ],
    }));
  };

  // Remove question from form
  const handleRemoveQuestion = (idx) => {
    if (formData.questions.length <= 1) {
      alert('An examination must contain at least one question.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  // Update question field
  const handleQuestionChange = (qIdx, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[qIdx] = { ...updated[qIdx], [field]: val };
      return { ...prev, questions: updated };
    });
  };

  // Update option string
  const handleOptionChange = (qIdx, optIdx, val) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      const newOpts = [...updated[qIdx].options];
      newOpts[optIdx] = val;
      updated[qIdx].options = newOpts;
      return { ...prev, questions: updated };
    });
  };

  // Submit create or update
  const handleSaveExam = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Please provide an exam title.');
      return;
    }
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.questionText.trim()) {
        setError(`Question ${i + 1} text cannot be blank.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setError(`Question ${i + 1}, Option ${j + 1} cannot be blank.`);
          return;
        }
      }
    }

    try {
      if (editingExamId) {
        await apiRequest(`/exams/${editingExamId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMsg('Exam updated successfully!');
      } else {
        await apiRequest('/exams', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMsg('New examination created successfully!');
      }
      setIsEditorOpen(false);
      fetchTeacherExams();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save examination.');
    }
  };

  // Delete Exam
  const handleDeleteExam = async () => {
    if (!deleteConfirmExam) return;
    try {
      await apiRequest(`/exams/${deleteConfirmExam._id}`, {
        method: 'DELETE',
      });
      setSuccessMsg(`Exam "${deleteConfirmExam.title}" was deleted.`);
      setDeleteConfirmExam(null);
      fetchTeacherExams();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete exam.');
    }
  };

  // View Submissions for an exam
  const handleViewSubmissions = async (exam) => {
    setSubmissionsModalExam(exam);
    setSubmissionsLoading(true);
    try {
      const data = await apiRequest(`/attempts/exam/${exam._id}`);
      setSubmissionsData(data);
    } catch (err) {
      setError(err.message || 'Failed to load submissions.');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 5rem 1.5rem' }}>
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
          <span className="badge badge-warning" style={{ marginBottom: '0.4rem' }}>
            Instructor Workspace
          </span>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--slate-900)' }}>
            Exam Management Portal
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem' }}>
            Design assessments, configure answer keys, and monitor student completion in real time.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          + Create New Examination
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <span>✓</span>
          <div>{successMsg}</div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--slate-500)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading your examinations...
        </div>
      ) : exams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No examinations created yet</h3>
          <p style={{ color: 'var(--slate-500)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Get started by authoring your first multiple choice assessment with customizable timers and answer keys.
          </p>
          <button onClick={openCreateModal} className="btn btn-primary">
            + Create Your First Exam
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {exams.map((exam) => (
            <div key={exam._id} className="card" style={{ padding: '1.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      className={`badge ${
                        exam.isPublished ? 'badge-success' : 'badge-slate'
                      }`}
                    >
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="badge badge-primary">
                      {exam.questions?.length || 0} Questions
                    </span>
                    <span className="badge badge-warning">
                      ⏱️ {exam.durationMinutes} Min
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', color: 'var(--slate-900)' }}>
                    {exam.title}
                  </h3>
                  {exam.description && (
                    <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      {exam.description}
                    </p>
                  )}
                </div>

                {/* Exam Management Controls */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleViewSubmissions(exam)}
                    className="btn btn-sm btn-secondary"
                  >
                    📊 View Results ({exam.stats?.attemptCount || 0})
                  </button>
                  <button
                    onClick={() => openEditModal(exam)}
                    className="btn btn-sm btn-secondary"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirmExam(exam)}
                    className="btn btn-sm btn-outline-danger"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Performance Summary Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '1rem',
                  padding: '0.85rem 1.25rem',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  border: '1px solid var(--slate-200)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block' }}>Total Submissions</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--slate-900)' }}>
                    {exam.stats?.attemptCount || 0}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block' }}>Average Score</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary-700)' }}>
                    {exam.stats?.averagePercentage || 0}%
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block' }}>Total Marks</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--slate-900)' }}>
                    {exam.totalMarks || 0} (Pass: {exam.passPercentage}%)
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block' }}>Multiple Attempts</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--slate-700)' }}>
                    {exam.allowMultipleAttempts ? 'Allowed' : 'Single Only'}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT EXAM MODAL */}
      {isEditorOpen && (
        <div className="modal-overlay" onClick={() => setIsEditorOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '850px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--slate-200)',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '1.4rem' }}>
                {editingExamId ? 'Edit Examination' : 'Create New Examination'}
              </h2>
              <button
                onClick={() => setIsEditorOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExam}>
              {/* General Exam Settings */}
              <div className="grid-cols-2" style={{ marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Exam Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Data Structures & Algorithms Midterm"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Duration (Minutes) *</label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    className="form-input"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMinutes: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Instructions</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide students with guidance regarding exam topics, rules, and expectations."
                />
              </div>

              {/* Toggles Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.75rem',
                  border: '1px solid var(--slate-200)',
                }}
              >
                <div>
                  <label className="form-label">Pass Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="form-input"
                    value={formData.passPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, passPercentage: Number(e.target.value) })
                    }
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Publish Immediately</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginLeft: '1.4rem' }}>
                    Visible to students
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.allowMultipleAttempts}
                      onChange={(e) =>
                        setFormData({ ...formData, allowMultipleAttempts: e.target.checked })
                      }
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Allow Retakes</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginLeft: '1.4rem' }}>
                    Permit multiple student attempts
                  </span>
                </div>
              </div>

              {/* Questions Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <h3 style={{ fontSize: '1.15rem' }}>
                    Questions ({formData.questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="btn btn-sm btn-secondary"
                  >
                    + Add Question
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {formData.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      style={{
                        padding: '1.25rem',
                        border: '1px solid var(--slate-300)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'white',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-800)' }}>
                          Question #{qIdx + 1}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>Marks:</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={q.marks}
                              onChange={(e) =>
                                handleQuestionChange(qIdx, 'marks', Number(e.target.value))
                              }
                              style={{ width: '60px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--slate-300)' }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="btn btn-sm btn-outline-danger"
                            style={{ padding: '0.2rem 0.6rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter question text here..."
                          value={q.questionText}
                          onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                          required
                        />
                      </div>

                      {/* Options */}
                      <span className="form-label" style={{ marginBottom: '0.5rem' }}>
                        Answer Options (Select the radio button for the correct key):
                      </span>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {q.options.map((opt, optIdx) => {
                          const optionLetters = ['A', 'B', 'C', 'D'];
                          const isCorrect = q.correctOptionIndex === optIdx;

                          return (
                            <div
                              key={optIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                padding: '0.4rem 0.75rem',
                                backgroundColor: isCorrect ? '#ecfdf5' : 'var(--slate-50)',
                                border: `1.5px solid ${isCorrect ? 'var(--success-500)' : 'var(--slate-200)'}`,
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={isCorrect}
                                onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                                title="Mark as correct answer"
                              />
                              <span style={{ fontWeight: 700, width: '20px' }}>
                                {optionLetters[optIdx]}
                              </span>
                              <input
                                type="text"
                                className="form-input"
                                style={{ padding: '0.4rem 0.65rem', fontSize: '0.9rem' }}
                                placeholder={`Option ${optionLetters[optIdx]} text...`}
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                required
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                          placeholder="Optional explanation shown to student upon result release..."
                          value={q.explanation}
                          onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--slate-200)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExamId ? 'Update Exam' : 'Save & Publish Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {submissionsModalExam && (
        <div className="modal-overlay" onClick={() => setSubmissionsModalExam(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--slate-200)',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.35rem' }}>{submissionsModalExam.title}</h3>
                <p style={{ color: 'var(--slate-500)', fontSize: '0.85rem', margin: 0 }}>
                  Student Attempt Logs & Performance Analytics
                </p>
              </div>
              <button
                onClick={() => setSubmissionsModalExam(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {submissionsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                Loading submission records...
              </div>
            ) : submissionsData ? (
              <div>
                {/* Stats Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem',
                    padding: '1rem',
                    backgroundColor: 'var(--slate-50)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem',
                    textAlign: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Attempts</span>
                    <strong style={{ display: 'block', fontSize: '1.25rem' }}>{submissionsData.stats?.totalAttempts}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Completed</span>
                    <strong style={{ display: 'block', fontSize: '1.25rem' }}>{submissionsData.stats?.totalCompleted}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Pass Rate</span>
                    <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--success-700)' }}>
                      {submissionsData.stats?.passRate}%
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Avg Score</span>
                    <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--primary-700)' }}>
                      {submissionsData.stats?.averagePercentage}%
                    </strong>
                  </div>
                </div>

                {/* Submissions Table */}
                {submissionsData.attempts?.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--slate-500)', padding: '2rem 0' }}>
                    No students have submitted attempts for this examination yet.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Marks</th>
                          <th>Score</th>
                          <th>Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionsData.attempts.map((att) => (
                          <tr key={att._id}>
                            <td><strong>{att.studentId?.name || 'Unknown'}</strong></td>
                            <td style={{ color: 'var(--slate-500)' }}>{att.studentId?.email}</td>
                            <td>
                              <span
                                className={`badge ${
                                  att.status === 'submitted'
                                    ? 'badge-success'
                                    : att.status === 'expired'
                                    ? 'badge-warning'
                                    : 'badge-primary'
                                }`}
                              >
                                {att.status}
                              </span>
                            </td>
                            <td>{att.totalMarksObtained} / {att.maxPossibleMarks}</td>
                            <td><strong>{att.percentage}%</strong></td>
                            <td>
                              <span
                                className={`badge ${
                                  att.isPassed ? 'badge-success' : 'badge-danger'
                                }`}
                              >
                                {att.isPassed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setSubmissionsModalExam(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmExam)}
        isDanger={true}
        title="Delete Examination?"
        message={`Are you sure you want to permanently delete "${deleteConfirmExam?.title}"? All existing student attempt records for this exam will also be deleted.`}
        confirmText="Yes, Delete Examination"
        cancelText="Keep Exam"
        onConfirm={handleDeleteExam}
        onCancel={() => setDeleteConfirmExam(null)}
      />
    </div>
  );
};
