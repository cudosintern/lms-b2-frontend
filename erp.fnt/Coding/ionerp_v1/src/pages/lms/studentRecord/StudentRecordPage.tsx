import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../../utils/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ───────────────────────────────────────────────────────────────────
interface UsnSuggestion {
  student_id: number;
  usno: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  student_name?: string;
}
interface AcademicBatch {
  academic_batch_id: number;
  academic_batch_code: string;
  academic_batch_desc: string;
  academic_year?: string;
}
interface StudentInfo {
  student_id: number;
  usno: string;
  student_name: string;
  email?: string;
  mobile?: string;
  gender?: string;
  section?: string;
  current_semester?: number;
  academic_batch?: AcademicBatch;
}
interface EnrolledCourse {
  crs_id?: number;
  crs_code?: string;
  crs_title?: string;
  semester?: number | string;
  academic_batch_id?: number;
  course_type?: string;
  credits?: number;
}
interface MarksRow {
  crs_id?: number;
  crs_code?: string;
  crs_title?: string;
  section?: string;
  section_id?: number;
  assessment_occasion?: string;
  qp_rollout?: any;
  secured_marks?: number | null;
  raw_marks_row?: Record<string, any>;
}
interface AttendanceItem {
  class_date?: string;
  crs_id?: number;
  crs_code?: string;
  crs_title?: string;
  section?: string;
  attendance_status: string;
}
interface StudentDetails {
  personal_info: StudentInfo;
  enrolled_courses: EnrolledCourse[];
  consolidated_marks: { total: number; items: MarksRow[] };
  consolidated_attendance: {
    summary: { present: number; absent: number; other: number };
    total: number;
    items: AttendanceItem[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildAttendanceSummary(items: AttendanceItem[]) {
  const map = new Map<string, { crs_code?: string; crs_title?: string; section?: string; total: number; present: number; absent: number }>();
  items.forEach((item) => {
    const key = String(item.crs_id ?? item.crs_code ?? 'unknown');
    if (!map.has(key))
      map.set(key, { crs_code: item.crs_code, crs_title: item.crs_title, section: item.section, total: 0, present: 0, absent: 0 });
    const entry = map.get(key)!;
    entry.total += 1;
    if (item.attendance_status === 'Present') entry.present += 1;
    else if (item.attendance_status === 'Absent') entry.absent += 1;
  });
  return map;
}

function extractCourseMarks(rows: MarksRow[]) {
  return rows
    .filter((r) => r.assessment_occasion)
    .map((r) => {
      const raw = r.raw_marks_row || {};
      const maxKey = Object.keys(raw).find((k) => k.includes('max') || k.includes('out_of'));
      return { occasion: r.assessment_occasion!, secured: r.secured_marks ?? null, max: maxKey ? raw[maxKey] : null };
    });
}

// ─── Component ───────────────────────────────────────────────────────────────
const StudentRecordPage: React.FC = () => {
  const [usnInput, setUsnInput] = useState('');
  const [suggestions, setSuggestions] = useState<UsnSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (search: string) => {
    if (!search.trim()) { setSuggestions([]); return; }
    setLoadingSuggestions(true);
    try {
      const r: any = await axiosInstance.get('/api/v1/reports/student-record-report/usn', { params: { search, limit: 20 } });
      const items = r.data?.data?.items ?? r.data?.items ?? [];
      setSuggestions(Array.isArray(items) ? items : []);
    } catch { setSuggestions([]); }
    finally { setLoadingSuggestions(false); }
  }, []);

  const handleUsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsnInput(val); setDetails(null); setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleUsnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { setShowSuggestions(false); if (usnInput.trim()) fetchDetails(usnInput.trim()); }
  };

  const selectSuggestion = (s: UsnSuggestion) => {
    setUsnInput(s.usno); setShowSuggestions(false); fetchDetails(s.usno);
  };

  const fetchDetails = async (usno: string) => {
    setLoadingDetails(true); setDetails(null);
    try {
      const r: any = await axiosInstance.get('/api/v1/reports/student-record-report/details', { params: { usno } });
      const d = r.data?.data ?? r.data;
      if (d?.personal_info) setDetails(d);
      else toast.error('Student not found');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to fetch student record');
    }
    finally { setLoadingDetails(false); }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const marksItems = details?.consolidated_marks?.items ?? [];
  const attendanceItems = details?.consolidated_attendance?.items ?? [];
  const enrolledCourses: EnrolledCourse[] = details?.enrolled_courses ?? [];
  const hasEnrolled = enrolledCourses.length > 0;

  const attendanceByCourse = buildAttendanceSummary(attendanceItems);

  const courseMarkMap = new Map<string, MarksRow[]>();
  marksItems.forEach((row) => {
    const key = String(row.crs_id ?? row.crs_code ?? 'unknown');
    if (!courseMarkMap.has(key)) courseMarkMap.set(key, []);
    courseMarkMap.get(key)!.push(row);
  });

  const fallbackKeys = Array.from(
    new Set(Array.from(courseMarkMap.keys()).concat(Array.from(attendanceByCourse.keys())))
  );

  const info = details?.personal_info;
  const attSummary = details?.consolidated_attendance?.summary;
  const batchLabel = info?.academic_batch?.academic_batch_desc ?? '';
  const semLabel = info?.current_semester ? `${info.current_semester} - Semester` : 'Semester';

  const handleExportPdf = () => {
    if (!details || !info) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setTextColor(31, 58, 79);
    doc.text("Student Record", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`USN: ${info.usno}`, 14, yPos);
    doc.text(`Name: ${info.student_name || '--'}`, pageWidth / 2, yPos);
    yPos += 8;
    doc.text(`Semester: ${info.current_semester || '--'}`, 14, yPos);
    doc.text(`Section: ${info.section || '--'}`, pageWidth / 2, yPos);
    yPos += 8;
    if (batchLabel) {
      doc.text(`Curriculum: ${batchLabel}`, 14, yPos);
      yPos += 8;
    }
    
    yPos += 4;

    const coursesToRender = hasEnrolled ? enrolledCourses : fallbackKeys.map((key) => {
      const markRows = courseMarkMap.get(key) ?? [];
      const firstMark = markRows[0];
      const attData = attendanceByCourse.get(key);
      return {
        crs_id: key,
        crs_code: firstMark?.crs_code ?? attData?.crs_code ?? key,
        crs_title: firstMark?.crs_title ?? attData?.crs_title ?? '--'
      };
    });

    const tableData: any[][] = [];
    coursesToRender.forEach(c => {
      const courseKey = String(c.crs_id ?? c.crs_code ?? 'unknown');
      const attData = attendanceByCourse.get(courseKey);
      const markRows = courseMarkMap.get(courseKey) ?? [];
      const marksEntries = extractCourseMarks(markRows);

      const total = attData?.total ?? 0;
      const attended = attData?.present ?? 0;
      const pct = total > 0 ? ((attended / total) * 100).toFixed(2) + '%' : 'N/A';

      const marksStr = marksEntries.length === 0 ? 'No marks' : marksEntries.map(m => `${m.occasion}: ${m.secured ?? '--'}${m.max ? `/${m.max}`:''}`).join('\n');

      tableData.push([
        `${c.crs_code || ''} - ${c.crs_title || ''}`,
        total,
        attended,
        pct,
        marksStr
      ]);
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Course', 'Total Classes', 'Attended', 'Attendance %', 'Consolidated Marks']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [31, 58, 79] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 50 },
        4: { cellWidth: 50 }
      }
    });

    doc.save(`Student_Record_${info.usno}.pdf`);
  };

  // ── Course card (shared renderer) ─────────────────────────────────────────
  const CourseCard = ({
    courseKey, crsCode, crsTitle, courseType, credits,
  }: { courseKey: string; crsCode: string; crsTitle: string; courseType?: string; credits?: number }) => {
    const markRows = courseMarkMap.get(courseKey) ?? [];
    const attData = attendanceByCourse.get(courseKey);
    const marksEntries = extractCourseMarks(markRows);
    const total = attData?.total ?? 0;
    const attended = attData?.present ?? 0;
    const missed = attData?.absent ?? 0;
    const pct = total > 0 ? ((attended / total) * 100).toFixed(2) : null;
    const sectionLabel = attData?.section ?? info?.section ?? null;

    return (
      <div className="border border-gray-200 rounded mb-3 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* Left: course + attendance */}
          <div className="p-3">
            <div className="font-bold text-gray-800 text-sm">{crsCode || '—'}</div>
            <div className="text-red-600 text-xs font-medium mt-0.5">
              {crsTitle || '—'}
              {courseType && <span className="text-gray-500 ml-1">( {courseType} )</span>}
            </div>
            {credits != null && <div className="text-xs text-gray-400 mt-0.5">Credits: {credits}</div>}

            {attData ? (
              <>
                <div className="mt-2 text-xs font-semibold text-gray-700">
                  Attendance{sectionLabel && <span className="font-normal"> : Section - {sectionLabel}</span>}
                </div>
                <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                  <div className="flex"><span className="w-36">Total Class:</span><span className="font-medium">{String(total).padStart(2,'0')}</span></div>
                  <div className="flex"><span className="w-36">Class attended:</span><span className="font-medium">{String(attended).padStart(2,'0')}</span></div>
                  <div className="flex"><span className="w-36">Class missed:</span><span className="font-medium">{String(missed).padStart(2,'0')}</span></div>
                  <div className="flex"><span className="w-36">Attendance percentage:</span>
                    <span className={`font-medium ${pct && Number(pct)<75?'text-red-600':'text-green-700'}`}>{pct}%</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-2 text-xs text-gray-400 italic">No attendance recorded</div>
            )}
          </div>

          {/* Right: marks */}
          <div className="p-3">
            <div className="text-sm font-semibold text-gray-800 mb-2">Consolidated marks</div>
            {marksEntries.length === 0 ? (
              <div className="text-xs text-gray-400 italic">No marks recorded</div>
            ) : (
              <div className="space-y-1">
                {marksEntries.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_auto_auto] text-xs text-gray-700 gap-x-1 items-start">
                    <span className="leading-tight">{m.occasion}</span>
                    <span className="text-gray-500">:</span>
                    <span className="text-right font-medium whitespace-nowrap">
                      {m.secured !== null && m.secured !== undefined
                        ? `${m.secured}${m.max ? ` / ${m.max}` : ''}`
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5">
          <h1 className="text-sm font-semibold">Student Record</h1>
        </div>

        <div className="p-4">
          {/* USN Input Row */}
          <div className="flex items-start gap-4 mb-1">
            <div className="flex flex-col gap-1" style={{ minWidth: 220 }} ref={suggestionRef}>
              <label className="text-xs font-semibold text-gray-700">
                Student USN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usnInput}
                  onChange={handleUsnChange}
                  onKeyDown={handleUsnKeyDown}
                  placeholder="Type USN and press Enter"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</span>

                {showSuggestions && usnInput.length > 0 && (
                  <div className="absolute z-50 bg-white border border-gray-200 rounded shadow-lg w-80 max-h-60 overflow-y-auto mt-1">
                    {loadingSuggestions ? (
                      <div className="px-3 py-2 text-xs text-gray-500">Loading...</div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">No students found</div>
                    ) : suggestions.map((s) => (
                      <div key={s.student_id}
                        className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer flex gap-2"
                        onMouseDown={() => selectSuggestion(s)}>
                        <span className="font-mono text-blue-700 text-xs">{s.usno}</span>
                        <span className="text-gray-700">{s.student_name || s.name || `${s.first_name||''} ${s.last_name||''}`.trim()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500">Note: Hit enter once you type USN.</span>
            </div>

            <div className="ml-auto mt-5">
              <button disabled={!details}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs px-4 py-2 rounded font-medium"
                onClick={handleExportPdf}>
                Export PDF
              </button>
            </div>
          </div>

          {loadingDetails && (
            <div className="mt-10 flex justify-center items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading student record...</span>
            </div>
          )}

          {details && !loadingDetails && (
            <div className="flex gap-6 mt-4">
              {/* ── Left: Courses ─────────────────────────────── */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold mb-3">
                  <span>▲</span>
                  <span>{semLabel}{batchLabel && ` (${batchLabel})`}</span>
                </div>

                {/* Primary: from iems_courses via enrolled_courses */}
                {hasEnrolled && enrolledCourses.map((c) => (
                  <CourseCard
                    key={String(c.crs_id ?? c.crs_code ?? Math.random())}
                    courseKey={String(c.crs_id ?? c.crs_code ?? 'unknown')}
                    crsCode={c.crs_code || '—'}
                    crsTitle={c.crs_title || '—'}
                    courseType={c.course_type}
                    credits={c.credits}
                  />
                ))}

                {/* Fallback: from marks/attendance only */}
                {!hasEnrolled && fallbackKeys.length > 0 && fallbackKeys.map((key) => {
                  const markRows = courseMarkMap.get(key) ?? [];
                  const firstMark = markRows[0];
                  const attData = attendanceByCourse.get(key);
                  return (
                    <CourseCard
                      key={key}
                      courseKey={key}
                      crsCode={firstMark?.crs_code ?? attData?.crs_code ?? key}
                      crsTitle={firstMark?.crs_title ?? attData?.crs_title ?? '—'}
                    />
                  );
                })}

                {!hasEnrolled && fallbackKeys.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded">
                    No course data found. Courses may not be assigned to this student yet.
                  </div>
                )}
              </div>

              {/* ── Right: Profile Card ────────────────────────── */}
              <div className="w-64 shrink-0">
                <div className="border border-gray-200 rounded p-4 flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 80 80" className="w-full h-full text-gray-400">
                      <circle cx="40" cy="30" r="18" fill="currentColor" opacity=".4" />
                      <ellipse cx="40" cy="72" rx="28" ry="18" fill="currentColor" opacity=".25" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800 text-sm">{info?.student_name || '—'}</div>
                    {info?.email && <div className="text-xs text-blue-600">{info.email}</div>}
                  </div>
                  <hr className="w-full border-gray-200" />
                  <div className="w-full text-xs space-y-1.5">
                    <div className="flex gap-1 flex-wrap">
                      <span className="font-semibold text-gray-600 whitespace-nowrap">Student USN:</span>
                      <span className="text-gray-800">{info?.usno}</span>
                    </div>
                    {info?.section && <div className="flex gap-1"><span className="font-semibold text-gray-600">Section:</span><span className="text-gray-800">{info.section}</span></div>}
                    {info?.current_semester && <div className="flex gap-1"><span className="font-semibold text-gray-600">Semester:</span><span className="text-gray-800">{info.current_semester}</span></div>}
                    {info?.gender && <div className="flex gap-1"><span className="font-semibold text-gray-600">Gender:</span><span className="text-gray-800 capitalize">{info.gender}</span></div>}
                    {info?.mobile && <div className="flex gap-1"><span className="font-semibold text-gray-600">Mobile:</span><span className="text-gray-800">{info.mobile}</span></div>}
                    {info?.academic_batch && (
                      <div>
                        <div className="font-semibold text-gray-600">Curriculum:</div>
                        <div className="text-blue-700 mt-0.5">{info.academic_batch.academic_batch_desc}</div>
                      </div>
                    )}
                    {hasEnrolled && (
                      <div className="flex gap-1">
                        <span className="font-semibold text-gray-600">Enrolled Courses:</span>
                        <span className="text-gray-800 font-medium">{enrolledCourses.length}</span>
                      </div>
                    )}
                  </div>

                  {attSummary && (attSummary.present + attSummary.absent) > 0 && (
                    <>
                      <hr className="w-full border-gray-200" />
                      <div className="w-full text-xs">
                        <div className="font-semibold text-gray-700 mb-1">Overall Attendance</div>
                        <div className="flex justify-between text-gray-600"><span>Present:</span><span className="text-green-700 font-medium">{attSummary.present}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Absent:</span><span className="text-red-600 font-medium">{attSummary.absent}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Total:</span><span className="font-medium">{attSummary.present + attSummary.absent}</span></div>
                        <div className="mt-1.5 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full transition-all"
                            style={{ width: `${(attSummary.present / (attSummary.present + attSummary.absent)) * 100}%` }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {!details && !loadingDetails && (
            <div className="mt-12 flex flex-col items-center gap-3 text-gray-400">
              <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 64 64" stroke="currentColor">
                <circle cx="32" cy="22" r="12" strokeWidth="2" />
                <path d="M8 56c0-13.255 10.745-24 24-24s24 10.745 24 24" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm">Enter a student USN above and press <strong>Enter</strong> to view their record.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRecordPage;
