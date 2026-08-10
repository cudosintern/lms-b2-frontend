import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../utils/api';
import { toast } from 'react-toastify';

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
  { label: '40% - 60%', value: '40-60' },
  { label: '60% - 75%', value: '60-75' },
  { label: '>= 75%', value: '75-100' },
  { label: 'All', value: 'all' },
];

const BASE_API = '/api/v1/reports/consolidated-attendance-report';

// ─── Component ───────────────────────────────────────────────────────────────
const ConsolidatedAttendanceReportPage: React.FC = () => {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [curriculums, setCurriculums] = useState<DropdownItem[]>([]);
  const [terms, setTerms] = useState<DropdownItem[]>([]);
  const [courses, setCourses] = useState<DropdownItem[]>([]);
  const [sections, setSections] = useState<DropdownItem[]>([]);

  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedRange, setSelectedRange] = useState('');
  const [selectDate, setSelectDate] = useState('');
  const [reportType, setReportType] = useState<'vertical' | 'horizontal'>('vertical');

  // ── Report state ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // ── Load curriculums on mount ─────────────────────────────────────────────
  useEffect(() => {
    axiosInstance.get(`${BASE_API}/meta/curriculums`)
      .then((r: any) => {
        const items = r.data?.data?.items ?? r.data?.items ?? [];
        setCurriculums(items);
        if (items.length > 0) setSelectedCurriculum(String(items[0].academic_batch_id));
      })
      .catch(() => {});
  }, []);

  // ── Load terms when curriculum changes ────────────────────────────────────
  useEffect(() => {
    setSelectedTerm(''); setSelectedCourse(''); setSelectedSection('');
    setTerms([]); setCourses([]); setSections([]); setResult(null);
    if (!selectedCurriculum) return;
    axiosInstance.get(`${BASE_API}/meta/terms`, { params: { academic_batch_id: selectedCurriculum } })
      .then((r: any) => {
        const items = r.data?.data?.items ?? r.data?.items ?? [];
        setTerms(items);
      })
      .catch(() => {});
  }, [selectedCurriculum]);

  // ── Load courses when term changes ────────────────────────────────────────
  useEffect(() => {
    setSelectedCourse(''); setSelectedSection('');
    setCourses([]); setSections([]); setResult(null);
    if (!selectedCurriculum || !selectedTerm) return;
    const term = terms.find(t => String(t.semester_id) === selectedTerm || String(t.semester) === selectedTerm);
    const semParam = term?.semester ?? selectedTerm;
    axiosInstance.get(`${BASE_API}/meta/courses`, {
      params: { academic_batch_id: selectedCurriculum, semester: semParam }
    })
      .then((r: any) => {
        const items = r.data?.data?.items ?? r.data?.items ?? [];
        setCourses(items);
      })
      .catch(() => {});
  }, [selectedTerm, selectedCurriculum]);

  // ── Load sections when course changes ─────────────────────────────────────
  useEffect(() => {
    setSelectedSection('');
    setSections([]); setResult(null);
    if (!selectedCurriculum || !selectedTerm || !selectedCourse) return;
    const term = terms.find(t => String(t.semester_id) === selectedTerm || String(t.semester) === selectedTerm);
    const semParam = term?.semester ?? selectedTerm;
    axiosInstance.get(`${BASE_API}/meta/sections`, {
      params: { academic_batch_id: selectedCurriculum, semester: semParam, crs_id: selectedCourse }
    })
      .then((r: any) => {
        const items = r.data?.data?.items ?? r.data?.items ?? [];
        setSections(items);
      })
      .catch(() => {});
  }, [selectedCourse, selectedTerm, selectedCurriculum]);

  // ── Fetch report ──────────────────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    if (!selectedCurriculum) { toast.warn('Please select a Curriculum'); return; }
    setLoading(true); setHasFetched(true); setResult(null);
    try {
      const term = terms.find(t => String(t.semester_id) === selectedTerm || String(t.semester) === selectedTerm);
      const semParam = term?.semester ?? selectedTerm;

      const params: Record<string, any> = {
        academic_batch_id: selectedCurriculum,
        report_type: reportType,
      };
      if (selectedTerm) params.semester = semParam;
      if (selectedCourse) params.crs_id = selectedCourse;
      if (selectedSection) params.section_id = selectedSection;
      if (selectDate) { params.from_date = selectDate; params.to_date = selectDate; }

      // Parse range filter
      if (selectedRange && selectedRange !== '' && selectedRange !== 'all') {
        const [minStr, maxStr] = selectedRange.split('-');
        if (minStr !== undefined) params.range_min = Number(minStr);
        if (maxStr !== undefined) params.range_max = Number(maxStr);
      }

      const r: any = await axiosInstance.get(`${BASE_API}/report`, { params });
      const d = r.data?.data ?? r.data;
      setResult(d);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [selectedCurriculum, selectedTerm, selectedCourse, selectedSection, selectedRange, selectDate, reportType, terms]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!result || !result.rows.length) return;
    const headers = result.headers.map(h => h.label).join(',');
    const rows = result.rows.map(row =>
      result.headers.map(h => {
        const val = row[h.key] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance_report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getSelectedCurriculumLabel = () => {
    const c = curriculums.find(c => String(c.academic_batch_id) === selectedCurriculum);
    return c ? `${c.academic_batch_desc} (${c.academic_batch_code})` : '';
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
          <div className="grid grid-cols-5 gap-3 mb-3">
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
                Course: <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                disabled={!selectedTerm}
                className="w-full mt-1 border border-gray-300 rounded text-sm px-2 py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Course</option>
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
                Section: <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                disabled={!selectedCourse}
                className="w-full mt-1 border border-gray-300 rounded text-sm px-2 py-1.5 focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select Section</option>
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
          <div className="flex items-end gap-8 mb-4">
            {/* Select Date */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Select Date</label>
              <div className="flex items-center border border-gray-300 rounded px-2 py-1.5 gap-2 w-48">
                <span className="text-gray-400 text-sm">📅</span>
                <input
                  type="date"
                  value={selectDate}
                  onChange={e => setSelectDate(e.target.value)}
                  className="text-sm focus:outline-none flex-1 bg-transparent"
                />
                {selectDate && (
                  <button onClick={() => setSelectDate('')} className="text-gray-400 text-xs hover:text-red-500">✕</button>
                )}
              </div>
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
                  <button
                    onClick={exportCSV}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded font-medium"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded font-medium"
                  >
                    Print / PDF
                  </button>
                </>
              )}
            </div>
          </div>

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
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1f3a4f] text-white">
                      {result.headers.map(h => (
                        <th
                          key={h.key}
                          className="px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-[#2d4f6a] last:border-r-0"
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}
                      >
                        {result.headers.map(h => {
                          const val = row[h.key];
                          const isAttPct = h.key === 'attendance_pct';
                          const isDayCol = h.key.match(/^\d{4}-\d{2}-\d{2}$/);

                          return (
                            <td
                              key={h.key}
                              className="px-3 py-2 border-b border-gray-100 whitespace-nowrap"
                            >
                              {isAttPct ? (
                                <span className={`font-semibold ${getPctColor(Number(val))}`}>
                                  {val}%
                                </span>
                              ) : isDayCol ? (
                                <span className={`font-bold ${val === 'P' ? 'text-green-700' : val === 'A' ? 'text-red-600' : 'text-gray-400'}`}>
                                  {val === 'P' ? '1P' : val === 'A' ? '1A' : '—'}
                                </span>
                              ) : (
                                <span>{val ?? '—'}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedAttendanceReportPage;
