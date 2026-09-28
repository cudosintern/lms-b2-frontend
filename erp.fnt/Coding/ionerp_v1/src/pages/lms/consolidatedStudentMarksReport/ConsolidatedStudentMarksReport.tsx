import React, { useEffect, useMemo, useRef, useState } from "react";
import CustomMarksRangeDialog from "./CustomMarksRangeDialog";
import MarksCourseSelect from "./MarksCourseSelect";
import "./consolidatedStudentMarksReport.css";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "react-toastify";
import {
  exportConsolidatedStudentMarks, fetchConsolidatedStudentMarksGraph,
  fetchConsolidatedStudentMarksReport, fetchMarksCourses, fetchMarksCurriculums,
  fetchMarksDepartments, fetchMarksSections, fetchMarksTerms,
} from "./consolidatedStudentMarksReportService";
import {
  ConsolidatedStudentMarksGraphData, ConsolidatedStudentMarksReportData,
  ConsolidatedStudentMarksRequest, MarksCourseOption, MarksCurriculumOption,
  MarksSectionOption, MarksSelectOption, MarksTermOption,
} from "./consolidatedStudentMarksReportTypes";
import { transformConsolidatedStudentMarks } from "./transformConsolidatedStudentMarks";

type Filters = {
  departmentId: number | null; academicBatchId: number | null; semesterId: number | null;
  sectionId: number | null; courseIds: number[]; includeTotal: boolean;
  useRange: boolean; startRange: string; endRange: string; includeAbsents: boolean;
};
const initialFilters: Filters = {
  departmentId: null, academicBatchId: null, semesterId: null, sectionId: null,
  courseIds: [], includeTotal: false, useRange: false, startRange: "", endRange: "", includeAbsents: false,
};
const messageOf = (error: unknown) => error instanceof Error ? error.message : "Unable to load report data";
const displayMark = (value: number | null | undefined) => value == null ? "-" : Number(value.toFixed(2));

const ConsolidatedStudentMarksReport: React.FC = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"report" | "graph">("report");
  const [departments, setDepartments] = useState<MarksSelectOption[]>([]);
  const [curriculums, setCurriculums] = useState<MarksCurriculumOption[]>([]);
  const [terms, setTerms] = useState<MarksTermOption[]>([]);
  const [sections, setSections] = useState<MarksSectionOption[]>([]);
  const [courses, setCourses] = useState<MarksCourseOption[]>([]);
  const [loading, setLoading] = useState({ departments: false, curriculums: false, terms: false,
    sections: false, courses: false, report: false, graph: false, export: false });
  const [error, setError] = useState("");
  const [report, setReport] = useState<ConsolidatedStudentMarksReportData | null>(null);
  const [graph, setGraph] = useState<ConsolidatedStudentMarksGraphData | null>(null);
  const [submitted, setSubmitted] = useState<ConsolidatedStudentMarksRequest | null>(null);
  const [exportFormat, setExportFormat] = useState<"excel" | "csv" | "pdf">("excel");
  const generation = useRef(0);
  const table = useMemo(() => transformConsolidatedStudentMarks(report), [report]);

  const updateFilters = (patch: Partial<Filters>) => {
    generation.current += 1;
    setFilters((previous) => ({ ...previous, ...patch }));
    setReport(null); setGraph(null); setSubmitted(null); setError("");
    setLoading((previous) => ({ ...previous, report: false, graph: false }));
  };

  // Each dependent dropdown ignores responses for a selection that has changed.
  useEffect(() => {
    let current = true;
    setLoading((p) => ({ ...p, departments: true }));
    fetchMarksDepartments().then((data) => {
      if (current) setDepartments(data.map((item) => ({ value: item.id, label: item.name })));
    }).catch((e) => { if (current) setError(messageOf(e)); })
      .finally(() => { if (current) setLoading((p) => ({ ...p, departments: false })); });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    setCurriculums([]);
    setLoading((p) => ({ ...p, curriculums: !!filters.departmentId }));
    if (filters.departmentId) fetchMarksCurriculums(filters.departmentId).then((data) => {
      if (current) setCurriculums(data);
    }).catch((e) => { if (current) setError(messageOf(e)); })
      .finally(() => { if (current) setLoading((p) => ({ ...p, curriculums: false })); });
    return () => { current = false; };
  }, [filters.departmentId]);

  useEffect(() => {
    let current = true;
    setTerms([]);
    setLoading((p) => ({ ...p, terms: !!filters.academicBatchId }));
    if (filters.academicBatchId) fetchMarksTerms(filters.academicBatchId).then((data) => {
      if (current) setTerms(data);
    }).catch((e) => { if (current) setError(messageOf(e)); })
      .finally(() => { if (current) setLoading((p) => ({ ...p, terms: false })); });
    return () => { current = false; };
  }, [filters.academicBatchId]);

  useEffect(() => {
    let current = true;
    setSections([]);
    setLoading((p) => ({ ...p, sections: !!filters.semesterId }));
    if (filters.academicBatchId && filters.semesterId) fetchMarksSections({
      academic_batch_id: filters.academicBatchId, semester_id: filters.semesterId,
    }).then((data) => { if (current) setSections(data); })
      .catch((e) => { if (current) setError(messageOf(e)); })
      .finally(() => { if (current) setLoading((p) => ({ ...p, sections: false })); });
    return () => { current = false; };
  }, [filters.academicBatchId, filters.semesterId]);

  useEffect(() => {
    let current = true;
    setCourses([]);
    setLoading((p) => ({ ...p, courses: !!filters.sectionId }));
    if (filters.academicBatchId && filters.semesterId && filters.sectionId) fetchMarksCourses({
      academic_batch_id: filters.academicBatchId, semester_id: filters.semesterId, section_id: filters.sectionId,
    }).then((data) => {
      if (current) {
        setCourses(data);
        setFilters((p) => ({ ...p, courseIds: [] }));
      }
    }).catch((e) => { if (current) setError(messageOf(e)); })
      .finally(() => { if (current) setLoading((p) => ({ ...p, courses: false })); });
    return () => { current = false; };
  }, [filters.academicBatchId, filters.semesterId, filters.sectionId]);

  useEffect(() => {
    let current = true;
    if (activeTab === "graph" && submitted && !graph) {
      setLoading((p) => ({ ...p, graph: true }));
      fetchConsolidatedStudentMarksGraph(submitted).then((data) => { if (current) setGraph(data); })
        .catch((e) => { if (current) setError(messageOf(e)); })
        .finally(() => { if (current) setLoading((p) => ({ ...p, graph: false })); });
    }
    return () => { current = false; };
  }, [activeTab, submitted, graph]);

  const generate = async (selection: Filters = filters) => {
    let validation = "";
    if (!selection.departmentId) validation = "Department is required.";
    else if (!selection.academicBatchId) validation = "Curriculum is required.";
    else if (!selection.semesterId) validation = "Term is required.";
    else if (!selection.sectionId) validation = "Section is required.";
    else if (!selection.courseIds.length) validation = "Select at least one course.";
    else if (selection.useRange && (selection.startRange.trim() === "" || selection.endRange.trim() === "" ||
      !Number.isFinite(Number(selection.startRange)) || !Number.isFinite(Number(selection.endRange)) ||
      Number(selection.startRange) < 0 || Number(selection.endRange) > 100 || Number(selection.startRange) > Number(selection.endRange))) {
      validation = "Enter a marks range from 0 to 100, with start no greater than end.";
    }
    if (validation) { setError(validation); toast.error(validation); return; }
    const payload: ConsolidatedStudentMarksRequest = {
      department_id: selection.departmentId, academic_batch_id: selection.academicBatchId!,
      semester_id: selection.semesterId, section_id: selection.sectionId, course_ids: selection.courseIds,
      include_total_marks: selection.includeTotal, start_range: selection.useRange ? Number(selection.startRange) : null,
      end_range: selection.useRange ? Number(selection.endRange) : null, include_absents: selection.useRange && selection.includeAbsents,
    };
    const version = ++generation.current;
    setError(""); setReport(null); setGraph(null); setSubmitted(null);
    setLoading((p) => ({ ...p, report: true }));
    try {
      const data = await fetchConsolidatedStudentMarksReport(payload);
      if (version !== generation.current) return;
      setReport(data); setSubmitted(payload);
      if (!data.rows.length) toast.info("No records found for the selected filters.");
    } catch (e) {
      if (version === generation.current) setError(messageOf(e));
    } finally {
      if (version === generation.current) setLoading((p) => ({ ...p, report: false }));
    }
  };

  const download = async () => {
    if (!submitted) return;
    setLoading((p) => ({ ...p, export: true }));
    try {
      const blob = await exportConsolidatedStudentMarks({ ...submitted, format: exportFormat });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `consolidated-student-marks.${exportFormat === "excel" ? "xlsx" : exportFormat}`;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(messageOf(e)); }
    finally { setLoading((p) => ({ ...p, export: false })); }
  };

  const summary = report?.filters;
  const averageFor = (key: string) => {
    const values = table.rows.map((r) => r.componentMarks[key]).filter((v) => v != null && v !== "-" && v !== "AB").map(Number).filter(Number.isFinite);
    return values.length ? displayMark(values.reduce((sum, n) => sum + n, 0) / values.length) : "-";
  };
  return <div style={styles.page}>
    <div style={styles.titleBar}><span style={styles.titleText}>Consolidated Student Marks Report</span></div>
    <div style={styles.card}>
      <div className="consolidated-marks-filters">
        <div style={styles.filterItem}><label htmlFor="marks-department" style={styles.label}>Department <span className="marks-required">*</span></label>
          <select id="marks-department" style={styles.input} value={filters.departmentId ?? ""} disabled={loading.departments}
            onChange={(e) => updateFilters({ departmentId: Number(e.target.value) || null, academicBatchId: null, semesterId: null, sectionId: null, courseIds: [] })}>
            <option value="">{loading.departments ? "Loading..." : "Select department"}</option>
            {departments.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select></div>
        <div style={styles.filterItem}><label htmlFor="marks-curriculum" style={styles.label}>Curriculum <span className="marks-required">*</span></label>
          <select id="marks-curriculum" style={styles.input} value={filters.academicBatchId ?? ""} disabled={!filters.departmentId || loading.curriculums}
            onChange={(e) => updateFilters({ academicBatchId: Number(e.target.value) || null, semesterId: null, sectionId: null, courseIds: [] })}>
            <option value="">{loading.curriculums ? "Loading..." : "Select curriculum"}</option>
            {curriculums.map((c) => <option key={c.academic_batch_id} value={c.academic_batch_id}>{c.name}</option>)}
          </select></div>
        <div style={styles.filterItem}><label htmlFor="marks-term" style={styles.label}>Term <span className="marks-required">*</span></label>
          <select id="marks-term" style={styles.input} value={filters.semesterId ?? ""} disabled={!filters.academicBatchId || loading.terms}
            onChange={(e) => updateFilters({ semesterId: Number(e.target.value) || null, sectionId: null, courseIds: [] })}>
            <option value="">{loading.terms ? "Loading..." : "Select term"}</option>
            {terms.map((t) => <option key={t.semester_id ?? t.crclm_term_id} value={t.semester_id ?? t.crclm_term_id}>{t.name}</option>)}
          </select></div>
        <div style={styles.filterItem}><label htmlFor="marks-section" style={styles.label}>Section <span className="marks-required">*</span></label>
          <select id="marks-section" style={styles.input} value={filters.sectionId ?? ""} disabled={!filters.semesterId || loading.sections}
            onChange={(e) => updateFilters({ sectionId: Number(e.target.value) || null, courseIds: [] })}>
            <option value="">{loading.sections ? "Loading..." : "Select section"}</option>
            {sections.map((s) => <option key={s.section_id} value={s.section_id}>{s.section_name}</option>)}
          </select></div>
        <div style={styles.filterItem}><label id="marks-courses-label" htmlFor="marks-courses" style={styles.label}>Courses <span className="marks-required">*</span></label>
          <MarksCourseSelect courses={courses} selectedIds={filters.courseIds} disabled={!filters.sectionId || loading.courses}
            loading={loading.courses} onChange={(courseIds) => updateFilters({ courseIds })} />
          <div style={styles.inlineHint}>{filters.courseIds.length} course(s) selected.</div>
        </div>
      </div>
      <div style={styles.actionsRow}>
        <label style={styles.checkboxLabel}><input type="checkbox" checked={filters.includeTotal} onChange={(e) => updateFilters({ includeTotal: e.target.checked })} />Include Total Marks</label>
        <button type="button" style={styles.secondaryButton} onClick={() => setRangeOpen(true)}>Custom Range</button>
        {filters.useRange && <button type="button" style={styles.secondaryButton} onClick={() => {
          const next = { ...filters, useRange: false, startRange: "", endRange: "", includeAbsents: false };
          updateFilters(next);
          if (submitted) void generate(next);
        }}>Reset Range</button>}
        <button type="button" style={styles.generateButton} disabled={loading.report || loading.courses || loading.sections || loading.terms || loading.curriculums} onClick={() => generate()}>{loading.report ? "Generating..." : "Generate Report"}</button>
        <select aria-label="Export format" style={styles.input} value={exportFormat} onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}>
          <option value="excel">Excel</option><option value="csv">CSV</option><option value="pdf">PDF</option>
        </select>
        <button type="button" style={styles.exportButton} disabled={!submitted || !report?.rows.length || loading.export} onClick={download}>{loading.export ? "Exporting..." : "Export Marks"}</button>
      </div>
      {filters.useRange && <div style={styles.inlineHint}>Marks range: {filters.startRange}–{filters.endRange}{filters.includeAbsents ? " · Including absent students" : ""}</div>}
      {rangeOpen && <CustomMarksRangeDialog initialValues={filters} onClose={() => setRangeOpen(false)} onApply={(values) => {
        const next = { ...filters, ...values, useRange: true };
        setRangeOpen(false);
        updateFilters(next);
        if (next.departmentId && next.academicBatchId && next.semesterId && next.sectionId && next.courseIds.length) void generate(next);
      }} />}
      {error && <div role="alert" style={styles.errorBox}>{error}</div>}
    </div>
    <div style={styles.tabCard}>
      <div style={styles.tabRow} role="tablist">
        <button type="button" role="tab" aria-selected={activeTab === "report"} style={activeTab === "report" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("report")}>Consolidated Student Marks Report</button>
        <button type="button" role="tab" aria-selected={activeTab === "graph"} style={activeTab === "graph" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("graph")}>Consolidated Student Marks Graph</button>
      </div>
      {summary && <div style={styles.summaryStrip}>{summary.marks_source.toUpperCase()} / {summary.academic_batch_name} / {summary.term_name} / Section {summary.section_name} / {summary.selected_course_ids.length} courses{summary.start_range != null ? ` / Marks ${summary.start_range}â€“${summary.end_range}` : ""}</div>}
      {loading.report ? <div style={styles.stateBox}>Loading consolidated student marks...</div> : !report ? <div style={styles.stateBox}>Select the required filters and generate the report.</div> : !report.rows.length ? <div style={styles.stateBox}>No records found for the selected filters.</div> : report.courses?.every((course) => !course.components.length) ? <div style={styles.stateBox}>{summary?.marks_source === "lms" ? "No released LMS assessments are configured for the selected filters." : "No EMS assessment marks are available for the selected filters."}</div> : activeTab === "report" ? <>
        <div style={styles.tableScroll}><table style={styles.table}>
          <thead><tr><th style={styles.th} rowSpan={2}>Sl. No</th><th style={styles.th} rowSpan={2}>USN</th><th style={styles.th} rowSpan={2}>Student Name</th>
            {table.headers.map((h) => <th key={h.courseId} style={styles.courseGroupHead} colSpan={Math.max(h.componentKeys.length, 1) + (summary?.include_total_marks ? 1 : 0)}>{h.courseCode}<div style={styles.courseTitle}>{h.courseTitle}</div></th>)}
          </tr><tr>{table.headers.map((h) => <React.Fragment key={h.courseId}>
            {h.componentKeys.length ? h.componentKeys.map((key) => <th key={key} style={styles.subHead}>{h.componentLabels[key]}</th>) : <th style={styles.subHead}>No assessments</th>}
            {summary?.include_total_marks && <th style={styles.totalHead}>Total Marks</th>}
          </React.Fragment>)}</tr></thead>
          <tbody>{table.rows.map((row) => <tr key={row.key}><td style={styles.td}>{row.slNo}</td><td style={styles.td}>{row.studentUsn}</td><td style={styles.td}>{row.studentName}</td>
            {table.headers.map((h) => <React.Fragment key={h.courseId}>
              {h.componentKeys.length ? h.componentKeys.map((key) => <td key={key} style={styles.td}>{row.componentMarks[key] ?? "-"}</td>) : <td style={styles.td}>-</td>}
              {summary?.include_total_marks && <td style={styles.tdGrandTotal}>{row.courseTotals[h.courseId] ?? "-"}</td>}
            </React.Fragment>)}</tr>)}</tbody>
          <tfoot><tr><th style={styles.th} colSpan={3}>Class Average</th>{table.headers.map((h) => <React.Fragment key={h.courseId}>
            {h.componentKeys.length ? h.componentKeys.map((key) => <td key={key} style={styles.td}>{averageFor(key)}</td>) : <td style={styles.td}>-</td>}
            {summary?.include_total_marks && <td style={styles.td}>-</td>}
          </React.Fragment>)}</tr></tfoot>
        </table></div><div style={styles.inlineHint}>AB: absent. -: no mark or outside the selected range. Assessment maximum marks appear in brackets.</div>
      </> : loading.graph ? <div style={styles.stateBox}>Loading graph...</div> : !graph?.courses.length ? <div style={styles.stateBox}>No graph data available.</div> : <div style={styles.graphCard}>
        {graph.courses.map((course) => <div key={course.course_id} style={styles.chartWrap}>
          <h3 style={styles.chartTitle}>{course.course_code} - {course.course_title}</h3>
          {course.assessments.some((a) => a.average_marks != null) ? <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: Math.max(600, course.assessments.length * 180) }}>
              <ResponsiveContainer width="100%" height={580}>
                <BarChart data={course.assessments.map((a) => ({ ...a,
                  barLabel: a.average_marks == null ? "" : `${graph.filters.section_name ?? ""} - ${displayMark(a.average_marks)}`,
                }))} margin={{ top: 80, right: 24, bottom: 36, left: 20 }} barCategoryGap="18%">
                  <CartesianGrid stroke="#dedede" vertical={false} />
                  <XAxis dataKey="occasion_name" interval={0} tick={{ fontSize: 12, fill: "#555" }} tickLine={false} axisLine={{ stroke: "#ccc" }} height={48} />
                  <YAxis domain={[0, 100]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                    tick={{ fontSize: 12, fill: "#555" }} axisLine={{ stroke: "#ccc" }} tickLine={false}
                    label={{ value: "Average Score", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#555", fontSize: 12 } }} />
                  <Tooltip formatter={(value: number) => [displayMark(value), "Average Score"]} />
                  <Bar dataKey="average_marks" name="Average Score" fill="#32df2b" isAnimationActive={false}>
                    <LabelList dataKey="barLabel" content={({ x, y, width, value }) => {
                      if (!value || x == null || y == null) return null;
                      const labelX = Number(x) + Number(width ?? 0) / 2;
                      const labelY = Number(y) - 12;
                      return <text x={labelX} y={labelY} transform={`rotate(-90, ${labelX}, ${labelY})`}
                        textAnchor="start" dominantBaseline="middle" fill="#111" fontSize={12}>{String(value)}</text>;
                    }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div> : <div style={styles.stateBox}>No recorded marks for this course.</div>}
          <details><summary style={styles.metricSubtext}>Assessment details</summary>
          <table style={styles.table}><thead><tr><th style={styles.th}>Assessment</th><th style={styles.th}>Maximum</th><th style={styles.th}>Average</th><th style={styles.th}>Marked</th><th style={styles.th}>Absent</th></tr></thead>
            <tbody>{course.assessments.map((a) => <tr key={a.component_id}><td style={styles.td}>{a.occasion_name}</td><td style={styles.td}>{displayMark(a.max_marks)}</td><td style={styles.td}>{displayMark(a.average_marks)}</td><td style={styles.td}>{a.student_count}</td><td style={styles.td}>{a.absent_count}</td></tr>)}</tbody></table>
          </details>
        </div>)}
      </div>}
    </div>
  </div>;
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "20px",
    background: "#f4f6f9",
    minHeight: "100vh",
    fontFamily: "Segoe UI, sans-serif",
  },
  titleBar: {
    background: "linear-gradient(135deg, #1a2e4a 0%, #2d4a6b 100%)",
    borderRadius: 6,
    padding: "14px 20px",
    marginBottom: 20,
  },
  titleText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: 0.4,
  },
  card: {
    background: "#fff",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  filterItem: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#444",
    marginBottom: 4,
  },
  input: {
    border: "1px solid #ced4da",
    borderRadius: 4,
    padding: "8px 10px",
    fontSize: 13,
    color: "#212529",
    background: "#fff",
    minHeight: 38,
  },
  actionsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#2f3b52",
    fontSize: 13,
    fontWeight: 500,
    marginRight: "auto",
  },
  secondaryButton: {
    background: "#eef2ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: 4,
    padding: "9px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  exportButton: {
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "9px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  generateButton: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "9px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  rangeRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid #edf2f7",
  },
  inlineHint: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
  },
  errorBox: {
    marginTop: 12,
    background: "#fdecea",
    color: "#b42318",
    border: "1px solid #f5c2c0",
    borderRadius: 4,
    padding: "10px 12px",
    fontSize: 13,
  },
  tabCard: {
    background: "#fff",
    borderRadius: 6,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  tabRow: {
    display: "flex",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    flexWrap: "wrap",
  },
  tab: {
    border: "none",
    background: "transparent",
    padding: "14px 18px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
  },
  activeTab: {
    border: "none",
    background: "#fff",
    padding: "14px 18px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    color: "#1d4ed8",
    borderBottom: "2px solid #1d4ed8",
  },
  summaryStrip: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    padding: "12px 16px",
    borderBottom: "1px solid #edf2f7",
    fontSize: 12,
    color: "#475569",
    background: "#f8fafc",
  },
  stateBox: {
    padding: "32px 18px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
  },
  tableScroll: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: "980px",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    padding: "10px 12px",
    borderBottom: "1px solid #dbe4ee",
    borderRight: "1px solid #e5edf5",
    background: "#edf2f7",
    color: "#1e293b",
    textAlign: "center",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },
  courseGroupHead: {
    padding: "10px 12px",
    borderBottom: "1px solid #dbe4ee",
    borderRight: "1px solid #e5edf5",
    background: "#dbeafe",
    color: "#1e3a8a",
    textAlign: "center",
    minWidth: 140,
  },
  courseTitle: {
    fontSize: 11,
    marginTop: 4,
    color: "#475569",
  },
  subHead: {
    padding: "10px 12px",
    borderBottom: "1px solid #dbe4ee",
    borderRight: "1px solid #e5edf5",
    background: "#eff6ff",
    color: "#334155",
    textAlign: "center",
    minWidth: 110,
  },
  totalHead: {
    padding: "10px 12px",
    borderBottom: "1px solid #dbe4ee",
    borderRight: "1px solid #e5edf5",
    background: "#dcfce7",
    color: "#166534",
    textAlign: "center",
    minWidth: 110,
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    textAlign: "center",
    color: "#334155",
    verticalAlign: "middle",
  },
  tdGrandTotal: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef2f7",
    borderRight: "1px solid #eef2f7",
    textAlign: "center",
    color: "#166534",
    background: "#dcfce7",
    fontWeight: 700,
  },
  graphCard: {
    padding: 16,
  },
  metricSubtext: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  chartWrap: {
    width: "100%",
    marginBottom: 32,
  },
  chartTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: 600,
    margin: "16px 0 0",
  },
};

export default ConsolidatedStudentMarksReport;
