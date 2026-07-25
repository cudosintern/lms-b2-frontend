import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './IssueObservationReport.css';

// ============================================
// API Base URL - Same pattern as DepartmentDropdown
// ============================================
const API_BASE_URL = process.env.REACT_APP_API_URL;
console.log("API_BASE_URL:", API_BASE_URL);

// Faculty API - for getting student by USN
const facultyApi = axios.create({
  baseURL: API_BASE_URL + "/issues_observations_report",
  headers: { 'Content-Type': 'application/json' },
});

// Student API - for all other operations
const studentApi = axios.create({
  baseURL: API_BASE_URL + "/stud_issues_observations_report",
  headers: { 'Content-Type': 'application/json' },
});

// Add token interceptor to both APIs
const tokenInterceptor = (config: any) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

facultyApi.interceptors.request.use(tokenInterceptor);
studentApi.interceptors.request.use(tokenInterceptor);

console.log("Faculty API Base URL:", facultyApi.defaults.baseURL);
console.log("Student API Base URL:", studentApi.defaults.baseURL);

// --- Types ---
interface ApiResponse<T = unknown> {
  status?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface ReportListItem {
  lms_isnob_id: number;
  report_title: string;
  counselling_date: string;
  mentor_name: string | null;
  mentor_status: number;
  mentee_status: number;
  report_status: string;
  can_agree: boolean;
}

interface ReportDetail {
  lms_isnob_id: number;
  academic_batch_id: number;
  semester_id: number;
  ssd_id: number;
  student_usn: string;
  report_title: string;
  counselling_date: string;
  mentor_users_id: number;
  mentor_name: string | null;
  purpose_of_meeting_desc: string;
  observation_desc: string;
  comm_parent_flag: number;
  comm_high_auth_flag: number;
  mentor_status: number;
  mentee_status: number;
  report_status: string;
  can_agree: boolean;
  created_date: string;
  modified_date: string;
}

interface HistoryItem {
  history_id?: number;
  action_type?: string;
  action_timestamp?: string;
  report_title?: string;
  counselling_date?: string;
  purpose_of_meeting_desc?: string;
  observation_desc?: string;
  comm_parent_flag?: number;
  comm_high_auth_flag?: number;
  mentor_status?: number;
  mentee_status?: number;
  mentor_name?: string | null;
}

interface AcademicBatch {
  academic_batch_id: number;
  academic_batch_code?: string;
  academic_batch_desc?: string;
}

interface Semester {
  semester_id: number;
  semester: string;
}

interface Student {
  student_id: number;
  student_usn: string;
  student_name: string;
}

// --- Status Badge Component ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string }> = {
      'In Progress': { bg: '#fef9e7', text: '#b7950b', dot: '#b7950b' },
      'Finalized': { bg: '#eafaf1', text: '#1e8449', dot: '#1e8449' },
      'Pending': { bg: '#fdebd0', text: '#ca6f1e', dot: '#ca6f1e' },
      'Completed': { bg: '#d6eaf8', text: '#1a5276', dot: '#1a5276' },
    };
    return configs[status] || configs['In Progress'];
  };

  const config = getStatusConfig(status);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 14px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '500',
        border: '1px solid #e5e7eb',
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.dot,
          display: 'inline-block',
        }}
      />
      {status}
    </div>
  );
};

// --- Main Component ---
const StudentIssueObservationReport: React.FC = () => {
  // State for student search
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentUSN, setStudentUSN] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [usnInput, setUsnInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [usnError, setUsnError] = useState<string | null>(null);
  const [studentFound, setStudentFound] = useState(false);

  // State for reports
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [reportDetail, setReportDetail] = useState<ReportDetail | null>(null);

  // State for curriculum and term
  const [academicBatches, setAcademicBatches] = useState<AcademicBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  // State for history
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // UI state
  const [pageError, setPageError] = useState<string | null>(null);
  const [isAgreeing, setIsAgreeing] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  const usnRef = useRef<HTMLInputElement | null>(null);

  // Utility: format date
  const formatDate = useCallback((value?: string) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return value;
    }
  }, []);

  // ✅ Get student by USN - FACULTY API
  const resolveStudentId = useCallback(async (usn: string) => {
    try {
      const resp = await facultyApi.get<ApiResponse<Student>>(
        `/get_student_by_usn/${usn}`
      );
      console.log('Student API Response (Faculty):', resp.data);
      if (resp.data.status && resp.data.data) {
        return resp.data.data;
      }
      return null;
    } catch (err: any) {
      console.log('Error fetching student:', err.response);
      return null;
    }
  }, []);

  // ✅ Fetch academic batches - STUDENT API
  const fetchAcademicBatches = useCallback(async (studentIdValue: number) => {
    if (!studentIdValue) return;
    try {
      const resp = await studentApi.get<ApiResponse<AcademicBatch[]>>(
        `/get_student_academic_batches/${studentIdValue}`
      );
      console.log('Academic Batches Response:', resp.data);
      if (resp.data && resp.data.status && Array.isArray(resp.data.data)) {
        setAcademicBatches(resp.data.data);
        if (resp.data.data.length > 0) {
          const firstBatchId = resp.data.data[0].academic_batch_id;
          setSelectedBatch(String(firstBatchId));
          await fetchSemesters(studentIdValue, firstBatchId);
        }
      }
    } catch (err) {
      console.error('Failed to load curriculum:', err);
    }
  }, []);

  // ✅ Fetch semesters - STUDENT API
  const fetchSemesters = useCallback(async (studentIdValue: number, batchId: number) => {
    if (!studentIdValue || !batchId) return;
    try {
      const resp = await studentApi.get<ApiResponse<Semester[]>>(
        `/get_student_semesters/${studentIdValue}/${batchId}`
      );
      console.log('Semesters Response:', resp.data);
      if (resp.data && resp.data.status && Array.isArray(resp.data.data)) {
        setSemesters(resp.data.data);
        if (resp.data.data.length > 0) {
          setSelectedSemester(String(resp.data.data[0].semester_id));
        }
      }
    } catch (err) {
      console.error('Failed to load semesters:', err);
    }
  }, []);

  // ✅ Load report details - STUDENT API
  const loadReportDetails = useCallback(async (reportId: number, studentIdValue: number) => {
    if (!reportId || !studentIdValue) return;
    setGlobalLoading(true);
    setPageError(null);
    try {
      const resp = await studentApi.get<ApiResponse<ReportDetail>>(
        `/get_student_issue_observation/${reportId}/${studentIdValue}`
      );
      console.log('Report Details Response:', resp.data);
      if (resp.data && resp.data.status && resp.data.data) {
        setReportDetail(resp.data.data);
        await loadReportHistory(reportId, studentIdValue);
      } else {
        setReportDetail(null);
        setPageError(resp.data?.message || 'Failed to load report details');
      }
    } catch (err: unknown) {
      setReportDetail(null);
      setPageError((err as any)?.response?.data?.message || 'Failed to load report details');
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  // ✅ Load history - STUDENT API
  const loadReportHistory = useCallback(async (reportId: number, studentIdValue: number) => {
    if (!reportId || !studentIdValue) return;
    try {
      const resp = await studentApi.get<ApiResponse<HistoryItem[]>>(
        `/get_student_issue_observation_history/${reportId}/${studentIdValue}`
      );
      console.log('History Response:', resp.data);
      if (resp.data && resp.data.status && Array.isArray(resp.data.data)) {
        setHistory(resp.data.data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      setHistory([]);
    }
  }, []);

  // ✅ Search student
  const searchByUSN = useCallback(async () => {
    const usn = usnInput.trim().toUpperCase();
    
    setPageError(null);
    setUsnError(null);
    setStudentUSN('');
    setStudentName('');
    setStudentFound(false);
    setReports([]);
    setReportDetail(null);
    setAcademicBatches([]);
    setSemesters([]);
    setSelectedBatch('');
    setSelectedSemester('');
    setSelectedReportId(null);
    setHistory([]);
    setStudentId(null);

    if (!usn) {
      setUsnError('Please enter a USN');
      return;
    }

    setIsSearching(true);
    try {
      const student = await resolveStudentId(usn);
      
      if (!student) {
        setPageError('Student not found');
        setIsSearching(false);
        return;
      }

      const studentIdValue = student.student_id;
      
      setStudentId(studentIdValue);
      setStudentUSN(student.student_usn);
      setStudentName(student.student_name);
      setStudentFound(true);

      // ✅ Get reports - STUDENT API
      const reportsResp = await studentApi.get<ApiResponse<ReportListItem[]>>(
        `/get_student_issue_observations/${studentIdValue}`
      );
      console.log('Reports Response:', reportsResp.data);

      if (reportsResp.data && reportsResp.data.status && Array.isArray(reportsResp.data.data)) {
        const list = reportsResp.data.data;
        setReports(list);

        await fetchAcademicBatches(studentIdValue);

        if (list.length > 0) {
          const firstId = list[0].lms_isnob_id;
          setSelectedReportId(firstId);
          await loadReportDetails(firstId, studentIdValue);
        } else {
          setSelectedReportId(null);
          setReportDetail(null);
          setHistory([]);
          setPageError('No reports available for this student');
        }
      } else {
        setSelectedReportId(null);
        setReportDetail(null);
        setHistory([]);
        setPageError(reportsResp.data?.message || 'No reports available for this student');
      }
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.message || 'Failed to search student. Please try again.';
      setPageError(message);
    } finally {
      setIsSearching(false);
    }
  }, [usnInput, resolveStudentId, fetchAcademicBatches, loadReportDetails]);

  // ✅ Handle curriculum change
  const handleCurriculumChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const batchId = e.target.value;
    setSelectedBatch(batchId);
    if (studentId && batchId) {
      await fetchSemesters(studentId, Number(batchId));
    }
  }, [studentId, fetchSemesters]);

  // ✅ Agree action - STUDENT API
  const handleAgree = useCallback(async () => {
    if (!reportDetail || !selectedReportId || !studentId) return;
    if (reportDetail.mentee_status === 1) {
      setPageError('Already agreed to this report');
      return;
    }

    setIsAgreeing(true);
    setPageError(null);
    try {
      const resp = await studentApi.put<ApiResponse>(
        `/student_agree/${selectedReportId}/${studentId}`
      );
      console.log('Agree Response:', resp.data);
      
      if (resp.data && resp.data.status) {
        await loadReportDetails(selectedReportId, studentId);
        const rep = await studentApi.get<ApiResponse<ReportListItem[]>>(
          `/get_student_issue_observations/${studentId}`
        );
        if (rep.data && rep.data.status && Array.isArray(rep.data.data)) {
          setReports(rep.data.data);
        }
        setPageError(null);
      } else {
        setPageError(resp.data?.message || 'Failed to process agreement');
      }
    } catch (err: unknown) {
      setPageError((err as any)?.response?.data?.message || 'Failed to process agreement');
    } finally {
      setIsAgreeing(false);
    }
  }, [reportDetail, selectedReportId, studentId, loadReportDetails]);

  // ✅ When report selection changes
  useEffect(() => {
    if (!selectedReportId || !studentId) return;
    loadReportDetails(selectedReportId, studentId);
  }, [selectedReportId, studentId, loadReportDetails]);

  // ✅ Check if student can agree - with mentor validation
  const canAgree = useMemo(() => {
    // Check if report exists
    if (!reportDetail) return false;
    
    // Student must be found
    if (!studentFound) return false;
    
    // Check if mentor is assigned (has mentor_users_id and mentor_name)
    const hasMentor = reportDetail.mentor_users_id !== null 
      && reportDetail.mentor_users_id !== 0
      && reportDetail.mentor_name !== null
      && reportDetail.mentor_name !== '';
    
    // Check if can agree from API
    const canAgreeFromAPI = reportDetail.can_agree === true;
    
    // Check if student hasn't already agreed
    const notAlreadyAgreed = reportDetail.mentee_status !== 1;
    
    return hasMentor && canAgreeFromAPI && notAlreadyAgreed;
  }, [reportDetail, studentFound]);

  const onUSNKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') searchByUSN();
  };

  // Get status color for badge
  const getStatusBadgeStyle = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string }> = {
      'In Progress': { bg: '#fef9e7', text: '#b7950b', dot: '#b7950b' },
      'Finalized': { bg: '#eafaf1', text: '#1e8449', dot: '#1e8449' },
      'Pending': { bg: '#fdebd0', text: '#ca6f1e', dot: '#ca6f1e' },
      'Completed': { bg: '#d6eaf8', text: '#1a5276', dot: '#1a5276' },
    };
    return configs[status] || configs['In Progress'];
  };

  return (
    <div className="sio-outer">
      <div className="sio-panel">
        {/* Header */}
        <div className="sio-header">
          <h2 className="sio-header-title">Issues and Observations Report</h2>
        </div>

        <div className="sio-body">
          {globalLoading && (
            <div className="sio-loading-overlay">
              <div className="sio-spinner" />
            </div>
          )}

          {pageError && <div className="sio-alert">{pageError}</div>}

          {/* Status Badge - Top Right */}
          {reportDetail?.report_status && studentFound && (
            <div className="sio-status-wrapper">
              <div 
                className="sio-status-badge"
                style={{
                  backgroundColor: getStatusBadgeStyle(reportDetail.report_status).bg,
                  color: getStatusBadgeStyle(reportDetail.report_status).text,
                }}
              >
                <span 
                  className="sio-status-dot"
                  style={{
                    backgroundColor: getStatusBadgeStyle(reportDetail.report_status).dot,
                  }}
                />
                {reportDetail.report_status}
              </div>
            </div>
          )}

          {/* Filters Row - 4 columns: USN, Curriculum, Term, Report */}
          <div className="sio-filters-section">
            <div className="sio-filters-grid">
              {/* Student USN */}
              <div className="sio-filter-group">
                <label className="sio-filter-label">
                  Student USN: <span className="required">*</span>
                </label>
                <div className="sio-search-wrapper">
                  <input
                    ref={usnRef}
                    className={`sio-filter-input ${usnError ? 'sio-input-error' : ''}`}
                    value={usnInput}
                    onChange={(e) => { setUsnInput(e.target.value); setUsnError(null); }}
                    onKeyDown={onUSNKeyDown}
                    placeholder="Enter USN"
                    disabled={isSearching}
                  />
                  <button className="sio-search-btn" onClick={searchByUSN} disabled={isSearching}>
                    {isSearching ? <div className="sio-spinner-small" /> : <Search size={16} />}
                  </button>
                </div>
                {usnError ? (
                  <div className="sio-hint error">{usnError}</div>
                ) : studentFound ? (
                  <div className="sio-hint success">✓ Student found: {studentName}</div>
                ) : (
                  <div className="sio-hint info">Press 'Enter' key after typing USN.</div>
                )}
              </div>

              {/* Curriculum */}
              <div className="sio-filter-group">
                <label className="sio-filter-label">
                  Curriculum: <span className="required">*</span>
                </label>
                <select
                  className="sio-filter-select"
                  value={selectedBatch}
                  onChange={handleCurriculumChange}
                  disabled={!studentFound || academicBatches.length === 0}
                >
                  <option value="">Select Curriculum</option>
                  {academicBatches.map((batch) => (
                    <option key={batch.academic_batch_id} value={batch.academic_batch_id}>
                      {batch.academic_batch_desc || batch.academic_batch_code || `Batch ${batch.academic_batch_id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term */}
              <div className="sio-filter-group">
                <label className="sio-filter-label">
                  Term: <span className="required">*</span>
                </label>
                <select
                  className="sio-filter-select"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  disabled={!studentFound || semesters.length === 0}
                >
                  <option value="">Select Term</option>
                  {semesters.map((s) => (
                    <option key={s.semester_id} value={s.semester_id}>{s.semester}</option>
                  ))}
                </select>
              </div>

              {/* Report */}
              <div className="sio-filter-group">
                <label className="sio-filter-label">
                  Report: <span className="required">*</span>
                </label>
                <select
                  className="sio-filter-select"
                  value={selectedReportId ?? ''}
                  onChange={(e) => setSelectedReportId(Number(e.target.value) || null)}
                  disabled={!studentFound}
                >
                  <option value="">Create Report</option>
                  {reports.map((r) => (
                    <option key={r.lms_isnob_id} value={r.lms_isnob_id}>
                      {r.report_title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Report Title */}
          <div className="sio-report-title-wrapper">
            <label className="sio-filter-label">
              Report Title: <span className="required">*</span>
            </label>
            <input
              className="sio-report-title-input"
              value={reportDetail?.report_title || ''}
              readOnly
              placeholder="Report Title:"
            />
          </div>

          {/* Info Table - 2x2 Grid */}
          <div className="sio-info-table-wrapper">
            <table className="sio-info-table">
              <tbody>
                <tr>
                  <td className="sio-info-label">USN:</td>
                  <td className="sio-info-value">{studentUSN || '-'} {studentName ? `[- ${studentName}]` : ''}</td>
                  <td className="sio-info-label">Mentor:</td>
                  <td className="sio-info-value">{reportDetail?.mentor_name || ''}</td>
                </tr>
                <tr>
                  <td className="sio-info-label">Counselling Date:</td>
                  <td className="sio-info-value">{reportDetail?.counselling_date ? formatDate(reportDetail.counselling_date) : 'DD-MM-YYYY'}</td>
                  <td className="sio-info-label">Term:</td>
                  <td className="sio-info-value">{selectedSemester || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Purpose of Meeting */}
          <div className="sio-rich-section">
            <label className="sio-filter-label">
              Purpose of meeting / Issue reported: <span className="required">*</span>
            </label>
            <div className="sio-rich-wrapper">
              <div className="sio-toolbar">
                <button className="sio-toolbar-btn">↩</button>
                <button className="sio-toolbar-btn">↪</button>
                <span className="sio-toolbar-divider" />
                <button className="sio-toolbar-btn sio-toolbar-btn-bold">B</button>
                <button className="sio-toolbar-btn sio-toolbar-btn-italic">I</button>
                <span className="sio-toolbar-divider" />
                <button className="sio-toolbar-btn">≡</button>
                <button className="sio-toolbar-btn">☰</button>
                <button className="sio-toolbar-btn">⋮</button>
                <span className="sio-toolbar-divider" />
                <button className="sio-toolbar-btn">•</button>
                <button className="sio-toolbar-btn">1.</button>
                <button className="sio-toolbar-btn">🔗</button>
              </div>
              <textarea
                className="sio-textarea"
                value={reportDetail?.purpose_of_meeting_desc || ''}
                readOnly
                placeholder="Formats: B / I / E / A / B / I / E / A / B / I / E / A / B / I"
              />
              <div className="sio-counter">
                {(reportDetail?.purpose_of_meeting_desc || '').length}
              </div>
            </div>
          </div>

          {/* Observations */}
          <div className="sio-rich-section">
            <label className="sio-filter-label">
              Observations and Action Taken: <span className="required">*</span>
            </label>
            <div className="sio-rich-wrapper">
              <div className="sio-toolbar">
                <button className="sio-toolbar-btn">↩</button>
                <button className="sio-toolbar-btn">↪</button>
                <span className="sio-toolbar-divider" />
                <button className="sio-toolbar-btn sio-toolbar-btn-bold">B</button>
                <button className="sio-toolbar-btn sio-toolbar-btn-italic">I</button>
                <span className="sio-toolbar-divider" />
                <button className="sio-toolbar-btn">≡</button>
                <button className="sio-toolbar-btn">☰</button>
                <button className="sio-toolbar-btn">⋮</button>
                <span className="sio-toolbar-divider" />
                <button className="sio-toolbar-btn">•</button>
                <button className="sio-toolbar-btn">1.</button>
                <button className="sio-toolbar-btn">🔗</button>
              </div>
              <textarea
                className="sio-textarea"
                value={reportDetail?.observation_desc || ''}
                readOnly
                placeholder="Formats: B / I / E / A / B / I / E / A / B / I / E / A / B / I"
              />
              <div className="sio-counter">
                {(reportDetail?.observation_desc || '').length}
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="sio-signatures-section">
            <div className="sio-signature-group">
              <label className="sio-filter-label">Mentee Signature with Date</label>
              <div className="sio-sign-box">
                {reportDetail?.mentee_status === 1 ? (
                  <span className="sio-sign-agree">✓ Agreed on {reportDetail.modified_date ? formatDate(reportDetail.modified_date) : ''}</span>
                ) : (
                  <span className="sio-sign-wait">Waiting for signature</span>
                )}
              </div>
            </div>
            <div className="sio-signature-group">
              <label className="sio-filter-label">Mentor Signature with Date</label>
              <div className="sio-sign-box">
                {reportDetail?.mentor_status === 2 ? (
                  <span className="sio-sign-agree">✓ Agreed on {reportDetail.modified_date ? formatDate(reportDetail.modified_date) : ''}</span>
                ) : (
                  <span className="sio-sign-wait">Waiting for signature</span>
                )}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="sio-history-section">
            <button className="sio-history-toggle" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? '▼' : '▶'} History
              <span className="sio-history-count">({history.length})</span>
            </button>
            {showHistory && (
              <div className="sio-history-panel">
                {history.length === 0 ? (
                  <div className="sio-history-empty">No history available</div>
                ) : (
                  <table className="sio-history-table">
                    <thead>
                      <tr><th>Date</th><th>Updated By</th><th>Status</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i}>
                          <td>{h.action_timestamp ? formatDate(h.action_timestamp) : '-'}</td>
                          <td>{h.mentor_name ?? 'System'}</td>
                          <td>
                            <span className={`sio-history-status ${(h.mentor_status === 2 && h.mentee_status === 1) ? 'sio-history-status-finalized' : 'sio-history-status-progress'}`}>
                              {(h.mentor_status === 2 && h.mentee_status === 1) ? 'Finalized' : 'In Progress'}
                            </span>
                          </td>
                          <td>{h.action_type ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sio-footer">
            <div className="sio-copyright">
              IonCUDOS v8.0 - Copyright © 2014 by IonIdea.
            </div>
            <div className="sio-actions">
              <button
                className="sio-btn sio-btn-cancel"
                onClick={() => {
                  setReports([]);
                  setReportDetail(null);
                  setHistory([]);
                  setSelectedReportId(null);
                  setStudentUSN('');
                  setUsnInput('');
                  setStudentName('');
                  setStudentFound(false);
                  setAcademicBatches([]);
                  setSelectedBatch('');
                  setSemesters([]);
                  setSelectedSemester('');
                  setPageError(null);
                  setStudentId(null);
                }}
                disabled={globalLoading || isAgreeing}
              >
                Cancel
              </button>

              {/* ✅ Always visible Agree button with dynamic state */}
              <button
                className={`sio-btn sio-btn-agree ${canAgree ? 'active' : 'disabled'}`}
                onClick={handleAgree}
                disabled={!canAgree || globalLoading || isAgreeing}
                title={
                  !studentFound ? 'Please search for a student first' :
                  !reportDetail ? 'No report selected' :
                  !reportDetail.mentor_users_id || reportDetail.mentor_users_id === 0 || !reportDetail.mentor_name ? '❌ No mentor assigned to this report' :
                  reportDetail.mentee_status === 1 ? '✅ You have already agreed to this report' :
                  !reportDetail.can_agree ? '⏳ Waiting for mentor approval' :
                  'Click to agree to this report'
                }
              >
                <CheckCircle size={16} />
                {isAgreeing ? 'Processing...' : 'Agree'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentIssueObservationReport;