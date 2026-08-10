import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../utils/api';
import { toast } from 'react-toastify';
import { LocalStorageHelper } from '../../../utils/localStorageHelper';
import { loginData } from '../../login/loginModel';

interface Curriculum { academic_batch_id: number; academic_batch_desc: string; academic_batch_code: string; academic_year?: string; }
interface Term { semester_id: number; semester: number; semester_desc: string; }
interface Course { crs_id: number; crs_code: string; crs_title: string; }
interface Section { section_id: number; section: string; }
interface Topic { topic_id: number; topic_title: string; topic_code?: string; }
interface Assignment {
  lms_assignment_id: number; assignment_name: string; additional_info: string | null;
  crs_id: number | null; due_date: string | null; issue_date: string | null;
  status: number; created_by: number; created_date: string; shared_students_count: number;
  file_name?: string; file_path?: string;
  // Fields populated when backend joins them
  section?: string; section_name?: string;
  topic?: string; topic_title?: string; topic_name?: string;
  section_id?: number | string;
  topic_id?: number | string;
  bloom_ids?: number[];
  update_count?: number;
}
interface BloomLevel { bloom_id: number; bloom_name: string; bloom_code: string; }
interface ShareStudent { student_id: number; usno: string; name: string; first_name: string; last_name: string; }

const QUIZ_META = '/api/v1/manage-quiz';
const ASSIGN_API = '/api/v1/manage-assignment/assignment';

const fmtDate = (v: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Pick the section label from multiple possible field names
const getSectionLabel = (a: Assignment) => a.section_name || a.section || '—';
// Pick the topic label from multiple possible field names
const getTopicLabel = (a: Assignment) => a.topic_title || a.topic_name || a.topic || '—';

type ModalMode = 'add' | 'edit' | 'share' | null;

const defaultForm = {
  assignment_name: '', additional_info: '',
  issue_date: '', due_date: '',
  topic_id: '' as string,
  section_id: '' as string,
  bloom_ids: [] as number[],
};



const ManageAssignmentPage: React.FC = () => {
  const authState = LocalStorageHelper.getObject<loginData>('auth_state');
  const userId: number = (authState as any)?.user_id ?? (authState as any)?.id ?? 1;

  // Dropdown state
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingSection, setLoadingSection] = useState(false);

  // Data
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [bloomLevels, setBloomLevels] = useState<BloomLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Share modal
  const [shareStudents, setShareStudents] = useState<ShareStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sharedStatusMap, setSharedStatusMap] = useState<Map<number, any>>(new Map());
  const [assignmentDetails, setAssignmentDetails] = useState<any>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // View Students modal
  const [viewStudentsModal, setViewStudentsModal] = useState<{assignment: Assignment, students: any[]} | null>(null);
  const [loadingViewStudents, setLoadingViewStudents] = useState(false);

  // Review modal
  const [reviewModal, setReviewModal] = useState<{ mapId: number; student: any } | null>(null);
  const [reviewForm, setReviewForm] = useState<{ action: 'approve' | 'rework' | 'pending'; secured_marks: string; remark: string }>({ action: 'approve', secured_marks: '', remark: '' });
  const [reviewSaving, setReviewSaving] = useState(false);

  // Load topics when course changes
  const loadTopics = useCallback((batchId: string, termId: string, courseId: string) => {
    if (!batchId || !termId || !courseId) { setTopics([]); return; }
    setLoadingTopics(true);
    axiosInstance.get(`${QUIZ_META}/meta/topics`, {
      params: { academic_batch_id: Number(batchId), semester_id: Number(termId), crs_id: Number(courseId) }
    })
      .then((r: any) => { setTopics(Array.isArray(r.data?.data) ? r.data.data : []); setLoadingTopics(false); })
      .catch(() => { setTopics([]); setLoadingTopics(false); });
  }, []);

  // Load curriculums on mount
  useEffect(() => {
    setLoadingBatch(true);
    const doneA = () => setLoadingBatch(false);
    axiosInstance.get(`${QUIZ_META}/meta/curriculums`)
      .then((r: any) => { setCurriculums(Array.isArray(r.data?.data) ? r.data.data : []); doneA(); }, doneA);
    // Load bloom levels
    axiosInstance.get(`${ASSIGN_API}/meta/bloom-levels`)
      .then((r: any) => { const d = r.data?.data; setBloomLevels(Array.isArray(d) ? d : []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBatch) { setTerms([]); setSelectedTerm(''); setCourses([]); setSelectedCourse(''); setSections([]); setSelectedSection(''); setTopics([]); return; }
    setLoadingTerm(true);
    const doneB = () => setLoadingTerm(false);
    axiosInstance.get(`${QUIZ_META}/meta/terms`, { params: { academic_batch_id: selectedBatch } })
      .then((r: any) => { setTerms(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedTerm(''); setCourses([]); setSelectedCourse(''); setSections([]); setSelectedSection(''); setTopics([]); doneB(); }, doneB);
  }, [selectedBatch]);

  useEffect(() => {
    if (!selectedBatch || !selectedTerm) { setCourses([]); setSelectedCourse(''); setSections([]); setSelectedSection(''); setTopics([]); return; }
    setLoadingCourse(true);
    const doneC = () => setLoadingCourse(false);
    axiosInstance.get(`${QUIZ_META}/meta/courses`, { params: { academic_batch_id: selectedBatch, semester_id: selectedTerm } })
      .then((r: any) => { setCourses(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedCourse(''); setSections([]); setSelectedSection(''); setTopics([]); doneC(); }, doneC);
  }, [selectedBatch, selectedTerm]);

  useEffect(() => {
    if (!selectedBatch || !selectedTerm) { setSections([]); setSelectedSection(''); return; }
    setLoadingSection(true);
    const doneD = () => setLoadingSection(false);
    axiosInstance.get(`${QUIZ_META}/meta/sections`, { params: { academic_batch_id: selectedBatch, semester_id: selectedTerm } })
      .then((r: any) => { setSections(Array.isArray(r.data?.data) ? r.data.data : []); setSelectedSection(''); doneD(); }, doneD);
  }, [selectedBatch, selectedTerm]);

  // When course changes, reload topics
  useEffect(() => {
    loadTopics(selectedBatch, selectedTerm, selectedCourse);
  }, [selectedBatch, selectedTerm, selectedCourse, loadTopics]);

  const fetchAssignments = useCallback(async () => {
    // Only fetch when all three required dropdowns are selected
    if (!selectedBatch || !selectedTerm || !selectedCourse) {
      setAssignments([]);
      return;
    }
    setLoading(true);
    try {
      const params: any = {
        created_by: userId,
        academic_batch_id: Number(selectedBatch),
        semester_id: Number(selectedTerm),
        crs_id: Number(selectedCourse),
      };
      const r: any = await axiosInstance.get(`${ASSIGN_API}/list`, { params });
      const items = r.data?.data?.items ?? r.data?.items ?? r.data;
      const fetched = Array.isArray(items) ? items : [];
      setAssignments(fetched);
    } catch {
      setAssignments([]);
    }
    finally { setLoading(false); }
  }, [userId, selectedBatch, selectedTerm, selectedCourse]);

  useEffect(() => {
    fetchAssignments();
  }, [selectedBatch, selectedTerm, selectedCourse, fetchAssignments]);

  const closeModal = () => {
    setModalMode(null); setForm(defaultForm); setSelectedAssignment(null);
    setAssignmentFile(null);
    setShareStudents([]); setSelectedStudentIds(new Set());
  };

  const openAdd = () => {
    setForm({ ...defaultForm, section_id: selectedSection });
    setSelectedAssignment(null);
    setModalMode('add');
  };

  const openEdit = async (a: Assignment) => {
    setSelectedAssignment(a);
    setAssignmentFile(null);
    
    // Fix section_id mismatch caused by MIN(id) grouping in backend dropdown options
    let mappedSectionId = a.section_id ? String(a.section_id) : selectedSection;
    if (a.section_id) {
      const exactMatch = sections.find(s => String(s.section_id) === String(a.section_id));
      if (!exactMatch && (a.section_name || a.section)) {
        const nameMatch = sections.find(s => s.section === (a.section_name || a.section));
        if (nameMatch) {
          mappedSectionId = String(nameMatch.section_id);
        }
      }
    }

    setForm({
      assignment_name: a.assignment_name,
      additional_info: a.additional_info ?? '',
      issue_date: a.issue_date?.substring(0, 10) ?? '',
      due_date: a.due_date?.substring(0, 10) ?? '',
      topic_id: a.topic_id ? String(a.topic_id) : '',
      section_id: mappedSectionId,
      bloom_ids: a.bloom_ids || [],
    });
    setModalMode('edit');
  };

  const openShare = async (a: Assignment) => {
    if (a.lms_assignment_id < 0) { toast.info('This is demo data — sharing is disabled.'); return; }
    setSelectedAssignment(a); setShareStudents([]); setSelectedStudentIds(new Set()); setModalMode('share');
    setSharedStatusMap(new Map()); setAssignmentDetails(null); setStudentSearchTerm('');
    setLoadingStudents(true);

    // Step 1: Fetch students list (required)
    try {
      const params: any = {};
      if (selectedBatch) params.academic_batch_id = Number(selectedBatch);
      if (selectedTerm) params.semester_id = Number(selectedTerm);
      if (selectedSection) params.section = sections.find(s => String(s.section_id) === selectedSection)?.section;
      const r1: any = await axiosInstance.get(`${ASSIGN_API}/meta/students`, { params });
      const items = r1.data?.data?.items ?? r1.data?.items ?? r1.data;
      setShareStudents(Array.isArray(items) ? items : []);
    } catch {
      toast.error('Failed to load student list');
    }

    // Step 2: Fetch assignment details + already-shared students (optional — don't block modal)
    try {
      const r2: any = await axiosInstance.get(`${ASSIGN_API}/${a.lms_assignment_id}`);
      const details = r2.data?.data ?? r2.data;
      setAssignmentDetails(details?.assignment || a);
      const sList = details?.shared_students || [];
      const smap = new Map<number, any>();
      sList.forEach((ss: any) => smap.set(ss.ssd_id, ss));
      setSharedStatusMap(smap);
      setSelectedStudentIds(new Set(sList.map((ss: any) => ss.ssd_id)));
    } catch {
      // Assignment details fetch failed — modal still works, students already loaded
      toast.warning('Could not load share status — students list is still available');
    }

    setLoadingStudents(false);
  };

  const openViewStudents = async (a: Assignment) => {
    if (a.lms_assignment_id < 0) { toast.info('This is demo data.'); return; }
    setViewStudentsModal({ assignment: a, students: [] });
    setLoadingViewStudents(true);
    try {
      const r: any = await axiosInstance.get(`${ASSIGN_API}/${a.lms_assignment_id}`);
      const details = r.data?.data ?? r.data;
      const sList = details?.shared_students || [];
      setViewStudentsModal({ assignment: a, students: sList });
    } catch {
      toast.error('Failed to load shared students');
      setViewStudentsModal(null);
    } finally {
      setLoadingViewStudents(false);
    }
  };

  const handleSave = async () => {
    if (!form.assignment_name.trim()) { toast.error('Assignment name is required'); return; }
    if (selectedAssignment && selectedAssignment.lms_assignment_id < 0) {
      toast.info('This is demo data — save is disabled. Use real data from the backend.');
      closeModal(); return;
    }
    setSaving(true);
    try {
      // Upload file first if one is selected, get back file_name + file_path
      let uploadedFileName: string | null = null;
      let uploadedFilePath: string | null = null;
      if (assignmentFile) {
        const fd = new FormData();
        fd.append('file', assignmentFile);
        try {
          const up: any = await axiosInstance.post(`${ASSIGN_API}/upload-file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          const upData = up.data?.data ?? up.data;
          uploadedFileName = upData?.file_name || null;
          uploadedFilePath = upData?.file_path || null;
        } catch { toast.error('File upload failed — assignment will be saved without attachment.'); }
      }

      const payload: any = {
        assignment_name: form.assignment_name.trim(),
        additional_info: form.additional_info || null,
        academic_batch_id: selectedBatch ? Number(selectedBatch) : null,
        semester_id: selectedTerm ? Number(selectedTerm) : null,
        crs_id: selectedCourse ? Number(selectedCourse) : null,
        section_id: form.section_id ? Number(form.section_id) : (selectedSection ? Number(selectedSection) : null),
        topic_id: form.topic_id ? Number(form.topic_id) : null,
        issue_date: form.issue_date || null,
        due_date: form.due_date || null,
        bloom_ids: form.bloom_ids, clo_ids: [], student_ids: [], status: 1,
        assess_attain_flag: 0, created_by: userId, modified_by: userId,
        file_name: uploadedFileName,
        file_path: uploadedFilePath,
      };
      if (modalMode === 'add') {
        await axiosInstance.post(`${ASSIGN_API}/create`, payload);
        toast.success('Assignment created successfully!');
      } else if (modalMode === 'edit' && selectedAssignment) {
        await axiosInstance.put(`${ASSIGN_API}/${selectedAssignment.lms_assignment_id}`, payload);
        toast.success('Assignment updated successfully!');
      }
      closeModal(); fetchAssignments();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to save assignment'); }
    finally { setSaving(false); }
  };

  const handleShare = async () => {
    if (!selectedAssignment || selectedStudentIds.size === 0) { toast.warning('Select at least one student'); return; }
    setSaving(true);
    try {
      await axiosInstance.post(`${ASSIGN_API}/${selectedAssignment.lms_assignment_id}/share`, { student_ids: Array.from(selectedStudentIds), created_by: userId });
      toast.success('Assignment shared with students!');
      closeModal(); fetchAssignments();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to share assignment'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (a: Assignment) => {
    if (a.lms_assignment_id < 0) { toast.info('This is demo data — delete is disabled.'); return; }
    if (!window.confirm(`Delete "${a.assignment_name}"?`)) return;
    try {
      await axiosInstance.delete(`${ASSIGN_API}/${a.lms_assignment_id}`);
      toast.success('Assignment deleted'); fetchAssignments();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to delete assignment'); }
  };

  const handleReview = async () => {
    if (!reviewModal) return;
    setReviewSaving(true);
    try {
      await axiosInstance.post(`${ASSIGN_API}/review/${reviewModal.mapId}`, {
        action: reviewForm.action,
        secured_marks: reviewForm.secured_marks !== '' ? Number(reviewForm.secured_marks) : null,
        remark: reviewForm.remark || null,
        modified_by: userId,
      });
      toast.success('Review saved successfully!');
      setReviewModal(null);
      // Refresh shared students in the currently open share modal
      if (selectedAssignment) {
        try {
          const r2: any = await axiosInstance.get(`${ASSIGN_API}/${selectedAssignment.lms_assignment_id}`);
          const details = r2.data?.data ?? r2.data;
          const sList = details?.shared_students || [];
          const smap = new Map<number, any>();
          sList.forEach((ss: any) => smap.set(ss.ssd_id, ss));
          setSharedStatusMap(smap);
        } catch { /* non-blocking */ }
      }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to save review'); }
    finally { setReviewSaving(false); }
  };

  const toggleStudent = (id: number) =>
    setSelectedStudentIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const filtered = assignments.filter(a => a.assignment_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / showEntries));
  const pageData = filtered.slice((currentPage - 1) * showEntries, currentPage * showEntries);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * showEntries + 1;
  const end = Math.min(currentPage * showEntries, filtered.length);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5">
          <h1 className="text-sm font-semibold">Manage Assignment</h1>
        </div>

        <div className="p-4">
          {/* Filter Row */}
          <div className="grid grid-cols-5 gap-3 mb-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Curriculum <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setCurrentPage(1); }} disabled={loadingBatch}>
                <option value="">{loadingBatch ? 'Loading...' : 'Select Curriculum'}</option>
                {curriculums.map(c => <option key={c.academic_batch_id} value={c.academic_batch_id}>{c.academic_batch_desc} {c.academic_year || `(${c.academic_batch_code})`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Term <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); setCurrentPage(1); }} disabled={!selectedBatch || loadingTerm}>
                <option value="">{loadingTerm ? 'Loading...' : 'Select Term'}</option>
                {terms.map(t => <option key={t.semester_id} value={t.semester_id}>{t.semester} - {t.semester_desc}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Course <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setCurrentPage(1); }} disabled={!selectedTerm || loadingCourse}>
                <option value="">{loadingCourse ? 'Loading...' : 'Select Course'}</option>
                {courses.map(c => <option key={c.crs_id} value={c.crs_id}>{c.crs_title} ({c.crs_code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
              <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none disabled:opacity-50"
                value={selectedSection} onChange={e => { setSelectedSection(e.target.value); setCurrentPage(1); }} disabled={!selectedTerm || loadingSection}>
                <option value="">{loadingSection ? 'Loading...' : 'Select Section'}</option>
                {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.section}</option>)}
              </select>
            </div>
            <div className="flex justify-end">
              <button onClick={openAdd} className="bg-[#1a73e8] text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 whitespace-nowrap">
                Add Assignment ⊞
              </button>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select className="border border-gray-300 rounded px-2 py-0.5 text-sm" value={showEntries} onChange={e => { setShowEntries(Number(e.target.value)); setCurrentPage(1); }}>
                {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Search:</span>
              <input type="text" className="border border-gray-300 rounded px-2 py-0.5 text-sm w-40" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="w-full text-sm">
              <thead className="bg-[#d6dde3] text-gray-700">
                <tr>
                  <th className="px-3 py-2 w-8"><input type="checkbox" /></th>
                  <th className="px-3 py-2 text-left">Sl No. ⇅</th>
                  <th className="px-3 py-2 text-left">Assignment Name ⇅</th>
                  <th className="px-3 py-2 text-left">Section(s) ⇅</th>
                  <th className="px-3 py-2 text-left">Topic(s) ⇅</th>
                  <th className="px-3 py-2 text-left">Issue Date ⇅</th>
                  <th className="px-3 py-2 text-left">Due Date ⇅</th>
                  <th className="px-3 py-2 text-left">View Students</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!selectedBatch || !selectedTerm || !selectedCourse ? (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400 text-sm">Please select Curriculum, Term and Course to view assignments.</td></tr>
                ) : loading ? (
                  <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
                ) : pageData.length > 0 ? pageData.map((a, idx) => (
                  <tr key={a.lms_assignment_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><input type="checkbox" /></td>
                    <td className="px-3 py-2">{(currentPage - 1) * showEntries + idx + 1}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-blue-700">{a.assignment_name}</span>
                      {(a.update_count ?? 0) > 0 && (
                        <span
                          className="ml-1.5 inline-flex items-center justify-center w-[18px] h-[18px] text-[10px] bg-orange-100 text-orange-600 rounded-full font-bold cursor-help align-middle border border-orange-200"
                          title={`Assignment updated ${a.update_count} time(s) after sharing`}
                        >ℹ</span>
                      )}
                    </td>
                    {/* Section — pulled from backend field or filter */}
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {getSectionLabel(a) !== '—'
                        ? getSectionLabel(a)
                        : sections.find(s => String(s.section_id) === selectedSection)?.section || '—'}
                    </td>
                    {/* Topic — pulled from backend field */}
                    <td className="px-3 py-2 text-xs text-gray-600">{getTopicLabel(a)}</td>
                    <td className="px-3 py-2 text-xs">{fmtDate(a.issue_date)}</td>
                    <td className="px-3 py-2 text-xs">{fmtDate(a.due_date)}</td>
                    <td className="px-3 py-2">
                      <button 
                        onClick={() => openViewStudents(a)} 
                        className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-semibold cursor-pointer"
                        title="View Shared Students"
                      >
                        {a.shared_students_count ?? 0}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => openEdit(a)} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-1">Edit</button>
                      <button onClick={() => openShare(a)} className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded mr-1">Share</button>
                      {a.lms_assignment_id > 0 && a.file_name && (
                        <button
                          onClick={() => {
                            const baseURL = axiosInstance.defaults.baseURL || "";
                            window.open(`${baseURL}/api/v1/manage-assignment/assignment/download/${a.lms_assignment_id}`, '_blank');
                          }}
                          className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mr-1 hover:bg-orange-200"
                          title="Download assignment file"
                        >Download</button>
                      )}
                      <button onClick={() => handleDelete(a)} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Delete</button>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${a.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">No assignments found for the selected filters.</td></tr>
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

      {/* Add/Edit Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center sticky top-0">
              <span className="font-semibold text-sm">{modalMode === 'add' ? 'Create Assignment' : 'Edit Assignment'}</span>
              <button onClick={closeModal} className="text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Assignment Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title <span className="text-red-500">*</span></label>
                <input type="text" className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="e.g. React Hooks Assignment" value={form.assignment_name}
                  onChange={e => setForm({ ...form, assignment_name: e.target.value })} />
              </div>

              {/* Section + Topic side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select className="w-full border rounded px-3 py-2 text-sm bg-white"
                    value={form.section_id}
                    onChange={e => setForm({ ...form, section_id: e.target.value })}>
                    <option value="">Select Section</option>
                    {sections.map(s => <option key={s.section_id} value={s.section_id}>{s.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <select className="w-full border rounded px-3 py-2 text-sm bg-white disabled:opacity-50"
                    value={form.topic_id}
                    onChange={e => setForm({ ...form, topic_id: e.target.value })}
                    disabled={loadingTopics}>
                    <option value="">{loadingTopics ? 'Loading...' : 'Select Topic'}</option>
                    {topics.map(t => <option key={t.topic_id} value={t.topic_id}>{t.topic_title}{t.topic_code ? ` (${t.topic_code})` : ''}</option>)}
                  </select>
                </div>
              </div>

              {/* Issue + Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input type="date" className="w-full border rounded px-3 py-2 text-sm" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" className="w-full border rounded px-3 py-2 text-sm" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach a File (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    placeholder="No file chosen"
                    value={assignmentFile?.name || (modalMode === 'edit' && selectedAssignment?.file_name) || ''}
                    className="flex-1 border border-gray-300 rounded-l px-3 py-2 text-sm bg-gray-50"
                  />
                  <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded-r cursor-pointer whitespace-nowrap">
                    Browse
                    <input type="file" className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                      onChange={e => setAssignmentFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                <p className="text-xs text-orange-500 mt-1">Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, ZIP (max 10MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Instructions</label>
                <textarea rows={3} className="w-full border rounded px-3 py-2 text-sm resize-none"
                  placeholder="Describe the assignment requirements..." value={form.additional_info}
                  onChange={e => setForm({ ...form, additional_info: e.target.value })} />
              </div>

              {/* Bloom's Taxonomy */}
              {bloomLevels.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bloom's Taxonomy Levels</label>
                  <div className="flex flex-wrap gap-2">
                    {bloomLevels.map(b => (
                      <label key={b.bloom_id} className="flex items-center gap-1 cursor-pointer text-sm">
                        <input type="checkbox" checked={form.bloom_ids.includes(b.bloom_id)}
                          onChange={() => {
                            const ids = form.bloom_ids.includes(b.bloom_id)
                              ? form.bloom_ids.filter(id => id !== b.bloom_id)
                              : [...form.bloom_ids, b.bloom_id];
                            setForm({ ...form, bloom_ids: ids });
                          }}
                          className="accent-[#1f4e5f]" />
                        {b.bloom_name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-gray-50 rounded-b-lg flex justify-end gap-2 sticky bottom-0">
              <button onClick={closeModal} className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={!form.assignment_name.trim() || saving}
                className="px-4 py-2 text-sm bg-[#1f3a4f] text-white rounded hover:bg-[#17404e] disabled:opacity-50">
                {saving ? 'Saving...' : modalMode === 'add' ? 'Create Assignment' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {modalMode === 'share' && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl mx-4 my-auto">
            <div className="bg-white text-gray-800 px-5 py-3 rounded-t-lg flex justify-between items-center border-b">
              <span className="font-semibold text-[15px]">Manage Student Information</span>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
            </div>

            <div className="p-4">
              {/* Info Block */}
              <div className="border border-gray-200 rounded-sm mb-4">
                <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 text-xs">
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Curriculum:</span>
                    <span className="text-gray-800">{curriculums.find(c => String(c.academic_batch_id) === selectedBatch)?.academic_batch_desc || selectedBatch}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Term:</span>
                    <span className="text-gray-800">{terms.find(t => String(t.semester_id) === selectedTerm)?.semester} - {terms.find(t => String(t.semester_id) === selectedTerm)?.semester_desc}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Course:</span>
                    <span className="text-gray-800">{courses.find(c => String(c.crs_id) === selectedCourse)?.crs_code} - {courses.find(c => String(c.crs_id) === selectedCourse)?.crs_title}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Section:</span>
                    <span className="text-gray-800">{sections.find(s => String(s.section_id) === selectedSection)?.section || selectedSection}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Assignment Name:</span>
                    <span className="text-gray-800 font-medium">{selectedAssignment.assignment_name}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Document:</span>
                    <a href="#" className="text-blue-600 hover:underline">{selectedAssignment.file_name || 'N/A'}</a>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Submission Due Date:</span>
                    <span className="text-gray-800">{fmtDate(selectedAssignment.due_date)}</span>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-1">
                    <span className="font-semibold text-gray-600 whitespace-nowrap">Max marks:</span>
                    <span className="text-gray-800">5.00</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mb-2">
                <input type="text" placeholder="Search by USN or Student Name"
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-blue-500"
                  value={studentSearchTerm} onChange={e => setStudentSearchTerm(e.target.value)} />
              </div>

              <div className="border border-gray-200 rounded-sm overflow-auto max-h-[50vh]">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 text-gray-700">
                    <tr>
                      <th className="p-2 w-10 border-r border-gray-200">
                        <input type="checkbox" className="accent-[#1f3a4f] mt-1"
                          checked={shareStudents.length > 0 && shareStudents.every(s => selectedStudentIds.has(s.student_id))}
                          onChange={() => {
                            const all = shareStudents.every(s => selectedStudentIds.has(s.student_id));
                            setSelectedStudentIds(all ? new Set() : new Set(shareStudents.map(s => s.student_id)));
                          }} />
                      </th>
                      <th className="p-2 border-r border-gray-200 font-semibold">USN</th>
                      <th className="p-2 border-r border-gray-200 font-semibold">Student Name</th>
                      <th className="p-2 border-r border-gray-200 font-semibold">Seen On</th>
                      <th className="p-2 border-r border-gray-200 font-semibold">Status</th>
                      <th className="p-2 border-r border-gray-200 font-semibold">Action</th>
                      <th className="p-2 border-r border-gray-200 font-semibold">Marks</th>
                      <th className="p-2 font-semibold">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingStudents ? (
                      <tr><td colSpan={8} className="p-4 text-gray-500 text-sm">Loading...</td></tr>
                    ) : shareStudents.filter(s =>
                        (s.usno||'').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        (s.name || `${s.first_name} ${s.last_name}`).toLowerCase().includes(studentSearchTerm.toLowerCase())
                      ).map(s => {
                      const ss = sharedStatusMap.get(s.student_id);
                      const isShared = selectedStudentIds.has(s.student_id);
                      let statusText = "---"; let statusColor = "text-gray-500"; let actionText = "---";
                      if (ss) {
                        const flag = Number(ss.accept_rework_flag || 0);
                        if (flag === 1) { statusText = "Assignment Accepted"; statusColor = "text-green-600"; }
                        else if (flag === 2) { statusText = "Justify"; statusColor = "text-blue-600"; }
                        else if (ss.file_path) { statusText = "Submitted"; statusColor = "text-blue-600"; }
                        else { statusText = "Not Submitted"; statusColor = "text-gray-800"; }
                        if (ss.file_path) actionText = "Review";
                      } else { statusText = "Not Shared"; }
                      return (
                        <tr key={s.student_id} className="hover:bg-gray-50">
                          <td className="p-2 border-r border-gray-200"><input type="checkbox" className="accent-[#1f3a4f]" checked={isShared} onChange={() => toggleStudent(s.student_id)} /></td>
                          <td className="p-2 border-r border-gray-200 text-gray-600">{s.usno}</td>
                          <td className="p-2 border-r border-gray-200 text-gray-800 text-left pl-3">{s.name || `${s.first_name} ${s.last_name}`.trim()}</td>
                          <td className="p-2 border-r border-gray-200 text-gray-800">{ss?.seen_on ? fmtDate(ss.seen_on) : '---'}</td>
                          <td className="p-2 border-r border-gray-200">
                            <div className="flex flex-col gap-1 items-center">
                              {ss?.file_path && <a href="#" className="text-blue-600 hover:underline">{ss.file_name || 'Submission'}</a>}
                              <span className={statusColor}>{statusText}</span>
                            </div>
                          </td>
                          <td className="p-2 border-r border-gray-200">
                            {ss?.file_path ? (
                              <button
                                onClick={() => {
                                  setReviewModal({
                                    mapId: ss.map_assignment_student_id,
                                    student: { ...ss, name: s.name || `${s.first_name} ${s.last_name}`.trim(), usno: s.usno },
                                  });
                                  setReviewForm({
                                    action: 'approve',
                                    secured_marks: ss.secured_marks != null ? String(ss.secured_marks) : '',
                                    remark: ss.remark || '',
                                  });
                                }}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 font-medium"
                              >Review</button>
                            ) : <span className="text-gray-400 text-xs">---</span>}
                          </td>
                          <td className="p-2 border-r border-gray-200 text-gray-800">{ss?.secured_marks ?? (ss ? '0' : '---')}</td>
                          <td className="p-2 text-gray-500">{ss?.remark || '---'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-3 rounded-b-lg flex justify-end gap-2 text-sm border-t">
              <button onClick={handleShare} disabled={saving} className="bg-[#6b9cce] hover:bg-[#5a8bbd] text-white px-5 py-1.5 rounded">
                {saving ? 'Sharing...' : 'Share'}
              </button>
              <button onClick={closeModal} disabled={saving} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-1.5 rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Students Modal ── */}
      {viewStudentsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-6">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 my-auto">
            <div className="bg-[#1f3a4f] text-white px-5 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">View Students — {viewStudentsModal.assignment.assignment_name}</span>
              <button onClick={() => setViewStudentsModal(null)} className="text-white text-2xl font-light hover:opacity-75">&times;</button>
            </div>
            <div className="p-5">
              {loadingViewStudents ? (
                <p className="text-center py-10 text-gray-400">Loading students...</p>
              ) : viewStudentsModal.students.length > 0 ? (
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#d6dde3] text-gray-700">
                      <tr>
                        <th className="px-3 py-2 w-8">#</th>
                        <th className="px-3 py-2 text-left">USN</th>
                        <th className="px-3 py-2 text-left">Student Name</th>
                        <th className="px-3 py-2">Viewed On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewStudentsModal.students.map((s: any, i: number) => (
                        <tr key={s.ssd_id ?? i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-center">{i + 1}</td>
                          <td className="px-3 py-2">{s.usno || s.usn || s.student_usn || s.student_name || '—'}</td>
                          <td className="px-3 py-2">{s.full_name || s.name || s.student_name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.student_usn || '—'}</td>
                          <td className="px-3 py-2 text-center">{s.seen_on ? new Date(s.seen_on).toLocaleString() : 'Not Viewed'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-10 text-gray-400 text-sm">No students found.</p>
              )}
            </div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button onClick={() => setViewStudentsModal(null)}
                className="px-5 py-1.5 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">Review Submission</span>
              <button onClick={() => setReviewModal(null)} className="text-white text-2xl font-light">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Student info */}
              <div className="bg-gray-50 rounded p-3 text-sm">
                <div className="text-gray-500 text-xs mb-0.5">Student</div>
                <div className="font-semibold text-gray-800">{reviewModal.student.name || reviewModal.student.usno}</div>
                <div className="text-xs text-gray-500">{reviewModal.student.usno}</div>
              </div>
              {/* Submitted file */}
              {reviewModal.student.file_name && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded p-2.5">
                  <span className="text-base">📎</span>
                  <span className="text-xs text-blue-800 flex-1 truncate">{reviewModal.student.file_name}</span>
                  <a
                    href={`${axiosInstance.defaults.baseURL || ''}/api/v1/manage-assignment/assignment/download-submission/${reviewModal.mapId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 shrink-0"
                  >Download</a>
                </div>
              )}
              {/* Action selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  {(['approve', 'rework', 'pending'] as const).map(act => (
                    <button
                      key={act}
                      onClick={() => setReviewForm(f => ({ ...f, action: act }))}
                      className={`flex-1 py-2 text-xs rounded font-semibold border transition-all ${
                        reviewForm.action === act
                          ? act === 'approve' ? 'bg-green-600 text-white border-green-600'
                            : act === 'rework' ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-gray-500 text-white border-gray-500'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {act === 'approve' ? '✓ Approve' : act === 'rework' ? '↩ Rework' : '⏸ Pending'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Marks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marks Secured</label>
                <input
                  type="number" min="0" step="0.5"
                  value={reviewForm.secured_marks}
                  onChange={e => setReviewForm(f => ({ ...f, secured_marks: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="e.g. 4.5"
                />
              </div>
              {/* Remark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark / Feedback</label>
                <textarea
                  rows={3}
                  value={reviewForm.remark}
                  onChange={e => setReviewForm(f => ({ ...f, remark: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400"
                  placeholder="Add feedback for the student or rework instructions..."
                />
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 rounded-b-lg flex justify-end gap-2">
              <button onClick={() => setReviewModal(null)} className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
              <button
                onClick={handleReview}
                disabled={reviewSaving}
                className={`px-4 py-2 text-sm text-white rounded disabled:opacity-50 ${
                  reviewForm.action === 'approve' ? 'bg-green-600 hover:bg-green-700'
                  : reviewForm.action === 'rework' ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {reviewSaving ? 'Saving...' : 'Save Review'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageAssignmentPage;
