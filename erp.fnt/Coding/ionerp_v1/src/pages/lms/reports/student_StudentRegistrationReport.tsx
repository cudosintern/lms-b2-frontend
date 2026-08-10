import React, { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Curriculum {
  academic_batch_id: number;
  academic_batch_code: string;
  academic_batch_desc: string;
  academic_year: string;
  regulation_year: string;
}

interface Term {
  semester_id: number;
  semester: string;
  semester_desc: string;
  academic_batch_id: number;
}

interface RegisteredCourse {
  course_code: string;
  course_type: string;
}

interface StudentRow {
  sl_no: number;
  usn: string;
  name: string;
  registered_courses: RegisteredCourse[];
  total_credits: number;
  section: string;
}

interface CourseTypeBlock {
  course_type: string;
  students: StudentRow[];
}

interface OverallSummaryRow {
  course_type: string;
  total_students: number;
  registered_students: number;
  unregistered_students: number;
}

interface SummaryCourse {
  course_code: string;
  course_name: string;
  credits: number;
  registered_students: number;
  other_dept_students?: number;
}

interface SummaryRow {
  course_type: string;
  credits: number;
  registered_students: number;
  total_registered: number;
  courses: SummaryCourse[];
  is_elective: boolean;
}

interface ModalStudent {
  usn: string;
  name: string;
  section: string;
}

interface ModalData {
  title: string;
  curriculum: string;
  term: string;
  course_type: string;
  students: ModalStudent[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

const BASE_URL = "http://127.0.0.1:8000";

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Component ───────────────────────────────────────────────────────────────

const StudentRegistrationReport: React.FC = () => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  const [courseBlocks, setCourseBlocks] = useState<CourseTypeBlock[]>([]);
  const [overallSummary, setOverallSummary] = useState<OverallSummaryRow[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [modal, setModal] = useState<ModalData | null>(null);

  // ── 1. Fetch curriculums on mount ─────────────────────────────────────────
  // GET /api/v1/meta/curriculums  (no params)
  useEffect(() => {
    apiFetch<{ status: boolean; data: Curriculum[] }>("/api/v1/meta/curriculums")
      .then((res) => setCurriculums(res.data || []))
      .catch(() => setCurriculums([]));
  }, []);

  // ── 2. Fetch terms when curriculum changes ────────────────────────────────
  // GET /api/v1/meta/terms?academic_batch_id=<id>
  useEffect(() => {
    if (!selectedCurriculum) {
      setTerms([]);
      setSelectedTerm("");
      clearData();
      return;
    }
    apiFetch<{ status: boolean; data: Term[] }>(
      `/api/v1/meta/terms?academic_batch_id=${selectedCurriculum}`
    )
      .then((res) => setTerms(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTerms([]));
    setSelectedTerm("");
    clearData();
  }, [selectedCurriculum]);

  const clearData = () => {
    setCourseBlocks([]);
    setOverallSummary([]);
    setSummary([]);
  };

  // ── 3. Fetch all report data when curriculum + term are both selected ──────
  // GET /api/v1/student-registration/students?academic_batch_id=&semester_id=
  // GET /api/v1/student-registration/overall-summary?academic_batch_id=&semester_id=
  // GET /api/v1/student-registration/summary?academic_batch_id=&semester_id=
  const fetchReportData = useCallback(async () => {
    if (!selectedCurriculum || !selectedTerm) return;
    setLoading(true);
    setError(null);

    const qs = `?academic_batch_id=${selectedCurriculum}&semester_id=${selectedTerm}`;

    try {
      const [studentsRes, overallRes, summaryRes] = await Promise.all([
        apiFetch<{ status: boolean; data: any[] }>(
          `/api/v1/student-registration/students${qs}`
        ),
        apiFetch<{ status: boolean; data: OverallSummaryRow[] }>(
          `/api/v1/student-registration/overall-summary${qs}`
        ),
        apiFetch<{ status: boolean; data: SummaryRow[] }>(
          `/api/v1/student-registration/summary${qs}`
        ),
      ]);

console.log("API students:", studentsRes.data);

      const transformed = [
  {
    course_type: "All",
    students: (studentsRes.data || []).map((s: any, index: number) => ({
      sl_no: index + 1,
      usn: s.roll_no,
      name: s.name,
      registered_courses: [],
      total_credits: 0,
      section: "A", // or dynamic if available
    })),
  },
];

setCourseBlocks(transformed);

      setOverallSummary(overallRes.data || []);
      setSummary(summaryRes.data || []);
    } catch {
      setError(
        "Failed to load report data. Please verify the selected curriculum and term."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCurriculum, selectedTerm]);

  useEffect(() => {
    if (selectedCurriculum && selectedTerm) fetchReportData();
  }, [selectedCurriculum, selectedTerm]);

  // ── 4. View Students Modal ────────────────────────────────────────────────
  // GET /api/v1/student-registration/view-students?academic_batch_id=&semester_id=&course_type=&registered=
  const openViewModal = async (
    course_type: string,
    registered: boolean,
    title: string
  ) => {
    const qs = `?academic_batch_id=${selectedCurriculum}&semester_id=${selectedTerm}&course_type=${encodeURIComponent(course_type)}&registered=${registered}`;
    try {
      const res = await apiFetch<{ data: ModalStudent[] }>(
        `/api/v1/student-registration/view-students${qs}`
      );
      const curr = curriculums.find(
        (c) => String(c.academic_batch_id) === selectedCurriculum
      );
      const term = terms.find((t) => String(t.semester_id) === selectedTerm);
      setModal({
        title,
        curriculum: curr?.academic_batch_desc || "",
        term: term?.semester_desc || term?.semester || "",
        course_type,
        students: res.data || [],
      });
    } catch {
      alert("Could not load students.");
    }
  };

  // ── 5. Export ─────────────────────────────────────────────────────────────
  const handleExport = (type: "excel" | "pdf") => {
    const qs = `?academic_batch_id=${selectedCurriculum}&semester_id=${selectedTerm}&format=${type}`;
    window.open(`${BASE_URL}/api/v1/student-registration/export${qs}`, "_blank");
    setExportDropdownOpen(false);
  };

  const currObj = curriculums.find(
    (c) => String(c.academic_batch_id) === selectedCurriculum
  );
  const termObj = terms.find((t) => String(t.semester_id) === selectedTerm);
  const hasData =
    courseBlocks.length > 0 || overallSummary.length > 0 || summary.length > 0;

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Student Registration Report</span>
      </div>

      {/* ── Filters ── */}
      <div style={styles.filterRow}>
        {/* Curriculum */}
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            Curriculum:<span style={styles.required}>*</span>
          </label>
          <select
            style={styles.select}
            value={selectedCurriculum}
            onChange={(e) => setSelectedCurriculum(e.target.value)}
          >
            <option value="">Select Curriculum</option>
            {curriculums.map((c) => (
              <option key={c.academic_batch_id} value={String(c.academic_batch_id)}>
                {c.academic_batch_desc}
              </option>
            ))}
          </select>
        </div>

        {/* Term */}
        <div style={styles.filterGroup}>
          <label style={styles.label}>
            Term:<span style={styles.required}>*</span>
          </label>
          <select
            style={styles.select}
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            disabled={!selectedCurriculum}
          >
            <option value="">Select Term</option>
            {terms.map((t) => (
              <option key={t.semester_id} value={String(t.semester_id)}>
                {t.semester_desc || t.semester}
              </option>
            ))}
          </select>
        </div>

        {/* Export — top-right, shown only when data is loaded */}
        {hasData && (
          <div style={styles.exportWrapper}>
            <button
              style={styles.exportBtn}
              onClick={() => setExportDropdownOpen((o) => !o)}
            >
              🖨 Export ▴
            </button>
            {exportDropdownOpen && (
              <div style={styles.exportDropdown}>
                <div
                  style={styles.exportItem}
                  onClick={() => handleExport("excel")}
                >
                  Export as Excel
                </div>
                <div
                  style={styles.exportItem}
                  onClick={() => handleExport("pdf")}
                >
                  Export as PDF
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* ── Loading ── */}
      {loading && <div style={styles.loadingBar}>Loading report data...</div>}

      {/* ════════════════════════════════════════════════════════════════
          MAIN STUDENTS TABLE
          Layout from mentor UI:
          Sl.No | Student USN | Student Name | Registered Courses | Total Credits | Student Signature
          - Section-A grey bar spans all 6 cols
          - Course-type sub-header row (Theory | Core | Core…) under section bar
          - Student rows with blue course-code chips
         ════════════════════════════════════════════════════════════════ */}
      {courseBlocks.length > 0 && (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.mainHeaderRow}>
                <th style={{ ...styles.th, width: 60, textAlign: "center" }}>
                  Sl.No.
                </th>
                <th style={styles.th}>Student USN</th>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Registered Courses</th>
                <th style={{ ...styles.th, width: 120, textAlign: "center" }}>
                  Total Credits
                </th>
                <th style={{ ...styles.th, width: 150 }}>Student Signature</th>
              </tr>
            </thead>
            <tbody>
              {courseBlocks.map((block) => {
                // Group students by section within this course-type block
                const sectionMap: Record<string, StudentRow[]> = {};
                block.students.forEach((s) => {
                  const sec = s.section || "—";
                  if (!sectionMap[sec]) sectionMap[sec] = [];
                  sectionMap[sec].push(s);
                });

                return Object.entries(sectionMap).map(
                  ([sectionName, students]) => {
                    // Collect unique course types for sub-header labels
                    const courseTypeSet = new Set<string>();
                    students.forEach((s) =>
                      s.registered_courses?.forEach((c) =>
                        courseTypeSet.add(c.course_type)
                      )
                    );
                    const courseTypes = Array.from(courseTypeSet);

                    return (
                      <React.Fragment
                        key={`${block.course_type}-${sectionName}`}
                      >
                        {/* ── Section header bar ── */}
                        <tr>
                          <td colSpan={6} style={styles.sectionHeaderCell}>
                            Section - {sectionName}
                          </td>
                        </tr>

                        {/* ── Course-type sub-header row ── */}
                        <tr style={styles.courseTypeSubRow}>
                          <td style={styles.subEmptyCell} />
                          <td style={styles.subEmptyCell} />
                          <td style={styles.subEmptyCell} />
                          <td style={styles.subCoursesCell}>
                            {courseTypes.map((ct) => (
                              <span key={ct} style={styles.courseTypeLabel}>
                                {ct}
                              </span>
                            ))}
                          </td>
                          <td style={styles.subEmptyCell} />
                          <td style={styles.subEmptyCell} />
                        </tr>

                        {/* ── Student rows ── */}
                        {students.map((s, idx) => (
                          <tr
                            key={s.usn}
                            style={idx % 2 !== 0 ? styles.altRow : {}}
                          >
                            <td
                              style={{
                                ...styles.td,
                                textAlign: "center",
                              }}
                            >
                              {s.sl_no}
                            </td>
                            <td style={styles.td}>{s.usn}</td>
                            <td style={styles.td}>{s.name}</td>
                            <td style={styles.td}>
                              {s.registered_courses?.map((c) => (
                                <span
                                  key={c.course_code}
                                  style={styles.courseChip}
                                >
                                  {c.course_code}
                                </span>
                              ))}
                            </td>
                            <td
                              style={{
                                ...styles.td,
                                textAlign: "center",
                              }}
                            >
                              {s.total_credits}
                            </td>
                            <td style={styles.td} />
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  }
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          OVERALL SUMMARY
          Course Type | Total Students | Registered Students | Unregistered Students
         ════════════════════════════════════════════════════════════════ */}
      {overallSummary.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Overall Summary</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.summaryHeaderRow}>
                <th style={styles.th}>Course Type</th>
                <th style={{ ...styles.th, textAlign: "center" }}>
                  Total Students
                </th>
                <th style={{ ...styles.th, textAlign: "center" }}>
                  Registered Students
                </th>
                <th style={{ ...styles.th, textAlign: "center" }}>
                  Unregistered Students
                </th>
              </tr>
            </thead>
            <tbody>
              {overallSummary.map((row) => (
                <tr key={row.course_type}>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {row.course_type}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {row.total_students}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {row.registered_students}
                    <br />
                    <span
                      style={styles.viewLink}
                      onClick={() =>
                        openViewModal(
                          row.course_type,
                          true,
                          "Registered Students"
                        )
                      }
                    >
                      View Students
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {row.unregistered_students}
                    {row.unregistered_students > 0 && (
                      <>
                        <br />
                        <span
                          style={styles.viewLink}
                          onClick={() =>
                            openViewModal(
                              row.course_type,
                              false,
                              "Unregistered Students"
                            )
                          }
                        >
                          View Students
                        </span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SUMMARY
          Header: curriculum (term) | Credits | Registered students | Total registered
          Group rows (Core / Theory…): bold label | — | — | View | Total: N
          Course rows: code - name | credits | other dept? | registered count
         ════════════════════════════════════════════════════════════════ */}
      {summary.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Summary</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.summaryHeaderRow}>
                <th style={styles.th}>
                  {currObj?.academic_batch_desc}
                  {termObj
                    ? ` ( ${termObj.semester_desc || termObj.semester} )`
                    : ""}
                </th>
                <th style={{ ...styles.th, width: 90, textAlign: "center" }}>
                  Credits
                </th>
                <th style={styles.th}>Registered students</th>
                <th style={{ ...styles.th, width: 160, textAlign: "right" }}>
                  Total registered
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <React.Fragment key={row.course_type}>
                  {/* Course-type group header */}
                  <tr style={styles.summaryGroupRow}>
                    <td
                      style={{
                        ...styles.td,
                        fontWeight: 700,
                        color: "#1a1a1a",
                      }}
                    >
                      {row.course_type}
                    </td>
                    <td style={styles.td} />
                    <td style={styles.td} />
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <span
                        style={styles.viewLink}
                        onClick={() =>
                          openViewModal(
                            row.course_type,
                            true,
                            row.is_elective
                              ? `${row.course_type} — Students`
                              : `${row.course_type} — Courses`
                          )
                        }
                      >
                        View
                      </span>{" "}
                      <span style={{ color: "#555" }}>
                        | Total: {row.total_registered}
                      </span>
                    </td>
                  </tr>

                  {/* Individual course rows */}
                  {row.courses.map((c) => (
                    <tr key={c.course_code}>
                      <td style={styles.td}>
                        {c.course_code} - {c.course_name}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {c.credits}
                      </td>
                      <td style={styles.td}>
                        {row.is_elective &&
                          c.other_dept_students !== undefined && (
                            <span style={{ color: "#555", fontSize: 13 }}>
                              Other Dept: {c.other_dept_students}{" "}
                              <span
                                style={styles.viewLink}
                                onClick={() =>
                                  openViewModal(
                                    row.course_type,
                                    true,
                                    `${c.course_code} — Other Dept Students`
                                  )
                                }
                              >
                                View
                              </span>
                            </span>
                          )}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        {c.registered_students}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL — Section-wise student list
         ════════════════════════════════════════════════════════════════ */}
      {modal && (
        <div style={styles.modalOverlay} onClick={() => setModal(null)}>
          <div
            style={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>{modal.title}</span>
              <button
                style={styles.modalClose}
                onClick={() => setModal(null)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalMeta}>
              <span>
                <b>Curriculum:</b> {modal.curriculum}
              </span>
              <span style={{ marginLeft: 24 }}>
                <b>Term:</b> {modal.term}
              </span>
              <span style={{ marginLeft: 24 }}>
                <b>Course Type:</b> {modal.course_type}
              </span>
            </div>

            {modal.students.length === 0 ? (
              <p style={{ padding: 16, color: "#888" }}>No students found.</p>
            ) : (
              (() => {
                const secMap: Record<string, ModalStudent[]> = {};
                modal.students.forEach((s) => {
                  if (!secMap[s.section]) secMap[s.section] = [];
                  secMap[s.section].push(s);
                });
                return Object.entries(secMap).map(([sec, studs]) => (
                  <div key={sec} style={{ marginTop: 12 }}>
                    <div style={styles.modalSectionHeader}>
                      Section - {sec}
                    </div>
                    <table style={{ ...styles.table, marginTop: 0 }}>
                      <thead>
                        <tr style={styles.summaryHeaderRow}>
                          <th
                            style={{ ...styles.th, width: 60, textAlign: "center" }}
                          >
                            Sl.No.
                          </th>
                          <th style={styles.th}>Student USN</th>
                          <th style={styles.th}>Student Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studs.map((s, i) => (
                          <tr key={s.usn}>
                            <td
                              style={{ ...styles.td, textAlign: "center" }}
                            >
                              {i + 1}
                            </td>
                            <td style={styles.td}>{s.usn}</td>
                            <td style={styles.td}>{s.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ));
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f4f5f7",
    minHeight: "100vh",
    paddingBottom: 60,
  },

  header: {
    background: "linear-gradient(135deg, #12243e 0%, #1e3a5f 100%)",
    borderRadius: "0 0 14px 14px",
    padding: "18px 28px",
    marginBottom: 24,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: 0.3,
  },

  filterRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 24,
    padding: "0 28px",
    marginBottom: 20,
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  label: {
    fontSize: 13,
    color: "#333",
    fontWeight: 500,
  },
  required: {
    color: "#dc3545",
    marginLeft: 2,
  },
  select: {
    padding: "7px 36px 7px 12px",
    border: "1px solid #ced4da",
    borderRadius: 6,
    fontSize: 14,
    color: "#333",
    background: "#fff",
    minWidth: 280,
    cursor: "pointer",
  },

  exportWrapper: {
    marginLeft: "auto",
    position: "relative" as const,
    alignSelf: "flex-end",
  },
  exportBtn: {
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "8px 20px",
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 600,
  },
  exportDropdown: {
    position: "absolute" as const,
    right: 0,
    top: "110%",
    background: "#fff",
    border: "1px solid #ced4da",
    borderRadius: 6,
    zIndex: 200,
    boxShadow: "0 4px 14px rgba(0,0,0,0.13)",
    minWidth: 170,
  },
  exportItem: {
    padding: "10px 16px",
    fontSize: 14,
    cursor: "pointer",
    color: "#333",
  },

  errorBanner: {
    background: "#fff3cd",
    border: "1px solid #ffc107",
    borderRadius: 6,
    padding: "10px 28px",
    margin: "0 28px 16px",
    color: "#856404",
    fontSize: 14,
  },
  loadingBar: {
    textAlign: "center" as const,
    padding: 24,
    color: "#666",
    fontSize: 15,
  },

  tableCard: {
    margin: "0 28px 24px",
    background: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  section: {
    margin: "0 28px 24px",
    background: "#fff",
    borderRadius: 8,
    padding: "16px 18px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1a2a4a",
    marginBottom: 12,
    marginTop: 0,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 14,
  },
  mainHeaderRow: {
    background: "#fff",
  },
  summaryHeaderRow: {
    background: "#e0e0e0",
  },
  th: {
    border: "1px solid #dee2e6",
    padding: "10px 14px",
    textAlign: "left" as const,
    fontWeight: 600,
    color: "#222",
    fontSize: 14,
  },
  td: {
    border: "1px solid #dee2e6",
    padding: "9px 14px",
    color: "#444",
    verticalAlign: "top" as const,
    fontSize: 14,
  },
  altRow: { background: "#fafafa" },

  sectionHeaderCell: {
    background: "#d4d4d4",
    padding: "8px 14px",
    fontWeight: 600,
    color: "#333",
    border: "1px solid #dee2e6",
    fontSize: 14,
  },

  /* Course-type sub-header row */
  courseTypeSubRow: { background: "#ebebeb" },
  subEmptyCell: {
    border: "1px solid #dee2e6",
    padding: "7px 14px",
    background: "#ebebeb",
  },
  subCoursesCell: {
    border: "1px solid #dee2e6",
    padding: "7px 14px",
    background: "#e0e0e0",
  },
  courseTypeLabel: {
    display: "inline-block",
    marginRight: 28,
    fontWeight: 500,
    color: "#444",
    fontSize: 13,
  },

  /* Course code chips in student rows */
  courseChip: {
    color: "#0d6efd",
    marginRight: 14,
    display: "inline-block",
    cursor: "default",
  },

  summaryGroupRow: { background: "#e0e0e0" },

  viewLink: {
    color: "#3a7bd5",
    cursor: "pointer",
    fontSize: 13,
    textDecoration: "none",
  },

  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    background: "#fff",
    borderRadius: 10,
    padding: "26px",
    minWidth: 620,
    maxWidth: "90vw",
    maxHeight: "80vh",
    overflowY: "auto" as const,
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1a2a4a",
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#666",
  },
  modalMeta: {
    fontSize: 13,
    color: "#555",
    marginBottom: 14,
    background: "#f8f9fa",
    borderRadius: 6,
    padding: "8px 14px",
  },
  modalSectionHeader: {
    background: "#d4d4d4",
    padding: "6px 14px",
    fontWeight: 600,
    borderRadius: 4,
    marginBottom: 4,
    color: "#333",
    fontSize: 13,
  },
};

export default StudentRegistrationReport;
