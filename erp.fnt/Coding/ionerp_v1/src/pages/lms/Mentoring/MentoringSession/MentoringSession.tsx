import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './mentoringSession.css';

// ============================================
// API Configuration - CORRECT BASE URL
// ============================================
const API_BASE_URL = process.env.REACT_APP_API_URL + '/student_mentoring';
console.log("API_BASE_URL:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Type Definitions ---
interface AcademicBatch {
  academic_batch_id: number;
  academic_batch_code: string;
  academic_batch_desc: string;
}

interface ScheduleItem {
  schedule_id: number;
  group_name: string;
  sub_group_name: string;
  session_agenda: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  questionnaire_id: number;
  questionnaire_status: 'Pending' | 'Submitted';
  semester?: string;
}

interface QuestionOption {
  option_id: number;
  option: string;
  specify_flag: number;
  selected: boolean;
  specification: string | null;
}

interface Question {
  question_id: number;
  question_no: number;
  question: string;
  que_type_id: number;
  question_type: string;
  mandatory: number;
  text_answer: string | null;
  options: QuestionOption[];
}

interface QuestionnaireResponse {
  is_submitted: boolean;
  questionnaire_response_id: number | null;
  schedule_id: number;
  questionnaire_id: number;
  questionnaire_name: string;
  message_to_mentees: string;
  questions: Question[];
}

interface Comment {
  comment_id?: number;
  generic_comment_id?: number;
  individual_comment_id?: number;
  comment: string;
  attachment: string | null;
  suggestion_type: number;
  posted_by_id: number;
  posted_by_name: string;
  posted_by_type: 'Mentor' | 'Mentee';
  created_date: string;
}

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// --- Main Component ---
const MentoringSession: React.FC = () => {
  // --- State ---
  const [studentId, setStudentId] = useState<number | null>(null);
  const [academicBatches, setAcademicBatches] = useState<AcademicBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showEntries, setShowEntries] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  // --- Questionnaire State ---
  const [showQuestionnaire, setShowQuestionnaire] = useState<boolean>(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [questionLoading, setQuestionLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // --- Comments State ---
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [commentLoading, setCommentLoading] = useState<boolean>(false);
  const [commentType, setCommentType] = useState<'group' | 'individual'>('group');
  const [attachment, setAttachment] = useState<File | null>(null);

  // --- Student Info ---
  useEffect(() => {
    const id = localStorage.getItem('student_id');
    if (id) {
      setStudentId(Number(id));
    } else {
      const sessionId = sessionStorage.getItem('student_id');
      if (sessionId) {
        setStudentId(Number(sessionId));
      } else {
        setStudentId(1);
      }
    }
  }, []);

  // --- Fetch Academic Batches ---
  useEffect(() => {
    if (studentId) {
      fetchAcademicBatches();
    }
  }, [studentId]);

  const fetchAcademicBatches = async () => {
    try {
      const response = await api.get<ApiResponse<AcademicBatch[]>>(
        `/get_student_academic_batches/${studentId}`
      );
      
      console.log('📥 Academic Batches Response:', response.data);
      
      if (response.data?.status && response.data.data) {
        setAcademicBatches(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedBatch(String(response.data.data[0].academic_batch_id));
        }
      } else {
        setAcademicBatches([]);
      }
    } catch (err) {
      console.error('Error fetching academic batches:', err);
      setError('Failed to load academic batches.');
    }
  };

  // --- Fetch Schedules ---
  useEffect(() => {
    if (selectedBatch && studentId && selectedMonth) {
      fetchSchedules();
    }
  }, [selectedBatch, studentId, selectedMonth]);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<ScheduleItem[]>>(
        `/get_my_mentoring_schedules/${selectedBatch}/${studentId}`
      );
      
      console.log('📥 Schedule API Response:', response.data);
      
      if (response.data?.status && response.data.data) {
        let filteredData = response.data.data;
        if (selectedMonth) {
          const [year, month] = selectedMonth.split('-').map(Number);
          filteredData = response.data.data.filter(item => {
            const date = new Date(item.start_date);
            return date.getFullYear() === year && date.getMonth() === month - 1;
          });
        }
        
        const processedData = filteredData.map(item => {
          let semester = '';
          if (item.session_agenda) {
            const match = item.session_agenda.match(/(\d+)\s*-\s*Semester/i);
            if (match) {
              semester = `${match[1]} - Semester`;
            }
          }
          if (!semester && item.group_name) {
            const match = item.group_name.match(/(\d+)\s*-\s*Semester/i);
            if (match) {
              semester = `${match[1]} - Semester`;
            }
          }
          return { ...item, semester };
        });
        
        setSchedules(processedData);
        setTotal(processedData.length);
        console.log('📊 Processed Data:', processedData);
      } else {
        setSchedules([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load mentoring schedules.');
      setSchedules([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch Questionnaire ---
  const openQuestionnaire = async (scheduleId: number) => {
    if (!studentId) return;
    
    setQuestionLoading(true);
    setShowQuestionnaire(true);
    setSelectedScheduleId(scheduleId);
    
    try {
      const response = await api.get<ApiResponse<QuestionnaireResponse>>(
        `/get_questionnaire/${scheduleId}/${studentId}`
      );
      
      if (response.data?.status && response.data.data) {
        setQuestionnaire(response.data.data);
      } else {
        setQuestionnaire(null);
      }
    } catch (err) {
      console.error('Error fetching questionnaire:', err);
      setQuestionnaire(null);
    } finally {
      setQuestionLoading(false);
    }
  };

  // --- Submit Questionnaire ---
  const submitQuestionnaire = async () => {
    if (!selectedScheduleId || !studentId || !questionnaire) return;
    
    const answers = questionnaire.questions.map(q => {
      const selectedOptions = q.options
        .filter(opt => opt.selected)
        .map(opt => opt.option_id);
      
      // ✅ Force Question 3 (Any suggestions?) to be treated as open-ended
      const isQuestion3 = q.question_no === 3;
      
      // For Question 3, always use text_answer and no options
      if (isQuestion3) {
        return {
          questionnaire_que_id: q.question_id,
          text_answer: q.text_answer || '',
          selected_option_ids: []
        };
      }
      
      // For other questions
      let textAnswer = '';
      if (q.que_type_id === 3) {
        textAnswer = q.text_answer || '';
      }
      
      return {
        questionnaire_que_id: q.question_id,
        text_answer: textAnswer,
        selected_option_ids: selectedOptions
      };
    });
    
    // Validate all mandatory questions
    const allAnswered = questionnaire.questions.every(q => {
      if (q.mandatory === 1) {
        const isQuestion3 = q.question_no === 3;
        const selectedOptions = q.options.filter(opt => opt.selected);
        
        // For Question 3, check text_answer
        if (isQuestion3) {
          return q.text_answer && q.text_answer.trim() !== '';
        }
        
        // For open-ended questions
        if (q.que_type_id === 3) {
          return q.text_answer && q.text_answer.trim() !== '';
        }
        
        // For select questions
        return selectedOptions.length > 0;
      }
      return true;
    });
    
    if (!allAnswered) {
      alert('Please answer all mandatory questions before submitting.');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        schedule_id: selectedScheduleId,
        student_id: studentId,
        sub_group_date_id: 1,
        answers: answers
      };
      
      console.log('📤 Submitting payload:', JSON.stringify(payload, null, 2));
      
      const response = await api.post<ApiResponse<any>>(
        '/save_questionnaire_response',
        payload
      );
      
      if (response.data?.status) {
        alert(response.data?.message || 'Questionnaire submitted successfully!');
        setShowQuestionnaire(false);
        setQuestionnaire(null);
        await fetchSchedules();
      } else {
        alert(response.data?.message || 'Failed to submit questionnaire');
      }
    } catch (err: any) {
      console.error('Error submitting questionnaire:', err);
      alert(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Fetch Comments ---
  const openComments = async (scheduleId: number, type: 'group' | 'individual') => {
    if (!studentId) return;
    
    setCommentType(type);
    setCommentLoading(true);
    setShowComments(true);
    setSelectedScheduleId(scheduleId);
    setAttachment(null);
    setCommentText('');
    
    try {
      const endpoint = type === 'group' 
        ? `/get_group_comments/${scheduleId}/${studentId}`
        : `/get_individual_comments/${scheduleId}/${studentId}`;
      
      const response = await api.get<ApiResponse<Comment[]>>(endpoint);
      
      if (response.data?.status && response.data.data) {
        setComments(response.data.data);
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  };

  // --- Submit Comment ---
  const submitComment = async () => {
    if (!selectedScheduleId || !studentId || !commentText.trim()) return;
    
    try {
      const endpoint = commentType === 'group'
        ? '/save_group_comment'
        : '/save_individual_comment';
      
      const formData = new FormData();
      formData.append('schedule_id', String(selectedScheduleId));
      formData.append('student_id', String(studentId));
      formData.append('comment', commentText.trim());
      formData.append('suggestion_type', '0');
      
      if (attachment) {
        formData.append('attachment', attachment);
      }
      
      const response = await api.post<ApiResponse<any>>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data?.status) {
        setCommentText('');
        setAttachment(null);
        await openComments(selectedScheduleId, commentType);
        alert(response.data?.message || 'Comment submitted successfully!');
      } else {
        alert(response.data?.message || 'Failed to submit comment');
      }
    } catch (err: any) {
      console.error('Error submitting comment:', err);
      alert(err.response?.data?.message || 'Failed to submit. Please try again.');
    }
  };

  // --- Helper Functions ---
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return 'N/A';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getStatusClass = (status: string): string => {
    const statusMap: Record<string, string> = {
      'Pending': 'status-pending',
      'Submitted': 'status-completed'
    };
    return statusMap[status] || 'status-pending';
  };

  // --- Handle Attachment ---
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  // --- Get Paginated Data ---
  const getPaginatedData = (): ScheduleItem[] => {
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return [];
    }
    
    let filtered = schedules;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = schedules.filter(item =>
        item.group_name?.toLowerCase().includes(searchLower) ||
        item.sub_group_name?.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower) ||
        item.semester?.toLowerCase().includes(searchLower)
      );
    }
    
    const startIndex = (currentPage - 1) * showEntries;
    const endIndex = startIndex + showEntries;
    return filtered.slice(startIndex, endIndex);
  };

  const paginatedData = getPaginatedData();
  const totalPages = Math.ceil(total / showEntries);

  // --- Get Unique Groups for Display ---
  const getGroups = () => {
    const groupMap = new Map<string, { 
      schedule_id: number; 
      group_name: string; 
      semester: string;
      sub_groups: ScheduleItem[] 
    }>();
    
    paginatedData.forEach(item => {
      const key = `${item.schedule_id}-${item.semester || 'No Semester'}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          schedule_id: item.schedule_id,
          group_name: item.group_name,
          semester: item.semester || 'No Semester',
          sub_groups: []
        });
      }
      groupMap.get(key)?.sub_groups.push(item);
    });
    
    return Array.from(groupMap.values());
  };

  const groups = getGroups();

  // --- Render ---
  return (
    <div className="session-container">
      <div className="session-card">
        {/* Header */}
        <div className="session-header">
          <h2 className="session-header-title">Student Mentoring Session</h2>
        </div>

        {/* Content */}
        <div className="session-content">
          {/* Filters */}
          <div className="session-filters-compact">
            <div className="filter-group-left">
              <div className="filter-item">
                <label className="filter-label">
                  Curriculum: <span className="required-asterisk">*</span>
                </label>
                <select
                  className="form-select filter-select"
                  value={selectedBatch}
                  onChange={(e) => {
                    setSelectedBatch(e.target.value);
                    setSelectedMonth('');
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Select Curriculum</option>
                  {academicBatches.map((batch) => (
                    <option key={batch.academic_batch_id} value={batch.academic_batch_id}>
                      {batch.academic_batch_desc || batch.academic_batch_code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label className="filter-label">
                  Month: <span className="required-asterisk">*</span>
                </label>
                <input
                  type="month"
                  className="form-control filter-input"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={!selectedBatch}
                />
              </div>
            </div>

            <div className="filter-group-right">
              <div className="dataTables_length">
                <label>
                  Show
                  <select
                    className="form-select form-select-sm d-inline-block mx-2"
                    value={showEntries}
                    onChange={(e) => {
                      setShowEntries(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{ width: '70px', display: 'inline-block' }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  entries
                </label>
              </div>
              <div className="dataTables_filter">
                <label>
                  Search:
                  <input
                    type="search"
                    className="form-control form-control-sm ms-2"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ width: '200px', display: 'inline-block' }}
                    placeholder="Search..."
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="loading-text">Loading sessions...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="error-state">
              <div className="alert alert-danger" role="alert">
                {error}
                <button className="btn btn-sm btn-link" onClick={fetchSchedules}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* No Data */}
          {!loading && !error && selectedBatch && selectedMonth && total === 0 && (
            <div className="no-data-message">
              <p className="no-data-text">No sessions available for the selected filters</p>
            </div>
          )}

          {/* Data Table */}
          {!loading && !error && total > 0 && (
            <>
              {groups.map((group) => (
                <div className="session-group" key={`${group.schedule_id}-${group.semester}`}>
                  <div className="session-group-header">
                    <div className="group-row">
                      <div>
                        <strong>{group.group_name}</strong>
                      </div>
                      <div>
                        <strong>Mentor :</strong> Mr. INDHU M, Dr. Uday Muddapur
                      </div>
                      <div>
                        <strong>Term :</strong> {group.semester}
                      </div>
                    </div>
                  </div>

                  <table className="session-table">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>SI No</th>
                        <th>Sub Group</th>
                        <th>Session Date</th>
                        <th>Time</th>
                        <th>Venue</th>
                        <th style={{ textAlign: "center", width: "120px" }}>Status</th>
                        <th style={{ textAlign: "center", width: "120px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.sub_groups.map((sub, idx) => (
                        <tr key={`${sub.schedule_id}-${idx}`}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>
                            <a href="#" className="sub-group-link">{sub.sub_group_name}</a>
                          </td>
                          <td>
                            {formatDate(sub.start_date)} to {formatDate(sub.end_date)}
                            <br />
                            <span style={{ fontSize: '12px', color: '#6c757d' }}>
                              {formatTime(sub.start_time)} to {formatTime(sub.end_time)}
                            </span>
                          </td>
                          <td>
                            <a href={sub.location} target="_blank" rel="noopener noreferrer" className="venue-link">
                              {sub.location || 'TBD'}
                            </a>
                          </td>
                          <td>{sub.location || 'TBD'}</td>
                          <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                            <span className={`status-pill ${getStatusClass(sub.questionnaire_status)}`}>
                              {sub.questionnaire_status || 'Pending'}
                            </span>
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                            <div className="action-buttons">
                              <button
                                className="query-btn"
                                onClick={() => openQuestionnaire(sub.schedule_id)}
                              >
                                Q
                              </button>
                              <button
                                className="feedback-btn"
                                onClick={() => openComments(sub.schedule_id, 'group')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-wrapper">
                  <div className="dataTables_info">
                    Showing {((currentPage - 1) * showEntries) + 1} to {Math.min(currentPage * showEntries, total)} of {total} entries
                  </div>
                  <div className="dataTables_paginate">
                    <ul className="pagination">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="session-footer">
          <div className="footer-text">
            IonCUDOS v8.0 - Copyright © 2014 by IonIdea.
          </div>
        </div>
      </div>

      {/* ============ QUESTIONNAIRE MODAL ============ */}
      {showQuestionnaire && (
        <div className="modal-overlay" onClick={() => setShowQuestionnaire(false)}>
          <div className="modal-box questionnaire-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Questionnaire</h3>
              <button className="modal-close" onClick={() => setShowQuestionnaire(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {questionLoading ? (
                <div className="loading-state">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="loading-text">Loading questions...</p>
                </div>
              ) : !questionnaire ? (
                <div className="no-data-message">
                  <p className="no-data-text">No questions available for this session</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>{questionnaire.questionnaire_name}</strong>
                    {questionnaire.message_to_mentees && (
                      <p style={{ marginTop: '8px', fontSize: '14px', color: '#495057' }}>
                        {questionnaire.message_to_mentees}
                      </p>
                    )}
                  </div>
                  
                  {questionnaire.questions.map((q, idx) => {
                    // ✅ ALWAYS show Question 3 as textarea
                    const isQuestion3 = q.question_no === 3;
                    
                    return (
                      <div className="question-block" key={q.question_id}>
                        <label className="question-label">
                          {q.question_no}. {q.question}
                          {q.mandatory === 1 && <span className="required-asterisk"> *</span>}
                        </label>
                        
                        {/* ✅ If Question 3, ALWAYS show textarea */}
                        {isQuestion3 || q.que_type_id === 3 ? (
                          <textarea
                            className="form-control"
                            rows={3}
                            value={q.text_answer || ''}
                            onChange={(e) => {
                              const updatedQuestions = questionnaire.questions.map(question =>
                                question.question_id === q.question_id
                                  ? { ...question, text_answer: e.target.value }
                                  : question
                              );
                              setQuestionnaire({ ...questionnaire, questions: updatedQuestions });
                            }}
                            placeholder="Type your answer here..."
                          />
                        ) : (
                          <div className="options-group">
                            {q.options.map((option) => (
                              <label key={option.option_id} className="option-label">
                                <input
                                  type={q.que_type_id === 1 ? 'radio' : 'checkbox'}
                                  name={`question_${q.question_id}`}
                                  checked={option.selected}
                                  onChange={() => {
                                    const updatedQuestions = questionnaire.questions.map(question => {
                                      if (question.question_id === q.question_id) {
                                        const updatedOptions = question.options.map(opt => {
                                          if (q.que_type_id === 1) {
                                            return { ...opt, selected: opt.option_id === option.option_id };
                                          } else {
                                            if (opt.option_id === option.option_id) {
                                              return { ...opt, selected: !opt.selected };
                                            }
                                            return opt;
                                          }
                                        });
                                        return { ...question, options: updatedOptions };
                                      }
                                      return question;
                                    });
                                    setQuestionnaire({ ...questionnaire, questions: updatedQuestions });
                                  }}
                                />
                                {option.option}
                                {option.specify_flag === 1 && option.selected && (
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ marginLeft: '20px', width: '200px', display: 'inline-block' }}
                                    placeholder="Specify..."
                                    value={option.specification || ''}
                                    onChange={(e) => {
                                      const updatedQuestions = questionnaire.questions.map(question => {
                                        if (question.question_id === q.question_id) {
                                          const updatedOptions = question.options.map(opt =>
                                            opt.option_id === option.option_id
                                              ? { ...opt, specification: e.target.value }
                                              : opt
                                          );
                                          return { ...question, options: updatedOptions };
                                        }
                                        return question;
                                      });
                                      setQuestionnaire({ ...questionnaire, questions: updatedQuestions });
                                    }}
                                  />
                                )}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="ion-btn ion-btn-close"
                onClick={() => {
                  setShowQuestionnaire(false);
                  setQuestionnaire(null);
                }}
                disabled={submitting}
              >
                Close
              </button>
              {questionnaire && (
                <button
                  className="ion-btn ion-btn-save"
                  onClick={submitQuestionnaire}
                  disabled={submitting || questionLoading}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ COMMENTS MODAL ============ */}
      {showComments && (
        <div className="modal-overlay" onClick={() => setShowComments(false)}>
          <div className="modal-box comments-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{commentType === 'group' ? 'Group' : 'Individual'} Comments</h3>
              <div className="comment-type-toggle">
                <button
                  className={`toggle-btn ${commentType === 'group' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedScheduleId) {
                      openComments(selectedScheduleId, 'group');
                    }
                  }}
                >
                  Group
                </button>
                <button
                  className={`toggle-btn ${commentType === 'individual' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedScheduleId) {
                      openComments(selectedScheduleId, 'individual');
                    }
                  }}
                >
                  Individual
                </button>
              </div>
              <button className="modal-close" onClick={() => setShowComments(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {commentLoading ? (
                <div className="loading-state">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="loading-text">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="no-data-message">
                  <p className="no-data-text">No comments yet</p>
                </div>
              ) : (
                <div className="comments-list">
                  {comments.map((comment) => {
                    const id = comment.comment_id || comment.generic_comment_id || comment.individual_comment_id;
                    return (
                      <div className="comment-item" key={id}>
                        <div className="comment-header">
                          <strong>{comment.posted_by_name}</strong>
                          <span className="comment-usn">({comment.posted_by_type})</span>
                          <span className="comment-date">
                            {new Date(comment.created_date).toLocaleString()}
                          </span>
                        </div>
                        <div className="comment-body">{comment.comment}</div>
                        {comment.attachment && (
                          <div style={{ marginTop: '8px', fontSize: '12px' }}>
                            <a href={`${API_BASE_URL}/uploads/mentoring_comments/${comment.attachment}`} target="_blank" rel="noopener noreferrer">
                              📎 {comment.attachment}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="comment-input-area">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Write your comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="attach-btn" style={{ cursor: 'pointer', padding: '6px 12px', background: '#e9ecef', borderRadius: '4px', fontSize: '14px' }}>
                    📎 Attach File
                    <input
                      type="file"
                      hidden
                      onChange={handleAttachmentChange}
                    />
                  </label>
                  {attachment && (
                    <span style={{ fontSize: '13px', color: '#28a745' }}>
                      ✅ {attachment.name}
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    className="ion-btn ion-btn-save"
                    onClick={submitComment}
                    disabled={!commentText.trim()}
                    style={{ marginLeft: 'auto' }}
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentoringSession;