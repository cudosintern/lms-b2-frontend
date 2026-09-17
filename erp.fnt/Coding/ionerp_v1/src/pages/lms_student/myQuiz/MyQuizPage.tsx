import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../utils/api';
import { LocalStorageHelper } from '../../../utils/localStorageHelper';
import { loginData } from '../../login/loginModel';
import { ApiEndpoint } from '../../../utils/ApiEndpoint/lmsApiEndpoint';

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface SharedQuiz {
  qs_map_id: number;
  quiz_id: number;
  ssd_id: number;
  student_usn: string;
  q_secured_marks: number | null;
  secured_marks: number | null;
  is_submitted: number;
  accept_rework_flag: number | null;
  rework_comment: string | null;
  remarks: string | null;
  quiz_title: string;
  quiz_description: string | null;
  quiz_instruction: string | null;
  quiz_date: string | null;
  quiz_time: string | null;
  duration: string | null;
  marks_flag: number;
  practice_quiz: number;
  file_name: string | null;
  file_path: string | null;
  crs_code: string;
  crs_title: string;
  question_count: number;
  answered_count: number;
}

interface QuizOption { qq_option_id: number; option_value: string; option_explanation?: string; }
interface QuizQuestion { qq_id: number; question: string; question_type: number; marks: number | null; options: QuizOption[]; selected_option_id: number | null; }

interface QuizEnrollment {
  academic_batch_id: number; semester_id: number; crs_id: number;
  crs_code: string; crs_title: string; section_id: number; section_name: string | null;
}
interface QuizDropdowns {
  batches: { academic_batch_id: number; academic_batch_desc: string }[];
  semesters: { semester_id: number; semester: number; academic_batch_id: number }[];
  enrollments: QuizEnrollment[];
}
type QuizApiResponse<T> = Partial<T> & { status?: boolean; data?: T };
const EMPTY_DROPDOWNS: QuizDropdowns = { batches: [], semesters: [], enrollments: [] };

const STUDENT_QUIZ_API = '/api/v1/student-quiz';

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  try { const dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
};
const fmtTime = (t: string | null) => { if (!t) return '—'; if (/^\d{2}:\d{2}/.test(t)) return t.substring(0, 5); return t; };
const fmtSecs = (s: number) => { const m = Math.floor(s / 60); const ss = s % 60; return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`; };

const getStatusInfo = (q: SharedQuiz): { label: string; color: string; bg: string } => {
  if (q.is_submitted === 1) return { label: 'Submitted', color: 'text-green-700', bg: 'bg-green-100' };
  if (q.accept_rework_flag === 2) return { label: 'Rework', color: 'text-amber-700', bg: 'bg-amber-100' };
  if (q.accept_rework_flag === 1) return { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100' };
  return { label: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100' };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyQuizPage: React.FC = () => {
  const authState = LocalStorageHelper.getObject<loginData>('auth_state');
  const session = authState as (loginData & { student_id?: number; id?: number }) | null;
  const studentId = Number(session?.student_id ?? session?.user_id ?? session?.id);
  const hasStudent = Number.isInteger(studentId) && studentId > 0;
  const [dropdowns, setDropdowns] = useState<QuizDropdowns>(EMPTY_DROPDOWNS);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState('');
  const [batchId, setBatchId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const quizRequest = useRef(0);
  const filtersReady = hasStudent && !!batchId && !!semesterId && !!courseId && !!sectionId;

  const [quizzes, setQuizzes] = useState<SharedQuiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);


  const [detailModal, setDetailModal] = useState<SharedQuiz | null>(null);

  // Quiz Taking state
  const [quizSession, setQuizSession] = useState<{ quiz: SharedQuiz; questions: QuizQuestion[] } | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmitRef = useRef(false);
  const answersRef = useRef<Record<number, number>>({});
  const [confirmSubmitPrompt, setConfirmSubmitPrompt] = useState(false);

  useEffect(() => {
    let active = true;
    setDropdowns(EMPTY_DROPDOWNS);
    setBatchId(''); setSemesterId(''); setCourseId(''); setSectionId('');
    setMetadataError('');
    if (!hasStudent) { setMetadataLoading(false); return; }
    setMetadataLoading(true);
    const loadDropdowns = async () => {
      try {
        const r = await axiosInstance.get<QuizApiResponse<QuizDropdowns>>(
          `${STUDENT_QUIZ_API}/dropdowns`, { params: { student_id: studentId } });
        if (!active) return;
        if (r.data?.status === false) throw new Error('Failed to load enrollment');
        const body = r.data?.data ?? r.data;
        const data: QuizDropdowns = {
          batches: body.batches ?? [],
          semesters: body.semesters ?? [],
          enrollments: body.enrollments ?? [],
        };
        setDropdowns(data);
        setBatchId(String(data.batches[0]?.academic_batch_id ?? ''));
      } catch {
        if (active) setMetadataError('Failed to load your academic details. Please reload the page.');
      } finally {
        if (active) setMetadataLoading(false);
      }
    };
    void loadDropdowns();
    return () => { active = false; };
  }, [studentId, hasStudent]);

  const fetchQuizzes = useCallback(async () => {
    const request = ++quizRequest.current;
    setQuizzes([]); setCurrentPage(1);
    if (!filtersReady) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await axiosInstance.get<QuizApiResponse<{ items: SharedQuiz[] }>>(`${STUDENT_QUIZ_API}/my-quizzes`, {
        params: { student_id: studentId, academic_batch_id: Number(batchId),
          semester_id: Number(semesterId), crs_id: Number(courseId), section_id: Number(sectionId) },
      });
      if (request !== quizRequest.current) return;
      if (r.data?.status === false) throw new Error('Failed to load quizzes');
      const items = r.data?.data?.items ?? r.data?.items;
      setQuizzes(Array.isArray(items) ? items : []);
    } catch {
      if (request === quizRequest.current) toast.error('Failed to load quizzes');
    } finally { if (request === quizRequest.current) setLoading(false); }
  }, [studentId, batchId, semesterId, courseId, sectionId, filtersReady]);

  useEffect(() => {
    fetchQuizzes();
    return () => { quizRequest.current += 1; };
  }, [fetchQuizzes]);

  const semesters = dropdowns.semesters.filter(s => String(s.academic_batch_id) === batchId);
  const enrollment = dropdowns.enrollments.filter(e =>
    String(e.academic_batch_id) === batchId && String(e.semester_id) === semesterId);
  const courses = Array.from(new Map(enrollment.map(e => [e.crs_id, e])).values());
  const sections = Array.from(new Map(enrollment.filter(e => String(e.crs_id) === courseId && e.section_id)
    .map(e => [e.section_id, e])).values());

  // ── Timer ──
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startTimer = (seconds: number, handleAutoSubmit: () => void) => {
    stopTimer();
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          if (!autoSubmitRef.current) { autoSubmitRef.current = true; handleAutoSubmit(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => stopTimer(), []);

  // ── Start Quiz ──
  const handleStartQuiz = async (quiz: SharedQuiz) => {
    setStartingQuiz(true);
    try {
      const r: any = await axiosInstance.post(ApiEndpoint.studentQuiz.start(quiz.quiz_id), null, {
        params: { ssd_id: studentId, student_usn: quiz.student_usn },
      });
      const data = r.data?.data ?? r.data;
      const questions: QuizQuestion[] = (data?.questions ?? []).map((q: any) => ({
        ...q, selected_option_id: q.selected_option_id ?? null,
      }));
      const preAnswers: Record<number, number> = {};
      questions.forEach((q: QuizQuestion) => { if (q.selected_option_id) preAnswers[q.qq_id] = q.selected_option_id; });
      setAnswers(preAnswers);
      answersRef.current = preAnswers;
      autoSubmitRef.current = false;
      setQuizSession({ quiz, questions });
      setDetailModal(null);
      const durationMins = Number(quiz.duration) || 30;
      startTimer(durationMins * 60, () => submitAnswers(quiz, questions, true));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to start quiz');
    } finally { setStartingQuiz(false); }
  };

  // ── Submit Quiz ──
  const submitAnswers = async (
    quiz: SharedQuiz,
    questions: QuizQuestion[],
    isAutoSubmit = false,
  ) => {
    if (submitting) return;
    setSubmitting(true);
    stopTimer();
    try {
      const currentAnswers = answersRef.current;
      const payload = {
        ssd_id: studentId,
        student_usn: quiz.student_usn,   // ← use usn from the mapping row, not auth_state
        answers: Object.entries(currentAnswers).map(([qq_id, qq_option_id]) => ({ qq_id: Number(qq_id), qq_option_id })),
      };
      await axiosInstance.post(ApiEndpoint.studentQuiz.submit(quiz.quiz_id), payload);
      toast.success(isAutoSubmit ? 'Time up! Quiz auto-submitted.' : 'Quiz submitted successfully!');
      setQuizSession(null);
      setAnswers({});
      fetchQuizzes();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Submit failed');
    } finally { setSubmitting(false); }
  };

  const filtered = quizzes.filter(q => {
    const matchesSearch =
      q.quiz_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.crs_title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / showEntries));
  const pageData = filtered.slice((currentPage - 1) * showEntries, currentPage * showEntries);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * showEntries + 1;
  const end = Math.min(currentPage * showEntries, filtered.length);

  // ──────────────────────── QUIZ TAKING UI ─────────────────────────────────
  if (quizSession) {
    const { quiz, questions } = quizSession;
    const answeredCount = Object.keys(answers).length;
    const timerColor = timeLeft < 120 ? 'text-red-600' : timeLeft < 300 ? 'text-amber-500' : 'text-green-600';

    return (
      <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-[#1f3a4f] text-white px-6 py-3 flex justify-between items-center flex-shrink-0">
          <div>
            <div className="font-bold text-base">{quiz.quiz_title}</div>
            <div className="text-xs text-white/70 mt-0.5">{quiz.crs_title} — {questions.length} Questions</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-white/60">Answered</div>
              <div className="font-bold text-lg">{answeredCount}/{questions.length}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/60">Time Left</div>
              <div className={`font-mono font-bold text-2xl ${timerColor}`}>{fmtSecs(timeLeft)}</div>
            </div>
            <button
              onClick={() => setConfirmSubmitPrompt(true)}
              disabled={submitting}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : '✓ Submit Quiz'}
            </button>
          </div>
        </div>

        {quiz.quiz_instruction && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-sm text-blue-700 flex-shrink-0">
            <span className="font-semibold">Instructions:</span> {quiz.quiz_instruction}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full">
          {questions.map((q, idx) => {
            const selected = answers[q.qq_id];
            return (
              <div key={q.qq_id} className={`bg-white border rounded-lg p-5 mb-4 shadow-sm ${selected ? 'border-green-300' : 'border-gray-200'}`}>
                <div className="flex gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1f3a4f] text-white flex items-center justify-center text-sm font-bold">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{q.question}</p>
                    {q.marks && <span className="text-xs text-gray-400 mt-0.5 block">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <div className="space-y-2 ml-11">
                  {q.options.map(opt => (
                    <label key={opt.qq_option_id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition
                        ${selected === opt.qq_option_id ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}
                    >
                      <input type="radio" name={`q_${q.qq_id}`} checked={selected === opt.qq_option_id}
                        onChange={() => setAnswers(prev => {
                          const next = { ...prev, [q.qq_id]: opt.qq_option_id };
                          answersRef.current = next;
                          return next;
                        })}
                        className="accent-blue-600" />
                      <span className="text-sm">{opt.option_value}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex justify-center mt-4 pb-8">
            <button onClick={() => setConfirmSubmitPrompt(true)} disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-3 rounded-xl text-base shadow disabled:opacity-50 transition">
              {submitting ? 'Submitting...' : '✓ Submit Quiz'}
            </button>
          </div>
        </div>

        {confirmSubmitPrompt && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center transform scale-100 transition-all">
              <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Submit Quiz?</h3>
              <p className="text-sm text-gray-600 mb-6">
                You have answered <span className="font-bold text-gray-900">{answeredCount}</span> out of <span className="font-bold text-gray-900">{questions.length}</span> questions. 
                Are you sure you want to finish and submit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmSubmitPrompt(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >Cancel</button>
                <button
                  onClick={() => {
                    setConfirmSubmitPrompt(false);
                    submitAnswers(quiz, questions, false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md"
                >Yes, Submit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────── LIST VIEW ──────────────────────────────────────
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5 flex justify-between items-center">
          <h1 className="text-sm font-semibold">My Quizzes</h1>
          <button onClick={fetchQuizzes} disabled={loading || !filtersReady}
            className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded">
            ↻ Refresh
          </button>
        </div>

        <div className="p-4">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Academic Batch', value: batchId, disabled: metadataLoading || !dropdowns.batches.length,
                options: dropdowns.batches.map(b => ({ value: String(b.academic_batch_id), label: b.academic_batch_desc })),
                change: (v: string) => { setBatchId(v); setSemesterId(''); setCourseId(''); setSectionId(''); } },
              { label: 'Semester', value: semesterId, disabled: !batchId || !semesters.length,
                options: semesters.map(s => ({ value: String(s.semester_id), label: `Semester ${s.semester}` })),
                change: (v: string) => { setSemesterId(v); setCourseId(''); setSectionId(''); } },
              { label: 'Course', value: courseId, disabled: !semesterId || !courses.length,
                options: courses.map(c => ({ value: String(c.crs_id), label: `${c.crs_code} — ${c.crs_title}` })),
                change: (v: string) => { setCourseId(v); setSectionId(''); } },
              { label: 'Section', value: sectionId, disabled: !courseId || !sections.length,
                options: sections.map(s => ({ value: String(s.section_id), label: s.section_name || `Section ${s.section_id}` })),
                change: setSectionId },
            ].map(field => (
              <label key={field.label} className="text-sm text-gray-700">
                <span className="block mb-1 font-medium">{field.label}</span>
                <select className="border border-gray-300 rounded px-2 py-2 w-full disabled:bg-gray-100"
                  value={field.value} disabled={field.disabled} onChange={e => field.change(e.target.value)}>
                  <option value="">Select {field.label}</option>
                  {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-600 mb-3" role="status">
            {!hasStudent ? 'Student identity is missing. Please log in again.' : metadataLoading ? 'Loading academic details...' :
              metadataError || (!dropdowns.batches.length ? 'No academic batch is linked to your student profile.' :
              semesterId && !courses.length ? 'No enrolled courses found for this semester.' :
              courseId && !sections.length ? 'No enrolled sections found for this course.' :
              !filtersReady ? 'Select semester, course, and section to view your assigned quizzes.' : '')}
          </p>

          {/* Table controls */}
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
                placeholder="Quiz title or course..."
                value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="w-full text-sm">
              <thead className="bg-[#d6dde3] text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left w-10">Sl No.</th>
                  <th className="px-3 py-2 text-left">Quiz Title</th>
                  <th className="px-3 py-2 text-left">Course</th>
                  <th className="px-3 py-2 text-left">Quiz Date</th>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Duration</th>
                  <th className="px-3 py-2 text-left">Questions</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Loading your quizzes...
                    </div>
                  </td></tr>
                ) : pageData.length > 0 ? pageData.map((q, idx) => {
                  const status = getStatusInfo(q);
                  const canStart = q.is_submitted === 0;
                  return (
                    <tr key={q.qs_map_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{(currentPage - 1) * showEntries + idx + 1}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => setDetailModal(q)} className="font-medium text-blue-700 hover:underline text-left">{q.quiz_title}</button>
                        {q.practice_quiz === 1 && <span className="ml-1.5 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">Practice</span>}
                        {q.accept_rework_flag === 2 && (
                          <div className="flex items-center gap-1 mt-1 bg-amber-50 border border-amber-300 rounded px-2 py-0.5 text-[10px] text-amber-800 font-medium w-fit">
                            ⚠️ Rework needed
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">{q.crs_code ? `${q.crs_code}` : '—'}</td>
                      <td className="px-3 py-2 text-xs">{fmtDate(q.quiz_date)}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{fmtTime(q.quiz_time)}</td>
                      <td className="px-3 py-2 text-xs">{q.duration ? `${q.duration} min` : '—'}</td>
                      <td className="px-3 py-2 text-xs text-center">
                        <span className="font-medium">{q.answered_count}</span><span className="text-gray-400">/{q.question_count}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${status.bg} ${status.color}`}>{status.label}</span>
                        {q.secured_marks != null && <span className="ml-1 text-xs text-gray-500">({q.secured_marks} marks)</span>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 flex-wrap">
                          {canStart && q.question_count > 0 && (
                            <button onClick={() => handleStartQuiz(q)} disabled={startingQuiz}
                              className="text-xs bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700 disabled:opacity-50 font-semibold">
                              {startingQuiz ? '...' : '▶ Start'}
                            </button>
                          )}
                          <button onClick={() => setDetailModal(q)} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded hover:bg-indigo-200">View</button>
                          {q.file_name && (
                            <a href={ApiEndpoint.studentQuiz.downloadFile(q.quiz_id)} target="_blank" rel="noreferrer"
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-200">⬇ File</a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {!filtersReady ? 'Select your academic details above.' : quizzes.length === 0 ? 'No quizzes are assigned to you for the selected academic details.' : 'No quizzes match your search.'}
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

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
            <div className="bg-[#1f3a4f] text-white px-4 py-3 rounded-t-lg flex justify-between items-center sticky top-0">
              <span className="font-semibold text-sm">Quiz Details</span>
              <button onClick={() => setDetailModal(null)} className="text-white text-xl">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">{detailModal.quiz_title}</h2>
                {detailModal.crs_code && <p className="text-xs text-gray-500 mt-0.5">{detailModal.crs_code} — {detailModal.crs_title}</p>}
                {detailModal.practice_quiz === 1 && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">Practice Quiz</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Quiz Date', value: fmtDate(detailModal.quiz_date) },
                  { label: 'Quiz Time', value: fmtTime(detailModal.quiz_time) },
                  { label: 'Duration', value: detailModal.duration ? `${detailModal.duration} minutes` : '—' },
                  { label: 'Total Questions', value: String(detailModal.question_count) },
                  { label: 'Answered', value: String(detailModal.answered_count) },
                  { label: 'Marks Enabled', value: detailModal.marks_flag === 1 ? 'Yes' : 'No' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded p-2.5">
                    <div className="text-gray-500 mb-0.5 font-medium">{label}</div>
                    <div className="text-gray-800">{value}</div>
                  </div>
                ))}
              </div>
              {detailModal.quiz_instruction && (
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Instructions</div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 whitespace-pre-wrap">{detailModal.quiz_instruction}</div>
                </div>
              )}
              <div>
                <div className="text-xs font-medium text-gray-500 mb-2">Your Status</div>
                <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                  {(() => { const s = getStatusInfo(detailModal); return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.bg} ${s.color}`}>{s.label}</span>; })()}
                  {detailModal.is_submitted === 1 && <div className="text-green-700 text-xs mt-1">✅ You have submitted this quiz.</div>}
                  {detailModal.secured_marks != null && <div className="text-sm mt-1">Marks: <span className="font-bold">{detailModal.secured_marks}</span></div>}
                  {detailModal.remarks && <div className="text-sm">Remarks: {detailModal.remarks}</div>}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 rounded-b-lg flex justify-between items-center sticky bottom-0">
              <div className="flex gap-2">
                {detailModal.is_submitted === 0 && detailModal.question_count > 0 && (
                  <button onClick={() => handleStartQuiz(detailModal)} disabled={startingQuiz}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:opacity-50">
                    {startingQuiz ? 'Starting...' : '▶ Start Quiz'}
                  </button>
                )}
                {detailModal.file_name && (
                  <a href={ApiEndpoint.studentQuiz.downloadFile(detailModal.quiz_id)} target="_blank" rel="noreferrer"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">⬇ Download</a>
                )}
              </div>
              <button onClick={() => setDetailModal(null)} className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyQuizPage;
