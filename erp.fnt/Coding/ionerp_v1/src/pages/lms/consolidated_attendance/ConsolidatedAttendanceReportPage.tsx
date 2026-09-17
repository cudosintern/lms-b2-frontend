import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../../../utils/api';
import { toast } from 'react-toastify';
import { LocalStorageHelper } from '../../../utils/localStorageHelper';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DropdownItem {
  academic_batch_id?: number;
  academic_batch_code?: string;
  academic_batch_desc?: string;
  semester_id?: number;
  semester?: number;
  semester_desc?: string;
  crs_id?: number;
  crs_code?: string;
  crs_title?: string;
  section_id?: number;
  section?: string;
}

interface ReportRow {
  sl_no: number;
  usno: string;
  student_name: string;
  section: string;
  total_classes: number;
  present: number;
  absent: number;
  attendance_pct: number;
  [key: string]: any; // for horizontal date columns
}

interface ReportHeader {
  key: string;
  label: string;
}

interface ReportResult {
  total: number;
  headers: ReportHeader[];
  rows: ReportRow[];
  summary: {
    total_students: number;
    total_classes: number;
    average_attendance_pct: number;
    course?: { crs_code?: string; crs_title?: string };
  };
  report_type: string;
  date_range?: { from?: string; to?: string };
}

const RANGE_OPTIONS = [
  { label: 'Select Range', value: '' },
  { label: '< 40%', value: '0-40' },
  { label: '40% - < 60%', value: '40-60' },
  { label: '60% - < 75%', value: '60-75' },
  { label: '>= 75%', value: '75-100' },
  { label: 'All', value: 'all' },
];

const BASE_API = '/api/v1/consolidated-attendance-report';

const percentageColor = (pct: number) => pct >= 85 ? 'text-green-700' : pct >= 75 ? 'text-yellow-600' : 'text-red-600';

export function horizontalGroups(rows: ReportRow[]) {
  const sections = new Map<string, { section: string; courses: Map<string, ReportRow>; students: Map<string, Map<string, ReportRow>> }>();
  rows.forEach(row => {
    const sectionKey = String(row.section_id ?? row.section);
    const group = sections.get(sectionKey) ?? { section: row.section, courses: new Map(), students: new Map() };
    const courseKey = String(row.crs_id ?? row.crs_code);
    const studentKey = String(row.student_id ?? row.usno);
    group.courses.set(courseKey, row);
    const student = group.students.get(studentKey) ?? new Map<string, ReportRow>();
    student.set(courseKey, row);
    group.students.set(studentKey, student);
    sections.set(sectionKey, group);
  });
  return Array.from(sections.values());
}

const overallPercentage = (rows: ReportRow[]) => {
  const held = rows.reduce((sum, row) => sum + Number(row.total_classes), 0);
  return held ? rows.reduce((sum, row) => sum + Number(row.present), 0) * 100 / held : 0;
};

export const HorizontalAttendanceReport: React.FC<{ rows: ReportRow[] }> = ({ rows }) => {
  const cell = 'border border-gray-300 px-3 py-2';
  return <div className="p-4 space-y-10">{horizontalGroups(rows).map((group, groupIndex) => {
    const courses = Array.from(group.courses.entries());
    return <section key={groupIndex} aria-label={`Horizontal attendance - Section ${group.section}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse text-left">
          <caption className="border border-b-0 border-gray-300 p-2 text-left text-blue-700">Course-wise section-wise student attendance report with percentage (Section: {group.section})</caption>
          <thead>
            <tr><th colSpan={3 + courses.length * 2} className={cell}>Course</th><th colSpan={2} className={`${cell} text-center`}>Students displayed</th></tr>
            {courses.map(([key, course]) => <tr key={key}>
              <td colSpan={3 + courses.length * 2} className={cell}>{course.crs_code} - {course.crs_title} - Section: {course.section}</td>
              <td colSpan={2} className={`${cell} text-center`}>{Array.from(group.students.values()).filter(student => student.has(key)).length}</td>
            </tr>)}
            <tr><th rowSpan={4} className={cell}>Sl. No.</th><th rowSpan={4} className={cell}>USN</th><th className={cell}>Course Code</th>
              {courses.map(([key, course]) => <th key={key} colSpan={2} className={`${cell} text-center`}>{course.crs_code}</th>)}
              <th rowSpan={4} className={cell}>Overall %</th><th rowSpan={4} className={cell}>Student signature</th>
            </tr>
            <tr><th className={cell}>Section</th>{courses.map(([key, course]) => <td key={key} colSpan={2} className={`${cell} text-center`}>{course.section}</td>)}</tr>
            <tr><th className={cell}>Total Class Held</th>{courses.map(([key, course]) => <td key={key} colSpan={2} className={`${cell} text-center`}>{course.total_classes}</td>)}</tr>
            <tr><th className={cell}>Student Name</th>{courses.map(([key]) => <React.Fragment key={key}><th className={`${cell} text-center`}>Classes Attended</th><th className={`${cell} text-center`}>%</th></React.Fragment>)}</tr>
          </thead>
          <tbody>{Array.from(group.students.entries()).map(([studentKey, marks], index) => {
            const entries = Array.from(marks.values());
            const student = entries[0];
            const overall = overallPercentage(entries);
            return <tr key={studentKey}><td className={cell}>{index + 1}</td><td className={cell}>{student.usno}</td><td className={`${cell} whitespace-nowrap`}>{student.student_name}</td>
              {courses.map(([key]) => {
                const mark = marks.get(key);
                return <React.Fragment key={key}>
                  <td className={`${cell} text-center text-blue-700`} title={mark ? `${mark.absent} absent, ${mark.unmarked ?? 0} unmarked` : 'Not mapped to this course'}>{mark ? `${mark.present} / ${mark.total_classes}` : '—'}</td>
                  <td className={`${cell} text-center ${mark ? percentageColor(mark.attendance_pct) : ''}`}>{mark ? `${mark.attendance_pct}%` : '—'}</td>
                </React.Fragment>;
              })}
              <td className={`${cell} text-center ${percentageColor(overall)}`}>{overall.toFixed(2)}</td><td className={cell} />
            </tr>;
          })}</tbody>
          <tfoot>
            <tr><th colSpan={3} className={`${cell} text-center`}>Name of the Faculty</th>{courses.map(([key, course]) => <td key={key} colSpan={2} className={`${cell} text-center`}>{course.course_instructor || 'Not assigned'}</td>)}<td colSpan={2} rowSpan={2} className={cell} /></tr>
            <tr><th colSpan={3} className={`${cell} text-center`}>Signature of the Faculty</th>{courses.map(([key]) => <td key={key} colSpan={2} className={`${cell} h-10`} />)}</tr>
          </tfoot>
        </table>
      </div>
      <div className="flex justify-center gap-5 mt-4 text-xs"><span className="text-red-600">■ &lt; 75%</span><span className="text-yellow-600">■ 75% to &lt; 85%</span><span className="text-green-700">■ ≥ 85%</span></div>
    </section>;
  })}</div>;
};

export const VerticalAttendanceReport: React.FC<{ rows: ReportRow[] }> = ({ rows }) => {
  const groups = new Map<string, ReportRow[]>();
  rows.forEach(row => {
    const key = JSON.stringify([row.crs_id ?? row.crs_code, row.section_id ?? row.section]);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  });
  const cell = 'border border-gray-300 px-3 py-2';
  return <div className="space-y-10 p-4">
    {Array.from(groups.entries()).map(([key, students]) => {
      const course = students[0];
      return <section key={key} aria-label={`${course.crs_code} - Section ${course.section}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse text-left">
            <caption className="border border-b-0 border-gray-300 px-3 py-2 text-left text-blue-700">
              Course-wise Section-wise student attendance report with percentage
            </caption>
            <thead>
              <tr><th colSpan={5} className={cell}>Course</th><th className={`${cell} text-center`}>Students displayed</th></tr>
              <tr><th colSpan={5} className={`${cell} font-normal`}>{course.crs_code} - {course.crs_title} - Section: {course.section}</th>
                <th className={`${cell} text-center font-normal`}>{students.length}</th></tr>
              <tr>
                <th rowSpan={4} scope="col" className={`${cell} w-12`}>Sl. No.</th>
                <th rowSpan={4} scope="col" className={cell}>USN</th>
                <th className={cell}>Course Code</th><td colSpan={2} className={`${cell} text-center text-blue-700`}>{course.crs_code}</td>
                <th rowSpan={4} scope="col" className={`${cell} text-center w-1/5`}>Student signature</th>
              </tr>
              <tr><th className={cell}>Section</th><td colSpan={2} className={`${cell} text-center text-blue-700`}>{course.section}</td></tr>
              <tr><th className={cell}>Total Class Held</th><td colSpan={2} className={`${cell} text-center`}>{course.total_classes}</td></tr>
              <tr><th scope="col" className={cell}>Student Name</th><th scope="col" className={`${cell} text-center`}>Classes Attended</th><th scope="col" className={`${cell} text-center`}>%</th></tr>
            </thead>
            <tbody>
              {students.map((student, index) => <tr key={student.student_id ?? student.usno ?? index}>
                <td className={cell}>{index + 1}</td><td className={cell}>{student.usno}</td>
                <td className={cell}>{student.student_name}</td>
                <td className={`${cell} text-center text-blue-700`} title={`${student.absent} absent, ${student.unmarked ?? 0} unmarked`}>
                  {student.present} / {student.total_classes}
                </td>
                <td className={`${cell} text-center ${student.attendance_pct >= 85 ? 'text-green-700' : student.attendance_pct >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{student.attendance_pct}</td>
                <td className={cell} />
              </tr>)}
            </tbody>
            <tfoot>
              <tr><th colSpan={3} className={`${cell} text-center`}>Name of the Faculty</th><td colSpan={2} className={`${cell} text-center text-blue-700`}>{course.course_instructor || 'Not assigned'}</td><td rowSpan={2} className={cell} /></tr>
              <tr><th colSpan={3} className={`${cell} text-center`}>Signature of the Faculty</th><td colSpan={2} className={`${cell} h-10`} /></tr>
            </tfoot>
          </table>
        </div>
        <div className="flex justify-center gap-5 mt-4 text-xs" aria-label="Attendance percentage legend">
          <span className="text-red-600">■ &lt; 75%</span><span className="text-yellow-600">■ 75% to &lt; 85%</span><span className="text-green-700">■ ≥ 85%</span>
        </div>
      </section>;
    })}
  </div>;
};

// ─── Component ───────────────────────────────────────────────────────────────
const ConsolidatedAttendanceReportPage: React.FC = () => {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [curriculums, setCurriculums] = useState<DropdownItem[]>([]);
  const [terms, setTerms] = useState<DropdownItem[]>([]);
  const [courses, setCourses] = useState<DropdownItem[]>([]);
  const [sections, setSections] = useState<DropdownItem[]>([]);

  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedRange, setSelectedRange] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const reportRequest = useRef(0);
  const [reportType, setReportType] = useState<'vertical' | 'horizontal'>('vertical');

  // ── Report state ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // ── Load curriculums on mount ─────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    axiosInstance.get(`${BASE_API}/meta/curriculums`)
      .then((r: any) => {
        if (!active) return;
        const items = r.data?.data?.items ?? r.data?.items ?? [];
        setCurriculums(items);
        if (items.length > 0) setSelectedCurriculum(String(items[0].academic_batch_id));
      })
      .catch(() => { if (active) toast.error('Failed to load report filters'); });
    return () => { active = false; };
  }, []);

  // ── Load terms when curriculum changes ────────────────────────────────────
  useEffect(() => {
    setSelectedTerm(''); setSelectedCourses([]); setSelectedSection('');
    setTerms([]); setCourses([]); setSections([]); setResult(null);
    if (!selectedCurriculum) return;
    let active = true;
    axiosInstance.get(`${BASE_API}/meta/terms`, { params: { academic_batch_id: selectedCurriculum } })
      .then((r: any) => {
        if (!active) return;
        const items = r.data?.data?.items ?? r.data?.items ?? [];
        setTerms(items);
      })
      .catch(() => { if (active) toast.error('Failed to load report filters'); });
    return () => { active = false; };
  }, [selectedCurriculum]);

  // ── Load courses when term changes ────────────────────────────────────────
  useEffect(() => {
    setSelectedCourses([]); setSelectedSection('');
    setCourses([]); setSections([]); setResult(null);
    if (!selectedCurriculum || !selectedTerm) return;
    let active = true;
    axiosInstance.get(`${BASE_API}/meta/courses`, {
      params: { academic_batch_id: selectedCurriculum, semester_id: selectedTerm }
    })
      .then((r: any) => {
        if (!active) return;
        const items = r.data?.data?.items ?? r.data?.items ?? [];
        setCourses(items);
      })
      .catch(() => { if (active) toast.error('Failed to load report filters'); });
    return () => { active = false; };
  }, [selectedTerm, selectedCurriculum]);

  // ── Load sections when course changes ─────────────────────────────────────
  useEffect(() => {
    setSelectedSection('');
    setSections([]); setResult(null);
    if (!selectedCurriculum || !selectedTerm || !selectedCourses.length) return;
    let active = true;
    axiosInstance.get(`${BASE_API}/meta/sections`, {
      params: new URLSearchParams([['academic_batch_id', selectedCurriculum], ['semester_id', selectedTerm], ...selectedCourses.map(id => ['crs_ids', id])])
    })
      .then((r: any) => {
        if (!active) return;
        const items = r.data?.data?.items ?? r.data?.items ?? [];
        setSections(items);
      })
      .catch(() => { if (active) toast.error('Failed to load report filters'); });
    return () => { active = false; };
  }, [selectedCourses, selectedTerm, selectedCurriculum]);

  // Discard reports from an earlier filter selection, including in-flight responses.
  useEffect(() => {
    reportRequest.current += 1;
    setResult(null);
    setHasFetched(false);
    setLoading(false);
  }, [selectedCurriculum, selectedTerm, selectedCourses, selectedSection, selectedRange, fromDate, toDate, reportType]);

  const fetchReport = useCallback(async () => {
    if (!selectedCurriculum || !selectedTerm || !selectedCourses.length || !selectedRange || !fromDate || !toDate) {
      toast.warn('Select curriculum, term, courses, percentage range, and both dates');
      return;
    }
    if (fromDate > toDate) { toast.warn('From Date cannot be later than To Date'); return; }
    const requestId = ++reportRequest.current;
    setLoading(true); setHasFetched(true); setResult(null);
    try {
      const params = new URLSearchParams({
        academic_batch_id: selectedCurriculum, semester_id: selectedTerm,
        from_date: fromDate, to_date: toDate, report_type: reportType,
      });
      selectedCourses.forEach(id => params.append('crs_ids', id));
      if (selectedSection) params.set('section_id', selectedSection);
      if (selectedRange !== 'all' && reportType === 'vertical') {
        const [min, max] = selectedRange.split('-');
        params.set('range_min', min);
        params.set('range_max', max);
        params.set('range_max_inclusive', String(max === '100'));
      }
      const r = await axiosInstance.get<{ data: ReportResult } | ReportResult>(`${BASE_API}/report`, { params });
      const data = 'data' in r.data ? r.data.data : r.data;
      if (reportType === 'horizontal') {
        const [min, max] = selectedRange === 'all' ? [0, 100] : selectedRange.split('-').map(Number);
        const included: ReportRow[] = [];
        const percentages: number[] = [];
        horizontalGroups(data.rows).forEach(group => group.students.forEach(marks => {
          const entries = Array.from(marks.values());
          const pct = overallPercentage(entries);
          if (pct >= min && (max === 100 ? pct <= max : pct < max)) {
            included.push(...entries);
            percentages.push(pct);
          }
        }));
        data.rows = included;
        data.total = included.length;
        data.summary.total_students = new Set(included.map(row => row.student_id ?? row.usno)).size;
        data.summary.average_attendance_pct = percentages.length
          ? Number((percentages.reduce((sum, pct) => sum + pct, 0) / percentages.length).toFixed(2)) : 0;
      }
      if (reportRequest.current === requestId) setResult(data);
    } catch (err: any) {
      if (reportRequest.current === requestId) {
        const detail = err?.response?.data?.detail;
        toast.error(typeof detail === 'string' ? detail : 'Failed to generate report');
      }
    } finally {
      if (reportRequest.current === requestId) setLoading(false);
    }
  }, [selectedCurriculum, selectedTerm, selectedCourses, selectedSection, selectedRange, fromDate, toDate, reportType]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!result?.rows.length) return;
    try {
      const { buildHorizontalAttendancePdf } = await import('./horizontalAttendancePdf');
      const term = terms.find(item => String(item.semester_id) === selectedTerm);
      const context = {
        institution: LocalStorageHelper.getObject<{ label: string }>('auth_org_state')?.label,
        curriculum: getSelectedCurriculumLabel(), semester: term?.semester_desc || String(term?.semester ?? ''),
        from: result.date_range?.from || fromDate, to: result.date_range?.to || toDate,
      };
      const groups = horizontalGroups(result.rows);
      const doc = reportType === 'horizontal' ? buildHorizontalAttendancePdf(groups, context)
        : (await import('./verticalAttendancePdf')).buildVerticalAttendancePdf(
            groups.flatMap(group => Array.from(group.courses.keys()).map(key =>
              Array.from(group.students.values()).flatMap(marks => marks.has(key) ? [marks.get(key)!] : []))), context);
      const filename = `${getSelectedCurriculumLabel()}_${term?.semester_desc || selectedTerm}_consolidated_attendance_report_${new Date().toISOString().slice(0, 10)}`;
      doc.save(`${filename.replace(/[^a-zA-Z0-9_-]+/g, '_')}.pdf`);
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  const exportCSV = () => {
    if (!result || !result.rows.length) return;
    const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines: unknown[][] = reportType === 'horizontal'
      ? horizontalGroups(result.rows).flatMap(group => {
          const courses = Array.from(group.courses.entries());
          return [
            ['Section', group.section],
            ['Sl. No.', 'USN', 'Student Name', ...courses.flatMap(([, c]) => [`${c.crs_code} Classes Attended`, `${c.crs_code} %`]), 'Overall %', 'Student signature'],
            ...Array.from(group.students.values()).map((marks, index) => {
              const entries = Array.from(marks.values());
              return [index + 1, entries[0].usno, entries[0].student_name,
                ...courses.flatMap(([key]) => { const mark = marks.get(key); return mark ? [`${mark.present} / ${mark.total_classes}`, mark.attendance_pct] : ['—', '—']; }),
                overallPercentage(entries).toFixed(2), ''];
            }),
            ['', '', 'Name of the Faculty', ...courses.flatMap(([, c]) => [c.course_instructor || 'Not assigned', '']), '', ''],
            [],
          ];
        })
      : [result.headers.map(h => h.label), ...result.rows.map(row => result.headers.map(h => row[h.key]))];
    const csv = lines.map(line => line.map(cell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getSelectedCurriculumLabel = () => {
    const c = curriculums.find(c => String(c.academic_batch_id) === selectedCurriculum);
    return c ? `${c.academic_batch_desc ?? ''}${c.academic_batch_code ? ` (${c.academic_batch_code})` : ''}` : '';
  };

  const getPctColor = (pct: number) => {
    if (pct >= 75) return 'text-green-700';
    if (pct >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1f3a4f] text-white px-4 py-2.5">
          <h1 className="text-sm font-semibold">Consolidated Attendance Report List Page</h1>
        </div>

        <div className="p-4">
          {/* ── Filter Row 1 ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            {/* Curriculum */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Curriculum: <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCurriculum}
                onChange={e => setSelectedCurriculum(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded text-sm px-2 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select Curriculum</option>
                {curriculums.map(c => (
                  <option key={c.academic_batch_id} value={String(c.academic_batch_id)}>
                    {c.academic_batch_desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Term: <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTerm}
                onChange={e => setSelectedTerm(e.target.value)}
                disabled={!selectedCurriculum}
                className="w-full mt-1 border border-gray-300 rounded text-sm px-2 py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Term</option>
                {terms.map((t, i) => (
                  <option key={i} value={String(t.semester_id ?? t.semester)}>
                    {t.semester_desc || `${t.semester} - Semester`}
                  </option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Courses: <span className="text-red-500">*</span>
              </label>
              <select
                multiple
                aria-label="Courses"
                value={selectedCourses}
                onChange={e => setSelectedCourses(Array.from(e.target.selectedOptions, option => option.value))}
                disabled={!selectedTerm}
                className="w-full mt-1 border border-gray-300 rounded text-sm px-2 py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              >

                {courses.map(c => (
                  <option key={c.crs_id} value={String(c.crs_id)}>
                    {c.crs_code} - {c.crs_title}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Section:
              </label>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                disabled={!selectedCourses.length}
                className="w-full mt-1 border border-gray-300 rounded text-sm px-2 py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">All mapped sections</option>
                {sections.map((s, i) => (
                  <option key={i} value={String(s.section_id)}>
                    {s.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Range% */}
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Range(%): <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRange}
                onChange={e => setSelectedRange(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded text-sm px-2 py-1.5 focus:outline-none focus:border-blue-500"
              >
                {RANGE_OPTIONS.map((o, i) => (
                  <option key={i} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Filter Row 2 ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-end gap-8 mb-4">
            <div>
              <label htmlFor="attendance-from" className="text-xs font-semibold text-gray-700 block mb-1">From Date *</label>
              <input id="attendance-from" type="date" value={fromDate} max={toDate || undefined}
                onChange={e => setFromDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label htmlFor="attendance-to" className="text-xs font-semibold text-gray-700 block mb-1">To Date *</label>
              <input id="attendance-to" type="date" value={toDate} min={fromDate || undefined}
                onChange={e => setToDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>

            {/* Report Type */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Report Type</label>
              <div className="flex gap-6 items-center h-8">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="reportType"
                    value="vertical"
                    checked={reportType === 'vertical'}
                    onChange={() => setReportType('vertical')}
                    className="accent-blue-600"
                  />
                  Vertical Report
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="reportType"
                    value="horizontal"
                    checked={reportType === 'horizontal'}
                    onChange={() => setReportType('horizontal')}
                    className="accent-blue-600"
                  />
                  Horizontal Report
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-4 py-2 rounded font-medium"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>
              {result && result.rows.length > 0 && (
                <>
                  {reportType === 'horizontal' && <button
                    onClick={exportCSV}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded font-medium"
                  >
                    Export CSV
                  </button>}
                  <button
                    onClick={exportPDF}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded font-medium"
                  >
                    Export PDF
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            {reportType === 'horizontal'
              ? 'Each student appears once per section, with courses side by side. Overall % and the selected range use total present units divided by total held units across mapped courses. A dash means the student is not mapped to that course. '
              : 'Each course and section has its own student table. Attendance % = present class units / total class units. '}
            Missing marks contribute no present units. Hold Ctrl or Cmd to select multiple courses.
          </p>
          {/* ── Summary bar ──────────────────────────────────────────────── */}
          {result && (
            <div className="flex gap-4 mb-3">
              <div className="flex-1 bg-blue-50 border border-blue-100 rounded px-3 py-2 text-xs">
                <span className="text-gray-500">Students: </span>
                <span className="font-bold text-blue-700">{result.summary.total_students}</span>
              </div>
              <div className="flex-1 bg-purple-50 border border-purple-100 rounded px-3 py-2 text-xs">
                <span className="text-gray-500">Total Classes: </span>
                <span className="font-bold text-purple-700">{result.summary.total_classes}</span>
              </div>
              <div className="flex-1 bg-green-50 border border-green-100 rounded px-3 py-2 text-xs">
                <span className="text-gray-500">Avg Attendance: </span>
                <span className={`font-bold ${getPctColor(result.summary.average_attendance_pct)}`}>
                  {result.summary.average_attendance_pct}%
                </span>
              </div>
              {result.summary.course?.crs_code && (
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs">
                  <span className="text-gray-500">Course: </span>
                  <span className="font-bold text-gray-700">{result.summary.course.crs_code} — {result.summary.course.crs_title}</span>
                </div>
              )}
              {result.date_range?.from && (
                <div className="flex-1 bg-orange-50 border border-orange-100 rounded px-3 py-2 text-xs">
                  <span className="text-gray-500">Period: </span>
                  <span className="font-bold text-orange-700">{result.date_range.from} → {result.date_range.to}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Report Table ─────────────────────────────────────────────── */}
          <div className="border border-gray-200 rounded overflow-hidden">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Generating report...</span>
              </div>
            )}

            {!loading && hasFetched && result && result.rows.length === 0 && (
              <div className="px-4 py-3 text-sm bg-gray-50">
                <a className="text-blue-500 text-sm">No data available</a>
              </div>
            )}

            {!loading && !hasFetched && (
              <div className="px-4 py-3 text-sm bg-gray-50">
                <a className="text-blue-500 text-sm">No data available</a>
              </div>
            )}

            {!loading && result && result.rows.length > 0 && (
              <>
                <dl className="m-4 border border-gray-300 text-xs">
                  <div className="flex border-b border-gray-300"><dt className="w-40 p-2 font-semibold">Curriculum:</dt><dd className="p-2">{getSelectedCurriculumLabel()}</dd></div>
                  <div className="flex"><dt className="w-40 p-2 font-semibold">Semester:</dt><dd className="p-2">{terms.find(term => String(term.semester_id) === selectedTerm)?.semester_desc}</dd></div>
                </dl>
                {reportType === 'vertical' && <VerticalAttendanceReport rows={result.rows} />}
              </>
            )}
            {!loading && result && result.rows.length > 0 && reportType === 'horizontal' && (
              <HorizontalAttendanceReport rows={result.rows} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedAttendanceReportPage;
