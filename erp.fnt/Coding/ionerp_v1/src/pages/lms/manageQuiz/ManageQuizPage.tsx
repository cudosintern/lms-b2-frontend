import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Eye, Pencil, Share2 } from 'lucide-react';
import { useManageQuizService } from './manageQuizService';
import FixedAddQuizPage from './FixedAddQuizPage';

interface Curriculum { academic_batch_id: number; academic_batch_code: string; academic_batch_desc: string; academic_year?: string; }
interface Term { semester_id: number; semester: number; semester_desc: string; }
interface Course { crs_id: number; crs_code: string; crs_title: string; }
interface Quiz {
  quiz_id: number; quiz_title: string; academic_batch_id: number; semester_id: number;
  crs_id: number; quiz_date?: string; quiz_time?: string; duration?: string; status: number;
  section_names?: string; topic_names?: string;
  question_count?: number; student_count?: number; started_count?: number;
  total_marks?: number;
}

export default function ManageQuizPage() {
  const service = useManageQuizService();

  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit quiz state
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [loadingEditData, setLoadingEditData] = useState(false);

  // Quiz Questions modal
  const [questionsModal, setQuestionsModal] = useState<{ quiz: Quiz; data: any } | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Add-question form state
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [aqText, setAqText] = useState('');
  const [aqType, setAqType] = useState(1);
  const [aqMarks, setAqMarks] = useState('');
  const [aqOptions, setAqOptions] = useState([{ value: '', is_answer: 0 }, { value: '', is_answer: 0 }, { value: '', is_answer: 0 }, { value: '', is_answer: 0 }]);
  const [submittingQ, setSubmittingQ] = useState(false);

  // Edit-question form state
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null); // the question being edited
  const [eqText, setEqText] = useState('');
  const [eqType, setEqType] = useState(1);
  const [eqMarks, setEqMarks] = useState('');
  const [eqOptions, setEqOptions] = useState([{ value: '', is_answer: 0 }, { value: '', is_answer: 0 }, { value: '', is_answer: 0 }, { value: '', is_answer: 0 }]);
  const [submittingEq, setSubmittingEq] = useState(false);
  const [deletingQqId, setDeletingQqId] = useState<number | null>(null);

  // View Students modal
  const [studentsModal, setStudentsModal] = useState<{ quiz: Quiz; students: any[] } | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Custom Share Modal State
  const [shareModal, setShareModal] = useState<Quiz | null>(null);
  const [shareStudents, setShareStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [loadingShareStudents, setLoadingShareStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [submittingShare, setSubmittingShare] = useState(false);

  // Load curriculums on mount
  useEffect(() => {
    setLoadingBatch(true);
    const doneA = () => setLoadingBatch(false);
    service.getMetaCurriculums()
      .then(data => { setCurriculums(Array.isArray(data) ? data : []); doneA(); }, doneA);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load terms when batch changes
  useEffect(() => {
    if (!selectedBatch) { setTerms([]); setSelectedTerm(''); setCourses([]); setSelectedCourse(''); return; }
    setLoadingTerm(true);
    const doneB = () => setLoadingTerm(false);
    service.getMetaTerms(Number(selectedBatch))
      .then(data => { setTerms(Array.isArray(data) ? data : []); setSelectedTerm(''); setCourses([]); setSelectedCourse(''); doneB(); }, doneB);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch]);

  // Load courses when term changes
  useEffect(() => {
    if (!selectedBatch || !selectedTerm) { setCourses([]); setSelectedCourse(''); return; }
    setLoadingCourse(true);
    const doneC = () => setLoadingCourse(false);
    service.getMetaCourses(Number(selectedBatch), Number(selectedTerm))
      .then(data => { setCourses(Array.isArray(data) ? data : []); setSelectedCourse(''); doneC(); }, doneC);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, selectedTerm]);

  // Load quizzes when course changes
  const refreshQuizzes = () => {
    if (!selectedCourse || !selectedBatch || !selectedTerm) { setQuizzes([]); return; }
    setLoading(true);
    const doneD = () => setLoading(false);
    service.getQuizList({ academic_batch_id: Number(selectedBatch), semester_id: Number(selectedTerm), crs_id: Number(selectedCourse) })
      .then(data => { setQuizzes(Array.isArray(data) ? data : []); doneD(); }, doneD);
  };

  useEffect(() => {
    refreshQuizzes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  const handleDelete = async (quizId: number) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try { await service.deleteQuiz(quizId); setQuizzes(prev => prev.filter(q => q.quiz_id !== quizId)); }
    catch { alert('Failed to delete quiz'); }
  };

  const handleEdit = async (quiz: Quiz) => {
    setLoadingEditData(true);
    try {
      const data = await service.getQuizDetails(quiz.quiz_id);
      setEditData(data);
      setEditQuiz(quiz);
    } catch {
      alert('Failed to load quiz details for editing');
    } finally {
      setLoadingEditData(false);
    }
  };

  const handleShare = async (quiz: Quiz) => {
    setShareModal(quiz);
    setShareStudents([]);
    setSelectedStudentIds(new Set());
    setStudentSearchTerm('');
    setLoadingShareStudents(true);
    try {
      const axiosInst = await import('../../../utils/api');
      const params: any = {};
      if (selectedBatch) params.academic_batch_id = Number(selectedBatch);
      if (selectedTerm) params.semester_id = Number(selectedTerm);
      // Load students directly from iems_students filtered by current batch/term match
      const r: any = await axiosInst.default.get(`/api/v1/manage-quiz/meta/students`, { params })
        .catch(() => axiosInst.default.get(`/api/v1/manage-assignment/assignment/meta/students`, { params }));
      const raw = r.data?.data?.items ?? r.data?.data ?? r.data?.items ?? r.data ?? [];
      setShareStudents(Array.isArray(raw) ? raw : []);
    } catch {
      // Non-fatal: share modal still opens, user can use "Share All" button
      setShareStudents([]);
    } finally {
      setLoadingShareStudents(false);
    }
  };

  const submitShare = async () => {
    if (!shareModal) return;
    setSubmittingShare(true);
    try {
      const authState = (window as any).__AUTH_STATE__ || JSON.parse(localStorage.getItem('auth_state') || '{}');
      const userId = authState?.user_id ?? authState?.id ?? 1;
      // If specific students selected, send their IDs; otherwise backend auto-shares from course mapping
      const payload: any = { created_by: userId };
      if (selectedStudentIds.size > 0) payload.student_ids = Array.from(selectedStudentIds);
      const result: any = await service.shareQuiz(shareModal.quiz_id, payload);
      if (result?.status === false) {
        alert(result?.message || 'Share failed');
        return;
      }
      const { inserted = 0, skipped = 0 } = result?.data ?? result ?? {};
      alert(`Quiz shared successfully!\n✅ Shared with ${inserted} student(s)${skipped > 0 ? `\n⏭ Skipped ${skipped} (already shared)` : ''}`);
      setShareModal(null);
      refreshQuizzes();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to share quiz');
    } finally {
      setSubmittingShare(false);
    }
  };

  const submitShareAll = async () => {
    if (!shareModal) return;
    if (!window.confirm('Share this quiz with ALL matched students from the course/section mapping?')) return;
    setSubmittingShare(true);
    try {
      const authState = (window as any).__AUTH_STATE__ || JSON.parse(localStorage.getItem('auth_state') || '{}');
      const userId = authState?.user_id ?? authState?.id ?? 1;
      const result: any = await service.shareQuiz(shareModal.quiz_id, { created_by: userId });
      if (result?.status === false) { alert(result?.message || 'Share failed'); return; }
      const { inserted = 0, skipped = 0 } = result?.data ?? result ?? {};
      alert(`Shared with all!\n✅ ${inserted} new student(s)${skipped > 0 ? `\n⏭ ${skipped} already shared` : ''}`);
      setShareModal(null);
      refreshQuizzes();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to share quiz');
    } finally {
      setSubmittingShare(false);
    }
  };

  const openQuestions = async (quiz: Quiz) => {
    setQuestionsModal({ quiz, data: null });
    setLoadingQuestions(true);
    try {
      const data = await service.getQuizDetails(quiz.quiz_id);
      setQuestionsModal({ quiz, data });
    } catch { setQuestionsModal({ quiz, data: null }); }
    finally { setLoadingQuestions(false); }
  };

  const openStudents = async (quiz: Quiz) => {
    setStudentsModal({ quiz, students: [] });
    setLoadingStudents(true);
    try {
      const data = await service.getStudents(quiz.quiz_id);
      const arr = Array.isArray(data) ? data : (data?.items ?? []);
      setStudentsModal({ quiz, students: arr });
    } catch { setStudentsModal({ quiz, students: [] }); }
    finally { setLoadingStudents(false); }
  };

  const refreshQuestions = async (quiz: Quiz) => {
    setLoadingQuestions(true);
    try {
      const data = await service.getQuizDetails(quiz.quiz_id);
      setQuestionsModal({ quiz, data });
    } catch {}
    finally { setLoadingQuestions(false); }
  };

  const addQuestion = async () => {
    if (!questionsModal) return;
    if (!aqText.trim()) { alert('Question text is required'); return; }
    const authState = (window as any).__AUTH_STATE__ || JSON.parse(localStorage.getItem('auth_state') || '{}');
    const userId = authState?.user_id ?? authState?.id ?? 1;
    const payload: any = {
      question: aqText.trim(),
      question_type: aqType,
      marks: aqMarks ? Number(aqMarks) : null,
      created_by: userId,
      options: aqType === 1 ? aqOptions.filter(o => o.value.trim()).map(o => ({ option_value: o.value.trim(), is_answer: o.is_answer })) : 
               aqType === 2 ? [
                 { option_value: 'True', is_answer: aqOptions[0]?.is_answer || 0 },
                 { option_value: 'False', is_answer: aqOptions[1]?.is_answer || 0 }
               ] : [],
      clo_ids: [],
      bloom_ids: [],
    };
    setSubmittingQ(true);
    try {
      const res: any = await (await import('../../../utils/api')).default
        .post(`/api/v1/manage-quiz/${questionsModal.quiz.quiz_id}/question`, payload);
      if (res.data?.status === false) { alert(res.data?.message || 'Failed to add question'); return; }
      alert('Question added successfully!');
      setAqText(''); setAqMarks(''); setAqType(1);
      setAqOptions([{ value: '', is_answer: 0 }, { value: '', is_answer: 0 }, { value: '', is_answer: 0 }, { value: '', is_answer: 0 }]);
      setShowAddQuestion(false);
      await refreshQuestions(questionsModal.quiz);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to add question');
    } finally { setSubmittingQ(false); }
  };

  // Open the inline edit form pre-filled with this question's data
  const openEditQuestion = (q: any) => {
    setShowAddQuestion(false); // close add form if open
    const opts = Array.isArray(q.options) ? q.options : [];
    const mappedOpts = opts.map((o: any) => ({ value: o.option_value || o.value || '', is_answer: Number(o.is_answer) }));
    // Pad to 4 slots for MCQ
    while (mappedOpts.length < 4) mappedOpts.push({ value: '', is_answer: 0 });
    setEqText(q.question_text || q.question || '');
    setEqType(Number(q.question_type || q.type || 1));
    setEqMarks(q.marks != null ? String(q.marks) : '');
    setEqOptions(mappedOpts);
    setEditingQuestion(q);
  };

  const saveEditQuestion = async () => {
    if (!editingQuestion || !questionsModal) return;
    if (!eqText.trim()) { alert('Question text is required'); return; }
    const authState = (window as any).__AUTH_STATE__ || JSON.parse(localStorage.getItem('auth_state') || '{}');
    const userId = authState?.user_id ?? authState?.id ?? 1;
    const payload: any = {
      question: eqText.trim(),
      question_type: eqType,
      marks: eqMarks ? Number(eqMarks) : null,
      modified_by: userId,
      options: eqType === 1 ? eqOptions.filter(o => o.value.trim()).map(o => ({ option_value: o.value.trim(), is_answer: o.is_answer })) :
               eqType === 2 ? [
                 { option_value: 'True', is_answer: eqOptions[0]?.is_answer || 0 },
                 { option_value: 'False', is_answer: eqOptions[1]?.is_answer || 0 }
               ] : [],
      clo_ids: [],
      bloom_ids: [],
    };
    setSubmittingEq(true);
    try {
      const res: any = await (await import('../../../utils/api')).default
        .put(`/api/v1/manage-quiz/question/${editingQuestion.qq_id}`, payload);
      if (res.data?.status === false) { alert(res.data?.message || 'Failed to update question'); return; }
      alert('Question updated successfully!');
      setEditingQuestion(null);
      await refreshQuestions(questionsModal.quiz);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to update question');
    } finally { setSubmittingEq(false); }
  };

  const deleteQuestion = async (q: any) => {
    if (!questionsModal) return;
    if (!window.confirm(`Delete question: "${(q.question_text || q.question || '').substring(0, 60)}"?\nThis cannot be undone.`)) return;
    setDeletingQqId(q.qq_id);
    try {
      const res: any = await (await import('../../../utils/api')).default
        .delete(`/api/v1/manage-quiz/question/${q.qq_id}`);
      if (res.data?.status === false) { alert(res.data?.message || 'Failed to delete question'); return; }
      await refreshQuestions(questionsModal.quiz);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to delete question');
    } finally { setDeletingQqId(null); }
  };

  const filteredQuizzes = quizzes.filter(q => q.quiz_title.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / showEntries));
  const pageData = filteredQuizzes.slice((currentPage - 1) * showEntries, currentPage * showEntries);
  const start = filteredQuizzes.length === 0 ? 0 : (currentPage - 1) * showEntries + 1;
  const end = Math.min(currentPage * showEntries, filteredQuizzes.length);

  const getStatusBadge = (s: any) => {
    const n = s === undefined || s === null ? 1 : Number(s);
    if (n === 1) return 'bg-green-100 text-green-700';
    if (n === 0) return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };
  const getStatusText = (s: any, startedCount?: number) => {
    const n = s === undefined || s === null ? 1 : Number(s);
    if (n === 1 && startedCount && startedCount > 0) return 'In Progress';
    if (n === 1) return 'Active';
    if (n === 0) return 'Closed';
    return 'Not Initiated';
  };

  // Helper to format quiz_time
  const formatTime = (t?: string) => {
    if (!t) return '—';
    // Already HH:MM format
    if (/^\d{2}:\d{2}/.test(t)) return t.substring(0, 5);
    return t;
  };

  // Helper to format quiz_date
  const formatDate = (d?: string) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  };

  // Helper to get question type label
  const getQuestionTypeLabel = (t: any) => {
    const n = Number(t);
    if (n === 1) return 'MCQ';
    if (n === 2) return 'True/False';
    if (n === 3) return 'Short Answer';
    return `Type ${n}`;
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5">
          <h1 className="text-sm font-semibold">Manage Quiz</h1>
        </div>

        <div className="p-4">
          {/* Filter Row */}
          <div className="grid grid-cols-4 gap-4 mb-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Curriculum <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 bg-white"
                value={selectedBatch}
                onChange={e => { setSelectedBatch(e.target.value); setCurrentPage(1); }}
                disabled={loadingBatch}
              >
                <option value="">{loadingBatch ? 'Loading...' : 'Select Curriculum'}</option>
                {curriculums.map(c => (
                  <option key={c.academic_batch_id} value={c.academic_batch_id}>
                    {c.academic_batch_desc} {c.academic_year ? `${c.academic_year}` : `(${c.academic_batch_code})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Term <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 bg-white"
                value={selectedTerm}
                onChange={e => { setSelectedTerm(e.target.value); setCurrentPage(1); }}
                disabled={!selectedBatch || loadingTerm}
              >
                <option value="">{loadingTerm ? 'Loading...' : 'Select Term'}</option>
                {terms.map(t => (
                  <option key={t.semester_id} value={t.semester_id}>{t.semester} - {t.semester_desc || 'Semester'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Course <span className="text-red-500">*</span></label>
              <select
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 bg-white"
                value={selectedCourse}
                onChange={e => { setSelectedCourse(e.target.value); setCurrentPage(1); }}
                disabled={!selectedTerm || loadingCourse}
              >
                <option value="">{loadingCourse ? 'Loading...' : 'Select Course'}</option>
                {courses.map(c => (
                  <option key={c.crs_id} value={c.crs_id}>{c.crs_title} ({c.crs_code})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!selectedBatch || !selectedTerm || !selectedCourse) { alert('Please select Curriculum, Term and Course first'); return; }
                  setShowAddModal(true);
                }}
                className="bg-[#1a73e8] text-white px-4 py-1.5 rounded flex items-center gap-1.5 text-sm hover:bg-blue-700 whitespace-nowrap"
              >
                <Plus size={15} /> Add Quiz ⊞
              </button>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={showEntries}
                onChange={e => { setShowEntries(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[10, 25, 50, 100].map(n => <option key={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Search:</span>
              <input
                type="text"
                className="border border-gray-300 rounded px-2 py-1 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#d6dde3] text-gray-700">
                <tr>
                  <th className="px-3 py-2 w-8"><input type="checkbox" /></th>
                  <th className="px-3 py-2">Sl No. ⇅</th>
                  <th className="px-3 py-2">Quiz Name (Total Marks) ⇅</th>
                  <th className="px-3 py-2">Section(s) ⇅</th>
                  <th className="px-3 py-2">Topic(s) ⇅</th>
                  <th className="px-3 py-2">Quiz Date ⇅</th>
                  <th className="px-3 py-2">Start Time ⇅</th>
                  <th className="px-3 py-2 whitespace-nowrap">Duration in Hrs ⇅</th>
                  <th className="px-3 py-2">Quiz Questions</th>
                  <th className="px-3 py-2">View Students</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
                ) : !selectedBatch || !selectedTerm || !selectedCourse ? (
                  <tr><td colSpan={12} className="px-4 py-10 text-center text-gray-400 text-sm">Please select Curriculum, Term and Course to view quizzes.</td></tr>
                ) : pageData.length > 0 ? pageData.map((quiz, idx) => (
                  <tr key={quiz.quiz_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><input type="checkbox" /></td>
                    <td className="px-3 py-2">{(currentPage - 1) * showEntries + idx + 1}</td>
                    <td className="px-3 py-2 text-blue-600 font-medium">{quiz.quiz_title} ({quiz.total_marks || quiz.duration || 'N/A'})</td>
                    <td className="px-3 py-2 text-xs">{quiz.section_names || '—'}</td>
                    <td className="px-3 py-2 text-xs">{quiz.topic_names || '—'}</td>
                    <td className="px-3 py-2 text-xs">{formatDate(quiz.quiz_date)}</td>
                    <td className="px-3 py-2 text-xs">{formatTime(quiz.quiz_time)}</td>
                    <td className="px-3 py-2 text-xs">{quiz.duration ? (Number(quiz.duration) >= 60 ? (Number(quiz.duration) / 60).toFixed(1) : `0:${quiz.duration}`) : '—'}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => openQuestions(quiz)} className="text-blue-600 hover:text-blue-800" title="View Questions">
                        <Eye size={15} />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => openStudents(quiz)} className="text-green-600 hover:text-green-700" title="View Students">
                        <Users size={16} />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleEdit(quiz)} className="text-blue-500 hover:text-blue-700" title="Edit Quiz"
                          disabled={loadingEditData}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleShare(quiz)} className="text-orange-500 hover:text-orange-700" title="Share Quiz"
                          disabled={loadingShareStudents}>
                          <Share2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(quiz.quiz_id)} className="text-red-500 hover:text-red-600" title="Delete Quiz">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(quiz.status)}`}>
                        {getStatusText(quiz.status, quiz.started_count)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400 text-sm">No quizzes found for the selected filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
            <span>Showing {start} to {end} of {filteredQuizzes.length} entries</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
              >Previous</button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
              >Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Quiz Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
            <FixedAddQuizPage
              initialBatchId={Number(selectedBatch)}
              initialSemesterId={Number(selectedTerm)}
              initialCourseId={Number(selectedCourse)}
              onSuccess={() => {
                setShowAddModal(false);
                refreshQuizzes();
              }}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {editQuiz && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
            <FixedAddQuizPage
              initialBatchId={editQuiz.academic_batch_id}
              initialSemesterId={editQuiz.semester_id}
              initialCourseId={editQuiz.crs_id}
              editQuizId={editQuiz.quiz_id}
              editData={editData}
              onSuccess={() => {
                setEditQuiz(null);
                setEditData(null);
                refreshQuizzes();
              }}
              onCancel={() => { setEditQuiz(null); setEditData(null); }}
            />
          </div>
        </div>
      )}

      {/* ── Quiz Questions Modal ── */}
      {questionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-6">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 my-auto">
            <div className="bg-[#1f3a4f] text-white px-5 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">Quiz Questions — {questionsModal.quiz.quiz_title}</span>
              <button onClick={() => setQuestionsModal(null)} className="text-white text-2xl font-light">&times;</button>
            </div>
            <div className="p-5">
              {loadingQuestions ? (
                <p className="text-center py-10 text-gray-400">Loading questions...</p>
              ) : questionsModal.data ? (
                <div className="space-y-4">
                  {/* Quiz info */}
                  <div className="grid grid-cols-3 gap-3 text-xs border border-gray-200 rounded p-3 bg-gray-50">
                    {[
                      { label: 'Title', value: questionsModal.data.quiz?.quiz_title || questionsModal.data.quiz_title || questionsModal.quiz.quiz_title },
                      { label: 'Date', value: formatDate(questionsModal.data.quiz?.quiz_date || questionsModal.data.quiz_date) },
                      { label: 'Time', value: formatTime(questionsModal.data.quiz?.quiz_time || questionsModal.data.quiz_time) },
                      { label: 'Duration', value: (questionsModal.data.quiz?.duration || questionsModal.data.duration) ? `${questionsModal.data.quiz?.duration || questionsModal.data.duration} mins` : '—' },
                      { label: 'Status', value: (questionsModal.data.quiz?.status ?? questionsModal.data.status) !== 0 ? 'Active' : 'Closed' },
                      { label: 'Total Questions', value: questionsModal.data.questions?.length ?? (questionsModal.data.total_questions ?? '—') },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="text-gray-500 block">{label}</span>
                        <span className="font-medium text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Questions list with answers */}
                  {Array.isArray(questionsModal.data.questions) && questionsModal.data.questions.length > 0 ? (
                    <div className="space-y-3">
                      {questionsModal.data.questions.map((q: any, i: number) => (
                        <div key={q.qq_id ?? q.question_id ?? i} className="border border-gray-200 rounded overflow-hidden">
                          {/* Question header */}
                          <div className="bg-[#d6dde3] px-3 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-600">Q{i + 1}</span>
                              <span className="text-xs font-medium text-gray-800">{q.question_text || q.question || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border">{getQuestionTypeLabel(q.question_type || q.type)}</span>
                              <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border">Marks: {q.marks ?? q.max_marks ?? '—'}</span>
                              {/* Edit button */}
                              <button
                                onClick={() => openEditQuestion(q)}
                                className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium flex items-center gap-1"
                                title="Edit this question"
                                disabled={submittingEq || deletingQqId === q.qq_id}
                              >
                                ✏️ Edit
                              </button>
                              {/* Delete button */}
                              <button
                                onClick={() => deleteQuestion(q)}
                                className="text-[10px] bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded font-medium flex items-center gap-1"
                                title="Delete this question"
                                disabled={deletingQqId === q.qq_id}
                              >
                                {deletingQqId === q.qq_id ? '⏳' : '🗑️'} Delete
                              </button>
                            </div>
                          </div>

                          {/* Inline edit form — shows only for this question */}
                          {editingQuestion?.qq_id === q.qq_id ? (
                            <div className="p-4 bg-blue-50 border-t border-blue-200 space-y-3">
                              <h4 className="text-xs font-semibold text-blue-800">Edit Question</h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                  <label className="text-xs font-medium text-gray-600 block mb-1">Question Text *</label>
                                  <textarea rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm resize-none focus:outline-none"
                                    value={eqText} onChange={e => setEqText(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Question Type</label>
                                    <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none"
                                      value={eqType} onChange={e => setEqType(Number(e.target.value))}>
                                      <option value={1}>MCQ</option>
                                      <option value={2}>True / False</option>
                                      <option value={3}>Short Answer</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Marks</label>
                                    <input type="number" min={1} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                                      value={eqMarks} onChange={e => setEqMarks(e.target.value)} />
                                  </div>
                                </div>
                              </div>

                              {/* MCQ options */}
                              {eqType === 1 && (
                                <div>
                                  <label className="text-xs font-medium text-gray-600 block mb-1">Options (tick correct answer)</label>
                                  <div className="space-y-1.5">
                                    {eqOptions.map((opt, oi) => (
                                      <div key={oi} className="flex items-center gap-2">
                                        <input type="radio" name="eq_correct" checked={opt.is_answer === 1}
                                          onChange={() => setEqOptions(prev => prev.map((o, j) => ({ ...o, is_answer: j === oi ? 1 : 0 })))}
                                          className="accent-green-600" />
                                        <input type="text" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                                          placeholder={`Option ${oi + 1}`} value={opt.value}
                                          onChange={e => setEqOptions(prev => prev.map((o, j) => j === oi ? { ...o, value: e.target.value } : o))} />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* True/False options */}
                              {eqType === 2 && (
                                <div className="flex gap-4 text-sm">
                                  {['True', 'False'].map((label, li) => (
                                    <label key={label} className="flex items-center gap-1.5 cursor-pointer">
                                      <input type="radio" name="eq_tf_correct" className="accent-green-600"
                                        checked={eqOptions[li]?.is_answer === 1}
                                        onChange={() => setEqOptions([
                                          { value: 'True', is_answer: li === 0 ? 1 : 0 },
                                          { value: 'False', is_answer: li === 1 ? 1 : 0 },
                                          { value: '', is_answer: 0 }, { value: '', is_answer: 0 }
                                        ])} />
                                      {label}
                                    </label>
                                  ))}
                                </div>
                              )}

                              <div className="flex justify-end gap-2 pt-1">
                                <button onClick={() => setEditingQuestion(null)}
                                  className="px-4 py-1.5 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-100">Cancel</button>
                                <button onClick={saveEditQuestion} disabled={submittingEq}
                                  className="px-4 py-1.5 text-xs bg-blue-700 hover:bg-blue-800 text-white rounded disabled:opacity-50">
                                  {submittingEq ? 'Saving...' : '💾 Save Changes'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Options / Answer display (read-only) */
                            <div className="px-4 py-2 bg-white">
                              {Array.isArray(q.options) && q.options.length > 0 ? (
                                <div className="space-y-1">
                                  {q.options.map((opt: any, oi: number) => {
                                    const isCorrect = Number(opt.is_answer) === 1;
                                    return (
                                      <div key={opt.qq_option_id ?? oi}
                                        className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${isCorrect ? 'bg-green-50 border border-green-300 font-semibold text-green-800' : 'bg-gray-50'}`}>
                                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                          {String.fromCharCode(65 + oi)}
                                        </span>
                                        <span>{opt.option_value || opt.value || `Option ${oi + 1}`}</span>
                                        {isCorrect && <span className="ml-auto text-green-600 font-bold">✓ Correct Answer</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No options (short answer type)</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">No questions added to this quiz yet.</div>
                  )}
                </div>
              ) : (
                <p className="text-center py-10 text-gray-400">No data available for this quiz.</p>
              )}
            </div>
            {/* Add Question form */}
            <div className="border-t">
              {!showAddQuestion ? (
                <div className="px-5 py-3 flex justify-between items-center">
                  <button
                    onClick={() => setShowAddQuestion(true)}
                    className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded font-medium"
                  >
                    <Plus size={14} /> Add Question
                  </button>
                  <button onClick={() => { setQuestionsModal(null); setShowAddQuestion(false); }}
                    className="px-5 py-1.5 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Close</button>
                </div>
              ) : (
                <div className="p-5 bg-gray-50 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Add New Question</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 block mb-1">Question Text *</label>
                      <textarea rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm resize-none focus:outline-none"
                        value={aqText} onChange={e => setAqText(e.target.value)} placeholder="Enter question..." />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Question Type</label>
                        <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none"
                          value={aqType} onChange={e => setAqType(Number(e.target.value))}>
                          <option value={1}>MCQ</option>
                          <option value={2}>True / False</option>
                          <option value={3}>Short Answer</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Marks</label>
                        <input type="number" min={1} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none"
                          value={aqMarks} onChange={e => setAqMarks(e.target.value)} placeholder="e.g. 2" />
                      </div>
                    </div>
                  </div>

                  {/* MCQ Options */}
                  {aqType === 1 && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Options (tick correct answer)</label>
                      <div className="space-y-1.5">
                        {aqOptions.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input type="radio" name="aq_correct" checked={opt.is_answer === 1}
                              onChange={() => setAqOptions(prev => prev.map((o, j) => ({ ...o, is_answer: j === i ? 1 : 0 })))}
                              className="accent-green-600" />
                            <input type="text" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"
                              placeholder={`Option ${i + 1}`} value={opt.value}
                              onChange={e => setAqOptions(prev => prev.map((o, j) => j === i ? { ...o, value: e.target.value } : o))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* True/False options */}
                  {aqType === 2 && (
                    <div className="flex gap-4 text-sm">
                      {['True', 'False'].map((label, i) => (
                        <label key={label} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="tf_correct" className="accent-green-600"
                            checked={aqOptions[i]?.is_answer === 1}
                            onChange={() => setAqOptions([
                              { value: 'True', is_answer: i === 0 ? 1 : 0 },
                              { value: 'False', is_answer: i === 1 ? 1 : 0 },
                              { value: '', is_answer: 0 }, { value: '', is_answer: 0 }
                            ])} />
                          {label}
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setShowAddQuestion(false)}
                      className="px-4 py-1.5 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button onClick={addQuestion} disabled={submittingQ}
                      className="px-4 py-1.5 text-sm bg-[#1f3a4f] hover:bg-[#17404e] text-white rounded disabled:opacity-50">
                      {submittingQ ? 'Saving...' : 'Save Question'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── View Students Modal ── */}
      {studentsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-6">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl mx-4 my-auto">
            <div className="bg-[#1f3a4f] text-white px-5 py-3 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm">View Students — {studentsModal.quiz.quiz_title}</span>
              <button onClick={() => setStudentsModal(null)} className="text-white text-2xl font-light">&times;</button>
            </div>
            <div className="p-5">
              {loadingStudents ? (
                <p className="text-center py-10 text-gray-400">Loading students...</p>
              ) : studentsModal.students.length > 0 ? (
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#d6dde3] text-gray-700">
                      <tr>
                        <th className="px-3 py-2 w-8">#</th>
                        <th className="px-3 py-2 text-left">USN</th>
                        <th className="px-3 py-2 text-left">Student Name</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Score</th>
                        <th className="px-3 py-2">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentsModal.students.map((s: any, i: number) => (
                        <tr key={s.student_id ?? i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-center">{i + 1}</td>
                          <td className="px-3 py-2">{s.usno || s.usn || s.student_usn || s.student_name || '—'}</td>
                          <td className="px-3 py-2">{s.full_name || s.name || s.student_name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.student_usn || '—'}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              s.status === 'submitted' || s.is_submitted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {s.status || (s.is_submitted ? 'Submitted' : 'Pending')}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">{s.secured_marks ?? s.score ?? s.marks_obtained ?? '—'}</td>
                          <td className="px-3 py-2 text-center">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-10 text-gray-400 text-sm">No students assigned to this quiz yet.</p>
              )}
            </div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button onClick={() => setStudentsModal(null)}
                className="px-5 py-1.5 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Modal ── */}
      {shareModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start z-50 p-4 pt-10 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative mb-10">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
              <span className="font-semibold text-sm">Share Quiz "{shareModal.quiz_title}"</span>
              <button onClick={() => setShareModal(null)} className="text-white hover:opacity-75 text-xl font-light">&times;</button>
            </div>
            <div className="p-4">
              <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
                <input type="text" placeholder="Search by name or USN..." value={studentSearchTerm} onChange={e => setStudentSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64 focus:outline-none" />
                <span className="text-sm text-gray-600 font-medium bg-gray-100 px-3 py-1 rounded">
                  Selected: {selectedStudentIds.size} / {shareStudents.length}
                </span>
              </div>
              
              <div className="border border-gray-200 rounded max-h-96 overflow-y-auto">
                <table className="w-full text-xs text-left relative">
                  <thead className="bg-[#d6dde3] text-gray-700 sticky top-0 z-10 shadow-sm border-b border-gray-300">
                    <tr>
                      <th className="px-3 py-2 w-10 text-center">
                        <input type="checkbox"
                          checked={shareStudents.length > 0 && selectedStudentIds.size === shareStudents.filter(s => (s.first_name + ' ' + s.last_name).toLowerCase().includes(studentSearchTerm.toLowerCase()) || s.usno?.toLowerCase().includes(studentSearchTerm.toLowerCase())).length}
                          onChange={e => {
                            if (e.target.checked) {
                              const visible = shareStudents.filter(s => (s.first_name + ' ' + s.last_name).toLowerCase().includes(studentSearchTerm.toLowerCase()) || s.usno?.toLowerCase().includes(studentSearchTerm.toLowerCase())).map(s => s.student_id);
                              setSelectedStudentIds(new Set(Array.from(selectedStudentIds).concat(visible)));
                            } else {
                              const visible = shareStudents.filter(s => (s.first_name + ' ' + s.last_name).toLowerCase().includes(studentSearchTerm.toLowerCase()) || s.usno?.toLowerCase().includes(studentSearchTerm.toLowerCase())).map(s => s.student_id);
                              const newSet = new Set(selectedStudentIds);
                              visible.forEach(id => newSet.delete(id));
                              setSelectedStudentIds(newSet);
                            }
                          }} />
                      </th>
                      <th className="px-3 py-2">Sl No.</th>
                      <th className="px-3 py-2">USN</th>
                      <th className="px-3 py-2">Student Name</th>
                      <th className="px-3 py-2">Batch/Semester</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingShareStudents ? (
                      <tr><td colSpan={5} className="py-10 text-center text-gray-400">Loading actual students...</td></tr>
                    ) : shareStudents.filter(s => (s.first_name + ' ' + s.last_name).toLowerCase().includes(studentSearchTerm.toLowerCase()) || s.usno?.toLowerCase().includes(studentSearchTerm.toLowerCase())).map((st, i) => (
                      <tr key={st.student_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                        const newSet = new Set(selectedStudentIds);
                        newSet.has(st.student_id) ? newSet.delete(st.student_id) : newSet.add(st.student_id);
                        setSelectedStudentIds(newSet);
                      }}>
                        <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedStudentIds.has(st.student_id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedStudentIds);
                              e.target.checked ? newSet.add(st.student_id) : newSet.delete(st.student_id);
                              setSelectedStudentIds(newSet);
                            }} />
                        </td>
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-700">{st.usno}</td>
                        <td className="px-3 py-2">{st.first_name} {st.last_name}</td>
                        <td className="px-3 py-2 text-gray-500">Semester {st.current_semester} - {st.section || 'N/A'}</td>
                      </tr>
                    ))}
                    {!loadingShareStudents && shareStudents.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-400">No students available for the selected batch/term.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center gap-2 rounded-b-lg">
              <button onClick={submitShareAll} disabled={submittingShare}
                className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded font-medium disabled:opacity-50">
                {submittingShare ? 'Sharing...' : '⚡ Share All (Auto)'}
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShareModal(null)} className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-white text-gray-700">Cancel</button>
                <button onClick={submitShare} disabled={submittingShare}
                  className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50">
                  {submittingShare ? 'Sharing...' : selectedStudentIds.size > 0 ? `Share with ${selectedStudentIds.size} student(s)` : 'Share (Auto)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}