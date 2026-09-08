import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
import axiosInstance from "../../../utils/api";
import { normaliseList, createQuizWorkbook } from "./studentQuizReportService";

async function apiFetch<T>(path: string): Promise<T> {
  const response = await axiosInstance.get<T>(path);
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface DropdownOption {
  value: string;
  label: string;
}

interface StudentRow {
  sl: number;
  usn: string;
  name: string;
  marks: string | number;
}

type SortKey = "sl" | "usn" | "name" | "marks";

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const DownloadIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
  <span
    style={{
      marginLeft: 4,
      opacity: active ? 1 : 0.35,
      fontSize: 11,
      color: active ? "#4a7cdb" : undefined,
    }}
  >
    {active ? (asc ? "↑" : "↓") : "⇅"}
  </span>
);

const EmptyTableIcon = () => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#c0c8d8"
    strokeWidth="1.4"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="12" y2="17" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  options: DropdownOption[];
  disabled: boolean;
  loading: boolean;
  onChange: (val: string) => void;
}

function SelectField({
  label,
  id,
  value,
  options,
  disabled,
  loading,
  onChange,
}: SelectFieldProps) {
  return (
    <div style={styles.filterGroup}>
      <label htmlFor={id} style={styles.filterLabel}>
        {label} <span style={{ color: "#e53e3e" }}>*</span>
      </label>
      <div style={{ position: "relative" }}>
        <select
          id={id}
          value={value}
          disabled={disabled || loading}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...styles.select,
            ...(disabled || loading ? styles.selectDisabled : {}),
          }}
        >
          <option value="">{loading ? "Loading…" : `Select ${label}`}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span style={styles.chevron}>▾</span>
      </div>
    </div>
  );
}

interface ToastProps {
  message: string;
  type: "success" | "error" | "hidden";
}

function Toast({ message, type }: ToastProps) {
  if (type === "hidden") return null;
  return (
    <div
      style={{
        ...styles.toast,
        ...(type === "error" ? styles.toastError : styles.toastSuccess),
      }}
    >
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentQuizReport() {
  // ── Dropdown state
  const [curriculums, setCurriculums] = useState<DropdownOption[]>([]);
  const [terms, setTerms] = useState<DropdownOption[]>([]);
  const [courses, setCourses] = useState<DropdownOption[]>([]);
  const [sections, setSections] = useState<DropdownOption[]>([]);
  const [quizzes, setQuizzes] = useState<DropdownOption[]>([]);

  const [selCurriculum, setSelCurriculum] = useState("");
  const [selTerm, setSelTerm] = useState("");
  const [selCourse, setSelCourse] = useState("");
  const [selSection, setSelSection] = useState("");
  const [selQuiz, setSelQuiz] = useState("");

  // ── Loading flags
  const requestVersion = useRef(0);
  const [loadingCurriculums, setLoadingCurriculums] = useState(true);
  const [reportError, setReportError] = useState("");
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [exportingXLS, setExportingXLS] = useState(false);

  // ── Table state
  const [allStudents, setAllStudents] = useState<StudentRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("sl");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // ── Toast
  const [toast, setToast] = useState<ToastProps>({
    message: "",
    type: "hidden",
  });

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast({ message: "", type: "hidden" }), 3000);
    },
    []
  );

  // ── On mount: load curriculums
  // API: GET /api/v1/manage-quiz/meta/curriculums  (no parameters)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<unknown>("/api/v1/manage-quiz/meta/curriculums");
        const list = normaliseList(data);
        if (!active) return;
        setCurriculums(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          list.map((c: any) => ({
            value: String(c.academic_batch_id),
            label: String(c.academic_batch_desc),
          }))
        );
      } catch {
        if (active) showToast("Failed to load curriculums", "error");
      } finally {
        if (active) setLoadingCurriculums(false);
      }
    })();
    return () => { active = false; requestVersion.current++; };
  }, [showToast]);

  // ── Curriculum → Terms
  // API: GET /api/v1/manage-quiz/meta/terms?academic_batch_id={id}
  const onCurriculumChange = async (val: string) => {
    const version = ++requestVersion.current;
    setLoadingTerms(false);
    setLoadingCourses(false);
    setLoadingSections(false);
    setLoadingQuizzes(false);
    setLoadingStudents(false);
    setReportError("");
    setCurrentPage(1);

    setSelCurriculum(val);
    setSelTerm("");
    setTerms([]);
    setSelCourse("");
    setCourses([]);
    setSelSection("");
    setSections([]);
    setSelQuiz("");
    setQuizzes([]);
    setAllStudents([]);
    if (!val) return;

    setLoadingTerms(true);
    try {
      const data = await apiFetch<unknown>(
        `/api/v1/manage-quiz/meta/terms?academic_batch_id=${val}`
      );
      if (version !== requestVersion.current) return;
      const list = normaliseList(data);
      setTerms(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        list.map((t: any) => ({
          value: String(t.semester_id),
          label: String(t.semester_desc ?? t.semester),
        }))
      );
    } catch {
      if (version !== requestVersion.current) return;
      showToast("Failed to load terms", "error");
    } finally {
      if (version !== requestVersion.current) return;
      setLoadingTerms(false);
    }
  };

  // ── Term → Courses
  // API: GET /api/v1/manage-quiz/meta/courses?academic_batch_id={id}&semester_id={id}
  const onTermChange = async (val: string) => {
    const version = ++requestVersion.current;
    setLoadingTerms(false);
    setLoadingCourses(false);
    setLoadingSections(false);
    setLoadingQuizzes(false);
    setLoadingStudents(false);
    setReportError("");
    setCurrentPage(1);

    setSelTerm(val);
    setSelCourse("");
    setCourses([]);
    setSelSection("");
    setSections([]);
    setSelQuiz("");
    setQuizzes([]);
    setAllStudents([]);
    if (!val) return;

    setLoadingCourses(true);
    try {
      const data = await apiFetch<unknown>(
        `/api/v1/manage-quiz/meta/courses?academic_batch_id=${selCurriculum}&semester_id=${val}`
      );
      if (version !== requestVersion.current) return;
      const list = normaliseList(data);
      setCourses(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        list.map((c: any) => ({
          value: String(c.crs_id),
          label: [c.crs_code, c.crs_title].filter(Boolean).join(" - ") || String(c.crs_id),
        }))
      );
    } catch {
      if (version !== requestVersion.current) return;
      showToast("Failed to load courses", "error");
    } finally {
      if (version !== requestVersion.current) return;
      setLoadingCourses(false);
    }
  };

  // ── Course → Sections
  // API: GET /api/v1/manage-quiz/meta/sections?academic_batch_id={id}&semester_id={id}
  const onCourseChange = async (val: string) => {
    const version = ++requestVersion.current;
    setLoadingTerms(false);
    setLoadingCourses(false);
    setLoadingSections(false);
    setLoadingQuizzes(false);
    setLoadingStudents(false);
    setReportError("");
    setCurrentPage(1);

    setSelCourse(val);
    setSelSection("");
    setSections([]);
    setSelQuiz("");
    setQuizzes([]);
    setAllStudents([]);
    if (!val) return;

    setLoadingSections(true);
    try {
      const data = await apiFetch<unknown>(
        `/api/v1/manage-quiz/meta/sections?academic_batch_id=${selCurriculum}&semester_id=${selTerm}&course_id=${val}`
      );
      if (version !== requestVersion.current) return;
      const list = normaliseList(data);

      setSections(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        list.map((s: any) => ({
          value: String(s.value ?? s.section_id),
          label: String(s.label ?? s.section),
        }))
      );
    } catch {
      if (version !== requestVersion.current) return;
      showToast("Failed to load sections", "error");
    } finally {
      if (version !== requestVersion.current) return;
      setLoadingSections(false);
    }
  };

  // ── Section → Quizzes
  // The report requires numeric IDs for the complete filter context.
  const onSectionChange = async (val: string) => {
    const version = ++requestVersion.current;
    setLoadingTerms(false);
    setLoadingCourses(false);
    setLoadingSections(false);
    setLoadingQuizzes(false);
    setLoadingStudents(false);
    setReportError("");
    setCurrentPage(1);

    setSelSection(val);
    setSelQuiz("");
    setQuizzes([]);
    setAllStudents([]);
    if (!val) return;

    setLoadingQuizzes(true);
    try {
      const data = await apiFetch<unknown>(
        `/api/v1/quiz-report/quizzes?academic_batch_id=${selCurriculum}&semester_id=${selTerm}&crs_id=${selCourse}&section_id=${val}`
      );
      if (version !== requestVersion.current) return;
      const list = normaliseList(data);

      setQuizzes(
  list.map((q: any) => ({
    
    value: String(q.quiz_id),
    label: String(q.quiz_title),
  }))
);
    } catch {
      if (version !== requestVersion.current) return;
      showToast("Failed to load quizzes", "error");
    } finally {
      if (version !== requestVersion.current) return;
      setLoadingQuizzes(false);
    }
  };

  // ── Quiz → Students + Marks
  // Load only students mapped to the selected quiz and registration context.
  const onQuizChange = async (val: string) => {
    const version = ++requestVersion.current;
    setLoadingTerms(false);
    setLoadingCourses(false);
    setLoadingSections(false);
    setLoadingQuizzes(false);
    setLoadingStudents(false);
    setReportError("");
    setCurrentPage(1);

    setSelQuiz(val);
    setAllStudents([]);
    setSearchQuery("");
    setCurrentPage(1);
    if (!val) return;

    setLoadingStudents(true);
    try {
      const data = await apiFetch<unknown>(`/api/v1/quiz-report/students?academic_batch_id=${selCurriculum}&semester_id=${selTerm}&crs_id=${selCourse}&section_id=${selSection}&quiz_id=${val}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (version !== requestVersion.current) return;
      const list = normaliseList(data);
      const rows: StudentRow[] = list.map((s: any, i: number) => ({
        sl: i + 1,
        usn: String(s.usn ?? s.student_usn ?? s.roll_no ?? "-"),
        name: String(
          s.student_name ?? s.name ?? s.full_name ?? s.student_usn ?? "-"
        ),
        marks:
          s.secured_marks !== null && s.secured_marks !== undefined
            ? s.secured_marks
            : "-",
      }));
      setAllStudents(rows);

    } catch {
      if (version !== requestVersion.current) return;
      setReportError("Failed to load student data. Select the quiz again to retry.");
    } finally {
      if (version !== requestVersion.current) return;
      setLoadingStudents(false);
    }
  };

  // ── Sort handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // ── Filtered + sorted students
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return allStudents.filter(
      (s) =>
        !q ||
        s.usn.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        String(s.marks).includes(q)
    );
  }, [allStudents, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va =
        (sortKey === "marks" || sortKey === "sl")
          ? Number(a[sortKey]) || 0
          : String(a[sortKey]).toLowerCase();
      const vb =
        (sortKey === "marks" || sortKey === "sl")
          ? Number(b[sortKey]) || 0
          : String(b[sortKey]).toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, sorted.length);
  const pageRows = sorted.slice(pageStart, pageEnd);

  // ── Export Excel (.xlsx)
  // Export the complete loaded report, independent of search and pagination.
  const exportXLS = async () => {
    if (!selQuiz) {
      showToast("Please select a quiz first", "error");
      return;
    }

    setExportingXLS(true);
    try {
      const blob = await createQuizWorkbook(allStudents);

      // Determine filename from content-disposition if available, else default
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `StudentQuizReport_${selQuiz}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast("Excel downloaded ✓");
    } catch {
      showToast("Export failed. Please try again.", "error");
    } finally {
      setExportingXLS(false);
    }
  };

  const canExport = !!selQuiz && allStudents.length > 0 && !reportError && !loadingStudents && !exportingXLS;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.pageWrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerText}>Student Quiz Report</span>
      </div>

      <div style={styles.container}>
        {/* Filter Card */}
        <div style={styles.card}>
          <div style={styles.filterRow}>
            <SelectField
              label="Curriculum"
              id="sel-curriculum"
              value={selCurriculum}
              options={curriculums}
              disabled={false}
              loading={loadingCurriculums}
              onChange={onCurriculumChange}
            />
            <SelectField
              label="Term"
              id="sel-term"
              value={selTerm}
              options={terms}
              disabled={!selCurriculum}
              loading={loadingTerms}
              onChange={onTermChange}
            />
            <SelectField
              label="Course"
              id="sel-course"
              value={selCourse}
              options={courses}
              disabled={!selTerm}
              loading={loadingCourses}
              onChange={onCourseChange}
            />
            <SelectField
              label="Section"
              id="sel-section"
              value={selSection}
              options={sections}
              disabled={!selCourse}
              loading={loadingSections}
              onChange={onSectionChange}
            />
            <SelectField
              label="Quiz"
              id="sel-quiz"
              value={selQuiz}
              options={quizzes}
              disabled={!selSection}
              loading={loadingQuizzes}
              onChange={onQuizChange}
            />
          </div>

          {/* Export button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button
              onClick={exportXLS}
              disabled={!canExport}
              style={{
                ...styles.exportBtn,
                ...(!canExport ? styles.exportBtnDisabled : {}),
              }}
            >
              {exportingXLS ? (
                <>
                  <span style={styles.spinner} />
                  Exporting…
                </>
              ) : (
                <>
                  <DownloadIcon />
                  Export Excel (.xlsx)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div style={styles.card}>
          {/* Table Controls */}
          <div style={styles.tableControls}>
            <div style={styles.entriesControl}>
              Show&nbsp;
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={styles.entriesSelect}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              &nbsp;entries
            </div>
            <div style={styles.searchControl}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>Search:</span>
              <input
                aria-label="Search quiz report"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={styles.searchInput}
                placeholder=""
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  {(
                    [
                      { key: "sl" as SortKey, label: "Sl No.", width: 80 },
                      {
                        key: "usn" as SortKey,
                        label: "Student USN",
                        width: undefined,
                      },
                      {
                        key: "name" as SortKey,
                        label: "Student Name",
                        width: undefined,
                      },
                      { key: "marks" as SortKey, label: "Marks", width: 120 },
                    ] as { key: SortKey; label: string; width?: number }[]
                  ).map(({ key, label, width }) => (
                    <th
                      key={key}
                      tabIndex={0}
                      aria-sort={sortKey === key ? (sortAsc ? "ascending" : "descending") : "none"}
                      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handleSort(key); } }}
                      onClick={() => handleSort(key)}
                      style={{ ...styles.th, ...(width ? { width } : {}) }}
                    >
                      {label}
                      <SortIcon active={sortKey === key} asc={sortAsc} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingStudents ? (
                  <tr>
                    <td colSpan={4} style={styles.centerCell}>
                      <span style={styles.spinner} />
                      Loading students…
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={styles.centerCell}>
                      <div style={styles.emptyState}>
                        <EmptyTableIcon />
                        <p
                          style={{
                            marginTop: 10,
                            color: "#9ba3b4",
                            fontSize: 14,
                          }}
                        >
                          {reportError || (!selQuiz ? "Select all filters above to load quiz report" : "No data available in table")}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, i) => (
                    <tr
                      key={row.usn + i}
                      style={styles.tbodyRow}
                      onMouseEnter={(e) =>
                        (
                          (e.currentTarget as HTMLTableRowElement).style
                            .background
                        )
                          ? null
                          : ((
                              e.currentTarget as HTMLTableRowElement
                            ).style.background = "#f5f7fc")
                      }
                      onMouseLeave={(e) =>
                        ((
                          e.currentTarget as HTMLTableRowElement
                        ).style.background = "")
                      }
                    >
                      <td style={styles.td}>{row.sl}</td>
                      <td style={styles.td}>
                        <span style={styles.usnBadge}>{row.usn}</span>
                      </td>
                      <td style={styles.td}>{row.name}</td>
                      <td style={styles.td}>
                        <span style={styles.marksBadge}>{row.marks}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={styles.paginationRow}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              {sorted.length === 0
                ? "Showing 0 to 0 of 0 entries"
                : `Showing ${pageStart + 1} to ${pageEnd} of ${sorted.length} entries`}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={{
                  ...styles.pageBtn,
                  ...(currentPage <= 1 ? styles.pageBtnDisabled : {}),
                }}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                style={{
                  ...styles.pageBtn,
                  ...(currentPage >= totalPages ? styles.pageBtnDisabled : {}),
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast {...toast} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#f0f2f7",
    minHeight: "100vh",
    color: "#1e2533",
  },
  header: {
    background: "#1a2332",
    color: "#fff",
    padding: "18px 32px",
    borderRadius: "0 0 14px 14px",
    margin: "0 24px",
    boxShadow: "0 4px 18px rgba(26,35,50,0.18)",
  },
  headerText: {
    fontFamily: "'Sora', 'Segoe UI', sans-serif",
    fontSize: "1.2rem",
    fontWeight: 700,
    letterSpacing: "0.02em",
  },
  container: {
    maxWidth: 1300,
    margin: "0 auto",
    padding: "24px 24px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    padding: "24px 28px",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 16,
    alignItems: "flex-end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 5,
    flex: 1,
    minWidth: 140,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#6b7280",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  select: {
    padding: "9px 32px 9px 12px",
    border: "1.5px solid #dde1ea",
    borderRadius: 7,
    fontFamily: "inherit",
    fontSize: 14,
    color: "#1e2533",
    background: "#fff",
    cursor: "pointer",
    appearance: "none" as const,
    width: "100%",
    transition: "border-color 0.2s",
    outline: "none",
  },
  selectDisabled: {
    background: "#f5f6fa",
    color: "#aab0bc",
    cursor: "not-allowed",
  },
  chevron: {
    position: "absolute" as const,
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none" as const,
    color: "#6b7280",
    fontSize: 12,
  },
  exportBtn: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    padding: "9px 22px",
    borderRadius: 7,
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 7,
    transition: "background 0.2s",
  },
  exportBtnDisabled: {
    background: "#9ec4a8",
    cursor: "not-allowed",
  },
  tableControls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    flexWrap: "wrap" as const,
    gap: 10,
  },
  entriesControl: {
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    color: "#6b7280",
  },
  entriesSelect: {
    padding: "5px 8px",
    border: "1.5px solid #dde1ea",
    borderRadius: 6,
    fontFamily: "inherit",
    fontSize: 13,
    margin: "0 4px",
  },
  searchControl: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    padding: "6px 12px",
    border: "1.5px solid #dde1ea",
    borderRadius: 6,
    fontFamily: "inherit",
    fontSize: 13,
    width: 200,
    outline: "none",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 14,
  },
  theadRow: {
    background: "#e8ecf4",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left" as const,
    fontWeight: 600,
    fontSize: 11,
    color: "#6b7280",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    borderBottom: "2px solid #dde1ea",
    whiteSpace: "nowrap" as const,
    cursor: "pointer",
    userSelect: "none" as const,
  },
  tbodyRow: {
    borderBottom: "1px solid #f0f2f7",
    transition: "background 0.15s",
  },
  td: {
    padding: "11px 16px",
    color: "#1e2533",
  },
  usnBadge: {
    fontFamily: "monospace",
    fontSize: 13,
    background: "#f0f2f7",
    padding: "2px 8px",
    borderRadius: 4,
    letterSpacing: "0.03em",
  },
  marksBadge: {
    display: "inline-block",
    background: "#edf7f0",
    color: "#1e7e34",
    borderRadius: 20,
    padding: "3px 12px",
    fontWeight: 600,
    fontSize: 13,
  },
  centerCell: {
    textAlign: "center" as const,
    padding: "40px 20px",
    color: "#9ba3b4",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  spinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "3px solid #dde1ea",
    borderTopColor: "#4a7cdb",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    verticalAlign: "middle",
    marginRight: 8,
  },
  paginationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    flexWrap: "wrap" as const,
    gap: 10,
  },
  pageBtn: {
    padding: "5px 14px",
    border: "1.5px solid #dde1ea",
    borderRadius: 6,
    background: "#fff",
    fontFamily: "inherit",
    fontSize: 13,
    cursor: "pointer",
  },
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  toast: {
    position: "fixed" as const,
    bottom: 24,
    right: 24,
    padding: "12px 20px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: "#fff",
    zIndex: 9999,
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    animation: "fadeIn 0.3s ease",
  },
  toastSuccess: {
    background: "#1a2332",
  },
  toastError: {
    background: "#c53030",
  },
};
