import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../utils/api';
import { toast } from 'react-toastify';
import { LocalStorageHelper } from '../../../utils/localStorageHelper';
import { loginData } from '../../login/loginModel';

interface SharedAssignment {
  map_assignment_student_id: number;
  lms_assignment_id: number;
  ssd_id: number;
  student_usn: string;
  student_file_name: string | null;
  student_file_path: string | null;
  seen_on: string | null;
  accept_rework_flag: number | null;
  secured_marks: number | null;
  remark: string | null;
  assignment_justification: string | null;
  current_comments: string | null;
  assignment_name: string;
  additional_info: string | null;
  assignment_file_name: string | null;
  assignment_file_path: string | null;
  issue_date: string | null;
  due_date: string | null;
  crs_id: number | null;
  topic_id: number | null;
  topic_title: string;
  section_name: string;
  crs_code: string;
  crs_title: string;
  assignment_created_date: string | null;
  assignment_modified_date: string | null;
  update_count: number | null;
}

const STUDENT_ASSIGN_API = '/api/v1/student_assignment';

const fmtDate = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getStatusInfo = (a: SharedAssignment): { label: string; color: string; bg: string } => {
  const flag = Number(a.accept_rework_flag || 0);
  if (flag === 1) return { label: 'Accepted', color: 'text-green-700', bg: 'bg-green-100' };
  if (flag === 2) return { label: 'Rework', color: 'text-amber-700', bg: 'bg-amber-100' };
  if (a.student_file_name) return { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-100' };
  if (a.due_date) {
    const due = new Date(a.due_date);
    if (!isNaN(due.getTime()) && new Date() > due) return { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-100' };
  }
  return { label: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100' };
};

const isModifiedAfterShare = (a: SharedAssignment): boolean => {
  if (!a.assignment_modified_date || !a.seen_on) return false;
  return new Date(a.assignment_modified_date) > new Date(a.seen_on);
};

const MyAssignmentPage: React.FC = () => {
  const authState = LocalStorageHelper.getObject<loginData>('auth_state');
  // Student's iems_students.student_id — used to look up their assignments
  const studentId: number = (authState as any)?.student_id ?? (authState as any)?.id ?? 1;

  const [assignments, setAssignments] = useState<SharedAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Course filter derived from loaded data — no API call needed
  const [courseFilter, setCourseFilter] = useState('');

  // Upload modal
  const [uploadModal, setUploadModal] = useState<SharedAssignment | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Detail modal
  const [detailModal, setDetailModal] = useState<SharedAssignment | null>(null);

  // Auto-load on mount — just student_id, no dropdowns needed
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const r: any = await axiosInstance.get(`${STUDENT_ASSIGN_API}/my-assignments`, {
        params: { student_id: studentId },
      });
      const items = r.data?.data?.items ?? r.data?.items ?? r.data;
      setAssignments(Array.isArray(items) ? items : []);
    } catch {
      setAssignments([]);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const handleUpload = async () => {
    if (!uploadModal || !uploadFile) { toast.error('Select a file to upload'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      await axiosInstance.post(
        `${STUDENT_ASSIGN_API}/student-upload/${uploadModal.map_assignment_student_id}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      toast.success('Submission uploaded successfully!');
      setUploadModal(null);
      setUploadFile(null);
      fetchAssignments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const downloadAssignment = (assignment: SharedAssignment) => {
    // If no file was uploaded by faculty for this assignment, show a clear message
    if (!assignment.assignment_file_name) {
      toast.info('No file attached to this assignment by the faculty.');
      return;
    }
    
    // Trigger native browser download directly via the API URL.
    // The server handles the 'Content-Disposition' header with the exact filename.
    const baseURL = axiosInstance.defaults.baseURL || '';
    const url = `${baseURL}${STUDENT_ASSIGN_API}/download/${assignment.lms_assignment_id}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derive unique courses for the course filter chip bar
  const uniqueCourses = Array.from(
    new Map(assignments.map(a => [a.crs_id, { crs_id: a.crs_id, crs_code: a.crs_code, crs_title: a.crs_title }])).values()
  ).filter(c => c.crs_id);

  const filtered = assignments.filter(a => {
    const matchesCourse = !courseFilter || String(a.crs_id) === courseFilter;
    const matchesSearch =
      a.assignment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.topic_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.crs_title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCourse && matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / showEntries));
  const pageData = filtered.slice((currentPage - 1) * showEntries, currentPage * showEntries);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * showEntries + 1;
  const end = Math.min(currentPage * showEntries, filtered.length);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5 flex justify-between items-center">
          <h1 className="text-sm font-semibold">My Assignments</h1>
          <button onClick={fetchAssignments} disabled={loading}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded">
            {loading ? '⟳' : '↻'} Refresh
          </button>
        </div>

        <div className="p-4">

          {/* Summary bar */}
          {!loading && assignments.length > 0 && (
            <div className="mb-3 flex items-center gap-3 flex-wrap">
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
                📋 {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} shared with you
              </span>
              {/* Course filter chips */}
              {uniqueCourses.length > 1 && (
                <>
                  <span className="text-xs text-gray-400">Filter by course:</span>
                  <button
                    onClick={() => { setCourseFilter(''); setCurrentPage(1); }}
                    className={`text-xs px-2 py-0.5 rounded-full border transition ${!courseFilter ? 'bg-[#1f3a4f] text-white border-[#1f3a4f]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#1f3a4f]'}`}
                  >
                    All
                  </button>
                  {uniqueCourses.map(c => (
                    <button
                      key={c.crs_id}
                      onClick={() => { setCourseFilter(String(c.crs_id)); setCurrentPage(1); }}
                      className={`text-xs px-2 py-0.5 rounded-full border transition ${courseFilter === String(c.crs_id) ? 'bg-[#1f3a4f] text-white border-[#1f3a4f]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#1f3a4f]'}`}
                    >
                      {c.crs_code || c.crs_title}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Table Controls */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select className="border border-gray-300 rounded px-2 py-0.5 text-sm"
                value={showEntries} onChange={e => { setShowEntries(Number(e.target.value)); setCurrentPage(1); }}>
                {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Search:</span>
              <input type="text" className="border border-gray-300 rounded px-2 py-0.5 text-sm w-44"
                placeholder="Assignment, topic, course..."
                value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="w-full text-sm">
              <thead className="bg-[#d6dde3] text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left w-10">Sl No.</th>
                  <th className="px-3 py-2 text-left">Assignment Name</th>
                  <th className="px-3 py-2 text-left">Course</th>
                  <th className="px-3 py-2 text-left">Topic</th>
                  <th className="px-3 py-2 text-left">Issue Date</th>
                  <th className="px-3 py-2 text-left">Due Date</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Loading your assignments...
                    </div>
                  </td></tr>
                ) : pageData.length > 0 ? pageData.map((a, idx) => {
                  const status = getStatusInfo(a);
                  return (
                    <tr key={a.map_assignment_student_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{(currentPage - 1) * showEntries + idx + 1}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => setDetailModal(a)} className="font-medium text-blue-700 hover:underline text-left">
                          {a.assignment_name}
                        </button>
                        {(a.update_count ?? 0) > 0 && (
                          <span
                            className="ml-1.5 inline-flex items-center justify-center w-[18px] h-[18px] text-[10px] bg-orange-100 text-orange-600 rounded-full font-bold cursor-help align-middle border border-orange-200"
                            title={`Assignment updated ${a.update_count} time(s) by faculty after sharing`}
                          >ℹ</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">{a.crs_code ? `${a.crs_code} — ${a.crs_title}` : (a.crs_title || '—')}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{a.topic_title || '—'}</td>
                      <td className="px-3 py-2 text-xs">{fmtDate(a.issue_date)}</td>
                      <td className="px-3 py-2 text-xs">{fmtDate(a.due_date)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                        {a.secured_marks != null && (
                          <span className="ml-1 text-xs text-gray-500">({a.secured_marks} marks)</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {a.accept_rework_flag === 2 && (
                            <div className="w-full mb-1 flex items-center gap-1 bg-amber-50 border border-amber-300 rounded px-2 py-1 text-[10px] text-amber-800 font-medium">
                              ⚠️ Rework needed
                              {a.remark && <span className="font-normal truncate max-w-[140px]" title={a.remark}>— {a.remark}</span>}
                            </div>
                          )}
                          <button onClick={() => setDetailModal(a)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded hover:bg-indigo-200">View</button>
                          {a.assignment_file_name && (
                            <button onClick={() => downloadAssignment(a)} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded hover:bg-orange-200">Download</button>
                          )}
                          {(status.label === 'Pending' || status.label === 'Rework' || status.label === 'Overdue') && (
                            <button onClick={() => { setUploadModal(a); setUploadFile(null); }} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200">Upload</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {assignments.length === 0 ? 'No assignments have been shared with you yet.' : 'No assignments match the current filter.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
            <span>Showing {start} to {end} of {filtered.length} entries</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">Upload Submission</span>
              <button onClick={() => setUploadModal(null)} className="text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Assignment:</span>{' '}
                <span className="text-blue-700">{uploadModal.assignment_name}</span>
              </div>
              {uploadModal.due_date && (
                <div className="text-xs text-gray-500">Due: <span className="font-medium">{fmtDate(uploadModal.due_date)}</span></div>
              )}
              {uploadModal.accept_rework_flag === 2 && uploadModal.remark && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
                  <span className="font-semibold">Faculty Remark:</span> {uploadModal.remark}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose File</label>
                <div className="flex gap-2">
                  <input type="text" readOnly placeholder="No file chosen" value={uploadFile?.name || ''}
                    className="flex-1 border border-gray-300 rounded-l px-3 py-2 text-sm bg-gray-50" />
                  <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-r cursor-pointer whitespace-nowrap">
                    Browse
                    <input type="file" className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                      onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <p className="text-xs text-orange-500 mt-1">PDF, DOC, PPT, XLS, PNG, JPG, ZIP (max 10MB)</p>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 rounded-b-lg flex justify-end gap-2">
              <button onClick={() => setUploadModal(null)} className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleUpload} disabled={!uploadFile || uploading}
                className="px-4 py-2 text-sm bg-[#1f3a4f] text-white rounded hover:bg-[#17404e] disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center sticky top-0">
              <span className="font-semibold text-sm">Assignment Details</span>
              <button onClick={() => setDetailModal(null)} className="text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">{detailModal.assignment_name}</h2>
                {detailModal.crs_code && <p className="text-xs text-gray-500 mt-0.5">{detailModal.crs_code} — {detailModal.crs_title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Issue Date', value: fmtDate(detailModal.issue_date) },
                  { label: 'Due Date', value: fmtDate(detailModal.due_date) },
                  { label: 'Section', value: detailModal.section_name || '—' },
                  { label: 'Topic', value: detailModal.topic_title || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded p-2.5">
                    <div className="text-gray-500 mb-0.5 font-medium">{label}</div>
                    <div className="text-gray-800">{value}</div>
                  </div>
                ))}
              </div>
              {detailModal.additional_info && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Description / Instructions</div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 whitespace-pre-wrap">{detailModal.additional_info}</div>
                </div>
              )}
              {detailModal.assignment_file_name && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded p-3">
                  <span className="text-sm">📎</span>
                  <span className="text-xs text-blue-800 flex-1">{detailModal.assignment_file_name}</span>
                  <button onClick={() => downloadAssignment(detailModal)}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Download</button>
                </div>
              )}
              <hr />
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Your Submission</div>
                {detailModal.student_file_name ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2">
                    <span>✅</span>
                    <span className="text-xs text-green-800 flex-1">{detailModal.student_file_name}</span>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded p-3 text-xs text-gray-400 text-center">No submission uploaded yet.</div>
                )}
              </div>
              {(detailModal.secured_marks != null || detailModal.remark) && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-2">Faculty Feedback</div>
                  <div className="bg-gray-50 rounded p-3 space-y-1">
                    {detailModal.secured_marks != null && <div className="text-sm"><span className="font-medium text-gray-700">Marks:</span> {detailModal.secured_marks}</div>}
                    {detailModal.remark && <div className="text-sm"><span className="font-medium text-gray-700">Remark:</span> {detailModal.remark}</div>}
                    {detailModal.current_comments && <div className="text-sm"><span className="font-medium text-gray-700">Comments:</span> {detailModal.current_comments}</div>}
                  </div>
                </div>
              )}
              {(isModifiedAfterShare(detailModal) || (detailModal.update_count ?? 0) > 0) && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 text-xs text-orange-700 flex items-center gap-1.5">
                  ℹ️ This assignment was updated {detailModal.update_count ? `${detailModal.update_count} time(s)` : ''} by faculty after sharing.
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-gray-50 rounded-b-lg flex justify-end gap-2 sticky bottom-0">
              {(getStatusInfo(detailModal).label === 'Pending' || getStatusInfo(detailModal).label === 'Rework') && (
                <button onClick={() => { setDetailModal(null); setUploadModal(detailModal); setUploadFile(null); }}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">Upload Submission</button>
              )}
              <button onClick={() => setDetailModal(null)} className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAssignmentPage;
